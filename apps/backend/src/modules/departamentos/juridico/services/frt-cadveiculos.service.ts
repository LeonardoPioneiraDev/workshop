// src/modules/departamentos/juridico/services/frt-cadveiculos.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, In, Between, IsNull } from 'typeorm';
import { FrtCadveiculosEntity } from '../entities/frt-cadveiculos.entity';
import { DvsMultaEntity } from '../entities/dvs-multa.entity';
import { VeiculoFrotaEntity } from '../entities/veiculo-frota.entity';
import { OracleReadOnlyService } from '../../../../oracle/services/oracle-readonly.service';

export interface VeiculoFilters {
  codigoveic?: number;
  prefixoveic?: string;
  placaatualveic?: string;
  placaanteriorveic?: string;
  codigoempresa?: number;
  codigoga?: number;
  codigouf?: string;
  condicaoveic?: string;
  codigotpveic?: number;
  codigocategoriaveic?: number;
  dtinicioutilInicio?: Date;
  dtinicioutilFim?: Date;
  renavanveic?: string;
  numeromotor?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface VeiculoStats {
  totalVeiculos: number;
  veiculosAtivos: number;
  veiculosInativos: number;
  veiculosManutencao: number;
  veiculosVendidos: number;
  empresas: Array<{
    codigoempresa: number;
    quantidade: number;
    percentual: number;
  }>;
  garagens: Array<{
    codigoga: number;
    quantidade: number;
    percentual: number;
  }>;
  tiposVeiculo: Array<{
    codigotpveic: number;
    quantidade: number;
    percentual: number;
  }>;
  categorias: Array<{
    codigocategoriaveic: number;
    quantidade: number;
    percentual: number;
  }>;
  condicoes: Array<{
    condicao: string;
    quantidade: number;
    percentual: number;
  }>;
}

export interface VeiculoDetalhado extends FrtCadveiculosEntity {
  totalMultas?: number;
  valorTotalMultas?: number;
  multasPendentes?: number;
  valorMultasPendentes?: number;
  ultimaMulta?: Date;
  multasRecentes?: DvsMultaEntity[];
  situacaoCalculada?: string;
  tempoUso?: number;
}

export interface VeiculoFrotaData {
  codigoEmpresa: number;
  prefixoVeiculo: string;
  placaVeiculo: string;
  codigoGaragem: number;
  nomeGaragem: string;
  anoFabricacao?: string;
  anoModelo?: string;
  marcaMotor?: string;
  marcaCompleta?: string;
  codigoTipoFrota?: number;
  tipoFrotaDescricao?: string;
  renavanVeiculo?: string;
  numeroCPRVeiculo?: string;
  dataInicioUtilizacao?: Date;
  situacao: string;
  dataAtual: string;
  idadeVeiculo?: number;
  diasEmOperacao?: number;
}

export interface SincronizacaoResult {
  totalProcessados: number;
  novos: number;
  atualizados: number;
  erros: number;
  tempo: string;
  detalhes: {
    ativosProcessados: number;
    inativosProcessados: number;
    garagensProcessadas: string[];
  };
}

@Injectable()
export class FrtCadveiculosService {
  private readonly logger = new Logger(FrtCadveiculosService.name);

  constructor(
    @InjectRepository(FrtCadveiculosEntity)
    private readonly veiculoRepository: Repository<FrtCadveiculosEntity>,
    
    @InjectRepository(DvsMultaEntity)
    private readonly multaRepository: Repository<DvsMultaEntity>,

    @InjectRepository(VeiculoFrotaEntity)
    private readonly veiculoFrotaRepository: Repository<VeiculoFrotaEntity>,
    
    private readonly oracleService: OracleReadOnlyService
  ) {}

  // ✅ SINCRONIZAR FROTA COMPLETA DO ORACLE
  async sincronizarFrotaCompleta(incluirInativos: boolean = false): Promise<SincronizacaoResult> {
    const startTime = Date.now();
    this.logger.log('🔄 Iniciando sincronização da frota completa...');

    try {
      const condicaoVeiculo = incluirInativos ? "C.CONDICAOVEIC IN ('A', 'I')" : "C.CONDICAOVEIC = 'A'";
      
      const query = `
        SELECT 
          C.CODIGOEMPRESA AS "codigoEmpresa",
          C.PREFIXOVEIC AS "prefixoVeiculo",
          REPLACE(REPLACE(C.PLACAATUALVEIC, '-', ''), ' ', '') AS "placaVeiculo",
          C.CODIGOGA AS "codigoGaragem",
          CASE 
            WHEN C.CODIGOGA = 31 THEN 'PARANOÁ'
            WHEN C.CODIGOGA = 124 THEN 'SANTA MARIA'
            WHEN C.CODIGOGA = 239 THEN 'SÃO SEBASTIÃO'
            WHEN C.CODIGOGA = 240 THEN 'GAMA'
            ELSE 'DESCONHECIDA' 
          END AS "nomeGaragem",
          SUBSTR(P.MESANOFABRCPRVEIC,3,6) AS "anoFabricacao",
          SUBSTR(P.MESANOMODCPRVEIC,3,6) AS "anoModelo",	
          R.DESCRICAOMOTMARCA AS "marcaMotor",
          L.DESCRICAOMARCARROC ||' - '|| M.DESCRICAOMODCARROC AS "marcaCompleta",
          T.CODIGOTPFROTA AS "codigoTipoFrota",
          CASE 
            WHEN T.CODIGOTPFROTA = 3 THEN 'CONVENCIONAL'
            WHEN T.CODIGOTPFROTA = 4 THEN 'ART. PISO ALTO'
            WHEN T.CODIGOTPFROTA = 9 THEN 'MINI-ÔNIBUS'
            WHEN T.CODIGOTPFROTA IN (10, 11, 14) THEN 'ART. PISO BAIXO'
            WHEN T.CODIGOTPFROTA = 12 THEN 'PADRON'
            WHEN T.CODIGOTPFROTA = 13 THEN 'SUPER PADRON'
            ELSE T.DESCRICAOTPFROTA 
          END AS "tipoFrotaDescricao",
          C.RENAVANVEIC AS "renavanVeiculo",
          P.NUMEROCPRVEIC AS "numeroCPRVeiculo",
          C.DTINICIOUTILVEIC AS "dataInicioUtilizacao",
          CASE 
            WHEN C.CONDICAOVEIC = 'A' THEN 'ATIVO'
            WHEN C.CONDICAOVEIC = 'I' THEN 'INATIVO'
            ELSE 'OUTROS'
          END AS "situacao",
          TO_CHAR(SYSDATE, 'DD/MM/YYYY') AS "dataAtual",
          
          CASE
            WHEN SUBSTR(P.MESANOFABRCPRVEIC,3,2) IS NOT NULL THEN 
              EXTRACT(YEAR FROM SYSDATE) - TO_NUMBER(
                CASE 
                  WHEN TO_NUMBER(SUBSTR(P.MESANOFABRCPRVEIC,3,2)) <= 50 THEN '20' || SUBSTR(P.MESANOFABRCPRVEIC,3,2)
                  ELSE '19' || SUBSTR(P.MESANOFABRCPRVEIC,3,2)
                END
              )
            ELSE NULL
          END AS "idadeVeiculo",
          
          CASE
            WHEN C.DTINICIOUTILVEIC IS NOT NULL THEN
              TRUNC(SYSDATE - C.DTINICIOUTILVEIC)
            ELSE NULL
          END AS "diasEmOperacao"
          
        FROM FRT_CADVEICULOS C,
             FRT_COMPRAVEIC P,
             FRT_MODCARROC M,
             FRT_MARCACARROC L,
             MOT_MODELOMOTOR E,
             MOT_CADASTROMARCA R,
             FRT_TIPODEFROTA T
        
        WHERE C.CODIGOVEIC = P.CODIGOVEIC (+)
          AND C.CODIGOMODCARROC = M.CODIGOMODCARROC (+)
          AND C.CODIGOMODMOTOR = E.CODIGOMODMOTOR (+)
          AND E.CODIGOMOTMARCA = R.CODIGOMOTMARCA (+)
          AND M.CODIGOMARCARROC = L.CODIGOMARCARROC (+)
          AND C.CODIGOTPFROTA = T.CODIGOTPFROTA (+)
          AND ${condicaoVeiculo}
          AND C.CODIGOGA IN (31, 124, 239, 240)
          AND LENGTH(TO_NUMBER(C.PREFIXOVEIC)) > 5
          AND C.CODIGOEMPRESA = 4
         
        ORDER BY C.CODIGOGA, TO_NUMBER(C.PREFIXOVEIC)
      `;

      const dadosOracle = await this.oracleService.executeQuery(query);
      this.logger.log(`📊 Encontrados ${dadosOracle.length} veículos no Oracle`);

      if (dadosOracle.length === 0) {
        return {
          totalProcessados: 0,
          novos: 0,
          atualizados: 0,
          erros: 0,
          tempo: `${Date.now() - startTime}ms`,
          detalhes: {
            ativosProcessados: 0,
            inativosProcessados: 0,
            garagensProcessadas: []
          }
        };
      }

      let novos = 0;
      let atualizados = 0;
      let erros = 0;
      let ativosProcessados = 0;
      let inativosProcessados = 0;
      const garagensProcessadas = new Set<string>();

      const batchSize = 100;
      for (let i = 0; i < dadosOracle.length; i += batchSize) {
        const lote = dadosOracle.slice(i, i + batchSize);
        
        for (const veiculo of lote) {
          try {
            const existente = await this.veiculoFrotaRepository.findOne({
              where: {
                prefixoVeiculo: veiculo.prefixoVeiculo,
                codigoEmpresa: veiculo.codigoEmpresa
              }
            });

            const dadosVeiculo = {
              codigoEmpresa: veiculo.codigoEmpresa,
              prefixoVeiculo: veiculo.prefixoVeiculo,
              placaVeiculo: veiculo.placaVeiculo || '',
              codigoGaragem: veiculo.codigoGaragem,
              nomeGaragem: veiculo.nomeGaragem,
              anoFabricacao: veiculo.anoFabricacao,
              anoModelo: veiculo.anoModelo,
              marcaMotor: veiculo.marcaMotor,
              marcaCompleta: veiculo.marcaCompleta,
              codigoTipoFrota: veiculo.codigoTipoFrota,
              tipoFrotaDescricao: veiculo.tipoFrotaDescricao,
              renavanVeiculo: veiculo.renavanVeiculo,
              numeroCPRVeiculo: veiculo.numeroCPRVeiculo,
              dataInicioUtilizacao: veiculo.dataInicioUtilizacao,
              situacao: veiculo.situacao,
              dataAtual: veiculo.dataAtual,
              idadeVeiculo: veiculo.idadeVeiculo,
              diasEmOperacao: veiculo.diasEmOperacao,
              sincronizadoEm: new Date()
            };

            if (existente) {
              await this.veiculoFrotaRepository.update(existente.id, dadosVeiculo);
              atualizados++;
            } else {
              await this.veiculoFrotaRepository.save(dadosVeiculo);
              novos++;
            }

            if (veiculo.situacao === 'ATIVO') ativosProcessados++;
            if (veiculo.situacao === 'INATIVO') inativosProcessados++;
            garagensProcessadas.add(veiculo.nomeGaragem);

          } catch (error) {
            this.logger.error(`❌ Erro ao processar veículo ${veiculo.prefixoVeiculo}: ${error.message}`);
            erros++;
          }
        }
      }

      const tempo = `${Date.now() - startTime}ms`;
      this.logger.log(`✅ Sincronização concluída: ${novos} novos, ${atualizados} atualizados, ${erros} erros em ${tempo}`);

      return {
        totalProcessados: dadosOracle.length,
        novos,
        atualizados,
        erros,
        tempo,
        detalhes: {
          ativosProcessados,
          inativosProcessados,
          garagensProcessadas: Array.from(garagensProcessadas)
        }
      };

    } catch (error) {
      this.logger.error(`❌ Erro na sincronização: ${error.message}`);
      throw error;
    }
  }

  // ✅ BUSCAR FROTA SINCRONIZADA
  async buscarFrotaSincronizada(filters: {
    codigoGaragem?: number;
    nomeGaragem?: string;
    situacao?: string;
    codigoEmpresa?: number;
    prefixoVeiculo?: string;
    placaVeiculo?: string;
    tipoFrota?: number;
    idadeMinima?: number;
    idadeMaxima?: number;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  } = {}) {
    const {
      page = 1,
      limit = 50,
      orderBy = 'prefixoVeiculo',
      orderDirection = 'ASC',
      ...filtros
    } = filters;

    const queryBuilder = this.veiculoFrotaRepository.createQueryBuilder('vf');

    if (filtros.codigoGaragem) {
      queryBuilder.andWhere('vf.codigoGaragem = :codigoGaragem', { codigoGaragem: filtros.codigoGaragem });
    }

    if (filtros.nomeGaragem) {
      queryBuilder.andWhere('vf.nomeGaragem ILIKE :nomeGaragem', { nomeGaragem: `%${filtros.nomeGaragem}%` });
    }

    if (filtros.situacao) {
      queryBuilder.andWhere('vf.situacao = :situacao', { situacao: filtros.situacao });
    }

    if (filtros.codigoEmpresa) {
      queryBuilder.andWhere('vf.codigoEmpresa = :codigoEmpresa', { codigoEmpresa: filtros.codigoEmpresa });
    }

    if (filtros.prefixoVeiculo) {
      queryBuilder.andWhere('vf.prefixoVeiculo ILIKE :prefixoVeiculo', { prefixoVeiculo: `%${filtros.prefixoVeiculo}%` });
    }

    if (filtros.placaVeiculo) {
      queryBuilder.andWhere('vf.placaVeiculo ILIKE :placaVeiculo', { placaVeiculo: `%${filtros.placaVeiculo}%` });
    }

    if (filtros.tipoFrota) {
      queryBuilder.andWhere('vf.codigoTipoFrota = :tipoFrota', { tipoFrota: filtros.tipoFrota });
    }

    if (filtros.idadeMinima) {
      queryBuilder.andWhere('vf.idadeVeiculo >= :idadeMinima', { idadeMinima: filtros.idadeMinima });
    }

    if (filtros.idadeMaxima) {
      queryBuilder.andWhere('vf.idadeVeiculo <= :idadeMaxima', { idadeMaxima: filtros.idadeMaxima });
    }

    const orderField = `vf.${orderBy}`;
    queryBuilder.orderBy(orderField, orderDirection);

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      filters: filtros
    };
  }

  // ✅ ESTATÍSTICAS DA FROTA SINCRONIZADA
  async estatisticasFrotaSincronizada() {
    const [
      totalVeiculos,
      veiculosAtivos,
      veiculosInativos,
      estatisticasPorGaragem,
      estatisticasPorTipoFrota,
      idadeMedia
    ] = await Promise.all([
      this.veiculoFrotaRepository.count(),
      this.veiculoFrotaRepository.count({ where: { situacao: 'ATIVO' } }),
      this.veiculoFrotaRepository.count({ where: { situacao: 'INATIVO' } }),
      this.veiculoFrotaRepository
        .createQueryBuilder('vf')
        .select([
          'vf.codigoGaragem as "codigoGaragem"',
          'vf.nomeGaragem as "nomeGaragem"',
          'COUNT(*) as "total"',
          'COUNT(CASE WHEN vf.situacao = \'ATIVO\' THEN 1 END) as "ativos"',
          'COUNT(CASE WHEN vf.situacao = \'INATIVO\' THEN 1 END) as "inativos"'
        ])
        .groupBy('vf.codigoGaragem, vf.nomeGaragem')
        .orderBy('vf.nomeGaragem')
        .getRawMany(),
      this.veiculoFrotaRepository
        .createQueryBuilder('vf')
        .select([
          'vf.codigoTipoFrota as "codigoTipoFrota"',
          'vf.tipoFrotaDescricao as "tipoFrotaDescricao"',
          'COUNT(*) as "total"'
        ])
        .where('vf.codigoTipoFrota IS NOT NULL')
        .groupBy('vf.codigoTipoFrota, vf.tipoFrotaDescricao')
        .orderBy('COUNT(*)', 'DESC')
        .getRawMany(),
      this.veiculoFrotaRepository
        .createQueryBuilder('vf')
        .select('AVG(vf.idadeVeiculo)', 'idadeMedia')
        .where('vf.idadeVeiculo IS NOT NULL')
        .getRawOne()
    ]);

    return {
      success: true,
      data: {
        resumo: {
          totalVeiculos,
          veiculosAtivos,
          veiculosInativos,
          percentualAtivos: totalVeiculos > 0 ? (veiculosAtivos / totalVeiculos) * 100 : 0,
          percentualInativos: totalVeiculos > 0 ? (veiculosInativos / totalVeiculos) * 100 : 0,
          idadeMedia: Math.round(idadeMedia?.idadeMedia || 0)
        },
        distribuicao: {
          porGaragem: estatisticasPorGaragem,
          porTipoFrota: estatisticasPorTipoFrota
        }
      }
    };
  }

  // ✅ MÉTODOS ORIGINAIS
  async findAll(filters: VeiculoFilters = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        orderBy = 'prefixoveic',
        orderDirection = 'ASC',
        ...otherFilters
      } = filters;

      const queryBuilder = this.veiculoRepository.createQueryBuilder('veiculo');
      this.applyFilters(queryBuilder, otherFilters);
      queryBuilder.orderBy(`veiculo.${orderBy}`, orderDirection);

      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      const [veiculos, total] = await queryBuilder.getManyAndCount();
      const veiculosDetalhados = await Promise.all(
        veiculos.map(async (veiculo) => this.enriquecerVeiculo(veiculo))
      );

      return {
        data: veiculosDetalhados,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar veículos: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar veículos');
    }
  }

  async findOne(codigoveic: number): Promise<VeiculoDetalhado> {
    try {
      const veiculo = await this.veiculoRepository.findOne({
        where: { codigoveic },
      });

      if (!veiculo) {
        throw new NotFoundException(`Veículo ${codigoveic} não encontrado`);
      }

      return await this.enriquecerVeiculo(veiculo);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao buscar veículo ${codigoveic}: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar veículo');
    }
  }

  async findByPrefixo(prefixoveic: string): Promise<VeiculoDetalhado> {
    try {
      const veiculo = await this.veiculoRepository.findOne({
        where: { prefixoveic },
      });

      if (!veiculo) {
        throw new NotFoundException(`Veículo com prefixo ${prefixoveic} não encontrado`);
      }

      return await this.enriquecerVeiculo(veiculo);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao buscar veículo por prefixo ${prefixoveic}: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar veículo por prefixo');
    }
  }

  async findByPlaca(placaatualveic: string): Promise<VeiculoDetalhado> {
    try {
      const veiculo = await this.veiculoRepository.findOne({
        where: { placaatualveic },
      });

      if (!veiculo) {
        throw new NotFoundException(`Veículo com placa ${placaatualveic} não encontrado`);
      }

      return await this.enriquecerVeiculo(veiculo);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Erro ao buscar veículo por placa ${placaatualveic}: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar veículo por placa');
    }
  }

  async findByEmpresa(codigoempresa: number, filters: Partial<VeiculoFilters> = {}) {
    try {
      const veiculos = await this.veiculoRepository.find({
        where: {
          codigoempresa,
          ...this.buildWhereConditions(filters),
        },
        order: { prefixoveic: 'ASC' },
      });

      return await Promise.all(
        veiculos.map(async (veiculo) => this.enriquecerVeiculo(veiculo))
      );
    } catch (error) {
      this.logger.error(`Erro ao buscar veículos da empresa ${codigoempresa}: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar veículos da empresa');
    }
  }

  async findByGaragem(codigoga: number, filters: Partial<VeiculoFilters> = {}) {
    try {
      const veiculos = await this.veiculoRepository.find({
        where: {
          codigoga,
          ...this.buildWhereConditions(filters),
        },
        order: { prefixoveic: 'ASC' },
      });

      return await Promise.all(
        veiculos.map(async (veiculo) => this.enriquecerVeiculo(veiculo))
      );
    } catch (error) {
      this.logger.error(`Erro ao buscar veículos da garagem ${codigoga}: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar veículos da garagem');
    }
  }

  async getComMaisMultas(limit: number = 10) {
    try {
      const veiculosComMultas = await this.multaRepository
        .createQueryBuilder('multa')
        .leftJoin('multa.veiculo', 'veiculo')
        .select([
          'multa.codigoveic as codigoveic',
          'veiculo.prefixoveic as prefixoveic',
          'veiculo.placaatualveic as placaatualveic',
          'veiculo.codigoempresa as codigoempresa',
          'veiculo.codigoga as codigoga',
          'COUNT(*) as totalMultas',
          'SUM(multa.valortotalmulta) as valorTotal',
          'AVG(multa.valortotalmulta) as valorMedio',
          'MAX(multa.dataemissaomulta) as ultimaMulta'
        ])
        .groupBy('multa.codigoveic, veiculo.prefixoveic, veiculo.placaatualveic, veiculo.codigoempresa, veiculo.codigoga')
        .orderBy('totalMultas', 'DESC')
        .limit(limit)
        .getRawMany();

      return veiculosComMultas.map(item => ({
        codigoveic: item.codigoveic,
        prefixoveic: item.prefixoveic,
        placaatualveic: item.placaatualveic,
        codigoempresa: item.codigoempresa,
        codigoga: item.codigoga,
        totalMultas: parseInt(item.totalMultas),
        valorTotal: parseFloat(item.valorTotal) || 0,
        valorMedio: parseFloat(item.valorMedio) || 0,
        ultimaMulta: item.ultimaMulta,
      }));
    } catch (error) {
      this.logger.error(`Erro ao buscar veículos com mais multas: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao buscar veículos com mais multas');
    }
  }

  async getStats(filters: Partial<VeiculoFilters> = {}): Promise<VeiculoStats> {
    try {
      const whereConditions = this.buildWhereConditions(filters);
      const totalVeiculos = await this.veiculoRepository.count({ where: whereConditions });

      const [veiculosAtivos, veiculosInativos, veiculosManutencao, veiculosVendidos] = await Promise.all([
        this.veiculoRepository.count({ where: { ...whereConditions, condicaoveic: 'A' } }),
        this.veiculoRepository.count({ where: { ...whereConditions, condicaoveic: 'I' } }),
        this.veiculoRepository.count({ where: { ...whereConditions, condicaoveic: 'M' } }),
        this.veiculoRepository.count({ where: { ...whereConditions, condicaoveic: 'V' } }),
      ]);

      const empresasRaw = await this.veiculoRepository
        .createQueryBuilder('veiculo')
        .select(['veiculo.codigoempresa as codigoempresa', 'COUNT(*) as quantidade'])
        .where(whereConditions)
        .groupBy('veiculo.codigoempresa')
        .orderBy('quantidade', 'DESC')
        .getRawMany();

      const empresas = empresasRaw.map(item => ({
        codigoempresa: item.codigoempresa,
        quantidade: parseInt(item.quantidade),
        percentual: totalVeiculos > 0 ? (parseInt(item.quantidade) / totalVeiculos) * 100 : 0,
      }));

      const garagensRaw = await this.veiculoRepository
        .createQueryBuilder('veiculo')
        .select(['veiculo.codigoga as codigoga', 'COUNT(*) as quantidade'])
        .where(whereConditions)
        .groupBy('veiculo.codigoga')
        .orderBy('quantidade', 'DESC')
        .getRawMany();

      const garagens = garagensRaw.map(item => ({
        codigoga: item.codigoga,
        quantidade: parseInt(item.quantidade),
        percentual: totalVeiculos > 0 ? (parseInt(item.quantidade) / totalVeiculos) * 100 : 0,
      }));

      const tiposRaw = await this.veiculoRepository
        .createQueryBuilder('veiculo')
        .select(['veiculo.codigotpveic as codigotpveic', 'COUNT(*) as quantidade'])
        .where(whereConditions)
        .groupBy('veiculo.codigotpveic')
        .orderBy('quantidade', 'DESC')
        .getRawMany();

      const tiposVeiculo = tiposRaw.map(item => ({
        codigotpveic: item.codigotpveic,
        quantidade: parseInt(item.quantidade),
        percentual: totalVeiculos > 0 ? (parseInt(item.quantidade) / totalVeiculos) * 100 : 0,
      }));

      const categoriasRaw = await this.veiculoRepository
        .createQueryBuilder('veiculo')
        .select(['veiculo.codigocategoriaveic as codigocategoriaveic', 'COUNT(*) as quantidade'])
        .where(whereConditions)
        .groupBy('veiculo.codigocategoriaveic')
        .orderBy('quantidade', 'DESC')
        .getRawMany();

      const categorias = categoriasRaw.map(item => ({
        codigocategoriaveic: item.codigocategoriaveic,
        quantidade: parseInt(item.quantidade),
        percentual: totalVeiculos > 0 ? (parseInt(item.quantidade) / totalVeiculos) * 100 : 0,
      }));

      const condicoesRaw = await this.veiculoRepository
        .createQueryBuilder('veiculo')
        .select(['veiculo.condicaoveic as condicao', 'COUNT(*) as quantidade'])
        .where(whereConditions)
        .groupBy('veiculo.condicaoveic')
        .orderBy('quantidade', 'DESC')
        .getRawMany();

      const condicoes = condicoesRaw.map(item => ({
        condicao: this.decodificarCondicao(item.condicao),
        quantidade: parseInt(item.quantidade),
        percentual: totalVeiculos > 0 ? (parseInt(item.quantidade) / totalVeiculos) * 100 : 0,
      }));

      return {
        totalVeiculos,
        veiculosAtivos,
        veiculosInativos,
        veiculosManutencao,
        veiculosVendidos,
        empresas,
        garagens,
        tiposVeiculo,
        categorias,
        condicoes,
      };
    } catch (error) {
      this.logger.error(`Erro ao gerar estatísticas de veículos: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao gerar estatísticas de veículos');
    }
  }

  async search(texto: string, limit: number = 20) {
    try {
      const veiculos = await this.veiculoRepository.find({
        where: [
          { prefixoveic: Like(`%${texto}%`) },
          { placaatualveic: Like(`%${texto}%`) },
          { placaanteriorveic: Like(`%${texto}%`) },
          { renavanveic: Like(`%${texto}%`) },
          { numeromotor: Like(`%${texto}%`) },
        ],
        take: limit,
        order: { prefixoveic: 'ASC' },
      });

      return await Promise.all(
        veiculos.map(async (veiculo) => this.enriquecerVeiculo(veiculo))
      );
    } catch (error) {
      this.logger.error(`Erro ao pesquisar veículos: ${error.message}`, error.stack);
      throw new BadRequestException('Erro ao pesquisar veículos');
    }
  }

  // ✅ MÉTODOS PRIVADOS
  private applyFilters(queryBuilder: any, filters: Partial<VeiculoFilters>) {
    if (filters.codigoveic) {
      queryBuilder.andWhere('veiculo.codigoveic = :codigoveic', { codigoveic: filters.codigoveic });
    }

    if (filters.prefixoveic) {
      queryBuilder.andWhere('veiculo.prefixoveic LIKE :prefixoveic', { prefixoveic: `%${filters.prefixoveic}%` });
    }

    if (filters.placaatualveic) {
      queryBuilder.andWhere('veiculo.placaatualveic LIKE :placaatualveic', { placaatualveic: `%${filters.placaatualveic}%` });
    }

    if (filters.placaanteriorveic) {
      queryBuilder.andWhere('veiculo.placaanteriorveic LIKE :placaanteriorveic', { placaanteriorveic: `%${filters.placaanteriorveic}%` });
    }

    if (filters.codigoempresa) {
      queryBuilder.andWhere('veiculo.codigoempresa = :codigoempresa', { codigoempresa: filters.codigoempresa });
    }

    if (filters.codigoga) {
      queryBuilder.andWhere('veiculo.codigoga = :codigoga', { codigoga: filters.codigoga });
    }

    if (filters.codigouf) {
      queryBuilder.andWhere('veiculo.codigouf = :codigouf', { codigouf: filters.codigouf });
    }

    if (filters.condicaoveic) {
      queryBuilder.andWhere('veiculo.condicaoveic = :condicaoveic', { condicaoveic: filters.condicaoveic });
    }

    if (filters.codigotpveic) {
      queryBuilder.andWhere('veiculo.codigotpveic = :codigotpveic', { codigotpveic: filters.codigotpveic });
    }

    if (filters.codigocategoriaveic) {
      queryBuilder.andWhere('veiculo.codigocategoriaveic = :codigocategoriaveic', { codigocategoriaveic: filters.codigocategoriaveic });
    }

    if (filters.dtinicioutilInicio && filters.dtinicioutilFim) {
      queryBuilder.andWhere('veiculo.dtinicioutilveic BETWEEN :dtinicioutilInicio AND :dtinicioutilFim', {
        dtinicioutilInicio: filters.dtinicioutilInicio,
        dtinicioutilFim: filters.dtinicioutilFim,
      });
    }

    if (filters.renavanveic) {
      queryBuilder.andWhere('veiculo.renavanveic LIKE :renavanveic', { renavanveic: `%${filters.renavanveic}%` });
    }

    if (filters.numeromotor) {
      queryBuilder.andWhere('veiculo.numeromotor LIKE :numeromotor', { numeromotor: `%${filters.numeromotor}%` });
    }
  }

  private buildWhereConditions(filters: Partial<VeiculoFilters>): FindOptionsWhere<FrtCadveiculosEntity> {
    const where: FindOptionsWhere<FrtCadveiculosEntity> = {};

    if (filters.codigoveic) where.codigoveic = filters.codigoveic;
    if (filters.prefixoveic) where.prefixoveic = Like(`%${filters.prefixoveic}%`);
    if (filters.placaatualveic) where.placaatualveic = Like(`%${filters.placaatualveic}%`);
    if (filters.placaanteriorveic) where.placaanteriorveic = Like(`%${filters.placaanteriorveic}%`);
    if (filters.codigoempresa) where.codigoempresa = filters.codigoempresa;
    if (filters.codigoga) where.codigoga = filters.codigoga;
    if (filters.codigouf) where.codigouf = filters.codigouf;
    if (filters.condicaoveic) where.condicaoveic = filters.condicaoveic;
    if (filters.codigotpveic) where.codigotpveic = filters.codigotpveic;
    if (filters.codigocategoriaveic) where.codigocategoriaveic = filters.codigocategoriaveic;
    if (filters.dtinicioutilInicio && filters.dtinicioutilFim) {
      where.dtinicioutilveic = Between(filters.dtinicioutilInicio, filters.dtinicioutilFim);
    }
    if (filters.renavanveic) where.renavanveic = Like(`%${filters.renavanveic}%`);
    if (filters.numeromotor) where.numeromotor = Like(`%${filters.numeromotor}%`);

    return where;
  }

  private async enriquecerVeiculo(veiculo: FrtCadveiculosEntity): Promise<VeiculoDetalhado> {
    try {
      const [
        totalMultas,
        valorTotalResult,
        multasPendentesCount,
        valorPendentesResult,
        ultimaMultaResult,
        multasRecentes
      ] = await Promise.all([
        this.multaRepository.count({ where: { codigoveic: veiculo.codigoveic } }),
        this.multaRepository
          .createQueryBuilder('multa')
          .select('SUM(multa.valortotalmulta)', 'total')
          .where('multa.codigoveic = :codigoveic', { codigoveic: veiculo.codigoveic })
          .getRawOne(),
        this.multaRepository.count({
          where: {
            codigoveic: veiculo.codigoveic,
            datapagtomulta: IsNull(),
          },
        }),
        this.multaRepository
          .createQueryBuilder('multa')
          .select('SUM(multa.valortotalmulta)', 'total')
          .where('multa.codigoveic = :codigoveic', { codigoveic: veiculo.codigoveic })
          .andWhere('multa.datapagtomulta IS NULL')
          .getRawOne(),
        this.multaRepository
          .createQueryBuilder('multa')
          .select('MAX(multa.dataemissaomulta)', 'ultimaMulta')
          .where('multa.codigoveic = :codigoveic', { codigoveic: veiculo.codigoveic })
          .getRawOne(),
        this.multaRepository.find({
          where: { codigoveic: veiculo.codigoveic },
          order: { dataemissaomulta: 'DESC' },
          take: 5,
        }),
      ]);

      const valorTotalMultas = parseFloat(valorTotalResult?.total) || 0;
      const valorMultasPendentes = parseFloat(valorPendentesResult?.total) || 0;
      const ultimaMulta = ultimaMultaResult?.ultimaMulta;
      const situacaoCalculada = this.calcularSituacaoVeiculo(veiculo);
      const tempoUso = this.calcularTempoUso(veiculo.dtinicioutilveic);

      return {
        ...veiculo,
        totalMultas,
        valorTotalMultas,
        multasPendentes: multasPendentesCount,
        valorMultasPendentes,
        ultimaMulta,
        multasRecentes,
        situacaoCalculada,
        tempoUso,
      };
    } catch (error) {
      this.logger.warn(`Erro ao enriquecer veículo ${veiculo.codigoveic}: ${error.message}`);
      return {
        ...veiculo,
        totalMultas: 0,
        valorTotalMultas: 0,
        multasPendentes: 0,
        valorMultasPendentes: 0,
        ultimaMulta: null,
        multasRecentes: [],
        situacaoCalculada: this.calcularSituacaoVeiculo(veiculo),
        tempoUso: this.calcularTempoUso(veiculo.dtinicioutilveic),
      };
    }
  }

  private calcularSituacaoVeiculo(veiculo: FrtCadveiculosEntity): string {
    switch (veiculo.condicaoveic) {
      case 'A': return 'ATIVO';
      case 'I': return 'INATIVO';
      case 'M': return 'MANUTENÇÃO';
      case 'V': return 'VENDIDO';
      case 'T': return 'TRANSFERIDO';
      case 'S': return 'SUCATEADO';
      default: return 'INDEFINIDO';
    }
  }

  private calcularTempoUso(dataInicio?: Date): number {
    if (!dataInicio) return 0;
    
    const hoje = new Date();
    const diffTime = Math.abs(hoje.getTime() - dataInicio.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // dias
  }

  private decodificarCondicao(condicao: string): string {
    const condicoes: Record<string, string> = {
      'A': 'Ativo',
      'I': 'Inativo',
      'M': 'Manutenção',
      'V': 'Vendido',
      'T': 'Transferido',
      'S': 'Sucateado',
    };

    return condicoes[condicao] || condicao || 'Indefinido';
  }
}