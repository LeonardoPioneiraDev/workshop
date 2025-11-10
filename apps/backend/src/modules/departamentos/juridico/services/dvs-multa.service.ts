// src/modules/departamentos/juridico/services/dvs-multa.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, In, Like, IsNull, Not } from 'typeorm';
import { DvsMultaEntity } from '../entities/dvs-multa.entity';
import { DvsInfracaoEntity } from '../entities/dvs-infracao.entity';
import { FrtCadveiculosEntity } from '../entities/frt-cadveiculos.entity';
import { DvsAgenteAutuadorEntity } from '../entities/dvs-agente-autuador.entity';

// ✅ INTERFACE CORRIGIDA COM FILTERS
export interface MultaFilters {
  numeroaimulta?: string;
  codigoveic?: number;
  codigoinfra?: string;
  dataEmissaoInicio?: Date;
  dataEmissaoFim?: Date;
  valorMinimo?: number;
  valorMaximo?: number;
  responsavelmulta?: string;
  numeroprocesso?: string;
  autodeinfracao?: string;
  placaVeiculo?: string;
  prefixoVeiculo?: string;
  codigoempresa?: number;
  codigoga?: number;
  situacao?: 'PAGA' | 'PENDENTE' | 'VENCIDA' | 'EM_RECURSO' | 'ANISTIADA';
  temRecurso?: boolean;
  cod_agente_autuador?: number;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  filters?: any; // ✅ ADICIONADO PARA COMPATIBILIDADE
}

// ✅ INTERFACE PARA FINDALL OPTIONS
export interface DvsMultaFindAllOptions {
  limit?: number;
  offset?: number;
  filters?: MultaFilters;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface MultaStats {
  totalMultas: number;
  valorTotalMultas: number;
  valorTotalPago: number;
  valorPendente: number;
  multasPagas: number;
  multasPendentes: number;
  multasVencidas: number;
  multasComRecurso: number;
  multasAnistiadas: number;
  mediaValorMulta: number;
  infracoesFrequentes: Array<{
    codigoinfra: string;
    descricaoinfra: string;
    quantidade: number;
    valorTotal: number;
  }>;
  veiculosComMaisMultas: Array<{
    codigoveic: number;
    prefixoveic: string;
    placaatualveic: string;
    quantidade: number;
    valorTotal: number;
  }>;
}

// ✅ INTERFACE CORRIGIDA - COMPATÍVEL COM DVSULTAENTITY
export interface MultaDetalhada {
  numeroaimulta: string;
  codintfunc?: number;
  codigoveic?: number;
  codigoinfra?: string;
  codigouf?: string;
  codmunic?: number;
  codigoorg?: number;
  dataemissaomulta?: Date;
  localmulta?: string;
  numerolocalmulta?: string;
  datahoramulta?: Date;
  datavectomulta?: Date;
  valormulta?: number;
  totalparcelasmulta?: number;
  valortotalmulta?: number;
  datapagtomulta?: Date;
  responsavelmulta?: string;
  numerorecursomulta?: string;
  datarecursomulta?: Date;
  condicaorecursomulta?: string;
  valorpago?: number;
  dataautorizado?: Date;
  autorizado?: string;
  declimpressomulta?: string;
  documento?: string;
  datapagamentoprev?: Date;
  vlracrescimo?: number;
  vlrdesconto?: number;
  valorpagamento?: number;
  codigoforn?: number;
  codlanca?: number;
  id_prest2?: number;
  coddoctocpg?: number;
  codintproaut?: number;
  observacao?: string;
  datalimitecondutor?: Date;
  numerorecursomulta2?: string;
  datarecursomulta2?: Date;
  condicaorecursomulta2?: string;
  cod_motivo_notificacao?: number;
  cod_area_competencia?: number;
  cod_responsavel_notificacao?: number;
  cod_agente_autuador?: number;
  codintlinha?: number;
  numerorecursomulta3?: string;
  datarecursomulta3?: Date;
  condicaorecursomulta3?: string;
  flg_primparcelapaga?: string;
  entradavencimento?: Date;
  entradapagamento?: Date;
  autodeinfracao?: string;
  autodeinfracaoemissao?: Date;
  autodeinfracaorecebimento?: Date;
  autodeinfracaoconsiderado?: Date;
  autodeinfracaovalordodoc?: number;
  autodeinfracaovalorconsiderado?: number;
  notificacao1?: string;
  notificacao1emissao?: Date;
  notificacao1recebimento?: Date;
  notificacao1considerado?: Date;
  notificacao1valordodoc?: number;
  notificacao1valorconsiderado?: number;
  notificacao2?: string;
  notificacao2emissao?: Date;
  notificacao2recebimento?: Date;
  notificacao2considerado?: Date;
  notificacao2valordodoc?: number;
  notificacao2valorconsiderado?: number;
  notificacao3?: string;
  notificacao3emissao?: Date;
  notificacao3recebimento?: Date;
  notificacao3considerado?: Date;
  notificacao3valordodoc?: number;
  notificacao3valorconsiderado?: number;
  valoratualizado?: number;
  pgtointempdata?: Date;
  pgtointempvalor?: number;
  depjuddata?: Date;
  depjudvalor?: number;
  depjuddtrecup?: Date;
  depjudvlrrecup?: number;
  numeroprocesso?: string;
  parcvalor?: number;
  parctotalparcelas?: number;
  parcvalorparcelas?: number;
  entvencimento?: Date;
  entpagamento?: Date;
  entvalor?: number;
  parvencimento?: Date;
  parpagamento?: Date;
  parvalor?: number;
  ultparvencimento?: Date;
  ultparpagamento?: Date;
  ultparvalor?: number;
  totalpago?: number;
  recuso?: string;
  anistia?: string;
  instanciaenvio1?: Date;
  instanciapublicacaodo1?: Date;
  instanciaenvio2?: Date;
  instanciapublicacaodo2?: Date;
  instanciaenvio3?: Date;
  instanciapublicacaodo3?: Date;
  integrou_por_vencimento?: string;
  valorjulgado?: number;
  codigorecuperacao?: number;
  nprocessonotificacao?: string;
  autodeinfracaoprazo?: Date;
  notificacao1prazo?: Date;
  notificacao2prazo?: Date;
  notificacao3prazo?: Date;
  pgtointempvenc?: Date;
  depjudvenc?: Date;
  codcausaprincipal?: number;
  envpenalidade?: Date;
  revpenalidade?: Date;
  obsnotificacao?: string;
  recuperada?: string;
  palavrachave?: string;
  tratamentomulta?: string;
  importacaook?: string;
  tipodetrecho?: string;
  reembolsavel?: string;
  kmlocalmulta?: number;
  metroslocalmulta?: number;
  sentidolocalmulta?: string;
  bairrolocalmulta?: string;
  observacaorealmotivo?: string;
  tipotratamentomulta?: string;
  executor?: string;
  executorcnpjcpf?: string;
  ultalteracao?: string;
  ocorrencia?: number;
  codigoressarc?: number;
  flg_smartec?: string;
  data_imp_smartec?: Date;
  url_formulario?: string;
  url_boleto?: string;
  flg_smartec_multa?: string;
  reincidencia?: string;
  pontuacaoinfracao?: number;
  grupoinfracao?: string;
  cod_org_original?: string;
  ait_original?: string;
  data_sincronizacao?: Date;
  origem_dados?: string;
  created_at?: Date;
  updated_at?: Date;

  // ✅ RELACIONAMENTOS RESOLVIDOS
  infracao?: DvsInfracaoEntity;
  veiculo?: FrtCadveiculosEntity;
  agente?: DvsAgenteAutuadorEntity;

  // ✅ CAMPOS CALCULADOS
  situacaoCalculada?: string;
  diasVencimento?: number;
  valorAtualizadoCalculado?: number;
}

@Injectable()
export class DvsMultaService {
  private readonly logger = new Logger(DvsMultaService.name);

  constructor(
    @InjectRepository(DvsMultaEntity)
    private readonly multaRepository: Repository<DvsMultaEntity>,
    
    @InjectRepository(DvsInfracaoEntity)
    private readonly infracaoRepository: Repository<DvsInfracaoEntity>,
    
    @InjectRepository(FrtCadveiculosEntity)
    private readonly veiculoRepository: Repository<FrtCadveiculosEntity>,
    
    @InjectRepository(DvsAgenteAutuadorEntity)
    private readonly agenteRepository: Repository<DvsAgenteAutuadorEntity>,
  ) {}

  // ✅ MÉTODO FINDALL CORRIGIDO
  async findAll(options: DvsMultaFindAllOptions = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        filters = {},
        orderBy = 'dataemissaomulta',
        orderDirection = 'DESC',
      } = options;

      // ✅ EXTRAIR FILTROS ESPECÍFICOS
      const {
        page = 1,
        ...otherFilters
      } = filters;

      const queryBuilder = this.multaRepository
        .createQueryBuilder('multa')
        .leftJoinAndSelect('multa.infracao', 'infracao')
        .leftJoinAndSelect('multa.veiculo', 'veiculo')
        .leftJoinAndSelect('multa.agente', 'agente');

      // ✅ APLICAR FILTROS
      this.applyFilters(queryBuilder, otherFilters);

      // ✅ ORDENAÇÃO
      queryBuilder.orderBy(`multa.${orderBy}`, orderDirection);

      // ✅ PAGINAÇÃO
      const skip = offset || ((page - 1) * limit);
      queryBuilder.skip(skip).take(limit);

      const [multas, total] = await queryBuilder.getManyAndCount();

      // ✅ CALCULAR SITUAÇÕES
      const multasDetalhadas = await Promise.all(
        multas.map(async (multa) => this.calcularSituacaoMulta(multa))
      );

      return {
        data: multasDetalhadas,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar multas: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar multas');
    }
  }

  // ✅ BUSCAR MULTA POR ID
  async findOne(numeroaimulta: string): Promise<MultaDetalhada> {
    try {
      const multa = await this.multaRepository.findOne({
        where: { numeroaimulta },
        relations: ['infracao', 'veiculo', 'agente'],
      });

      if (!multa) {
        throw new NotFoundException(`Multa ${numeroaimulta} não encontrada`);
      }

      return await this.calcularSituacaoMulta(multa);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao buscar multa ${numeroaimulta}: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar multa');
    }
  }

  // ✅ BUSCAR MULTAS POR VEÍCULO
  async findByVeiculo(codigoveic: number, filters: Partial<MultaFilters> = {}) {
    try {
      const multas = await this.multaRepository.find({
        where: { 
          codigoveic,
          ...this.buildWhereConditions(filters)
        },
        relations: ['infracao', 'veiculo', 'agente'],
        order: { dataemissaomulta: 'DESC' },
      });

      return await Promise.all(
        multas.map(async (multa) => this.calcularSituacaoMulta(multa))
      );
    } catch (error) {
      this.logger.error(`Erro ao buscar multas do veículo ${codigoveic}: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar multas do veículo');
    }
  }

  // ✅ BUSCAR MULTAS POR INFRAÇÃO
  async findByInfracao(codigoinfra: string, filters: Partial<MultaFilters> = {}) {
    try {
      const multas = await this.multaRepository.find({
        where: { 
          codigoinfra,
          ...this.buildWhereConditions(filters)
        },
        relations: ['infracao', 'veiculo', 'agente'],
        order: { dataemissaomulta: 'DESC' },
      });

      return await Promise.all(
        multas.map(async (multa) => this.calcularSituacaoMulta(multa))
      );
    } catch (error) {
      this.logger.error(`Erro ao buscar multas da infração ${codigoinfra}: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar multas da infração');
    }
  }

  // ✅ ESTATÍSTICAS GERAIS
  async getStats(filters: Partial<MultaFilters> = {}): Promise<MultaStats> {
    try {
      const whereConditions = this.buildWhereConditions(filters);

      const [
        totalMultas,
        valorTotalMultas,
        valorTotalPago,
        multasPagas,
        multasComRecurso,
        multasAnistiadas
      ] = await Promise.all([
        this.multaRepository.count({ where: whereConditions }),
        this.multaRepository
          .createQueryBuilder('multa')
          .select('SUM(multa.valortotalmulta)', 'total')
          .where(whereConditions)
          .getRawOne()
          .then(result => parseFloat(result.total) || 0),
        this.multaRepository
          .createQueryBuilder('multa')
          .select('SUM(multa.totalpago)', 'total')
          .where(whereConditions)
          .getRawOne()
          .then(result => parseFloat(result.total) || 0),
        this.multaRepository.count({ 
          where: { 
            ...whereConditions,
            datapagtomulta: Not(IsNull())
          }
        }),
        this.multaRepository.count({ 
          where: { 
            ...whereConditions,
            recuso: 'S'
          }
        }),
        this.multaRepository.count({ 
          where: { 
            ...whereConditions,
            anistia: 'S'
          }
        }),
      ]);

      const valorPendente = valorTotalMultas - valorTotalPago;
      const multasPendentes = totalMultas - multasPagas;
      const mediaValorMulta = totalMultas > 0 ? valorTotalMultas / totalMultas : 0;

      const multasVencidas = await this.multaRepository.count({
        where: {
          ...whereConditions,
          datavectomulta: Not(IsNull()),
          datapagtomulta: IsNull(),
        },
      });

      const infracoesFrequentes = await this.multaRepository
        .createQueryBuilder('multa')
        .leftJoin('multa.infracao', 'infracao')
        .select([
          'multa.codigoinfra as codigoinfra',
          'infracao.descricaoinfra as descricaoinfra',
          'COUNT(*) as quantidade',
          'SUM(multa.valortotalmulta) as valorTotal'
        ])
        .where(whereConditions)
        .groupBy('multa.codigoinfra, infracao.descricaoinfra')
        .orderBy('quantidade', 'DESC')
        .limit(10)
        .getRawMany();

      const veiculosComMaisMultas = await this.multaRepository
        .createQueryBuilder('multa')
        .leftJoin('multa.veiculo', 'veiculo')
        .select([
          'multa.codigoveic as codigoveic',
          'veiculo.prefixoveic as prefixoveic',
          'veiculo.placaatualveic as placaatualveic',
          'COUNT(*) as quantidade',
          'SUM(multa.valortotalmulta) as valorTotal'
        ])
        .where(whereConditions)
        .groupBy('multa.codigoveic, veiculo.prefixoveic, veiculo.placaatualveic')
        .orderBy('quantidade', 'DESC')
        .limit(10)
        .getRawMany();

      return {
        totalMultas,
        valorTotalMultas,
        valorTotalPago,
        valorPendente,
        multasPagas,
        multasPendentes,
        multasVencidas,
        multasComRecurso,
        multasAnistiadas,
        mediaValorMulta,
        infracoesFrequentes: infracoesFrequentes.map(item => ({
          codigoinfra: item.codigoinfra,
          descricaoinfra: item.descricaoinfra,
          quantidade: parseInt(item.quantidade),
          valorTotal: parseFloat(item.valorTotal) || 0,
        })),
        veiculosComMaisMultas: veiculosComMaisMultas.map(item => ({
          codigoveic: item.codigoveic,
          prefixoveic: item.prefixoveic,
          placaatualveic: item.placaatualveic,
          quantidade: parseInt(item.quantidade),
          valorTotal: parseFloat(item.valorTotal) || 0,
        })),
      };
    } catch (error) {
      this.logger.error(`Erro ao gerar estatísticas: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao gerar estatísticas');
    }
  }

  // ✅ MULTAS VENCIDAS
  async getMultasVencidas(filters: Partial<MultaFilters> = {}) {
    try {
      const hoje = new Date();
      
      const multas = await this.multaRepository.find({
        where: {
          ...this.buildWhereConditions(filters),
          datavectomulta: Not(IsNull()),
          datapagtomulta: IsNull(),
        },
        relations: ['infracao', 'veiculo', 'agente'],
        order: { datavectomulta: 'ASC' },
      });

      return await Promise.all(
        multas
          .filter(multa => multa.datavectomulta && multa.datavectomulta < hoje)
          .map(async (multa) => this.calcularSituacaoMulta(multa))
      );
    } catch (error) {
      this.logger.error(`Erro ao buscar multas vencidas: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar multas vencidas');
    }
  }

  // ✅ MULTAS EM RECURSO
  async getMultasEmRecurso(filters: Partial<MultaFilters> = {}) {
    try {
      const multas = await this.multaRepository.find({
        where: {
          ...this.buildWhereConditions(filters),
          recuso: 'S',
        },
        relations: ['infracao', 'veiculo', 'agente'],
        order: { datarecursomulta: 'DESC' },
      });

      return await Promise.all(
        multas.map(async (multa) => this.calcularSituacaoMulta(multa))
      );
    } catch (error) {
      this.logger.error(`Erro ao buscar multas em recurso: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar multas em recurso');
    }
  }

  // ✅ RELATÓRIO POR PERÍODO
  async getRelatorioPorPeriodo(dataInicio: Date, dataFim: Date) {
    try {
      const multas = await this.multaRepository.find({
        where: {
          dataemissaomulta: Between(dataInicio, dataFim),
        },
        relations: ['infracao', 'veiculo', 'agente'],
        order: { dataemissaomulta: 'DESC' },
      });

      const stats = await this.getStats({
        dataEmissaoInicio: dataInicio,
        dataEmissaoFim: dataFim,
      });

      return {
        periodo: {
          inicio: dataInicio,
          fim: dataFim,
        },
        multas: await Promise.all(
          multas.map(async (multa) => this.calcularSituacaoMulta(multa))
        ),
        estatisticas: stats,
      };
    } catch (error) {
      this.logger.error(`Erro ao gerar relatório por período: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao gerar relatório por período');
    }
  }

  // ✅ MÉTODOS PRIVADOS

  private applyFilters(queryBuilder: any, filters: Partial<MultaFilters>) {
    if (filters.numeroaimulta) {
      queryBuilder.andWhere('multa.numeroaimulta = :numeroaimulta', {
        numeroaimulta: filters.numeroaimulta,
      });
    }

    if (filters.codigoveic) {
      queryBuilder.andWhere('multa.codigoveic = :codigoveic', {
        codigoveic: filters.codigoveic,
      });
    }

    if (filters.codigoinfra) {
      queryBuilder.andWhere('multa.codigoinfra = :codigoinfra', {
        codigoinfra: filters.codigoinfra,
      });
    }

    if (filters.dataEmissaoInicio && filters.dataEmissaoFim) {
      queryBuilder.andWhere('multa.dataemissaomulta BETWEEN :dataInicio AND :dataFim', {
        dataInicio: filters.dataEmissaoInicio,
        dataFim: filters.dataEmissaoFim,
      });
    }

    if (filters.valorMinimo) {
      queryBuilder.andWhere('multa.valortotalmulta >= :valorMinimo', {
        valorMinimo: filters.valorMinimo,
      });
    }

    if (filters.valorMaximo) {
      queryBuilder.andWhere('multa.valortotalmulta <= :valorMaximo', {
        valorMaximo: filters.valorMaximo,
      });
    }

    if (filters.responsavelmulta) {
      queryBuilder.andWhere('multa.responsavelmulta = :responsavelmulta', {
        responsavelmulta: filters.responsavelmulta,
      });
    }

    if (filters.numeroprocesso) {
      queryBuilder.andWhere('multa.numeroprocesso LIKE :numeroprocesso', {
        numeroprocesso: `%${filters.numeroprocesso}%`,
      });
    }

    if (filters.autodeinfracao) {
      queryBuilder.andWhere('multa.autodeinfracao LIKE :autodeinfracao', {
        autodeinfracao: `%${filters.autodeinfracao}%`,
      });
    }

    if (filters.placaVeiculo) {
      queryBuilder.andWhere('veiculo.placaatualveic LIKE :placaVeiculo', {
        placaVeiculo: `%${filters.placaVeiculo}%`,
      });
    }

    if (filters.prefixoVeiculo) {
      queryBuilder.andWhere('veiculo.prefixoveic LIKE :prefixoVeiculo', {
        prefixoVeiculo: `%${filters.prefixoVeiculo}%`,
      });
    }

    if (filters.codigoempresa) {
      queryBuilder.andWhere('veiculo.codigoempresa = :codigoempresa', {
        codigoempresa: filters.codigoempresa,
      });
    }

    if (filters.codigoga) {
      queryBuilder.andWhere('veiculo.codigoga = :codigoga', {
        codigoga: filters.codigoga,
      });
    }

    if (filters.cod_agente_autuador) {
      queryBuilder.andWhere('multa.cod_agente_autuador = :cod_agente_autuador', {
        cod_agente_autuador: filters.cod_agente_autuador,
      });
    }

    if (filters.situacao) {
      this.applySituacaoFilter(queryBuilder, filters.situacao);
    }

    if (filters.temRecurso !== undefined) {
      if (filters.temRecurso) {
        queryBuilder.andWhere('multa.recuso = :recuso', { recuso: 'S' });
      } else {
        queryBuilder.andWhere('(multa.recuso IS NULL OR multa.recuso != :recuso)', { recuso: 'S' });
      }
    }
  }

  private applySituacaoFilter(queryBuilder: any, situacao: string) {
    const hoje = new Date();

    switch (situacao) {
      case 'PAGA':
        queryBuilder.andWhere('multa.datapagtomulta IS NOT NULL');
        break;
      case 'PENDENTE':
        queryBuilder.andWhere('multa.datapagtomulta IS NULL');
        queryBuilder.andWhere('(multa.datavectomulta IS NULL OR multa.datavectomulta >= :hoje)', { hoje });
        break;
      case 'VENCIDA':
        queryBuilder.andWhere('multa.datapagtomulta IS NULL');
        queryBuilder.andWhere('multa.datavectomulta < :hoje', { hoje });
        break;
      case 'EM_RECURSO':
        queryBuilder.andWhere('multa.recuso = :recuso', { recuso: 'S' });
        break;
      case 'ANISTIADA':
        queryBuilder.andWhere('multa.anistia = :anistia', { anistia: 'S' });
        break;
    }
  }

  private buildWhereConditions(filters: Partial<MultaFilters>): FindOptionsWhere<DvsMultaEntity> {
    const where: FindOptionsWhere<DvsMultaEntity> = {};

    if (filters.numeroaimulta) {
      where.numeroaimulta = filters.numeroaimulta;
    }

    if (filters.codigoveic) {
      where.codigoveic = filters.codigoveic;
    }

    if (filters.codigoinfra) {
      where.codigoinfra = filters.codigoinfra;
    }

    if (filters.dataEmissaoInicio && filters.dataEmissaoFim) {
      where.dataemissaomulta = Between(filters.dataEmissaoInicio, filters.dataEmissaoFim);
    }

    if (filters.responsavelmulta) {
      where.responsavelmulta = filters.responsavelmulta;
    }

    if (filters.numeroprocesso) {
      where.numeroprocesso = Like(`%${filters.numeroprocesso}%`);
    }

    if (filters.autodeinfracao) {
      where.autodeinfracao = Like(`%${filters.autodeinfracao}%`);
    }

    if (filters.cod_agente_autuador) {
      where.cod_agente_autuador = filters.cod_agente_autuador;
    }

    return where;
  }

  // ✅ MÉTODO CORRIGIDO - CALCULAR SITUAÇÃO
  private async calcularSituacaoMulta(multa: DvsMultaEntity): Promise<MultaDetalhada> {
    const hoje = new Date();
    let situacaoCalculada = 'PENDENTE';
    let diasVencimento = 0;
    let valorAtualizadoCalculado = multa.valortotalmulta || 0;

    // ✅ DETERMINAR SITUAÇÃO
    if (multa.anistia === 'S') {
      situacaoCalculada = 'ANISTIADA';
    } else if (multa.datapagtomulta) {
      situacaoCalculada = 'PAGA';
    } else if (multa.recuso === 'S') {
      situacaoCalculada = 'EM_RECURSO';
    } else if (multa.datavectomulta && multa.datavectomulta < hoje) {
      situacaoCalculada = 'VENCIDA';
      diasVencimento = Math.floor((hoje.getTime() - multa.datavectomulta.getTime()) / (1000 * 60 * 60 * 24));
    }

    // ✅ CALCULAR VALOR ATUALIZADO (com juros e multa se vencida)
    if (situacaoCalculada === 'VENCIDA' && diasVencimento > 0) {
      const mesesVencimento = Math.ceil(diasVencimento / 30);
      const jurosMensal = 0.01; // 1% ao mês
      const multaAtraso = 0.20; // 20% de multa
      
      valorAtualizadoCalculado = valorAtualizadoCalculado * (1 + multaAtraso + (jurosMensal * mesesVencimento));
    }

    // ✅ RESOLVER RELACIONAMENTOS LAZY
    const infracao = await multa.infracao;
    const veiculo = await multa.veiculo;
    const agente = await multa.agente;

    // ✅ RETORNAR OBJETO COMPATÍVEL COM A INTERFACE
    return {
      numeroaimulta: multa.numeroaimulta,
      codintfunc: multa.codintfunc,
      codigoveic: multa.codigoveic,
      codigoinfra: multa.codigoinfra,
      codigouf: multa.codigouf,
      codmunic: multa.codmunic,
      codigoorg: multa.codigoorg,
      dataemissaomulta: multa.dataemissaomulta,
      localmulta: multa.localmulta,
      numerolocalmulta: multa.numerolocalmulta,
      datahoramulta: multa.datahoramulta,
      datavectomulta: multa.datavectomulta,
      valormulta: multa.valormulta,
      totalparcelasmulta: multa.totalparcelasmulta,
      valortotalmulta: multa.valortotalmulta,
      datapagtomulta: multa.datapagtomulta,
      responsavelmulta: multa.responsavelmulta,
      numerorecursomulta: multa.numerorecursomulta,
      datarecursomulta: multa.datarecursomulta,
      condicaorecursomulta: multa.condicaorecursomulta,
      valorpago: multa.valorpago,
      dataautorizado: multa.dataautorizado,
      autorizado: multa.autorizado,
      declimpressomulta: multa.declimpressomulta,
      documento: multa.documento,
      datapagamentoprev: multa.datapagamentoprev,
      vlracrescimo: multa.vlracrescimo,
      vlrdesconto: multa.vlrdesconto,
      valorpagamento: multa.valorpagamento,
      codigoforn: multa.codigoforn,
      codlanca: multa.codlanca,
      id_prest2: multa.id_prest2,
      coddoctocpg: multa.coddoctocpg,
      codintproaut: multa.codintproaut,
      observacao: multa.observacao,
      datalimitecondutor: multa.datalimitecondutor,
      numerorecursomulta2: multa.numerorecursomulta2,
      datarecursomulta2: multa.datarecursomulta2,
      condicaorecursomulta2: multa.condicaorecursomulta2,
      cod_motivo_notificacao: multa.cod_motivo_notificacao,
      cod_area_competencia: multa.cod_area_competencia,
      cod_responsavel_notificacao: multa.cod_responsavel_notificacao,
      cod_agente_autuador: multa.cod_agente_autuador,
      codintlinha: multa.codintlinha,
      numerorecursomulta3: multa.numerorecursomulta3,
      datarecursomulta3: multa.datarecursomulta3,
      condicaorecursomulta3: multa.condicaorecursomulta3,
      flg_primparcelapaga: multa.flg_primparcelapaga,
      entradavencimento: multa.entradavencimento,
      entradapagamento: multa.entradapagamento,
      autodeinfracao: multa.autodeinfracao,
      autodeinfracaoemissao: multa.autodeinfracaoemissao,
      autodeinfracaorecebimento: multa.autodeinfracaorecebimento,
      autodeinfracaoconsiderado: multa.autodeinfracaoconsiderado,
      autodeinfracaovalordodoc: multa.autodeinfracaovalordodoc,
      autodeinfracaovalorconsiderado: multa.autodeinfracaovalorconsiderado,
      notificacao1: multa.notificacao1,
      notificacao1emissao: multa.notificacao1emissao,
      notificacao1recebimento: multa.notificacao1recebimento,
      notificacao1considerado: multa.notificacao1considerado,
      notificacao1valordodoc: multa.notificacao1valordodoc,
      notificacao1valorconsiderado: multa.notificacao1valorconsiderado,
      notificacao2: multa.notificacao2,
      notificacao2emissao: multa.notificacao2emissao,
      notificacao2recebimento: multa.notificacao2recebimento,
      notificacao2considerado: multa.notificacao2considerado,
      notificacao2valordodoc: multa.notificacao2valordodoc,
      notificacao2valorconsiderado: multa.notificacao2valorconsiderado,
      notificacao3: multa.notificacao3,
      notificacao3emissao: multa.notificacao3emissao,
      notificacao3recebimento: multa.notificacao3recebimento,
      notificacao3considerado: multa.notificacao3considerado,
      notificacao3valordodoc: multa.notificacao3valordodoc,
      notificacao3valorconsiderado: multa.notificacao3valorconsiderado,
      valoratualizado: multa.valoratualizado,
      pgtointempdata: multa.pgtointempdata,
      pgtointempvalor: multa.pgtointempvalor,
      depjuddata: multa.depjuddata,
      depjudvalor: multa.depjudvalor,
      depjuddtrecup: multa.depjuddtrecup,
      depjudvlrrecup: multa.depjudvlrrecup,
      numeroprocesso: multa.numeroprocesso,
      parcvalor: multa.parcvalor,
      parctotalparcelas: multa.parctotalparcelas,
      parcvalorparcelas: multa.parcvalorparcelas,
      entvencimento: multa.entvencimento,
      entpagamento: multa.entpagamento,
      entvalor: multa.entvalor,
      parvencimento: multa.parvencimento,
      parpagamento: multa.parpagamento,
      parvalor: multa.parvalor,
      ultparvencimento: multa.ultparvencimento,
      ultparpagamento: multa.ultparpagamento,
      ultparvalor: multa.ultparvalor,
      totalpago: multa.totalpago,
      recuso: multa.recuso,
      anistia: multa.anistia,
      instanciaenvio1: multa.instanciaenvio1,
      instanciapublicacaodo1: multa.instanciapublicacaodo1,
      instanciaenvio2: multa.instanciaenvio2,
      instanciapublicacaodo2: multa.instanciapublicacaodo2,
      instanciaenvio3: multa.instanciaenvio3,
      instanciapublicacaodo3: multa.instanciapublicacaodo3,
      integrou_por_vencimento: multa.integrou_por_vencimento,
      valorjulgado: multa.valorjulgado,
      codigorecuperacao: multa.codigorecuperacao,
      nprocessonotificacao: multa.nprocessonotificacao,
      autodeinfracaoprazo: multa.autodeinfracaoprazo,
      notificacao1prazo: multa.notificacao1prazo,
      notificacao2prazo: multa.notificacao2prazo,
      notificacao3prazo: multa.notificacao3prazo,
      pgtointempvenc: multa.pgtointempvenc,
      depjudvenc: multa.depjudvenc,
      codcausaprincipal: multa.codcausaprincipal,
      envpenalidade: multa.envpenalidade,
      revpenalidade: multa.revpenalidade,
      obsnotificacao: multa.obsnotificacao,
      recuperada: multa.recuperada,
      palavrachave: multa.palavrachave,
      tratamentomulta: multa.tratamentomulta,
      importacaook: multa.importacaook,
      tipodetrecho: multa.tipodetrecho,
      reembolsavel: multa.reembolsavel,
      kmlocalmulta: multa.kmlocalmulta,
      metroslocalmulta: multa.metroslocalmulta,
      sentidolocalmulta: multa.sentidolocalmulta,
      bairrolocalmulta: multa.bairrolocalmulta,
      observacaorealmotivo: multa.observacaorealmotivo,
      tipotratamentomulta: multa.tipotratamentomulta,
      executor: multa.executor,
      executorcnpjcpf: multa.executorcnpjcpf,
      ultalteracao: multa.ultalteracao,
      ocorrencia: multa.ocorrencia,
      codigoressarc: multa.codigoressarc,
      flg_smartec: multa.flg_smartec,
      data_imp_smartec: multa.data_imp_smartec,
      url_formulario: multa.url_formulario,
      url_boleto: multa.url_boleto,
      flg_smartec_multa: multa.flg_smartec_multa,
      reincidencia: multa.reincidencia,
      pontuacaoinfracao: multa.pontuacaoinfracao,
      grupoinfracao: multa.grupoinfracao,
      cod_org_original: multa.cod_org_original,
      ait_original: multa.ait_original,
      data_sincronizacao: multa.data_sincronizacao,
      origem_dados: multa.origem_dados,
      created_at: multa.created_at,
      updated_at: multa.updated_at,

      // ✅ RELACIONAMENTOS RESOLVIDOS
      infracao,
      veiculo,
      agente,

      // ✅ CAMPOS CALCULADOS
      situacaoCalculada,
      diasVencimento,
      valorAtualizadoCalculado,
    };
  }
}