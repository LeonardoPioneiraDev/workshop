// src/modules/departamentos/operacoes/services/acidentes.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Between } from 'typeorm';
import { OracleReadOnlyService } from '../../../../oracle/services/oracle-readonly.service';
import { Acidente } from '../entities/acidente.entity';
import { FiltrosAcidentesDto, GrauAcidente, StatusProcesso } from '../dto/filtros-acidentes.dto';
import * as crypto from 'crypto';

@Injectable()
export class AcidentesService {
  private readonly logger = new Logger(AcidentesService.name);

  constructor(
    @InjectRepository(Acidente)
    private readonly acidenteRepository: Repository<Acidente>,
    private readonly oracleService: OracleReadOnlyService,
  ) {}

  async buscarAcidentes(filtros: FiltrosAcidentesDto) {
    this.logger.log(`🚨 Buscando acidentes com filtros: ${JSON.stringify(filtros)}`);

    try {
      // Definir período de busca
      const { dataInicio, dataFim } = this.definirPeriodoBusca(filtros);

      // Verificar se precisa sincronizar
      const precisaSincronizar = await this.verificarNecessidadeSincronizacao(
        dataInicio, 
        dataFim, 
        filtros.forcarSincronizacao
      );

      if (precisaSincronizar) {
        this.logger.log('📥 Dados não encontrados ou desatualizados. Sincronizando...');
        try {
          await this.sincronizarAcidentes(dataInicio, dataFim);
        } catch (syncError) {
          this.logger.warn('⚠️ Erro na sincronização, usando dados locais:', syncError.message);
        }
      }

      // Buscar dados locais com filtros
      return await this.buscarDadosLocais(filtros);
    } catch (error) {
      this.logger.error('❌ Erro ao buscar acidentes:', error);
      return {
        data: [],
        total: 0,
        page: filtros.page,
        limit: filtros.limit,
        totalPages: 0,
        filtros: this.resumirFiltrosAplicados(filtros),
        erro: 'Erro ao buscar acidentes'
      };
    }
  }

  private definirPeriodoBusca(filtros: FiltrosAcidentesDto): { dataInicio: string; dataFim: string } {
    const hoje = new Date();
    
    let dataInicio = filtros.dataInicio;
    let dataFim = filtros.dataFim;

    // Se não especificou período, usar últimos 5 anos para garantir dados
    if (!dataInicio && !dataFim) {
      const ano = filtros.ano;
      const mes = filtros.mes;

      if (ano && mes) {
        // Buscar mês específico
        dataInicio = `${ano}-${mes.toString().padStart(2, '0')}-01`;
        const ultimoDiaMes = new Date(ano, mes, 0).getDate();
        dataFim = `${ano}-${mes.toString().padStart(2, '0')}-${ultimoDiaMes}`;
      } else if (ano) {
        // Buscar ano específico
        dataInicio = `${ano}-01-01`;
        dataFim = `${ano}-12-31`;
      } else {
        // ✅ BUSCAR ÚLTIMOS 5 ANOS POR PADRÃO
        const anoInicio = hoje.getFullYear() - 5;
        dataInicio = `${anoInicio}-01-01`;
        dataFim = hoje.toISOString().split('T')[0];
      }
    }

    // Se só especificou início, buscar até hoje
    if (dataInicio && !dataFim) {
      dataFim = hoje.toISOString().split('T')[0];
    }

    // Se só especificou fim, buscar últimos 30 dias
    if (!dataInicio && dataFim) {
      const dataInicioDate = new Date(dataFim);
      dataInicioDate.setDate(dataInicioDate.getDate() - 30);
      dataInicio = dataInicioDate.toISOString().split('T')[0];
    }

    return { dataInicio, dataFim };
  }

  private async verificarNecessidadeSincronizacao(
    dataInicio: string, 
    dataFim: string, 
    forcar: boolean = false
  ): Promise<boolean> {
    if (forcar) return true;

    try {
      // Verificar se há dados para o período
      const count = await this.acidenteRepository.count({
        where: {
          dataAcidente: Between(new Date(dataInicio), new Date(dataFim)),
        }
      });

      // Se não há dados para o período, sincronizar
      return count === 0;
    } catch (error) {
      this.logger.error('❌ Erro ao verificar necessidade de sincronização:', error);
      return false; // Em caso de erro, não forçar sincronização
    }
  }

  private async buscarDadosLocais(filtros: FiltrosAcidentesDto) {
    try {
      const query = this.acidenteRepository.createQueryBuilder('acidente');

      // Aplicar filtros
      this.aplicarFiltros(query, filtros);

      // Paginação
      const skip = (filtros.page - 1) * filtros.limit;
      query.skip(skip).take(filtros.limit);

      // Ordenação
      query.orderBy('acidente.dataAcidente', 'DESC')
           .addOrderBy('acidente.horaAcidente', 'DESC');

      const [acidentes, total] = await query.getManyAndCount();

      return {
        data: acidentes,
        total,
        page: filtros.page,
        limit: filtros.limit,
        totalPages: Math.ceil(total / filtros.limit),
        filtros: this.resumirFiltrosAplicados(filtros),
      };
    } catch (error) {
      this.logger.error('❌ Erro ao buscar dados locais:', error);
      return {
        data: [],
        total: 0,
        page: filtros.page,
        limit: filtros.limit,
        totalPages: 0,
        filtros: this.resumirFiltrosAplicados(filtros),
        erro: 'Erro ao buscar dados locais'
      };
    }
  }

  private aplicarFiltros(query: SelectQueryBuilder<Acidente>, filtros: FiltrosAcidentesDto) {
    // Filtro de período
    const { dataInicio, dataFim } = this.definirPeriodoBusca(filtros);
    query.andWhere('acidente.dataAcidente BETWEEN :dataInicio AND :dataFim', {
      dataInicio: new Date(dataInicio),
      dataFim: new Date(dataFim),
    });

    // Filtro de grau do acidente
    if (filtros.grauAcidente && filtros.grauAcidente !== GrauAcidente.TODOS) {
      query.andWhere('acidente.grauAcidente = :grauAcidente', { 
        grauAcidente: filtros.grauAcidente 
      });
    }

    // Filtro de status do processo
    if (filtros.statusProcesso && filtros.statusProcesso !== StatusProcesso.TODOS) {
      query.andWhere('acidente.statusProcesso = :statusProcesso', { 
        statusProcesso: filtros.statusProcesso 
      });
    }

    // Filtro de garagem
    if (filtros.garagem) {
      query.andWhere('acidente.garagemVeiculoNome ILIKE :garagem', { 
        garagem: `%${filtros.garagem}%` 
      });
    }

    // Filtro de prefixo do veículo
    if (filtros.prefixoVeiculo) {
      query.andWhere('acidente.prefixoVeiculo ILIKE :prefixo', { 
        prefixo: `%${filtros.prefixoVeiculo}%` 
      });
    }

    // Filtro de município
    if (filtros.municipio) {
      query.andWhere('acidente.municipio ILIKE :municipio', { 
        municipio: `%${filtros.municipio}%` 
      });
    }

    // Filtro de bairro
    if (filtros.bairro) {
      query.andWhere('acidente.bairro ILIKE :bairro', { 
        bairro: `%${filtros.bairro}%` 
      });
    }

    // Filtro de turno
    if (filtros.turno) {
      query.andWhere('acidente.turno = :turno', { turno: filtros.turno });
    }
  }

  private resumirFiltrosAplicados(filtros: FiltrosAcidentesDto) {
    const { dataInicio, dataFim } = this.definirPeriodoBusca(filtros);
    
    return {
      periodo: `${dataInicio} a ${dataFim}`,
      grauAcidente: filtros.grauAcidente,
      statusProcesso: filtros.statusProcesso,
      garagem: filtros.garagem,
      prefixoVeiculo: filtros.prefixoVeiculo,
      municipio: filtros.municipio,
      bairro: filtros.bairro,
      turno: filtros.turno,
    };
  }

  async sincronizarAcidentes(dataInicio?: string, dataFim?: string): Promise<{
    total: number;
    sincronizados: number;
    atualizados: number;
    erros: number;
    periodo: string;
  }> {
    const periodo = dataInicio && dataFim ? `${dataInicio} a ${dataFim}` : 'Últimos 5 anos';
    this.logger.log(`🚨 Iniciando sincronização de acidentes... Período: ${periodo}`);

    try {
      // ✅ QUERY CORRIGIDA - Usar tabela PI_ACD + ROW_NUMBER para eliminar duplicatas
      const queryAcidentes = `
        SELECT * FROM (
          SELECT
              TO_CHAR(A.DATA_ACIDENTE, 'DD/MM/YYYY') AS "DATA_ACIDENTE",
              TO_CHAR(A.DATA_ACIDENTE, 'HH24:MI:SS') AS "HORA_ACIDENTE",
              
              A.CONDICAO_TEMPO AS "CondicaoTempo",
              A.VISIVILIDADE AS "Visibilidade",
              A.GRAU_ACIDENTE AS "GrauAcidente",
              A.STATUS_PROCESSO AS "StatusProcesso",
              A.OCORRENCIA AS "Ocorrencia",
              A.TIPO AS "TipoAcidenteGeral",
              A.BAIRRO AS "Bairro",
              A.MUNICIPIO AS "Municipio",
              A.TIPO_MONTA AS "TipoMonta",
              A.TIPO_ACIDENTE AS "TipoAcidenteDetalhe",
              A.VALOR_TOTAL AS "ValorTotalDano",
              A.VALOR_ACORDO AS "ValorAcordo",
              A.TURNO AS "Turno",
              A.PUNICAO AS "PunicoesAplicadas",
              
              -- Informações da Linha (pegar primeira linha se houver múltiplas)
              L.NUMERO AS "NumeroLinha",
              L.DESCRICAO AS "DescricaoLinha",
              
              -- Nome da Garagem (Linha)
              CASE SUBSTR(L.GARAGEM, 1, 3)
                  WHEN '004' THEN 'V. PIONEIRA'
                  WHEN '031' THEN 'PARANOÁ'
                  WHEN '124' THEN 'SANTA M.'
                  WHEN '239' THEN 'SÃO SEBAS.'
                  WHEN '240' THEN 'GAMA'
                  ELSE L.GARAGEM
              END AS "GaragemLinhaNome",

              -- Informações do Veículo
              F.PREFIXO AS "PrefixoVeiculo",
              F.PLACA AS "PlacaVeiculo",
              
              -- Nome da Garagem (Veículo)
              CASE SUBSTR(F.GARAGEM, 1, 3)
                  WHEN '004' THEN 'VIAÇÃO PIONEIRA'
                  WHEN '031' THEN 'PARANOÁ'
                  WHEN '124' THEN 'SANTA M.'
                  WHEN '239' THEN 'SÃO SEBAS.'
                  WHEN '240' THEN 'GAMA'
                  ELSE F.GARAGEM
              END AS "GaragemVeiculoNome",
              
              ROW_NUMBER() OVER (
                PARTITION BY A.DATA_ACIDENTE, A.OCORRENCIA, F.PREFIXO, A.TURNO 
                ORDER BY L.NUMERO NULLS LAST
              ) AS rn
              
          FROM
              PI_ACD A
          LEFT JOIN PI_LIN L ON A.CODINTLINHA = L.CODINTLINHA
          LEFT JOIN PI_FRT F ON A.CODIGOVEIC = F.CODIGOVEIC
          ${this.construirFiltroData(dataInicio, dataFim)}
        )
        WHERE rn = 1
        ORDER BY
            TO_DATE("DATA_ACIDENTE", 'DD/MM/YYYY') DESC,
            "PrefixoVeiculo" NULLS LAST
      `;

      const acidentesOracle = await this.oracleService.executeQuery(queryAcidentes);
      
      let sincronizados = 0;
      let atualizados = 0;
      let erros = 0;

      const dataSincronizacao = new Date().toISOString().split('T')[0];

      for (const acidente of acidentesOracle) {
        try {
          const resultado = await this.salvarOuAtualizarAcidente(acidente, dataSincronizacao);
          
          if (resultado.isNew) {
            sincronizados++;
          } else {
            atualizados++;
          }
        } catch (error) {
          this.logger.error(`Erro ao sincronizar acidente:`, error);
          erros++;
        }
      }

      const periodo = dataInicio && dataFim ? `${dataInicio} a ${dataFim}` : 'Todos os registros';
      
      this.logger.log(`✅ Sincronização de acidentes concluída: ${sincronizados} novos, ${atualizados} atualizados, ${erros} erros`);

      return {
        total: acidentesOracle.length,
        sincronizados,
        atualizados,
        erros,
        periodo,
      };

    } catch (error) {
      this.logger.error('❌ Erro na sincronização de acidentes:', error);
      throw error;
    }
  }

  private construirFiltroData(dataInicio?: string, dataFim?: string): string {
    if (!dataInicio && !dataFim) return '';
    
    let filtro = 'WHERE ';
    
    if (dataInicio && dataFim) {
      // Converter YYYY-MM-DD para DD/MM/YYYY para Oracle
      const dataInicioOracle = this.converterDataParaOracle(dataInicio);
      const dataFimOracle = this.converterDataParaOracle(dataFim);
      
      filtro += `A.DATA_ACIDENTE BETWEEN TO_DATE('${dataInicioOracle}', 'DD/MM/YYYY') AND TO_DATE('${dataFimOracle}', 'DD/MM/YYYY')`;
    } else if (dataInicio) {
      const dataInicioOracle = this.converterDataParaOracle(dataInicio);
      filtro += `A.DATA_ACIDENTE >= TO_DATE('${dataInicioOracle}', 'DD/MM/YYYY')`;
    } else if (dataFim) {
      const dataFimOracle = this.converterDataParaOracle(dataFim);
      filtro += `A.DATA_ACIDENTE <= TO_DATE('${dataFimOracle}', 'DD/MM/YYYY')`;
    }
    
    return filtro;
  }

  private converterDataParaOracle(data: string): string {
    // Converter YYYY-MM-DD para DD/MM/YYYY
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  private async salvarOuAtualizarAcidente(dadosOracle: any, dataSincronizacao: string): Promise<{
    acidente: Acidente;
    isNew: boolean;
  }> {
    // Converter data do formato DD/MM/YYYY para Date
    const dataAcidente = this.converterDataDDMMYYYY(dadosOracle.DATA_ACIDENTE);
    
    // Gerar hash único para o acidente
    const hashDados = this.gerarHash(dadosOracle);
    
    // Verificar se já existe (por data, prefixo, hora e hash)
    const acidenteExistente = await this.acidenteRepository.findOne({
      where: {
        dataAcidente,
        prefixoVeiculo: dadosOracle.PrefixoVeiculo,
        horaAcidente: dadosOracle.HORA_ACIDENTE,
      }
    });

    const dadosAcidente = {
      dataAcidente,
      horaAcidente: dadosOracle.HORA_ACIDENTE,
      condicaoTempo: dadosOracle.CondicaoTempo,
      visibilidade: dadosOracle.Visibilidade,
      grauAcidente: dadosOracle.GrauAcidente,
      statusProcesso: dadosOracle.StatusProcesso,
      ocorrencia: dadosOracle.Ocorrencia,
      tipoAcidenteGeral: dadosOracle.TipoAcidenteGeral,
      bairro: dadosOracle.Bairro,
      municipio: dadosOracle.Municipio,
      tipoMonta: dadosOracle.TipoMonta,
      tipoAcidenteDetalhe: dadosOracle.TipoAcidenteDetalhe,
      valorTotalDano: dadosOracle.ValorTotalDano,
      valorAcordo: dadosOracle.ValorAcordo,
      turno: dadosOracle.Turno,
      punicoesAplicadas: dadosOracle.PunicoesAplicadas,
      numeroLinha: dadosOracle.NumeroLinha,
      descricaoLinha: dadosOracle.DescricaoLinha,
      garagemLinhaNome: dadosOracle.GaragemLinhaNome,
      prefixoVeiculo: dadosOracle.PrefixoVeiculo,
      placaVeiculo: dadosOracle.PlacaVeiculo,
      garagemVeiculoNome: dadosOracle.GaragemVeiculoNome,
      dataUltimaAtualizacao: new Date(),
      dataSincronizacao: new Date(dataSincronizacao),
      hashDados,
      // Campos calculados
      mesAno: dataAcidente.toISOString().substring(0, 7), // YYYY-MM
      ano: dataAcidente.getFullYear(),
      mes: dataAcidente.getMonth() + 1,
      diaSemana: dataAcidente.getDay() + 1,
      periodoDia: this.calcularPeriodoDia(dadosOracle.HORA_ACIDENTE),
    };

    if (acidenteExistente) {
      // Só atualizar se os dados mudaram
      if (acidenteExistente.hashDados !== hashDados) {
        await this.acidenteRepository.update(acidenteExistente.id, dadosAcidente);
        this.logger.log(`📝 Acidente atualizado: ${dadosOracle.PrefixoVeiculo} - ${dadosOracle.DATA_ACIDENTE}`);
      }
      
      return {
        acidente: { ...acidenteExistente, ...dadosAcidente },
        isNew: false,
      };
    } else {
      const novoAcidente = await this.acidenteRepository.save(dadosAcidente);
      return {
        acidente: novoAcidente,
        isNew: true,
      };
    }
  }

  private converterDataDDMMYYYY(dataString: string): Date {
    // Converter DD/MM/YYYY para Date
    const [dia, mes, ano] = dataString.split('/');
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
  }

  private calcularPeriodoDia(hora: string): string {
    if (!hora) return null;
    
    const horaNum = parseInt(hora.split(':')[0]);
    
    if (horaNum >= 6 && horaNum < 12) return 'MANHÃ';
    if (horaNum >= 12 && horaNum < 18) return 'TARDE';
    if (horaNum >= 18 && horaNum < 24) return 'NOITE';
    return 'MADRUGADA';
  }

  private gerarHash(dados: any): string {
    const dadosString = JSON.stringify(dados);
    return crypto.createHash('md5').update(dadosString).digest('hex');
  }

  async obterEstatisticasAcidentes(filtros?: Partial<FiltrosAcidentesDto>) {
    try {
      const query = this.acidenteRepository.createQueryBuilder('acidente');

      if (filtros) {
        this.aplicarFiltros(query, filtros as FiltrosAcidentesDto);
      }

      const [
        totalAcidentes,
        acidentesComVitimas,
        acidentesSemVitimas,
        valorTotalResult,
      ] = await Promise.all([
        query.getCount(),
        query.clone().andWhere('acidente.grauAcidente = :grau', { grau: 'COM VÍTIMAS' }).getCount(),
        query.clone().andWhere('acidente.grauAcidente = :grau', { grau: 'SEM VÍTIMAS' }).getCount(),
        query.clone().select('SUM(acidente.valorTotalDano)', 'total').getRawOne(),
      ]);

      const [acidentesPorGaragem, acidentesPorMes, acidentesPorTurno] = await Promise.all([
        this.obterAcidentesPorGaragem(filtros),
        this.obterAcidentesPorMes(filtros),
        this.obterAcidentesPorTurno(filtros),
      ]);

      return {
        resumo: {
          total: totalAcidentes,
          comVitimas: acidentesComVitimas,
          semVitimas: acidentesSemVitimas,
          valorTotalDanos: valorTotalResult?.total || 0,
          percentualComVitimas: totalAcidentes > 0 ? (acidentesComVitimas / totalAcidentes) * 100 : 0,
        },
        distribuicao: {
          porGaragem: acidentesPorGaragem,
          porMes: acidentesPorMes,
          porTurno: acidentesPorTurno,
        },
        filtros: filtros ? this.resumirFiltrosAplicados(filtros as FiltrosAcidentesDto) : null,
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter estatísticas de acidentes:', error);
      // Retornar dados vazios em caso de erro
      return {
        resumo: {
          total: 0,
          comVitimas: 0,
          semVitimas: 0,
          valorTotalDanos: 0,
          percentualComVitimas: 0,
        },
        distribuicao: {
          porGaragem: [],
          porMes: [],
          porTurno: [],
        },
        filtros: null,
      };
    }
  }

  private async obterAcidentesPorGaragem(filtros?: Partial<FiltrosAcidentesDto>) {
    try {
      const query = this.acidenteRepository
        .createQueryBuilder('acidente')
        .select('acidente.garagemVeiculoNome', 'garagem')
        .addSelect('COUNT(*)', 'total')
        .addSelect('SUM(CASE WHEN acidente.grauAcidente = \'COM VÍTIMAS\' THEN 1 ELSE 0 END)', 'comVitimas')
        .addSelect('SUM(CASE WHEN acidente.grauAcidente = \'SEM VÍTIMAS\' THEN 1 ELSE 0 END)', 'semVitimas')
        .addSelect('SUM(acidente.valorTotalDano)', 'valorTotal')
        .groupBy('acidente.garagemVeiculoNome');

      if (filtros) {
        this.aplicarFiltros(query, filtros as FiltrosAcidentesDto);
      }

      return await query.orderBy('total', 'DESC').getRawMany();
    } catch (error) {
      this.logger.error('❌ Erro ao obter acidentes por garagem:', error);
      return [];
    }
  }

  private async obterAcidentesPorMes(filtros?: Partial<FiltrosAcidentesDto>) {
    try {
      const query = this.acidenteRepository
        .createQueryBuilder('acidente')
        .select('acidente.mesAno', 'mesAno')
        .addSelect('COUNT(*)', 'total')
        .addSelect('SUM(CASE WHEN acidente.grauAcidente = \'COM VÍTIMAS\' THEN 1 ELSE 0 END)', 'comVitimas')
        .addSelect('SUM(acidente.valorTotalDano)', 'valorTotal')
        .groupBy('acidente.mesAno');

      if (filtros) {
        this.aplicarFiltros(query, filtros as FiltrosAcidentesDto);
      }

      return await query.orderBy('acidente.mesAno', 'ASC').getRawMany();
    } catch (error) {
      this.logger.error('❌ Erro ao obter acidentes por mês:', error);
      return [];
    }
  }

  private async obterAcidentesPorTurno(filtros?: Partial<FiltrosAcidentesDto>) {
    try {
      const query = this.acidenteRepository
        .createQueryBuilder('acidente')
        .select('acidente.turno', 'turno')
        .addSelect('COUNT(*)', 'total')
        .addSelect('SUM(CASE WHEN acidente.grauAcidente = \'COM VÍTIMAS\' THEN 1 ELSE 0 END)', 'comVitimas')
        .groupBy('acidente.turno');

      if (filtros) {
        this.aplicarFiltros(query, filtros as FiltrosAcidentesDto);
      }

      return await query.orderBy('total', 'DESC').getRawMany();
    } catch (error) {
      this.logger.error('❌ Erro ao obter acidentes por turno:', error);
      return [];
    }
  }

  // ✅ MÉTODO CORRIGIDO - Usar COUNT(*) diretamente no ORDER BY
  async obterTopVeiculosAcidentes(limite: number = 10, filtros?: Partial<FiltrosAcidentesDto>) {
    try {
      const query = this.acidenteRepository
        .createQueryBuilder('acidente')
        .select('acidente.prefixoVeiculo', 'prefixo')
        .addSelect('acidente.placaVeiculo', 'placa')
        .addSelect('acidente.garagemVeiculoNome', 'garagem')
        .addSelect('COUNT(*)', 'totalAcidentes')
        .addSelect('SUM(acidente.valorTotalDano)', 'valorTotalDanos')
        .addSelect('SUM(CASE WHEN acidente.grauAcidente = \'COM VÍTIMAS\' THEN 1 ELSE 0 END)', 'comVitimas')
        .where('acidente.prefixoVeiculo IS NOT NULL')
        .groupBy('acidente.prefixoVeiculo, acidente.placaVeiculo, acidente.garagemVeiculoNome');

      if (filtros) {
        this.aplicarFiltros(query, filtros as FiltrosAcidentesDto);
      }

      return await query
        // ✅ CORREÇÃO: Usar COUNT(*) diretamente em vez de alias
        .orderBy('COUNT(*)', 'DESC')
        .limit(limite)
        .getRawMany();
    } catch (error) {
      this.logger.error('❌ Erro ao obter top veículos com acidentes:', error);
      return [];
    }
  }

  async obterValoresDistintos() {
    try {
      const [
        garagens,
        municipios,
        bairros,
        turnos,
        grausAcidente,
        statusProcesso,
      ] = await Promise.all([
        this.acidenteRepository.createQueryBuilder('acidente')
          .select('DISTINCT acidente.garagemVeiculoNome', 'garagem')
          .where('acidente.garagemVeiculoNome IS NOT NULL')
          .orderBy('garagem', 'ASC')
          .getRawMany(),
        
        this.acidenteRepository.createQueryBuilder('acidente')
          .select('DISTINCT acidente.municipio', 'municipio')
          .where('acidente.municipio IS NOT NULL')
          .orderBy('municipio', 'ASC')
          .getRawMany(),
        
        this.acidenteRepository.createQueryBuilder('acidente')
          .select('DISTINCT acidente.bairro', 'bairro')
          .where('acidente.bairro IS NOT NULL')
          .orderBy('bairro', 'ASC')
          .getRawMany(),
        
        this.acidenteRepository.createQueryBuilder('acidente')
          .select('DISTINCT acidente.turno', 'turno')
          .where('acidente.turno IS NOT NULL')
          .orderBy('turno', 'ASC')
          .getRawMany(),
        
        this.acidenteRepository.createQueryBuilder('acidente')
          .select('DISTINCT acidente.grauAcidente', 'grau')
          .where('acidente.grauAcidente IS NOT NULL')
          .orderBy('grau', 'ASC')
          .getRawMany(),
        
        this.acidenteRepository.createQueryBuilder('acidente')
          .select('DISTINCT acidente.statusProcesso', 'status')
          .where('acidente.statusProcesso IS NOT NULL')
          .orderBy('status', 'ASC')
          .getRawMany(),
      ]);

      return {
        garagens: garagens.map(g => g.garagem),
        municipios: municipios.map(m => m.municipio),
        bairros: bairros.map(b => b.bairro),
        turnos: turnos.map(t => t.turno),
        grausAcidente: grausAcidente.map(g => g.grau),
        statusProcesso: statusProcesso.map(s => s.status),
      };
    } catch (error) {
      this.logger.error('❌ Erro ao obter valores distintos:', error);
      return {
        garagens: [],
        municipios: [],
        bairros: [],
        turnos: [],
        grausAcidente: [],
        statusProcesso: [],
      };
    }
  }

  // 🔍 MÉTODO DE VERIFICAÇÃO DO ORACLE
  async verificarDadosOracle() {
    this.logger.log('🔍 Verificando dados no Oracle...');

    try {
      // Verificar total de registros
      const queryTotal = `SELECT COUNT(*) as TOTAL FROM PI_ACD`;
      const resultTotal = await this.oracleService.executeQuery(queryTotal);
      const total = resultTotal[0]?.TOTAL || 0;

      // Verificar datas mínima e máxima
      const queryDatas = `
        SELECT 
          MIN(DATA_ACIDENTE) as DATA_MIN,
          MAX(DATA_ACIDENTE) as DATA_MAX
        FROM PI_ACD
      `;
      const resultDatas = await this.oracleService.executeQuery(queryDatas);

      // Buscar alguns registros de exemplo
      const queryExemplos = `
        SELECT * FROM (
          SELECT
            TO_CHAR(DATA_ACIDENTE, 'DD/MM/YYYY') AS "DATA",
            GRAU_ACIDENTE AS "GRAU",
            OCORRENCIA AS "OCORRENCIA",
            TURNO AS "TURNO"
          FROM PI_ACD
          WHERE ROWNUM <= 5
          ORDER BY DATA_ACIDENTE DESC
        )
      `;
      const exemplos = await this.oracleService.executeQuery(queryExemplos);

      // Verificar dados no PostgreSQL local
      const totalLocal = await this.acidenteRepository.count();

      return {
        oracle: {
          total,
          dataMinima: resultDatas[0]?.DATA_MIN,
          dataMaxima: resultDatas[0]?.DATA_MAX,
          exemplos,
          conexao: total >= 0 ? 'OK' : 'FALHA'
        },
        postgresql: {
          total: totalLocal,
          conexao: 'OK'
        },
        status: total > 0 ? '✅ Oracle tem dados' : '⚠️ Oracle está vazio',
        recomendacao: total === 0 
          ? 'Use o endpoint POST /criar-dados-teste para popular dados de teste' 
          : `Sincronize os ${total} registros usando POST /sincronizar`
      };
    } catch (error) {
      this.logger.error('❌ Erro ao verificar Oracle:', error);
      return {
        oracle: {
          total: 0,
          conexao: 'ERRO',
          erro: error.message
        },
        postgresql: {
          total: await this.acidenteRepository.count(),
          conexao: 'OK'
        },
        status: '❌ Erro ao conectar no Oracle',
        recomendacao: 'Verifique as credenciais e conexão com o banco Oracle'
      };
    }
  }

  // 🧪 MÉTODO PARA CRIAR DADOS DE TESTE
  async criarDadosTeste(quantidade: number = 50) {
    this.logger.log(`🧪 Criando ${quantidade} acidentes de teste...`);

    try {
      const dadosTeste = [];
      const hoje = new Date();
      const garagens = ['VIAÇÃO PIONEIRA', 'PARANOÁ', 'SANTA M.', 'SÃO SEBAS.', 'GAMA'];
      const graus = ['COM VÍTIMAS', 'SEM VÍTIMAS'];
      const turnos = ['MANHÃ', 'TARDE', 'NOITE', 'MADRUGADA'];
      const municipios = ['BRASÍLIA', 'TAGUATINGA', 'CEILÂNDIA', 'GAMA', 'SAMAMBAIA'];

      for (let i = 0; i < quantidade; i++) {
        // Gerar data aleatória nos últimos 2 anos
        const diasAtras = Math.floor(Math.random() * 730); // 2 anos
        const dataAcidente = new Date(hoje);
        dataAcidente.setDate(dataAcidente.getDate() - diasAtras);

        const hora = `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`;
        const prefixo = `V${(1000 + i).toString()}`;
        const garagem = garagens[Math.floor(Math.random() * garagens.length)];
        const grau = graus[Math.floor(Math.random() * graus.length)];
        const turno = turnos[Math.floor(Math.random() * turnos.length)];
        const municipio = municipios[Math.floor(Math.random() * municipios.length)];

        const acidente = {
          dataAcidente,
          horaAcidente: hora,
          condicaoTempo: 'BOM TEMPO',
          visibilidade: 'BOA',
          grauAcidente: grau,
          statusProcesso: 'ABERTO',
          ocorrencia: `OC${10000 + i}`,
          tipoAcidenteGeral: 'COLISÃO',
          bairro: 'ASA NORTE',
          municipio,
          tipoMonta: 'SIMPLES',
          tipoAcidenteDetalhe: 'TRASEIRA',
          valorTotalDano: Math.floor(Math.random() * 10000) + 1000,
          valorAcordo: 0,
          turno,
          punicoesAplicadas: 'NENHUMA',
          numeroLinha: `${100 + Math.floor(Math.random() * 900)}`,
          descricaoLinha: `LINHA ${100 + i}`,
          garagemLinhaNome: garagem,
          prefixoVeiculo: prefixo,
          placaVeiculo: `ABC${(1000 + i).toString()}`,
          garagemVeiculoNome: garagem,
          dataUltimaAtualizacao: new Date(),
          dataSincronizacao: new Date(),
          hashDados: this.gerarHash({ i, prefixo, dataAcidente: dataAcidente.toISOString() }),
          mesAno: dataAcidente.toISOString().substring(0, 7),
          ano: dataAcidente.getFullYear(),
          mes: dataAcidente.getMonth() + 1,
          diaSemana: dataAcidente.getDay() + 1,
          periodoDia: this.calcularPeriodoDia(hora),
        };

        dadosTeste.push(acidente);
      }

      // Salvar em lote
      const resultado = await this.acidenteRepository.save(dadosTeste);

      this.logger.log(`✅ ${quantidade} acidentes de teste criados com sucesso!`);

      return {
        sucesso: true,
        quantidade: resultado.length,
        mensagem: `${quantidade} acidentes de teste criados com sucesso`,
        periodo: {
          inicio: dadosTeste[dadosTeste.length - 1].dataAcidente.toISOString().split('T')[0],
          fim: dadosTeste[0].dataAcidente.toISOString().split('T')[0]
        },
        estatisticas: {
          comVitimas: dadosTeste.filter(a => a.grauAcidente === 'COM VÍTIMAS').length,
          semVitimas: dadosTeste.filter(a => a.grauAcidente === 'SEM VÍTIMAS').length,
          garagens: [...new Set(dadosTeste.map(a => a.garagemVeiculoNome))],
        }
      };
    } catch (error) {
      this.logger.error('❌ Erro ao criar dados de teste:', error);
      throw error;
    }
  }
}
