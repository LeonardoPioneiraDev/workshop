// src/modules/departamentos/operacoes/services/frota.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { OracleReadOnlyService } from '../../../../oracle/services/oracle-readonly.service';
import { VeiculoOperacional } from '../entities/veiculo-operacional.entity';
import { HistoricoVeiculo } from '../entities/historico-veiculo.entity';
import { FiltrosFrotaDto, StatusVeiculo } from '../dto/filtros-frota.dto';
import * as crypto from 'crypto';

@Injectable()
export class FrotaService {
  private readonly logger = new Logger(FrotaService.name);

  constructor(
    @InjectRepository(VeiculoOperacional)
    private readonly veiculoRepository: Repository<VeiculoOperacional>,
    @InjectRepository(HistoricoVeiculo)
    private readonly historicoRepository: Repository<HistoricoVeiculo>,
    private readonly oracleService: OracleReadOnlyService,
  ) {}

  async buscarFrota(filtros: FiltrosFrotaDto) {
    this.logger.log(`🔍 Buscando frota com filtros: ${JSON.stringify(filtros)}`);

    try {
      const dataHoje = new Date().toISOString().split('T')[0];
      const dataBusca = filtros.dataSincronizacao || dataHoje;

      // Verificar se precisa sincronizar
      const precisaSincronizar = await this.verificarNecessidadeSincronizacao(dataBusca, filtros.forcarSincronizacao);

      if (precisaSincronizar) {
        this.logger.log('📥 Dados não encontrados ou desatualizados. Sincronizando...');
        try {
          await this.sincronizarFrota(dataBusca);
        } catch (syncError: any) {
          this.logger.warn(`⚠️ Erro na sincronização da frota, usando dados locais: ${syncError.message}`);
        }
      }

      // Buscar dados locais com filtros
      return await this.buscarDadosLocais(filtros);
    } catch (error: any) {
      this.logger.error('❌ Erro ao buscar frota:', error);
      return {
        veiculos: [],
        data: [],
        totalRegistros: 0,
        total: 0,
        paginaAtual: filtros.page,
        page: filtros.page,
        limit: filtros.limit,
        totalPaginas: 0,
        totalPages: 0,
        estatisticas: null,
        ultimaSincronizacao: new Date().toISOString(),
        erro: 'Erro ao buscar dados da frota'
      };
    }
  }

  private async verificarNecessidadeSincronizacao(data: string, forcar: boolean = false): Promise<boolean> {
    if (forcar) return true;

    try {
      const count = await this.veiculoRepository.count({
        where: { dataSincronizacao: new Date(data) }
      });

      return count === 0;
    } catch (error: any) {
      this.logger.error('❌ Erro ao verificar necessidade de sincronização:', error);
      return false;
    }
  }

  private async buscarDadosLocais(filtros: FiltrosFrotaDto) {
    try {
      const query = this.veiculoRepository.createQueryBuilder('veiculo');

      // Aplicar filtros
      this.aplicarFiltros(query, filtros);

      // Paginação
      const skip = (filtros.page - 1) * filtros.limit;
      query.skip(skip).take(filtros.limit);

      // Ordenação
      query.orderBy('veiculo.prefixo', 'ASC');

      const [veiculos, total] = await query.getManyAndCount();

      // Buscar estatísticas
      const estatisticas = await this.obterEstatisticasFrota();

      return {
        veiculos,
        data: veiculos,
        totalRegistros: total,
        total,
        paginaAtual: filtros.page,
        page: filtros.page,
        limit: filtros.limit,
        totalPaginas: Math.ceil(total / filtros.limit),
        totalPages: Math.ceil(total / filtros.limit),
        estatisticas,
        ultimaSincronizacao: new Date().toISOString()
      };
    } catch (error: any) {
      this.logger.error('❌ Erro ao buscar dados locais da frota:', error);
      return {
        veiculos: [],
        data: [],
        totalRegistros: 0,
        total: 0,
        paginaAtual: filtros.page,
        page: filtros.page,
        limit: filtros.limit,
        totalPaginas: 0,
        totalPages: 0,
        estatisticas: null,
        ultimaSincronizacao: new Date().toISOString(),
        erro: 'Erro ao buscar dados locais'
      };
    }
  }

  private aplicarFiltros(query: SelectQueryBuilder<VeiculoOperacional>, filtros: FiltrosFrotaDto) {
    if (filtros.status && filtros.status !== StatusVeiculo.TODOS) {
      query.andWhere('veiculo.status = :status', { status: filtros.status });
    }

    if (filtros.garagem) {
      query.andWhere('veiculo.garagemNome ILIKE :garagem', { garagem: `%${filtros.garagem}%` });
    }

    if (filtros.prefixo) {
      query.andWhere('veiculo.prefixo ILIKE :prefixo', { prefixo: `%${filtros.prefixo}%` });
    }

    if (filtros.placa) {
      query.andWhere('veiculo.placa ILIKE :placa', { placa: `%${filtros.placa}%` });
    }

    if (filtros.tipoVeiculo) {
      query.andWhere('veiculo.tipoVeiculo ILIKE :tipo', { tipo: `%${filtros.tipoVeiculo}%` });
    }

    if (filtros.dataSincronizacao) {
      query.andWhere('veiculo.dataSincronizacao = :data', { data: new Date(filtros.dataSincronizacao) });
    }
  }

  async sincronizarFrota(data?: string): Promise<{
    total: number;
    ativos: number;
    inativos: number;
    sincronizados: number;
    atualizados: number;
    erros: number;
    mudancasDetectadas: number;
  }> {
    this.logger.log('🔄 Iniciando sincronização da frota...');

    try {
      const queryVeiculos = `
        SELECT 
          C.CODIGOVEIC AS "CODIGO_VEICULO",
          C.PREFIXOVEIC AS "PREFIXO",
          REPLACE(REPLACE(C.PLACAATUALVEIC, '-', ''), ' ', '') AS "PLACA",
          L.DESCRICAOMARCARROC || ' - ' || M.DESCRICAOMODCARROC AS "MODELO",
          R.DESCRICAOMOTMARCA AS "MARCA",
          SUBSTR(P.MESANOFABRCPRVEIC, 3, 2) AS "ANO",
          CASE 
            WHEN C.CONDICAOVEIC = 'A' THEN 'ATIVO'
            WHEN C.CONDICAOVEIC = 'I' THEN 'INATIVO'
            ELSE 'DESCONHECIDO'
          END AS "STATUS",
          TO_CHAR(C.CODIGOGA) AS "GARAGEM",
          CASE 
            WHEN C.CODIGOGA = 31 THEN 'PARANOÁ'
            WHEN C.CODIGOGA = 124 THEN 'SANTA MARIA'
            WHEN C.CODIGOGA = 239 THEN 'SÃO SEBASTIÃO'
            WHEN C.CODIGOGA = 240 THEN 'GAMA'
            ELSE 'DESCONHECIDA'
          END AS "GARAGEM_NOME",
          NULL AS "SETOR",
          CASE 
            WHEN T.CODIGOTPFROTA = 3 THEN 'CONVENCIONAL'
            WHEN T.CODIGOTPFROTA = 4 THEN 'ART. PISO ALTO'
            WHEN T.CODIGOTPFROTA = 9 THEN 'MINI-ÔNIBUS'
            WHEN T.CODIGOTPFROTA IN (10, 11, 14) THEN 'ART. PISO BAIXO'
            WHEN T.CODIGOTPFROTA = 12 THEN 'PADRON'
            WHEN T.CODIGOTPFROTA = 13 THEN 'SUPER PADRON'
            ELSE T.DESCRICAOTPFROTA
          END AS "TIPO_VEICULO",
          NULL AS "CAPACIDADE_PASSAGEIROS"
        FROM FRT_CADVEICULOS C
        LEFT JOIN FRT_COMPRAVEIC P ON C.CODIGOVEIC = P.CODIGOVEIC
        LEFT JOIN FRT_MODCARROC M ON C.CODIGOMODCARROC = M.CODIGOMODCARROC
        LEFT JOIN FRT_MARCACARROC L ON M.CODIGOMARCARROC = L.CODIGOMARCARROC
        LEFT JOIN FRT_TIPODEFROTA T ON C.CODIGOTPFROTA = T.CODIGOTPFROTA
        LEFT JOIN MOT_MODELOMOTOR E ON C.CODIGOMODMOTOR = E.CODIGOMODMOTOR
        LEFT JOIN MOT_CADASTROMARCA R ON E.CODIGOMOTMARCA = R.CODIGOMOTMARCA
        WHERE C.CONDICAOVEIC IN ('A', 'I')
          AND C.CODIGOEMPRESA = 4
          AND C.CODIGOGA IN (31, 124, 239, 240)
          AND LENGTH(TO_NUMBER(C.PREFIXOVEIC)) > 5
        ORDER BY C.CODIGOGA, TO_NUMBER(C.PREFIXOVEIC)
      `;

      const veiculosOracle = await this.oracleService.executeQuery(queryVeiculos);
      
      let sincronizados = 0;
      let atualizados = 0;
      let erros = 0;
      let ativos = 0;
      let inativos = 0;
      let mudancasDetectadas = 0;

      const dataSincronizacao = data ? new Date(data) : new Date();

      for (const veiculo of veiculosOracle) {
        try {
          const resultado = await this.salvarOuAtualizarVeiculo(veiculo, dataSincronizacao);
          
          if (resultado.isNew) {
            sincronizados++;
          } else {
            atualizados++;
          }

          if (resultado.mudancasDetectadas > 0) {
            mudancasDetectadas += resultado.mudancasDetectadas;
          }
          
          // ✅ CORREÇÃO: Mudança de 'activos' para 'ativos'
          if (veiculo.STATUS === 'ATIVO') ativos++;
          else inativos++;
          
        } catch (error: any) {
          this.logger.error(`Erro ao sincronizar veículo ${veiculo.PREFIXO}:`, error);
          erros++;
        }
      }

      this.logger.log(`✅ Sincronização concluída: ${sincronizados} novos, ${atualizados} atualizados, ${mudancasDetectadas} mudanças, ${erros} erros`);

      return {
        total: veiculosOracle.length,
        ativos,
        inativos,
        sincronizados,
        atualizados,
        erros,
        mudancasDetectadas,
      };

    } catch (error: any) {
      this.logger.error('❌ Erro na sincronização da frota:', error);
      throw error;
    }
  }

  private async salvarOuAtualizarVeiculo(dadosOracle: any, dataSincronizacao: Date): Promise<{
    veiculo: VeiculoOperacional;
    isNew: boolean;
    mudancasDetectadas: number;
  }> {
    const veiculoExistente = await this.veiculoRepository.findOne({
      where: { prefixo: dadosOracle.PREFIXO }
    });

    // ✅ CORREÇÃO: Removido 'hashDados' que não existe na entidade
    const dadosVeiculo: Partial<VeiculoOperacional> = {
      codigoVeiculo: dadosOracle.CODIGO_VEICULO,
      prefixo: dadosOracle.PREFIXO,
      placa: dadosOracle.PLACA,
      modelo: dadosOracle.MODELO,
      marca: dadosOracle.MARCA,
      ano: dadosOracle.ANO,
      status: dadosOracle.STATUS,
      garagem: dadosOracle.GARAGEM,
      garagemNome: dadosOracle.GARAGEM_NOME,
      setor: dadosOracle.SETOR,
      tipoVeiculo: dadosOracle.TIPO_VEICULO,
      capacidadePassageiros: dadosOracle.CAPACIDADE_PASSAGEIROS,
      combustivel: null,
      quilometragem: null,
      motoristaAtual: null,
      rotaAtual: null,     
      dataUltimaAtualizacao: new Date(),
      dataSincronizacao,
      // ✅ REMOVIDO: hashDados não existe na entidade VeiculoOperacional
    };

    let mudancasDetectadas = 0;

    if (veiculoExistente) {
      // Verificar mudanças e registrar histórico
      mudancasDetectadas = await this.detectarERegistrarMudancas(veiculoExistente, dadosVeiculo);
      
      await this.veiculoRepository.update(veiculoExistente.id, dadosVeiculo);
      return {
        veiculo: { ...veiculoExistente, ...dadosVeiculo } as VeiculoOperacional,
        isNew: false,
        mudancasDetectadas,
      };
    } else {
      const novoVeiculo = await this.veiculoRepository.save(dadosVeiculo as VeiculoOperacional);
      return {
        veiculo: novoVeiculo,
        isNew: true,
        mudancasDetectadas: 0,
      };
    }
  }

  private async detectarERegistrarMudancas(
    veiculoAnterior: VeiculoOperacional,
    dadosNovos: Partial<VeiculoOperacional>
  ): Promise<number> {
    const mudancas: Array<{
      campo: string;
      valorAnterior: string;
      valorNovo: string;
      tipo: string;
    }> = [];

    const camposImportantes = [
      { campo: 'status', tipo: 'STATUS' },
      { campo: 'garagemNome', tipo: 'GARAGEM' },
    ];

    for (const { campo, tipo } of camposImportantes) {
      const valorAnterior = veiculoAnterior[campo as keyof VeiculoOperacional]?.toString();
      const valorNovo = dadosNovos[campo as keyof VeiculoOperacional]?.toString();

      if (valorAnterior !== valorNovo && (valorAnterior || valorNovo)) {
        mudancas.push({
          campo,
          valorAnterior: valorAnterior || 'N/A',
          valorNovo: valorNovo || 'N/A',
          tipo,
        });
      }
    }

    // Registrar mudanças no histórico
    for (const mudanca of mudancas) {
      try {
        await this.historicoRepository.save({
          prefixo: veiculoAnterior.prefixo,
          tipoMudanca: mudanca.tipo,
          campoAlterado: mudanca.campo,
          valorAnterior: mudanca.valorAnterior,
          valorNovo: mudanca.valorNovo,
          dataMudanca: new Date(),
          observacoes: `Mudança detectada durante sincronização`,
        });

        this.logger.log(
          `📝 Mudança registrada - ${veiculoAnterior.prefixo}: ${mudanca.campo} de "${mudanca.valorAnterior}" para "${mudanca.valorNovo}"`
        );
      } catch (error: any) {
        this.logger.error('❌ Erro ao registrar mudança no histórico:', error);
      }
    }

    return mudancas.length;
  }

  private gerarHash(dados: any): string {
    const dadosString = JSON.stringify(dados);
    return crypto.createHash('md5').update(dadosString).digest('hex');
  }

  async obterEstatisticasFrota() {
    try {
      const [
        totalVeiculos,
        veiculosAtivos,
        veiculosInativos,
      ] = await Promise.all([
        this.veiculoRepository.count(),
        this.veiculoRepository.count({ where: { status: 'ATIVO' } }),
        this.veiculoRepository.count({ where: { status: 'INATIVO' } }),
      ]);

      return {
        total: totalVeiculos,
        ativos: veiculosAtivos,
        inativos: veiculosInativos,
        percentualAtivos: totalVeiculos > 0 ? (veiculosAtivos / totalVeiculos) * 100 : 0,
      };
    } catch (error: any) {
      this.logger.error('❌ Erro ao obter estatísticas da frota:', error);
      return {
        total: 0,
        ativos: 0,
        inativos: 0,
        percentualAtivos: 0,
      };
    }
  }

  async obterVeiculosPorGaragem() {
    try {
      return await this.veiculoRepository
        .createQueryBuilder('veiculo')
        .select('veiculo.garagemNome', 'garagem')
        .addSelect('COUNT(*)', 'total')
        .addSelect('SUM(CASE WHEN veiculo.status = \'ATIVO\' THEN 1 ELSE 0 END)', 'ativos')
        .addSelect('SUM(CASE WHEN veiculo.status = \'INATIVO\' THEN 1 ELSE 0 END)', 'inativos')
        .groupBy('veiculo.garagemNome')
        .orderBy('total', 'DESC')
        .getRawMany();
    } catch (error: any) {
      this.logger.error('❌ Erro ao obter veículos por garagem:', error);
      return [];
    }
  }

  async obterHistoricoVeiculo(prefixo: string, limite: number = 50) {
    try {
      return await this.historicoRepository.find({
        where: { prefixo },
        order: { dataMudanca: 'DESC' },
        take: limite,
      });
    } catch (error: any) {
      this.logger.error('❌ Erro ao obter histórico do veículo:', error);
      return [];
    }
  }

  async obterMudancasRecentes(dias: number = 7) {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - dias);

      return await this.historicoRepository
        .createQueryBuilder('historico')
        .where('historico.dataMudanca >= :dataLimite', { dataLimite })
        .orderBy('historico.dataMudanca', 'DESC')
        .getMany();
    } catch (error: any) {
      this.logger.error('❌ Erro ao obter mudanças recentes:', error);
      return [];
    }
  }
}