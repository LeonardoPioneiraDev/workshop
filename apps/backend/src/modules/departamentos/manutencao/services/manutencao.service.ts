// src/modules/departamentos/manutencao/services/manutencao.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { OracleReadOnlyService } from '../../../../oracle/services/oracle-readonly.service';
import { OrdemServico } from '../entities/ordem-servico.entity';

@Injectable()
export class ManutencaoService {
  private readonly logger = new Logger(ManutencaoService.name);
  private sincronizandoOS = false;

  constructor(
    @InjectRepository(OrdemServico)
    private readonly osRepository: Repository<OrdemServico>,
    private readonly oracleService: OracleReadOnlyService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * ✅ NOVO: Busca OS do mês atual (para dashboard)
   */
  async buscarOSMesAtual(): Promise<any> {
    try {
      this.logger.log('📅 Buscando OS do mês atual...');
      
      const hoje = new Date();
      const mesAtual = hoje.getMonth() + 1; // 1-12
      const anoAtual = hoje.getFullYear();
      
      // Formato: MM/YYYY (ex: 10/2025)
      const mesAnoPattern = `${mesAtual.toString().padStart(2, '0')}/${anoAtual}`;
      
      const query = this.osRepository
        .createQueryBuilder('os')
        .where('os.data_abertura LIKE :mesAno', { mesAno: `%/${mesAnoPattern}` })
        .orderBy("TO_DATE(os.data_abertura, 'DD/MM/YYYY')", 'DESC')
        .addOrderBy('os.codigo_interno_os', 'DESC');

      const [data, totalCount] = await query.getManyAndCount();
      
      this.logger.log(`📊 OS do mês atual (${mesAnoPattern}): ${data.length} registros`);
      
      const statistics = this.calculateStatistics(data);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        message: `OS do mês atual (${mesAnoPattern}) carregadas`,
        periodo: {
          mes: mesAtual,
          ano: anoAtual,
          descricao: `${mesAtual}/${anoAtual}`
        },
        data,
        count: data.length,
        totalCount,
        statistics,
        fonte: 'PostgreSQL (Local)',
        tipo: 'mes_atual'
      };
    } catch (error: any) {
      this.logger.error('❌ Erro ao buscar OS do mês atual:', error);
      throw error;
    }
  }

  /**
   * ✅ NOVO: Busca todas as OS (para análises gerais)
   */
  async buscarTodasOS(filtros?: {
    startDate?: string;
    endDate?: string;
    origens?: number[];
    garagens?: number[];
    setor_codigo?: number;
    setor?: string;
    prefixo?: string;
    numeroOS?: string;
    placa?: string;
    tipoOS?: string;
    condicaoOS?: string;
    statusOS?: 'A' | 'FC';
    garagem?: string;
    tipoProblema?: string;
    limit?: number;
    page?: number;
  }): Promise<any> {
    try {
      this.logger.log('🔍 Buscando todas as OS com filtros:', JSON.stringify(filtros, null, 2));
      
      const query = this.osRepository.createQueryBuilder('os');

      // ✅ CORREÇÃO PRINCIPAL: Usar TO_DATE para comparação correta de datas
      if (filtros?.startDate) {
        const [year, month, day] = filtros.startDate.split('-');
        const dataFormatada = `${day}/${month}/${year}`;
        this.logger.log(`📅 Filtro data início: ${filtros.startDate} -> ${dataFormatada}`);
        
        query.andWhere(
          "TO_DATE(os.data_abertura, 'DD/MM/YYYY') >= TO_DATE(:dataInicio, 'DD/MM/YYYY')", 
          { dataInicio: dataFormatada }
        );
      }

      if (filtros?.endDate) {
        const [year, month, day] = filtros.endDate.split('-');
        const dataFormatada = `${day}/${month}/${year}`;
        this.logger.log(`�� Filtro data fim: ${filtros.endDate} -> ${dataFormatada}`);
        
        query.andWhere(
          "TO_DATE(os.data_abertura, 'DD/MM/YYYY') <= TO_DATE(:dataFim, 'DD/MM/YYYY')", 
          { dataFim: dataFormatada }
        );
      }

      if (filtros?.origens && filtros.origens.length > 0) {
        query.andWhere('os.codigo_origem_os IN (:...origens)', { origens: filtros.origens });
      }

      if (filtros?.garagens && filtros.garagens.length > 0) {
        query.andWhere('os.codigo_garagem IN (:...garagens)', { garagens: filtros.garagens });
      }

      if (filtros?.setor_codigo) {
        query.andWhere('os.codigo_garagem = :setor', { setor: filtros.setor_codigo });
      }

      if (filtros?.setor) {
        query.andWhere('os.garagem ILIKE :setor', { setor: `%${filtros.setor}%` });
      }

      if (filtros?.garagem) {
        query.andWhere('os.garagem ILIKE :garagem', { garagem: `%${filtros.garagem}%` });
      }

      if (filtros?.prefixo) {
        query.andWhere('os.prefixo_veiculo ILIKE :prefixo', { prefixo: `%${filtros.prefixo}%` });
      }

      if (filtros?.numeroOS) {
        query.andWhere('os.numero_os ILIKE :numeroOS', { numeroOS: `%${filtros.numeroOS}%` });
      }

      if (filtros?.placa) {
        query.andWhere('os.placa_veiculo ILIKE :placa', { placa: `%${filtros.placa}%` });
      }

      if (filtros?.tipoOS) {
        query.andWhere('os.tipo_os = :tipoOS', { tipoOS: filtros.tipoOS });
      }

      if (filtros?.condicaoOS) {
        query.andWhere('os.condicao_os = :condicaoOS', { condicaoOS: filtros.condicaoOS });
      }

      // ✅ Filtro por status (A = Aberta inclui A e AB)
      if (filtros?.statusOS) {
        this.logger.log(`📈 Filtro status OS: ${filtros.statusOS}`);
        if (filtros.statusOS === 'A') {
          query.andWhere('os.condicao_os IN (:...statusAberta)', { statusAberta: ['A', 'AB'] });
        } else {
          query.andWhere('os.condicao_os = :statusOS', { statusOS: filtros.statusOS });
        }
      }

      if (filtros?.tipoProblema) {
        query.andWhere('os.tipo_problema = :tipoProblema', { tipoProblema: filtros.tipoProblema });
      }

      // ✅ Paginação
      const page = filtros?.page || 1;
      const limit = filtros?.limit || 50000; // Limite alto por padrão
      const skip = (page - 1) * limit;

      query.skip(skip).take(limit);

      // ✅ CORREÇÃO: Ordenar por data convertida corretamente
      query.orderBy("TO_DATE(os.data_abertura, 'DD/MM/YYYY')", 'DESC');
      query.addOrderBy('os.codigo_interno_os', 'DESC');

      // ✅ Log da query para debug
      this.logger.log('🔍 Query SQL:', query.getSql());

      const [data, totalCount] = await query.getManyAndCount();
      
      this.logger.log(`📊 Total de OS encontradas: ${data.length} de ${totalCount}`);
      
      const statistics = this.calculateStatistics(data);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Todas as OS carregadas do banco local',
        filters: filtros,
        data,
        count: data.length,
        totalRegistros: totalCount,
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
        statistics,
        fonte: 'PostgreSQL (Local)',
        tipo: 'todas_os'
      };
    } catch (error: any) {
      this.logger.error('❌ Erro ao buscar todas as OS:', error);
      throw error;
    }
  }

  /**
   * ✅ NOVO: Sincronização manual do Globus (Oracle)
   */
  async sincronizarDoGlobus(params?: {
    startDate?: string;
    endDate?: string;
    origens?: number[];
    garagens?: number[];
    setor_codigo?: number;
    limit?: number;
  }): Promise<any> {
    if (this.sincronizandoOS) {
      this.logger.warn('⚠️ Sincronização já em andamento');
      throw new Error('Sincronização já em andamento. Aguarde a conclusão.');
    }

    this.sincronizandoOS = true;
    const startTime = Date.now();

    try {
      this.logger.log('🔄 Iniciando sincronização manual do Globus...');

      // ✅ Definir período padrão (ano atual completo)
      const hoje = new Date();
      const inicioAno = new Date(hoje.getFullYear(), 0, 1);
      
      const processedParams = {
        startDate: params?.startDate || inicioAno.toISOString().split('T')[0],
        endDate: params?.endDate || hoje.toISOString().split('T')[0],
        origens: params?.origens || [23, 24],
        garagens: params?.setor_codigo 
          ? [params.setor_codigo] 
          : (params?.garagens?.length > 0 ? params.garagens : [31, 124, 239, 240]),
        limit: params?.limit || 50000,
      };

      this.logger.log(`🔧 Parâmetros de sincronização:`);
      this.logger.log(`   📅 Período: ${processedParams.startDate} até ${processedParams.endDate}`);
      this.logger.log(`   🏢 Origens: ${processedParams.origens.join(', ')}`);
      this.logger.log(`   🚗 Garagens: ${processedParams.garagens.join(', ')}`);
      this.logger.log(`   📊 Limit: ${processedParams.limit}`);

      // ✅ Query do Oracle/Globus
      const sqlQuery = `
        SELECT
          T2.CODINTOS AS "codigoInternoOS",
          T2.NUMEROOS AS "numeroOS",
          T2.CODIGOVEIC AS "codigoVeiculo",
          T2.CODIGOGA AS "codigoGaragem",
          V.PREFIXOVEIC AS "prefixoVeiculo",
          V.PLACAATUALVEIC AS "placaVeiculo",
          DECODE(V.CONDICAOVEIC, 'A', 'Ativo', 'I', 'Inativo', 'Outro') AS "condicaoVeiculo",
          TO_CHAR(T2.DATAABERTURAOS, 'DD/MM/YYYY') AS "dataAbertura",
          TO_CHAR(T2.DATAFECHAMENTOOS, 'DD/MM/YYYY') AS "dataFechamento",
          T2.HORAABERTURAOS AS "horaAbertura",
          DECODE(T2.TIPOOS, 'C', 'Corretiva', 'P', 'Preventiva', 'Outro') AS "tipoOSDescricao",
          T2.TIPOOS AS "tipoOS",
          DECODE(T2.CONDICAOOS, 'A', 'Aberta', 'AB', 'Aberta', 'FC', 'Fechada', 'Outro') AS "condicaoOSDescricao",
          T2.CONDICAOOS AS "condicaoOS",
          T2.CODORIGOS AS "codigoOrigemOS",
          T2.USUARIOABERTURAOS AS "usuarioAbertura",
          T3.DESCORIGOS AS "descricaoOrigem",
          T1.DESCRCOMPLOSREA AS "descricaoServico",
          T1.CODSETOR AS "codigoSetor",
          T1.CODIGOGRPSERVI AS "codigoGrupoServico",
          GS.DESCRICAOGRPSERVI AS "grupoServico",
          CASE
            WHEN T2.CODIGOGA = 31 THEN 'PARANOÁ'
            WHEN T2.CODIGOGA = 124 THEN 'SANTA MARIA'
            WHEN T2.CODIGOGA = 239 THEN 'SÃO SEBASTIÃO'
            WHEN T2.CODIGOGA = 240 THEN 'GAMA'
            ELSE 'GARAGEM_' || T2.CODIGOGA
          END AS "garagem",
          CASE
            WHEN T2.CODORIGOS = 23 THEN 'QUEBRA'
            WHEN T2.CODORIGOS = 24 THEN 'DEFEITO'
            ELSE 'OUTRO_' || T2.CODORIGOS
          END AS "tipoProblema",
          CASE
            WHEN T2.DATAFECHAMENTOOS IS NOT NULL THEN
              T2.DATAFECHAMENTOOS - T2.DATAABERTURAOS
            ELSE
              TRUNC(SYSDATE) - TRUNC(T2.DATAABERTURAOS)
          END AS "diasEmAndamento",
          T2.KMEXECUCAOOS AS "kmExecucao",
          NVL(T2.VLRMAOOBRATERCOS, 0) AS "valorMaoObraTerceiros",
          NVL(T2.VLRPECASTERCOS, 0) AS "valorPecasTerceiros",
          DECODE(T2.SOCORROOS, 'S', 'Sim', 'N', 'Não', 'Não informado') AS "ehSocorro"
        FROM
          man_os T2
        LEFT JOIN
          man_osrealizado T1 ON T2.CODINTOS = T1.CODINTOS
        LEFT JOIN
          man_origemos T3 ON T2.CODORIGOS = T3.CODORIGOS
        LEFT JOIN
          frt_cadveiculos V ON T2.CODIGOVEIC = V.CODIGOVEIC
        LEFT JOIN
          man_grupodeservico GS ON T1.CODIGOGRPSERVI = GS.CODIGOGRPSERVI
        WHERE
          T2.DATAABERTURAOS >= TO_DATE('${processedParams.startDate}', 'YYYY-MM-DD')
          AND T2.DATAABERTURAOS <= TO_DATE('${processedParams.endDate}', 'YYYY-MM-DD')
          ${processedParams.origens.length > 0 ? `AND T2.CODORIGOS IN (${processedParams.origens.join(',')})` : ''}
          ${processedParams.garagens.length > 0 ? `AND T2.CODIGOGA IN (${processedParams.garagens.join(',')})` : ''}
          AND (V.CONDICAOVEIC IS NULL OR V.CONDICAOVEIC = 'A')
          AND ROWNUM <= ${processedParams.limit}
        ORDER BY
          T2.DATAABERTURAOS DESC,
          T2.NUMEROOS
      `;

      this.logger.log('🔍 Executando query no Globus...');
      const oracleData = await this.oracleService.executeQuery(sqlQuery);
      this.logger.log(`✅ Extraídos ${oracleData.length} registros do Globus`);

      if (oracleData.length === 0) {
        this.logger.warn('⚠️ Nenhum registro novo encontrado no Globus');
        return {
          success: true,
          timestamp: new Date().toISOString(),
          message: 'Nenhum registro novo encontrado no Globus',
          periodo: processedParams,
          total: 0,
          novos: 0,
          atualizados: 0,
          erros: 0,
          executionTime: `${Date.now() - startTime}ms`
        };
      }

      // ✅ Processar dados com UPSERT
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      let novos = 0;
      let atualizados = 0;
      let erros = 0;
      const dataAtual = new Date();
      dataAtual.setHours(0, 0, 0, 0);

      try {
        this.logger.log('💾 Processando dados no PostgreSQL...');
        
        for (const item of oracleData) {
          try {
            const osData = {
              codigoInternoOS: item.codigoInternoOS,
              numeroOS: item.numeroOS,
              codigoVeiculo: item.codigoVeiculo,
              codigoGaragem: item.codigoGaragem,
              prefixoVeiculo: item.prefixoVeiculo,
              placaVeiculo: item.placaVeiculo,
              condicaoVeiculo: item.condicaoVeiculo,
              dataAbertura: item.dataAbertura,
              dataFechamento: item.dataFechamento,
              horaAbertura: item.horaAbertura,
              tipoOSDescricao: item.tipoOSDescricao,
              tipoOS: item.tipoOS,
              condicaoOSDescricao: item.condicaoOSDescricao,
              condicaoOS: item.condicaoOS,
              codigoOrigemOS: item.codigoOrigemOS,
              usuarioAbertura: item.usuarioAbertura,
              descricaoOrigem: item.descricaoOrigem,
              descricaoServico: item.descricaoServico,
              codigoSetor: item.codigoSetor,
              codigoGrupoServico: item.codigoGrupoServico,
              grupoServico: item.grupoServico,
              garagem: item.garagem,
              tipoProblema: item.tipoProblema,
              diasEmAndamento: item.diasEmAndamento,
              kmExecucao: item.kmExecucao,
              valorMaoObraTerceiros: item.valorMaoObraTerceiros,
              valorPecasTerceiros: item.valorPecasTerceiros,
              ehSocorro: item.ehSocorro,
              dataSincronizacao: dataAtual,
              updatedAt: new Date(),
            };

            // ✅ UPSERT com ON CONFLICT
            const resultado = await queryRunner.manager
              .createQueryBuilder()
              .insert()
              .into(OrdemServico)
              .values(osData)
              .onConflict(`("codigo_interno_os") DO UPDATE SET 
                "numero_os" = EXCLUDED."numero_os",
                "codigo_veiculo" = EXCLUDED."codigo_veiculo",
                "codigo_garagem" = EXCLUDED."codigo_garagem",
                "prefixo_veiculo" = EXCLUDED."prefixo_veiculo",
                "placa_veiculo" = EXCLUDED."placa_veiculo",
                "condicao_veiculo" = EXCLUDED."condicao_veiculo",
                "data_abertura" = EXCLUDED."data_abertura",
                "data_fechamento" = EXCLUDED."data_fechamento",
                "hora_abertura" = EXCLUDED."hora_abertura",
                "tipo_os_descricao" = EXCLUDED."tipo_os_descricao",
                "tipo_os" = EXCLUDED."tipo_os",
                "condicao_os_descricao" = EXCLUDED."condicao_os_descricao",
                "condicao_os" = EXCLUDED."condicao_os",
                "codigo_origem_os" = EXCLUDED."codigo_origem_os",
                "usuario_abertura" = EXCLUDED."usuario_abertura",
                "descricao_origem" = EXCLUDED."descricao_origem",
                "descricao_servico" = EXCLUDED."descricao_servico",
                "codigo_setor" = EXCLUDED."codigo_setor",
                "codigo_grupo_servico" = EXCLUDED."codigo_grupo_servico",
                "grupo_servico" = EXCLUDED."grupo_servico",
                "garagem" = EXCLUDED."garagem",
                "tipo_problema" = EXCLUDED."tipo_problema",
                "dias_em_andamento" = EXCLUDED."dias_em_andamento",
                "km_execucao" = EXCLUDED."km_execucao",
                "valor_mao_obra_terceiros" = EXCLUDED."valor_mao_obra_terceiros",
                "valor_pecas_terceiros" = EXCLUDED."valor_pecas_terceiros",
                "eh_socorro" = EXCLUDED."eh_socorro",
                "data_sincronizacao" = EXCLUDED."data_sincronizacao",
                "updated_at" = EXCLUDED."updated_at"
              `)
              .execute();

            // Contar novos vs atualizados baseado na resposta
            if (resultado.raw && resultado.raw.length > 0 && resultado.raw[0].command === 'INSERT') {
              novos++;
            } else {
              atualizados++;
            }

          } catch (itemError: any) {
            erros++;
            this.logger.warn(`⚠️ Erro ao processar OS ${item.numeroOS}: ${itemError.message}`);
          }
        }

        await queryRunner.commitTransaction();
        this.logger.log('✅ Transação commitada com sucesso');

      } catch (transactionError: any) {
        await queryRunner.rollbackTransaction();
        this.logger.error('❌ Erro na transação, rollback realizado:', transactionError);
        throw transactionError;
      } finally {
        await queryRunner.release();
      }

      const executionTime = Date.now() - startTime;
      this.logger.log(`✅ Sincronização concluída em ${executionTime}ms:`);
      this.logger.log(`   📊 Total processado: ${oracleData.length}`);
      this.logger.log(`   ➕ Novos: ${novos}`);
      this.logger.log(`   🔄 Atualizados: ${atualizados}`);
      this.logger.log(`   ❌ Erros: ${erros}`);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Sincronização do Globus concluída com sucesso',
        executionTime: `${executionTime}ms`,
        periodo: processedParams,
        total: oracleData.length,
        novos,
        atualizados,
        erros,
      };

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`❌ Erro na sincronização: ${error.message}`, error.stack);
      throw error;
    } finally {
      this.sincronizandoOS = false;
    }
  }

  /**
   * ✅ NOVO: Obter estatísticas rápidas do banco
   */
  async obterEstatisticasRapidas(): Promise<any> {
    try {
      this.logger.log('📊 Calculando estatísticas rápidas...');

      // Total geral
      const totalGeral = await this.osRepository.count();

      // Mês atual
      const hoje = new Date();
      const mesAtual = hoje.getMonth() + 1;
      const anoAtual = hoje.getFullYear();
      const mesAnoPattern = `${mesAtual.toString().padStart(2, '0')}/${anoAtual}`;
      
      const totalMesAtual = await this.osRepository
        .createQueryBuilder('os')
        .where('os.data_abertura LIKE :mesAno', { mesAno: `%/${mesAnoPattern}` })
        .getCount();

      // OS Abertas
      const osAbertas = await this.osRepository
        .createQueryBuilder('os')
        .where('os.condicao_os IN (:...status)', { status: ['A', 'AB'] })
        .getCount();

      // Última sincronização
      const ultimaSincronizacao = await this.osRepository
        .createQueryBuilder('os')
        .select('MAX(os.data_sincronizacao)', 'ultima')
        .getRawOne();

      return {
        success: true,
        timestamp: new Date().toISOString(),
        estatisticas: {
          totalGeral,
          totalMesAtual,
          osAbertas,
          ultimaSincronizacao: ultimaSincronizacao?.ultima,
          mesAtualDescricao: `${mesAtual}/${anoAtual}`
        }
      };
    } catch (error: any) {
      this.logger.error('❌ Erro ao calcular estatísticas:', error);
      throw error;
    }
  }

  /**
   * ✅ Calcular estatísticas detalhadas
   */
  private calculateStatistics(data: any[]): any {
    if (data.length === 0) return {};

    const tiposOS = data.reduce((acc, item) => {
      const tipo = item.tipoOSDescricao || 'Não informado';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    const statusOS = data.reduce((acc, item) => {
      const status = item.condicaoOSDescricao || 'Não informado';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const garagens = data.reduce((acc, item) => {
      const garagem = item.garagem || 'Não informado';
      acc[garagem] = (acc[garagem] || 0) + 1;
      return acc;
    }, {});

    const tiposProblema = data.reduce((acc, item) => {
      const tipo = item.tipoProblema || 'Não informado';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});

    const totalValorTerceiros = data.reduce(
      (sum, item) =>
        sum +
        (parseFloat(item.valorMaoObraTerceiros) || 0) +
        (parseFloat(item.valorPecasTerceiros) || 0),
      0,
    );

    const osAbertas = data.filter((item) => item.condicaoOS === 'A' || item.condicaoOS === 'AB').length;
    const osFechadas = data.filter((item) => item.condicaoOS === 'FC').length;
    const quebras = data.filter((item) => item.tipoProblema === 'QUEBRA').length;
    const defeitos = data.filter((item) => item.tipoProblema === 'DEFEITO').length;
    const socorros = data.filter((item) => item.ehSocorro === 'Sim').length;

    return {
      resumo: {
        totalRegistros: data.length,
        osAbertas,
        osFechadas,
        quebras,
        defeitos,
        socorros,
      },
      distribuicoes: {
        tiposOS,
        statusOS,
        garagens,
        tiposProblema,
      },
      indicadores: {
        totalValorTerceiros: totalValorTerceiros.toFixed(2),
        percentualAbertas: data.length > 0 ? ((osAbertas / data.length) * 100).toFixed(1) + '%' : '0%',
        percentualFechadas: data.length > 0 ? ((osFechadas / data.length) * 100).toFixed(1) + '%' : '0%',
      },
    };
  }

  /**
   * ✅ MÉTODO LEGADO: Manter compatibilidade
   */
  async buscarOS(params: any): Promise<any> {
    // Redirecionar para o método apropriado baseado nos parâmetros
    if (params?.mesAtual === true) {
      return await this.buscarOSMesAtual();
    } else {
      return await this.buscarTodasOS(params);
    }
  }

  /**
   * ✅ MÉTODO LEGADO: Manter compatibilidade
   */
  async sincronizarOS(params: any): Promise<any> {
    return await this.sincronizarDoGlobus(params);
  }
}