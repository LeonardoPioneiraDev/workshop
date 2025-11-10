// src/modules/departamentos/juridico/services/sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';

// ✅ ENTITIES
import { MultaCacheEntity } from '../entities/multa-cache.entity';
import { DvsInfracaoEntity } from '../entities/dvs-infracao.entity';
import { DvsAgenteAutuadorEntity } from '../entities/dvs-agente-autuador.entity';
import { FrtCadveiculosEntity } from '../entities/frt-cadveiculos.entity';
import { MetricasDiariasEntity } from '../entities/metricas-diarias.entity';

// ✅ SERVICES
import { JuridicoService } from './juridico.service';
import { AlertaService } from './alerta.service';
import { AuditService } from './audit.service';
import { ConfiguracaoService } from './configuracao.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private syncInProgress = false;
  private ultimaExecucao: Date | null = null;
  private proximaExecucao: Date | null = null;

  constructor(
    // ✅ APENAS REPOSITORIES TYPEORM DIRETOS
    @InjectRepository(MultaCacheEntity)
    private readonly multaCacheRepository: Repository<MultaCacheEntity>,
    
    @InjectRepository(DvsInfracaoEntity)
    private readonly infracaoRepository: Repository<DvsInfracaoEntity>,
    
    @InjectRepository(DvsAgenteAutuadorEntity)
    private readonly agenteRepository: Repository<DvsAgenteAutuadorEntity>,
    
    @InjectRepository(FrtCadveiculosEntity)
    private readonly veiculoRepository: Repository<FrtCadveiculosEntity>,
    
    @InjectRepository(MetricasDiariasEntity)
    private readonly metricasRepository: Repository<MetricasDiariasEntity>,

    // ✅ SERVICES
    private readonly juridicoService: JuridicoService,
    private readonly alertaService: AlertaService,
    private readonly auditService: AuditService,
    private readonly configuracaoService: ConfiguracaoService,

    // ✅ DATA SOURCE
    private readonly dataSource: DataSource,
  ) {
    this.calcularProximaExecucao();
  }

  /**
   * 🔄 SINCRONIZAÇÃO COMPLETA PRINCIPAL
   */
  async executarSincronizacaoCompleta(): Promise<any> {
    if (this.syncInProgress) {
      throw new Error('Sincronização já em andamento');
    }

    this.syncInProgress = true;
    const startTime = Date.now();
    const auditId = await this.auditService.iniciarOperacao('SINCRONIZACAO_COMPLETA', {
      tipo: 'MANUAL',
      timestamp: new Date()
    });

    const resultado = {
      cache: { processados: 0, inseridos: 0, atualizados: 0, erros: 0 },
      agentes: { processados: 0, inseridos: 0, atualizados: 0, erros: 0 },
      veiculos: { processados: 0, inseridos: 0, atualizados: 0, erros: 0 },
      infracoes: { processados: 0, inseridos: 0, atualizados: 0, erros: 0 },
      metricas: { calculadas: 0, erros: 0 },
      erros: [],
      warnings: []
    };

    try {
      this.logger.log('🔄 Executando sincronização completa');
      this.ultimaExecucao = new Date();

      // ✅ 1. SINCRONIZAR CACHE DE MULTAS
      this.logger.log('📄 Sincronizando cache de multas do Oracle...');
      const multasResult = await this.juridicoService.getMultasComCache({
        forcarAtualizacao: true,
        limite: 10000,
        incluirDetalhes: true
      });

      // ✅ 2. SALVAR NO BANCO - CORRIGIDO
      if (multasResult.data && multasResult.data.length > 0) {
        this.logger.log(`💾 Salvando ${multasResult.data.length} multas no PostgreSQL...`);
        
        for (const multa of multasResult.data) {
          try {
            // ✅ VERIFICAR SE JÁ EXISTE
            const existente = await this.multaCacheRepository.findOne({
              where: { numero_ait: multa.numero_ait }
            });

            if (existente) {
              // ✅ ATUALIZAR
              await this.multaCacheRepository.update(existente.id, {
                ...multa,
                ultima_atualizacao: new Date()
              });
              resultado.cache.atualizados++;
            } else {
              // ✅ INSERIR NOVO
              const novaMulta = this.multaCacheRepository.create({
                ...multa,
                data_cache: new Date(),
                ultima_atualizacao: new Date()
              });
              await this.multaCacheRepository.save(novaMulta);
              resultado.cache.inseridos++;
            }
            resultado.cache.processados++;
          } catch (error) {
            this.logger.error(`❌ Erro ao salvar multa ${multa.numero_ait}: ${error.message}`);
            resultado.cache.erros++;
          }
        }
      }

      // ✅ 3. SINCRONIZAR TABELAS AUXILIARES
      this.logger.log('📋 Sincronizando tabelas auxiliares...');
      resultado.infracoes = await this.sincronizarInfracoesDoCache();
      resultado.agentes = await this.sincronizarAgentesDoCache();
      resultado.veiculos = await this.sincronizarVeiculosDoCache();

      // ✅ 4. CALCULAR MÉTRICAS
      this.logger.log('�� Calculando métricas...');
      resultado.metricas.calculadas = await this.calcularMetricasUltimosDias(7);

      const executionTime = Date.now() - startTime;
      this.calcularProximaExecucao();

      await this.auditService.finalizarOperacao(auditId, {
        sucesso: true,
        resultado,
        tempoExecucao: executionTime
      });

      this.logger.log(`✅ Sincronização completa finalizada em ${executionTime}ms`);
      this.logger.log(`📊 Resultado: ${resultado.cache.inseridos} inseridos, ${resultado.cache.atualizados} atualizados, ${resultado.cache.erros} erros`);

      return {
        success: true,
        executionTime: `${executionTime}ms`,
        timestamp: this.ultimaExecucao.toISOString(),
        proximaExecucao: this.proximaExecucao?.toISOString(),
        totalRecords: resultado.cache.processados,
        resultado
      };

    } catch (error) {
      this.logger.error(`❌ Erro na sincronização completa: ${error.message}`);
      resultado.erros.push(error.message);
      
      await this.auditService.finalizarOperacao(auditId, {
        sucesso: false,
        erro: error.message,
        resultado
      });

      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * 📋 SINCRONIZAR INFRAÇÕES DO CACHE
   */
  private async sincronizarInfracoesDoCache(): Promise<any> {
    const resultado = { processados: 0, inseridos: 0, atualizados: 0, erros: 0 };

    try {
      // ✅ BUSCAR INFRAÇÕES ÚNICAS DO CACHE
      const infracoesCache = await this.multaCacheRepository
        .createQueryBuilder('multa')
        .select([
          'DISTINCT multa.codigo_infracao as codigo',
          'multa.descricao_infracao as descricao',
          'multa.gravidade_infracao as gravidade',
          'multa.pontuacao_infracao as pontuacao',
          'multa.grupo_infracao as grupo'
        ])
        .where('multa.codigo_infracao IS NOT NULL')
        .andWhere('multa.codigo_infracao != :empty', { empty: '' })
        .getRawMany();

      resultado.processados = infracoesCache.length;
      this.logger.log(`📋 Processando ${resultado.processados} infrações do cache`);

      for (const infracaoData of infracoesCache) {
        try {
          // ✅ VERIFICAR SE JÁ EXISTE
          const existente = await this.infracaoRepository.findOne({
            where: { codigoinfra: infracaoData.codigo }
          });

          const dadosInfracao = {
            descricaoinfra: infracaoData.descricao,
            grupoinfra: infracaoData.grupo,
            pontuacaoinfra: infracaoData.pontuacao ? Number(infracaoData.pontuacao) : null,
            tipomulta: this.determinarTipoMulta(infracaoData.gravidade),
            origem_dados: 'CACHE_MULTAS',
            data_sincronizacao: new Date()
          };

          if (existente) {
            // ✅ ATUALIZAR
            await this.infracaoRepository.update(existente.codigoinfra, dadosInfracao);
            resultado.atualizados++;
          } else {
            // ✅ INSERIR NOVO
            const novaInfracao = this.infracaoRepository.create({
              codigoinfra: infracaoData.codigo,
              ...dadosInfracao
            });
            await this.infracaoRepository.save(novaInfracao);
            resultado.inseridos++;
          }
        } catch (error) {
          resultado.erros++;
          this.logger.warn(`⚠️ Erro ao processar infração ${infracaoData.codigo}: ${error.message}`);
        }
      }

      this.logger.log(`📋 Infrações: ${resultado.inseridos} inseridas, ${resultado.atualizados} atualizadas, ${resultado.erros} erros`);
      return resultado;

    } catch (error) {
      this.logger.error(`❌ Erro ao sincronizar infrações: ${error.message}`);
      return resultado;
    }
  }

  /**
   * 👥 SINCRONIZAR AGENTES DO CACHE
   */
  private async sincronizarAgentesDoCache(): Promise<any> {
    const resultado = { processados: 0, inseridos: 0, atualizados: 0, erros: 0 };

    try {
      const agentesCache = await this.multaCacheRepository
        .createQueryBuilder('multa')
        .select([
          'DISTINCT multa.codigo_agente_autuador as codigo',
          'multa.nome_agente as nome',
          'multa.matricula_agente as matricula'
        ])
        .where('multa.codigo_agente_autuador IS NOT NULL')
        .andWhere('multa.nome_agente IS NOT NULL')
        .getRawMany();

      resultado.processados = agentesCache.length;
      this.logger.log(`👥 Processando ${resultado.processados} agentes do cache`);

      for (const agenteData of agentesCache) {
        try {
          const existente = await this.agenteRepository.findOne({
            where: { cod_agente_autuador: Number(agenteData.codigo) }
          });

          const dadosAgente = {
            desc_agente_autuador: agenteData.nome,
            matriculafiscal: agenteData.matricula,
            origem_dados: 'CACHE_MULTAS',
            data_sincronizacao: new Date()
          };

          if (existente) {
            await this.agenteRepository.update(existente.cod_agente_autuador, dadosAgente);
            resultado.atualizados++;
          } else {
            const novoAgente = this.agenteRepository.create({
              cod_agente_autuador: Number(agenteData.codigo),
              ...dadosAgente
            });
            await this.agenteRepository.save(novoAgente);
            resultado.inseridos++;
          }
        } catch (error) {
          resultado.erros++;
          this.logger.warn(`⚠️ Erro ao processar agente ${agenteData.codigo}: ${error.message}`);
        }
      }

      this.logger.log(`👥 Agentes: ${resultado.inseridos} inseridos, ${resultado.atualizados} atualizados, ${resultado.erros} erros`);
      return resultado;

    } catch (error) {
      this.logger.error(`❌ Erro ao sincronizar agentes: ${error.message}`);
      return resultado;
    }
  }

  /**
   * 🚗 SINCRONIZAR VEÍCULOS DO CACHE
   */
  private async sincronizarVeiculosDoCache(): Promise<any> {
    const resultado = { processados: 0, inseridos: 0, atualizados: 0, erros: 0 };

    try {
      const veiculosCache = await this.multaCacheRepository
        .createQueryBuilder('multa')
        .select([
          'DISTINCT multa.codigo_veiculo as codigo',
          'multa.prefixo_veiculo as prefixo',
          'multa.placa_veiculo as placa',
          'multa.codigo_garagem as garagem'
        ])
        .where('multa.codigo_veiculo IS NOT NULL')
        .andWhere('multa.prefixo_veiculo IS NOT NULL')
        .getRawMany();

      resultado.processados = veiculosCache.length;
      this.logger.log(`🚗 Processando ${resultado.processados} veículos do cache`);

      for (const veiculoData of veiculosCache) {
        try {
          const existente = await this.veiculoRepository.findOne({
            where: { codigoveic: Number(veiculoData.codigo) }
          });

          const dadosVeiculo = {
            prefixoveic: veiculoData.prefixo,
            placaatualveic: veiculoData.placa,
            codigoga: veiculoData.garagem ? Number(veiculoData.garagem) : 1,
            origem_dados: 'CACHE_MULTAS',
            data_sincronizacao: new Date()
          };

          if (existente) {
            await this.veiculoRepository.update(existente.codigoveic, dadosVeiculo);
            resultado.atualizados++;
          } else {
            const novoVeiculo = this.veiculoRepository.create({
              codigoveic: Number(veiculoData.codigo),
              ...dadosVeiculo
            });
            await this.veiculoRepository.save(novoVeiculo);
            resultado.inseridos++;
          }
        } catch (error) {
          resultado.erros++;
          this.logger.warn(`⚠️ Erro ao processar veículo ${veiculoData.codigo}: ${error.message}`);
        }
      }

      this.logger.log(`🚗 Veículos: ${resultado.inseridos} inseridos, ${resultado.atualizados} atualizados, ${resultado.erros} erros`);
      return resultado;

    } catch (error) {
      this.logger.error(`❌ Erro ao sincronizar veículos: ${error.message}`);
      return resultado;
    }
  }

  /**
   * 📊 CALCULAR MÉTRICAS PARA UMA DATA ESPECÍFICA
   */
  private async calcularMetricasParaData(data: Date): Promise<void> {
    try {
      const dataStr = data.toISOString().split('T')[0];
      this.logger.log(`�� Calculando métricas para ${dataStr}`);
      
      const multasDoDia = await this.multaCacheRepository
        .createQueryBuilder('multa')
        .where('DATE(multa.data_emissao) = :data', { data: dataStr })
        .getMany();

      const totalMultas = multasDoDia.length;
      const multasPagas = multasDoDia.filter(m => m.status_multa === 'PAGA').length;
      const multasVencidas = multasDoDia.filter(m => m.status_multa === 'VENCIDA').length;
      const multasPendentes = multasDoDia.filter(m => m.status_multa === 'PENDENTE').length;
      const valorTotal = multasDoDia.reduce((sum, m) => sum + (m.valor_multa || 0), 0);

      let metricas = await this.metricasRepository.findOne({ 
        where: { dataReferencia: data } 
      });

      const dadosMetricas = {
        dataReferencia: data,
        totalMultas,
        multasPagas,
        multasVencidas,
        multasPendentes,
        valorTotal,
        valorMedio: totalMultas > 0 ? valorTotal / totalMultas : 0,
        taxaPagamento: totalMultas > 0 ? (multasPagas / totalMultas) * 100 : 0,
        ultimaAtualizacao: new Date()
      };

      if (metricas) {
        await this.metricasRepository.update(metricas.id, dadosMetricas);
      } else {
        await this.metricasRepository.save(dadosMetricas);
      }
      
    } catch (error) {
      this.logger.error(`❌ Erro ao calcular métricas para ${data}: ${error.message}`);
      throw error;
    }
  }

  // ✅ MÉTODOS AUXILIARES SIMPLIFICADOS

  private async calcularMetricasUltimosDias(dias: number): Promise<number> {
    let calculadas = 0;
    
    for (let i = 1; i <= dias; i++) {
      const data = new Date();
      data.setDate(data.getDate() - i);
      
      try {
        await this.calcularMetricasParaData(data);
        calculadas++;
      } catch (error) {
        this.logger.warn(`⚠️ Erro ao calcular métricas para ${data.toISOString().split('T')[0]}: ${error.message}`);
      }
    }
    
    return calculadas;
  }

  private calcularProximaExecucao(): void {
    const agora = new Date();
    const proxima = new Date(agora);
    proxima.setHours(agora.getHours() + 6, 0, 0, 0);
    this.proximaExecucao = proxima;
  }

  private determinarTipoMulta(gravidade: string): string {
    switch (gravidade?.toUpperCase()) {
      case 'LEVE': return 'L';
      case 'MEDIA': return 'M';
      case 'GRAVE': return 'G';
      case 'GRAVISSIMA': return 'S';
      default: return 'L';
    }
  }

  // ✅ MÉTODOS PÚBLICOS PARA API

  public async getStatusSincronizacao(): Promise<any> {
    return {
      syncInProgress: this.syncInProgress,
      ultimaExecucao: this.ultimaExecucao?.toISOString(),
      proximaExecucao: this.proximaExecucao?.toISOString()
    };
  }

  public async forcerSincronizacao(): Promise<any> {
    this.logger.log('🔄 Forçando sincronização imediata...');
    return await this.executarSincronizacaoCompleta();
  }

  public async executarSincronizacaoIncremental(): Promise<any> {
    if (this.syncInProgress) {
      throw new Error('Sincronização já em andamento');
    }

    this.syncInProgress = true;
    const startTime = Date.now();

    try {
      this.logger.log('🔄 Executando sincronização incremental');

      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 7);

      const multasResult = await this.juridicoService.getMultasComCache({
        forcarAtualizacao: true,
        limite: 5000,
        incluirDetalhes: false
      });

      const executionTime = Date.now() - startTime;

      this.logger.log(`✅ Sincronização incremental finalizada em ${executionTime}ms`);

      return {
        success: true,
        tipo: 'INCREMENTAL',
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
        totalRecords: multasResult.count
      };

    } catch (error) {
      this.logger.error(`❌ Erro na sincronização incremental: ${error.message}`);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  // ✅ MÉTODOS CRON SIMPLIFICADOS

  @Cron('0 */6 * * *', {
    name: 'sincronizacao-automatica',
    timeZone: 'America/Sao_Paulo',
  })
  async sincronizacaoAutomatica() {
    if (this.syncInProgress) {
      this.logger.warn('⚠️ Sincronização já em andamento, pulando execução automática');
      return;
    }

    this.logger.log('🕐 Iniciando sincronização automática (a cada 6 horas)');
    
    try {
      await this.executarSincronizacaoCompleta();
    } catch (error) {
      this.logger.error(`❌ Erro na sincronização automática: ${error.message}`);
    }
  }

  // ✅ MÉTODOS VAZIOS PARA COMPATIBILIDADE
  private async verificarMultasVencidas(): Promise<void> {
    // Implementar se necessário
  }

  private async verificarMetasNaoAtingidas(): Promise<void> {
    // Implementar se necessário
  }

  private async verificarFalhasSincronizacao(): Promise<void> {
    // Implementar se necessário
  }
}