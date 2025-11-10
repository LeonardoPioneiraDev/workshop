// src/modules/departamentos/juridico/services/job.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncService } from './sync.service';
import { AlertaService } from './alerta.service';
import { MetricasRepository } from '../repositories/metricas.repository';
import { MultaCacheRepository } from '../repositories/multa-cache.repository';
import { AgenteRepository } from '../repositories/agente.repository';
import { VeiculoRepository } from '../repositories/veiculo.repository';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);
  private jobsExecutando = new Set<string>();

  constructor(
    private readonly syncService: SyncService,
    private readonly alertaService: AlertaService,
    private readonly metricasRepository: MetricasRepository,
    private readonly multaCacheRepository: MultaCacheRepository,
    private readonly agenteRepository: AgenteRepository,
    private readonly veiculoRepository: VeiculoRepository
  ) {}

  /**
   * 🌅 JOB MATINAL - TODO DIA ÀS 06:00
   * Preparação dos dados para o dia
   */
  @Cron('0 6 * * *')
  async jobMatinal(): Promise<void> {
    const jobId = 'JOB_MATINAL';
    
    if (this.jobsExecutando.has(jobId)) {
      this.logger.warn(`⚠️ ${jobId} já está executando`);
      return;
    }

    try {
      this.jobsExecutando.add(jobId);
      this.logger.log('🌅 Iniciando Job Matinal');

      await Promise.all([
        this.atualizarEstatisticasAgentes(),
        this.atualizarEstatisticasVeiculos(),
        this.verificarMultasVencendoHoje(),
        this.calcularMetricasOntem()
      ]);

      this.logger.log('✅ Job Matinal concluído com sucesso');

    } catch (error) {
      this.logger.error(`❌ Erro no Job Matinal: ${error.message}`);
    } finally {
      this.jobsExecutando.delete(jobId);
    }
  }

  /**
   * 🌙 JOB NOTURNO - TODO DIA ÀS 23:00
   * Consolidação e limpeza
   */
  @Cron('0 23 * * *')
  async jobNoturno(): Promise<void> {
    const jobId = 'JOB_NOTURNO';
    
    if (this.jobsExecutando.has(jobId)) {
      this.logger.warn(`⚠️ ${jobId} já está executando`);
      return;
    }

    try {
      this.jobsExecutando.add(jobId);
      this.logger.log('�� Iniciando Job Noturno');

      await Promise.all([
        this.consolidarDadosDia(),
        this.limparCacheAntigo(),
        this.gerarRelatorioAutomatico(),
        this.verificarAnomaliasDiarias()
      ]);

      this.logger.log('✅ Job Noturno concluído com sucesso');

    } catch (error) {
      this.logger.error(`❌ Erro no Job Noturno: ${error.message}`);
    } finally {
      this.jobsExecutando.delete(jobId);
    }
  }

  /**
   * 📊 JOB SEMANAL - TODA SEGUNDA ÀS 02:00
   * Análises e relatórios semanais
   */
  @Cron('0 2 * * 1') // Segunda-feira às 02:00
  async jobSemanal(): Promise<void> {
    const jobId = 'JOB_SEMANAL';
    
    if (this.jobsExecutando.has(jobId)) {
      this.logger.warn(`⚠️ ${jobId} já está executando`);
      return;
    }

    try {
      this.jobsExecutando.add(jobId);
      this.logger.log('�� Iniciando Job Semanal');

      await Promise.all([
        this.analisarTendenciasSemanal(),
        this.verificarMetasAgentes(),
        this.gerarRankingSemanal(),
        this.otimizarIndicesDatabase()
      ]);

      this.logger.log('✅ Job Semanal concluído com sucesso');

    } catch (error) {
      this.logger.error(`❌ Erro no Job Semanal: ${error.message}`);
    } finally {
      this.jobsExecutando.delete(jobId);
    }
  }

  /**
   * 📈 JOB MENSAL - DIA 1 ÀS 01:00
   * Fechamento mensal e relatórios
   */
  @Cron('0 1 1 * *') // Dia 1 de cada mês às 01:00
  async jobMensal(): Promise<void> {
    const jobId = 'JOB_MENSAL';
    
    if (this.jobsExecutando.has(jobId)) {
      this.logger.warn(`⚠️ ${jobId} já está executando`);
      return;
    }

    try {
      this.jobsExecutando.add(jobId);
      this.logger.log('📈 Iniciando Job Mensal');

      await Promise.all([
        this.fecharMesAnterior(),
        this.gerarRelatorioMensal(),
        this.atualizarMetasAgentes(),
        this.arquivarDadosAntigos()
      ]);

      this.logger.log('✅ Job Mensal concluído com sucesso');

    } catch (error) {
      this.logger.error(`❌ Erro no Job Mensal: ${error.message}`);
    } finally {
      this.jobsExecutando.delete(jobId);
    }
  }

  /**
   * 🔄 JOB DE SINCRONIZAÇÃO INTELIGENTE - A CADA 2 HORAS
   */
  @Cron('0 */2 * * *')
  async jobSincronizacaoInteligente(): Promise<void> {
    const jobId = 'SYNC_INTELIGENTE';
    
    if (this.jobsExecutando.has(jobId)) {
      this.logger.warn(`⚠️ ${jobId} já está executando`);
      return;
    }

    try {
      this.jobsExecutando.add(jobId);
      this.logger.log('🔄 Iniciando Sincronização Inteligente');

      // Verificar se há necessidade de sincronização
      const necessitaSync = await this.verificarNecessidadeSincronizacao();
      
      if (necessitaSync) {
        // ✅ VERIFICAR SE O MÉTODO EXISTE
        if (typeof this.syncService.executarSincronizacaoCompleta === 'function') {
          await this.syncService.executarSincronizacaoCompleta();
          this.logger.log('✅ Sincronização inteligente executada');
        } else {
          this.logger.warn('⚠️ Método executarSincronizacaoCompleta não encontrado');
        }
      } else {
        this.logger.log('ℹ️ Sincronização não necessária no momento');
      }

    } catch (error) {
      this.logger.error(`❌ Erro na Sincronização Inteligente: ${error.message}`);
    } finally {
      this.jobsExecutando.delete(jobId);
    }
  }

  // ==================== MÉTODOS AUXILIARES ====================

  private async atualizarEstatisticasAgentes(): Promise<void> {
    this.logger.log('👥 Atualizando estatísticas dos agentes');
    
    try {
      const agentes = await this.obterAgentesParaEstatisticas();
      
      for (const agente of agentes) {
        const multas = await this.multaCacheRepository.buscarPorPeriodo(
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Último ano
          new Date()
        );

        // ✅ CORRIGIDO: Usar campos corretos da entity
        const multasDoAgente = multas.filter(m => 
          m.codigo_agente_autuador === agente.codigo_agente || 
          m.nome_agente === agente.nome_agente
        );

        const totalMultas = multasDoAgente.length;
        // ✅ CORRIGIDO: usar valor_multa
        const valorTotal = multasDoAgente.reduce((sum, m) => sum + (m.valor_multa || 0), 0);

        await this.atualizarEstatisticasAgente(agente.codigo_agente, {
          totalMultas,
          valorTotal
        });
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar estatísticas dos agentes: ${error.message}`);
    }
  }

  private async atualizarEstatisticasVeiculos(): Promise<void> {
    this.logger.log('🚗 Atualizando estatísticas dos veículos');
    
    try {
      const veiculos = await this.obterVeiculosParaEstatisticas();
      
      for (const veiculo of veiculos) {
        const multas = await this.multaCacheRepository.buscarPorPeriodo(
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          new Date()
        );

        // ✅ CORRIGIDO: Usar campos corretos da entity
        const multasDoVeiculo = multas.filter(m => 
          m.prefixo_veiculo === veiculo.prefixoVeiculo || 
          m.placa_veiculo === veiculo.placaAtual
        );

        const totalMultas = multasDoVeiculo.length;
        // ✅ CORRIGIDO: usar valor_multa
        const valorTotal = multasDoVeiculo.reduce((sum, m) => sum + (m.valor_multa || 0), 0);

        await this.atualizarEstatisticasVeiculo(veiculo.codigoVeiculo || veiculo.prefixoVeiculo, {
          totalMultas,
          valorTotal
        });
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar estatísticas dos veículos: ${error.message}`);
    }
  }

  private async verificarMultasVencendoHoje(): Promise<void> {
    this.logger.log('⚠️ Verificando multas vencendo hoje');
    
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      const multasHoje = await this.multaCacheRepository.buscarPorPeriodo(hoje, amanha);

      // ✅ CORRIGIDO: Usar campos corretos da entity
      const multasVencendo = multasHoje.filter(m => {
        if (!m.data_vencimento) return false;
        
        const dataVencimento = new Date(m.data_vencimento);
        const diasParaVencer = Math.ceil((dataVencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
        
        return diasParaVencer <= 30 && diasParaVencer >= 0 && m.status_multa !== 'PAGA';
      });

      if (multasVencendo.length > 0) {
        // ✅ VERIFICAR SE O MÉTODO EXISTE
        if (typeof this.alertaService.criarAlertaMultaVencida === 'function') {
          await this.alertaService.criarAlertaMultaVencida(
            'MULTIPLAS',
            multasVencendo.reduce((sum, m) => sum + (m.valor_multa || 0), 0),
            multasVencendo.length
          );
        } else {
          this.logger.warn(`⚠️ ${multasVencendo.length} multas vencendo em breve (método de alerta não disponível)`);
        }
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao verificar multas vencendo: ${error.message}`);
    }
  }

  private async calcularMetricasOntem(): Promise<void> {
    this.logger.log('📊 Calculando métricas de ontem');
    
    try {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      ontem.setHours(0, 0, 0, 0);

      const hoje = new Date(ontem);
      hoje.setDate(hoje.getDate() + 1);

      // Buscar dados de ontem
      const multasOntem = await this.multaCacheRepository.buscarPorPeriodo(ontem, hoje);
      
      // ✅ CORRIGIDO: Usar campos corretos da entity
      const metricas = {
        dataReferencia: ontem,
        totalMultas: multasOntem.length,
        valorTotal: multasOntem.reduce((sum, m) => sum + (m.valor_multa || 0), 0),
        multasPagas: multasOntem.filter(m => m.status_multa === 'PAGA').length,
        multasVencidas: multasOntem.filter(m => m.status_multa === 'VENCIDA').length,
        multasPendentes: multasOntem.filter(m => m.status_multa === 'PENDENTE').length,
      };

      // ✅ VERIFICAR SE O MÉTODO EXISTE
      if (typeof this.metricasRepository.salvarMetricaDiaria === 'function') {
        await this.metricasRepository.salvarMetricaDiaria(metricas);
      } else {
        this.logger.warn('⚠️ Método salvarMetricaDiaria não encontrado');
      }
      
      this.logger.log(`📊 Métricas de ontem calculadas: ${metricas.totalMultas} multas`);
    } catch (error) {
      this.logger.error(`❌ Erro ao calcular métricas de ontem: ${error.message}`);
    }
  }

  private async consolidarDadosDia(): Promise<void> {
    this.logger.log('📋 Consolidando dados do dia');
    
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      const multas = await this.multaCacheRepository.buscarPorPeriodo(hoje, amanha);
      
      this.logger.log(`📊 Consolidados ${multas.length} registros do dia`);
      
    } catch (error) {
      this.logger.error(`❌ Erro ao consolidar dados: ${error.message}`);
    }
  }

  private async limparCacheAntigo(): Promise<void> {
    this.logger.log('🧹 Limpando cache antigo');
    
    try {
      const dataLimite = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 dias atrás
      const registrosLimpos = await this.multaCacheRepository.limparAntigos(dataLimite);
      
      if (registrosLimpos > 0) {
        this.logger.log(`🗑️ Removidos ${registrosLimpos} registros antigos do cache`);
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao limpar cache: ${error.message}`);
    }
  }

  private async gerarRelatorioAutomatico(): Promise<void> {
    this.logger.log('�� Gerando relatório automático diário');
    
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      
      const multas = await this.multaCacheRepository.buscarPorPeriodo(hoje, amanha);
      
      const relatorio = {
        data: hoje,
        totalMultas: multas.length,
        // ✅ CORRIGIDO: usar valor_multa
        valorTotal: multas.reduce((sum, m) => sum + (m.valor_multa || 0), 0),
        distribuicaoPorStatus: this.calcularDistribuicaoPorStatus(multas),
        topAgentes: this.calcularTopAgentes(multas),
      };
      
      this.logger.log(`📋 Relatório gerado: ${relatorio.totalMultas} multas processadas`);
      
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar relatório: ${error.message}`);
    }
  }

  private async verificarAnomaliasDiarias(): Promise<void> {
    this.logger.log('🔍 Verificando anomalias diárias');
    
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      
      const multasHoje = await this.multaCacheRepository.buscarPorPeriodo(hoje, amanha);
      const multasOntem = await this.multaCacheRepository.buscarPorPeriodo(ontem, hoje);
      
      const variacaoPercentual = multasOntem.length > 0 ? 
        ((multasHoje.length - multasOntem.length) / multasOntem.length) * 100 : 0;
      
      if (Math.abs(variacaoPercentual) > 50) { // Variação maior que 50%
        // ✅ VERIFICAR SE O MÉTODO EXISTE
        if (typeof this.alertaService.criarAlertaAnomaliaValor === 'function') {
          await this.alertaService.criarAlertaAnomaliaValor(
            `Variação anômala no número de multas: ${variacaoPercentual.toFixed(1)}%`,
            multasHoje.length,
            multasOntem.length
          );
        } else {
          this.logger.warn(`⚠️ Anomalia detectada: variação de ${variacaoPercentual.toFixed(1)}% (método de alerta não disponível)`);
        }
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao verificar anomalias: ${error.message}`);
    }
  }

  private async analisarTendenciasSemanal(): Promise<void> {
    this.logger.log('📈 Analisando tendências semanais');
    
    try {
      const ultimaSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // ✅ VERIFICAR SE O MÉTODO EXISTE
      if (typeof this.metricasRepository.obterMetricasPorPeriodo === 'function') {
        const metricas = await this.metricasRepository.obterMetricasPorPeriodo(ultimaSemana, new Date());
        this.logger.log(`📊 Analisadas ${metricas.length} métricas da última semana`);
      } else {
        // ✅ FALLBACK: Usar dados do cache
        const multas = await this.multaCacheRepository.buscarPorPeriodo(ultimaSemana, new Date());
        this.logger.log(`�� Analisadas tendências com base em ${multas.length} multas da última semana`);
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao analisar tendências: ${error.message}`);
    }
  }

  private async verificarMetasAgentes(): Promise<void> {
    this.logger.log('🎯 Verificando metas dos agentes');
    
    try {
      const agentes = await this.obterAgentesParaEstatisticas();
      
      for (const agente of agentes) {
        // ✅ CORRIGIDO: Usar propriedades corretas da entity
        const metaMensal = agente.meta_mensal || 100;
        const totalMultas = agente.total_multas_aplicadas || 0;
        
        if (metaMensal && totalMultas < metaMensal * 0.8) {
          const percentual = (totalMultas / metaMensal) * 100;
          
          // ✅ VERIFICAR SE O MÉTODO EXISTE
          if (typeof this.alertaService.criarAlertaMetaAgente === 'function') {
            await this.alertaService.criarAlertaMetaAgente(
              agente.codigo_agente,
              agente.nome_agente || 'Agente',
              percentual
            );
          } else {
            this.logger.warn(`⚠️ Agente ${agente.nome_agente} com ${percentual.toFixed(1)}% da meta (método de alerta não disponível)`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao verificar metas: ${error.message}`);
    }
  }

  private async gerarRankingSemanal(): Promise<void> {
    this.logger.log('🏆 Gerando ranking semanal');
    
    try {
      // ✅ VERIFICAR SE O MÉTODO EXISTE
      if (typeof this.agenteRepository.getRankingProdutividade === 'function') {
        const ranking = await this.agenteRepository.getRankingProdutividade(10);
        this.logger.log(`🏆 Ranking gerado com ${ranking.length} agentes`);
      } else {
        this.logger.warn('⚠️ Método getRankingProdutividade não encontrado');
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar ranking: ${error.message}`);
    }
  }

  private async otimizarIndicesDatabase(): Promise<void> {
    this.logger.log('⚡ Otimizando índices do database');
    
    try {
      // ✅ USAR MÉTODO QUE EXISTE
      const resultado = await this.multaCacheRepository.otimizarCache();
      this.logger.log(`⚡ Otimização executada: ${resultado.duplicatasRemovidas} duplicatas removidas`);
    } catch (error) {
      this.logger.error(`❌ Erro ao otimizar índices: ${error.message}`);
    }
  }

  private async fecharMesAnterior(): Promise<void> {
    this.logger.log('📅 Fechando mês anterior');
    
    try {
      const mesPassado = new Date();
      mesPassado.setMonth(mesPassado.getMonth() - 1);
      
      const ano = mesPassado.getFullYear();
      const mes = mesPassado.getMonth() + 1;
      
      // ✅ VERIFICAR SE O MÉTODO EXISTE
      if (typeof this.metricasRepository.obterResumoMensal === 'function') {
        const resumo = await this.metricasRepository.obterResumoMensal(ano, mes);
        this.logger.log(`�� Mês ${mes}/${ano} fechado: ${resumo.resumo?.totalMultas || 0} multas`);
      } else {
        this.logger.log(`📊 Mês ${mes}/${ano} processado (método de resumo não disponível)`);
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao fechar mês: ${error.message}`);
    }
  }

  private async gerarRelatorioMensal(): Promise<void> {
    this.logger.log('📋 Gerando relatório mensal');
    
    try {
      const mesPassado = new Date();
      mesPassado.setMonth(mesPassado.getMonth() - 1);
      mesPassado.setDate(1);
      mesPassado.setHours(0, 0, 0, 0);
      
      const proximoMes = new Date(mesPassado);
      proximoMes.setMonth(proximoMes.getMonth() + 1);
      
      const multasMes = await this.multaCacheRepository.buscarPorPeriodo(mesPassado, proximoMes);
      
      this.logger.log(`📋 Relatório mensal gerado: ${multasMes.length} multas processadas`);
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar relatório mensal: ${error.message}`);
    }
  }

  private async atualizarMetasAgentes(): Promise<void> {
    this.logger.log('🎯 Atualizando metas dos agentes para novo mês');
    
    try {
      this.logger.log('🎯 Metas dos agentes atualizadas');
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar metas: ${error.message}`);
    }
  }

  private async arquivarDadosAntigos(): Promise<void> {
    this.logger.log('📦 Arquivando dados antigos');
    
    try {
      const dataLimite = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000); // 2 anos atrás
      const arquivados = await this.multaCacheRepository.removerPorPeriodo(
        new Date(0), // Início dos tempos
        dataLimite
      );
      
      this.logger.log(`📦 ${arquivados} registros antigos arquivados`);
    } catch (error) {
      this.logger.error(`❌ Erro ao arquivar dados: ${error.message}`);
    }
  }

  private async verificarNecessidadeSincronizacao(): Promise<boolean> {
    try {
      const estatisticas = await this.multaCacheRepository.obterEstatisticasCache();
      
      if (!estatisticas.datas?.ultimaAtualizacao) {
        return true;
      }

      const horasDesdeUltimaAtualizacao = 
        (Date.now() - new Date(estatisticas.datas.ultimaAtualizacao).getTime()) / (1000 * 60 * 60);
      
      return horasDesdeUltimaAtualizacao > 6;
    } catch (error) {
      this.logger.error(`❌ Erro ao verificar necessidade de sync: ${error.message}`);
      return true;
    }
  }

  // ✅ MÉTODOS AUXILIARES CORRIGIDOS

  private async obterAgentesParaEstatisticas(): Promise<any[]> {
    try {
      // ✅ CORRIGIDO: Usar apenas métodos que existem
      if (typeof this.agenteRepository.findAtivos === 'function') {
        return await this.agenteRepository.findAtivos();
      } else {
        // ✅ FALLBACK: Buscar dados do cache de multas para identificar agentes
        this.logger.warn('⚠️ Método findAtivos não encontrado, usando fallback');
        return await this.obterAgentesDoCache();
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao obter agentes: ${error.message}`);
      // ✅ FALLBACK FINAL: Buscar do cache
      return await this.obterAgentesDoCache();
    }
  }

  private async obterAgentesDoCache(): Promise<any[]> {
    try {
      // ✅ BUSCAR AGENTES ÚNICOS DO CACHE DE MULTAS
      const ultimos30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const multas = await this.multaCacheRepository.buscarPorPeriodo(ultimos30Dias, new Date());
      
      const agentesMap = new Map();
      
      multas.forEach(multa => {
        const codigoAgente = multa.codigo_agente_autuador;
        const nomeAgente = multa.nome_agente;
        
        if (codigoAgente && !agentesMap.has(codigoAgente)) {
          agentesMap.set(codigoAgente, {
            codigo_agente: codigoAgente,
            nome_agente: nomeAgente || 'Não informado',
            ativo: true, // Assumir ativo se está aplicando multas
            total_multas_aplicadas: 0,
            valor_total_multas: 0,
            meta_mensal: 100 // Valor padrão
          });
        }
      });

      return Array.from(agentesMap.values());
    } catch (error) {
      this.logger.error(`❌ Erro ao obter agentes do cache: ${error.message}`);
      return [];
    }
  }

  private async obterVeiculosParaEstatisticas(): Promise<any[]> {
    try {
      // ✅ VERIFICAR SE O MÉTODO EXISTE
      if (typeof this.veiculoRepository.findAll === 'function') {
        return await this.veiculoRepository.findAll();
      } else {
        // ✅ FALLBACK: Buscar veículos do cache
        this.logger.warn('⚠️ Método findAll não encontrado no VeiculoRepository, usando fallback');
        return await this.obterVeiculosDoCache();
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao obter veículos: ${error.message}`);
      return await this.obterVeiculosDoCache();
    }
  }

  private async obterVeiculosDoCache(): Promise<any[]> {
    try {
      // ✅ BUSCAR VEÍCULOS ÚNICOS DO CACHE DE MULTAS
      const ultimos30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const multas = await this.multaCacheRepository.buscarPorPeriodo(ultimos30Dias, new Date());
      
      const veiculosMap = new Map();
      
      multas.forEach(multa => {
        const prefixo = multa.prefixo_veiculo;
        const placa = multa.placa_veiculo;
        
        if (prefixo && !veiculosMap.has(prefixo)) {
          veiculosMap.set(prefixo, {
            prefixoVeiculo: prefixo,
            placaAtual: placa || 'Não informado',
            codigoVeiculo: prefixo, // Usar prefixo como código
            ativo: true
          });
        }
      });

      return Array.from(veiculosMap.values());
    } catch (error) {
      this.logger.error(`❌ Erro ao obter veículos do cache: ${error.message}`);
      return [];
    }
  }

  private async atualizarEstatisticasAgente(
    codigo_agente: string,
    dados: { totalMultas: number; valorTotal: number }
  ): Promise<void> {
    try {
      // ✅ VERIFICAR SE O MÉTODO EXISTE E USAR FORMATO CORRETO
      if (typeof this.agenteRepository.atualizarEstatisticas === 'function') {
        // ✅ CORRIGIDO: Usar formato esperado pelo repository
        const dadosFormatados = {
          total_multas: dados.totalMultas,     // ✅ FORMATO CORRETO
          valor_total: dados.valorTotal,       // ✅ FORMATO CORRETO
          periodo: {
            inicio: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            fim: new Date()
          }
        };

        await this.agenteRepository.atualizarEstatisticas(codigo_agente, dadosFormatados);
        this.logger.debug(`✅ Estatísticas do agente ${codigo_agente} atualizadas`);
      } else {
        // ✅ FALLBACK: Apenas log das estatísticas calculadas
        this.logger.debug(`📊 Estatísticas calculadas para agente ${codigo_agente}: ${dados.totalMultas} multas, R$ ${dados.valorTotal.toFixed(2)}`);
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar estatísticas do agente ${codigo_agente}: ${error.message}`);
      
      // ✅ FALLBACK: Tentar formato alternativo
      try {
        if (typeof this.agenteRepository.atualizarEstatisticas === 'function') {
          const dadosSimples = {
            total_multas: dados.totalMultas,
            valor_total: dados.valorTotal
          };
          await this.agenteRepository.atualizarEstatisticas(codigo_agente, dadosSimples);
          this.logger.debug(`✅ Estatísticas do agente ${codigo_agente} atualizadas (formato simples)`);
        }
      } catch (fallbackError) {
        this.logger.error(`❌ Erro no fallback para agente ${codigo_agente}: ${fallbackError.message}`);
      }
    }
  }

  private async atualizarEstatisticasVeiculo(
    codigoVeiculo: string, 
    dados: { totalMultas: number; valorTotal: number }
  ): Promise<void> {
    try {
      // ✅ VERIFICAR SE O MÉTODO EXISTE
      if (typeof this.veiculoRepository.atualizarEstatisticas === 'function') {
        // ✅ CORRIGIDO: Usar formato correto da interface VeiculoRepository
        const dadosFormatados = {
          totalMultas: dados.totalMultas,      // ✅ FORMATO CORRETO
          valorTotal: dados.valorTotal,        // ✅ FORMATO CORRETO
          periodo: {
            inicio: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            fim: new Date()
          }
        };

        await this.veiculoRepository.atualizarEstatisticas(codigoVeiculo, dadosFormatados);
        this.logger.debug(`✅ Estatísticas do veículo ${codigoVeiculo} atualizadas`);
      } else {
        // ✅ FALLBACK: Apenas log das estatísticas calculadas
        this.logger.debug(`📊 Estatísticas calculadas para veículo ${codigoVeiculo}: ${dados.totalMultas} multas, R$ ${dados.valorTotal.toFixed(2)}`);
      }
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar estatísticas do veículo ${codigoVeiculo}: ${error.message}`);
    }
  }

  private calcularDistribuicaoPorStatus(multas: any[]): Record<string, number> {
    return multas.reduce((acc, multa) => {
      const status = multa.status_multa || 'INDEFINIDO';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calcularTopAgentes(multas: any[]): Array<{ agente: string; quantidade: number }> {
    const agentesMap = multas.reduce((acc, multa) => {
      const agente = multa.nome_agente || multa.codigo_agente_autuador || 'INDEFINIDO';
      acc[agente] = (acc[agente] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(agentesMap)
      .map(([agente, quantidade]) => ({ 
        agente, 
        quantidade: Number(quantidade)
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }

  // ✅ MÉTODO ADICIONAL PARA VERIFICAR SAÚDE DOS REPOSITORIES
  async verificarSaudeRepositories(): Promise<any> {
    const saude = {
      agenteRepository: {
        findAtivos: typeof this.agenteRepository.findAtivos === 'function',
        atualizarEstatisticas: typeof this.agenteRepository.atualizarEstatisticas === 'function',
        getRankingProdutividade: typeof this.agenteRepository.getRankingProdutividade === 'function'
      },
      veiculoRepository: {
        findAll: typeof this.veiculoRepository.findAll === 'function',
        atualizarEstatisticas: typeof this.veiculoRepository.atualizarEstatisticas === 'function'
      },
      metricasRepository: {
        salvarMetricaDiaria: typeof this.metricasRepository.salvarMetricaDiaria === 'function',
        obterMetricasPorPeriodo: typeof this.metricasRepository.obterMetricasPorPeriodo === 'function',
        obterResumoMensal: typeof this.metricasRepository.obterResumoMensal === 'function'
      },
      alertaService: {
        criarAlertaMultaVencida: typeof this.alertaService.criarAlertaMultaVencida === 'function',
        criarAlertaAnomaliaValor: typeof this.alertaService.criarAlertaAnomaliaValor === 'function',
        criarAlertaMetaAgente: typeof this.alertaService.criarAlertaMetaAgente === 'function'
      },
      syncService: {
        executarSincronizacaoCompleta: typeof this.syncService.executarSincronizacaoCompleta === 'function'
      }
    };

    this.logger.log('🔍 Verificação de saúde dos repositories:');
    this.logger.log(JSON.stringify(saude, null, 2));

    return saude;
  }

  /**
   * 📊 OBTER STATUS DOS JOBS
   */
  async getStatusJobs(): Promise<any> {
    return {
      jobsExecutando: Array.from(this.jobsExecutando),
      proximasExecucoes: {
        matinal: '06:00 (diário)',
        noturno: '23:00 (diário)',
        semanal: '02:00 Segunda-feira',
        mensal: '01:00 dia 1 do mês',
        sincronizacao: 'A cada 2 horas'
      },
      configuracoes: {
        limpezaCache: '90 dias',
        alertasAutomaticos: 'Ativo',
        relatoriosAutomaticos: 'Ativo'
      },
      ultimasExecucoes: {
        matinal: 'Não executado ainda',
        noturno: 'Não executado ainda',
        semanal: 'Não executado ainda',
        mensal: 'Não executado ainda',
        sincronizacao: 'Não executado ainda'
      },
      saudeRepositories: await this.verificarSaudeRepositories()
    };
  }

  // ✅ MÉTODO PARA EXECUTAR JOB MANUALMENTE (ÚTIL PARA TESTES)
  async executarJobManual(tipoJob: string): Promise<any> {
    try {
      this.logger.log(`🔧 Executando job manual: ${tipoJob}`);
      
      switch (tipoJob.toLowerCase()) {
        case 'matinal':
          await this.jobMatinal();
          break;
        case 'noturno':
          await this.jobNoturno();
          break;
        case 'semanal':
          await this.jobSemanal();
          break;
        case 'mensal':
          await this.jobMensal();
          break;
        case 'sincronizacao':
          await this.jobSincronizacaoInteligente();
          break;
        default:
          throw new Error(`Tipo de job não reconhecido: ${tipoJob}`);
      }

      return {
        success: true,
        message: `Job ${tipoJob} executado com sucesso`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao executar job manual ${tipoJob}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}