// src/modules/departamentos/juridico/services/dvs-infracao.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, In, Not } from 'typeorm';
import { DvsInfracaoEntity } from '../entities/dvs-infracao.entity';
import { DvsMultaEntity } from '../entities/dvs-multa.entity';

export interface InfracaoFilters {
  codigoinfra?: string;
  descricaoinfra?: string;
  grupoinfra?: string;
  tipomulta?: string;
  orgao?: string;
  pontuacaoMinima?: number;
  pontuacaoMaxima?: number;
  ufirMinimo?: number;
  ufirMaximo?: number;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface InfracaoStats {
  totalInfracoes: number;
  infracoesComPontuacao: number;
  infracoesGravissimas: number;
  infracoesGraves: number;
  infracoesMedias: number;
  infracoesLeves: number;
  gruposInfracao: Array<{
    grupo: string;
    quantidade: number;
    percentual: number;
  }>;
  orgaosAutuadores: Array<{
    orgao: string;
    quantidade: number;
    percentual: number;
  }>;
  tiposMulta: Array<{
    tipo: string;
    quantidade: number;
    percentual: number;
  }>;
}

export interface InfracaoDetalhada extends DvsInfracaoEntity {
  totalMultas?: number;
  valorTotalMultas?: number;
  classificacaoGravidade?: string;
  multasRecentes?: DvsMultaEntity[];
}

@Injectable()
export class DvsInfracaoService {
  private readonly logger = new Logger(DvsInfracaoService.name);

  constructor(
    @InjectRepository(DvsInfracaoEntity)
    private readonly infracaoRepository: Repository<DvsInfracaoEntity>,
    
    @InjectRepository(DvsMultaEntity)
    private readonly multaRepository: Repository<DvsMultaEntity>,
  ) {}

  // ✅ BUSCAR TODAS AS INFRAÇÕES COM FILTROS
  async findAll(filters: InfracaoFilters = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        orderBy = 'codigoinfra',
        orderDirection = 'ASC',
        ...otherFilters
      } = filters;

      const queryBuilder = this.infracaoRepository.createQueryBuilder('infracao');

      // ✅ APLICAR FILTROS
      this.applyFilters(queryBuilder, otherFilters);

      // ✅ ORDENAÇÃO
      queryBuilder.orderBy(`infracao.${orderBy}`, orderDirection);

      // ✅ PAGINAÇÃO
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      const [infracoes, total] = await queryBuilder.getManyAndCount();

      // ✅ ENRIQUECER COM DADOS DE MULTAS
      const infracoesDetalhadas = await Promise.all(
        infracoes.map(async (infracao) => this.enriquecerInfracao(infracao))
      );

      return {
        data: infracoesDetalhadas,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar infrações: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar infrações');
    }
  }

  // ✅ BUSCAR INFRAÇÃO POR CÓDIGO
  async findOne(codigoinfra: string): Promise<InfracaoDetalhada> {
    try {
      const infracao = await this.infracaoRepository.findOne({
        where: { codigoinfra },
      });

      if (!infracao) {
        throw new NotFoundException(`Infração ${codigoinfra} não encontrada`);
      }

      return await this.enriquecerInfracao(infracao);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao buscar infração ${codigoinfra}: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar infração');
    }
  }

  // ✅ BUSCAR INFRAÇÕES POR GRUPO
  async findByGrupo(grupoinfra: string, filters: Partial<InfracaoFilters> = {}) {
    try {
      const infracoes = await this.infracaoRepository.find({
        where: {
          grupoinfra,
          ...this.buildWhereConditions(filters),
        },
        order: { codigoinfra: 'ASC' },
      });

      return await Promise.all(
        infracoes.map(async (infracao) => this.enriquecerInfracao(infracao))
      );
    } catch (error) {
      this.logger.error(`Erro ao buscar infrações do grupo ${grupoinfra}: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar infrações do grupo');
    }
  }

  // ✅ BUSCAR INFRAÇÕES POR ÓRGÃO
  async findByOrgao(orgao: string, filters: Partial<InfracaoFilters> = {}) {
    try {
      const infracoes = await this.infracaoRepository.find({
        where: {
          orgao,
          ...this.buildWhereConditions(filters),
        },
        order: { codigoinfra: 'ASC' },
      });

      return await Promise.all(
        infracoes.map(async (infracao) => this.enriquecerInfracao(infracao))
      );
    } catch (error) {
      this.logger.error(`Erro ao buscar infrações do órgão ${orgao}: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar infrações do órgão');
    }
  }

  // ✅ BUSCAR INFRAÇÕES MAIS FREQUENTES
  async getMaisFrequentes(limit: number = 10) {
    try {
      const infracoesFrequentes = await this.multaRepository
        .createQueryBuilder('multa')
        .leftJoin('multa.infracao', 'infracao')
        .select([
          'multa.codigoinfra as codigoinfra',
          'infracao.descricaoinfra as descricaoinfra',
          'infracao.grupoinfra as grupoinfra',
          'infracao.pontuacaoinfra as pontuacaoinfra',
          'COUNT(*) as totalMultas',
          'SUM(multa.valortotalmulta) as valorTotal',
          'AVG(multa.valortotalmulta) as valorMedio'
        ])
        .groupBy('multa.codigoinfra, infracao.descricaoinfra, infracao.grupoinfra, infracao.pontuacaoinfra')
        .orderBy('totalMultas', 'DESC')
        .limit(limit)
        .getRawMany();

      return infracoesFrequentes.map(item => ({
        codigoinfra: item.codigoinfra,
        descricaoinfra: item.descricaoinfra,
        grupoinfra: item.grupoinfra,
        pontuacaoinfra: parseInt(item.pontuacaoinfra) || 0,
        totalMultas: parseInt(item.totalMultas),
        valorTotal: parseFloat(item.valorTotal) || 0,
        valorMedio: parseFloat(item.valorMedio) || 0,
        classificacaoGravidade: this.classificarGravidade(parseInt(item.pontuacaoinfra) || 0),
      }));
    } catch (error) {
      this.logger.error(`Erro ao buscar infrações mais frequentes: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar infrações mais frequentes');
    }
  }

  // ✅ ESTATÍSTICAS GERAIS
  async getStats(filters: Partial<InfracaoFilters> = {}): Promise<InfracaoStats> {
    try {
      const whereConditions = this.buildWhereConditions(filters);

      // ✅ ESTATÍSTICAS BÁSICAS
      const totalInfracoes = await this.infracaoRepository.count({ where: whereConditions });

      const infracoesComPontuacao = await this.infracaoRepository.count({
        where: {
          ...whereConditions,
          pontuacaoinfra: Not(null),
        },
      });

      // ✅ CLASSIFICAÇÃO POR GRAVIDADE (baseado na pontuação)
      const [infracoesGravissimas, infracoesGraves, infracoesMedias, infracoesLeves] = await Promise.all([
        this.infracaoRepository
          .createQueryBuilder('infracao')
          .where(whereConditions)
          .andWhere('infracao.pontuacaoinfra >= 7')
          .getCount(),
        this.infracaoRepository
          .createQueryBuilder('infracao')
          .where(whereConditions)
          .andWhere('infracao.pontuacaoinfra >= 5 AND infracao.pontuacaoinfra < 7')
          .getCount(),
        this.infracaoRepository
          .createQueryBuilder('infracao')
          .where(whereConditions)
          .andWhere('infracao.pontuacaoinfra >= 3 AND infracao.pontuacaoinfra < 5')
          .getCount(),
        this.infracaoRepository
          .createQueryBuilder('infracao')
          .where(whereConditions)
          .andWhere('infracao.pontuacaoinfra > 0 AND infracao.pontuacaoinfra < 3')
          .getCount(),
      ]);

      // ✅ GRUPOS DE INFRAÇÃO
      const gruposRaw = await this.infracaoRepository
        .createQueryBuilder('infracao')
        .select(['infracao.grupoinfra as grupo', 'COUNT(*) as quantidade'])
        .where(whereConditions)
        .andWhere('infracao.grupoinfra IS NOT NULL')
        .groupBy('infracao.grupoinfra')
        .orderBy('quantidade', 'DESC')
        .getRawMany();

      const gruposInfracao = gruposRaw.map(item => ({
        grupo: item.grupo,
        quantidade: parseInt(item.quantidade),
        percentual: totalInfracoes > 0 ? (parseInt(item.quantidade) / totalInfracoes) * 100 : 0,
      }));

      // ✅ ÓRGÃOS AUTUADORES
      const orgaosRaw = await this.infracaoRepository
        .createQueryBuilder('infracao')
        .select(['infracao.orgao as orgao', 'COUNT(*) as quantidade'])
        .where(whereConditions)
        .andWhere('infracao.orgao IS NOT NULL')
        .groupBy('infracao.orgao')
        .orderBy('quantidade', 'DESC')
        .getRawMany();

      const orgaosAutuadores = orgaosRaw.map(item => ({
        orgao: item.orgao,
        quantidade: parseInt(item.quantidade),
        percentual: totalInfracoes > 0 ? (parseInt(item.quantidade) / totalInfracoes) * 100 : 0,
      }));

      // ✅ TIPOS DE MULTA
      const tiposRaw = await this.infracaoRepository
        .createQueryBuilder('infracao')
        .select(['infracao.tipomulta as tipo', 'COUNT(*) as quantidade'])
        .where(whereConditions)
        .andWhere('infracao.tipomulta IS NOT NULL')
        .groupBy('infracao.tipomulta')
        .orderBy('quantidade', 'DESC')
        .getRawMany();

      const tiposMulta = tiposRaw.map(item => ({
        tipo: this.decodificarTipoMulta(item.tipo),
        quantidade: parseInt(item.quantidade),
        percentual: totalInfracoes > 0 ? (parseInt(item.quantidade) / totalInfracoes) * 100 : 0,
      }));

      return {
        totalInfracoes,
        infracoesComPontuacao,
        infracoesGravissimas,
        infracoesGraves,
        infracoesMedias,
        infracoesLeves,
        gruposInfracao,
        orgaosAutuadores,
        tiposMulta,
      };
    } catch (error) {
      this.logger.error(`Erro ao gerar estatísticas de infrações: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao gerar estatísticas de infrações');
    }
  }

  // ✅ BUSCAR GRUPOS ÚNICOS
  async getGrupos() {
    try {
      const grupos = await this.infracaoRepository
        .createQueryBuilder('infracao')
        .select('DISTINCT infracao.grupoinfra', 'grupo')
        .where('infracao.grupoinfra IS NOT NULL')
        .orderBy('infracao.grupoinfra', 'ASC')
        .getRawMany();

      return grupos.map(item => item.grupo).filter(Boolean);
    } catch (error) {
      this.logger.error(`Erro ao buscar grupos de infrações: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar grupos de infrações');
    }
  }

  // ✅ BUSCAR ÓRGÃOS ÚNICOS
  async getOrgaos() {
    try {
      const orgaos = await this.infracaoRepository
        .createQueryBuilder('infracao')
        .select('DISTINCT infracao.orgao', 'orgao')
        .where('infracao.orgao IS NOT NULL')
        .orderBy('infracao.orgao', 'ASC')
        .getRawMany();

      return orgaos.map(item => item.orgao).filter(Boolean);
    } catch (error) {
      this.logger.error(`Erro ao buscar órgãos autuadores: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar órgãos autuadores');
    }
  }

  // ✅ BUSCAR INFRAÇÕES POR TEXTO
  async search(texto: string, limit: number = 20) {
    try {
      const infracoes = await this.infracaoRepository.find({
        where: [
          { codigoinfra: Like(`%${texto}%`) },
          { descricaoinfra: Like(`%${texto}%`) },
          { grupoinfra: Like(`%${texto}%`) },
          { artigoinfra: Like(`%${texto}%`) },
        ],
        take: limit,
        order: { codigoinfra: 'ASC' },
      });

      return await Promise.all(
        infracoes.map(async (infracao) => this.enriquecerInfracao(infracao))
      );
    } catch (error) {
      this.logger.error(`Erro ao pesquisar infrações: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao pesquisar infrações');
    }
  }

  // ✅ MÉTODOS PRIVADOS

  private applyFilters(queryBuilder: any, filters: Partial<InfracaoFilters>) {
    if (filters.codigoinfra) {
      queryBuilder.andWhere('infracao.codigoinfra LIKE :codigoinfra', {
        codigoinfra: `%${filters.codigoinfra}%`,
      });
    }

    if (filters.descricaoinfra) {
      queryBuilder.andWhere('infracao.descricaoinfra LIKE :descricaoinfra', {
        descricaoinfra: `%${filters.descricaoinfra}%`,
      });
    }

    if (filters.grupoinfra) {
      queryBuilder.andWhere('infracao.grupoinfra = :grupoinfra', {
        grupoinfra: filters.grupoinfra,
      });
    }

    if (filters.tipomulta) {
      queryBuilder.andWhere('infracao.tipomulta = :tipomulta', {
        tipomulta: filters.tipomulta,
      });
    }

    if (filters.orgao) {
      queryBuilder.andWhere('infracao.orgao = :orgao', {
        orgao: filters.orgao,
      });
    }

    if (filters.pontuacaoMinima) {
      queryBuilder.andWhere('infracao.pontuacaoinfra >= :pontuacaoMinima', {
        pontuacaoMinima: filters.pontuacaoMinima,
      });
    }

    if (filters.pontuacaoMaxima) {
      queryBuilder.andWhere('infracao.pontuacaoinfra <= :pontuacaoMaxima', {
        pontuacaoMaxima: filters.pontuacaoMaxima,
      });
    }

    if (filters.ufirMinimo) {
      queryBuilder.andWhere('infracao.ufirinfra >= :ufirMinimo', {
        ufirMinimo: filters.ufirMinimo,
      });
    }

    if (filters.ufirMaximo) {
      queryBuilder.andWhere('infracao.ufirinfra <= :ufirMaximo', {
        ufirMaximo: filters.ufirMaximo,
      });
    }
  }

  private buildWhereConditions(filters: Partial<InfracaoFilters>): FindOptionsWhere<DvsInfracaoEntity> {
    const where: FindOptionsWhere<DvsInfracaoEntity> = {};

    if (filters.codigoinfra) {
      where.codigoinfra = Like(`%${filters.codigoinfra}%`);
    }

    if (filters.descricaoinfra) {
      where.descricaoinfra = Like(`%${filters.descricaoinfra}%`);
    }

    if (filters.grupoinfra) {
      where.grupoinfra = filters.grupoinfra;
    }

    if (filters.tipomulta) {
      where.tipomulta = filters.tipomulta;
    }

    if (filters.orgao) {
      where.orgao = filters.orgao;
    }

    return where;
  }

  private async enriquecerInfracao(infracao: DvsInfracaoEntity): Promise<InfracaoDetalhada> {
    try {
      // ✅ BUSCAR ESTATÍSTICAS DE MULTAS PARA ESTA INFRAÇÃO
      const [totalMultas, valorTotalResult, multasRecentes] = await Promise.all([
        this.multaRepository.count({ where: { codigoinfra: infracao.codigoinfra } }),
        this.multaRepository
          .createQueryBuilder('multa')
          .select('SUM(multa.valortotalmulta)', 'total')
          .where('multa.codigoinfra = :codigoinfra', { codigoinfra: infracao.codigoinfra })
          .getRawOne(),
        this.multaRepository.find({
          where: { codigoinfra: infracao.codigoinfra },
          order: { dataemissaomulta: 'DESC' },
          take: 5,
        }),
      ]);

      const valorTotalMultas = parseFloat(valorTotalResult?.total) || 0;
      const classificacaoGravidade = this.classificarGravidade(infracao.pontuacaoinfra || 0);

      return {
        ...infracao,
        totalMultas,
        valorTotalMultas,
        classificacaoGravidade,
        multasRecentes,
      };
    } catch (error) {
      this.logger.warn(`Erro ao enriquecer infração ${infracao.codigoinfra}: ${error.message}`);
      return {
        ...infracao,
        totalMultas: 0,
        valorTotalMultas: 0,
        classificacaoGravidade: this.classificarGravidade(infracao.pontuacaoinfra || 0),
        multasRecentes: [],
      };
    }
  }

  private classificarGravidade(pontuacao: number): string {
    if (pontuacao >= 7) return 'GRAVÍSSIMA';
    if (pontuacao >= 5) return 'GRAVE';
    if (pontuacao >= 3) return 'MÉDIA';
    if (pontuacao > 0) return 'LEVE';
    return 'SEM PONTUAÇÃO';
  }

  private decodificarTipoMulta(tipo: string): string {
    const tipos: Record<string, string> = {
      'A': 'Advertência',
      'M': 'Multa',
      'S': 'Suspensão',
      'C': 'Cassação',
      'R': 'Retenção',
      'AP': 'Apreensão',
    };

    return tipos[tipo] || tipo || 'Não informado';
  }
}