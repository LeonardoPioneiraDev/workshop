// apps/backend/src/modules/departamentos/juridico/services/multa-completa.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Between } from 'typeorm';
import { MultaCompleta } from '../entities/multa-completa.entity';
import { MultaCompletaFilterDto } from '../dto/multa-completa-filter.dto';
import { OracleReadOnlyService } from '../../../../oracle/services/oracle-readonly.service';

import { 
  SyncResult, 
  MultaCompletaResult, 
  AgrupamentoResult,
  AgrupamentoPorAgente,
  AgrupamentoPorVeiculo,
  AgrupamentoPorInfracao,
  AgrupamentoPorPeriodo
} from '../types/multa-completa.types';

@Injectable()
export class MultaCompletaService {
  private readonly logger = new Logger(MultaCompletaService.name);

  constructor(
    @InjectRepository(MultaCompleta)
    private readonly multaCompletaRepository: Repository<MultaCompleta>,
    private readonly oracleService: OracleReadOnlyService,
  ) {}

  /**
   * Busca multas completas com cache inteligente
   */
  async buscarMultasCompletas(filters: MultaCompletaFilterDto): Promise<MultaCompletaResult> {
    this.logger.log(`🔍 Buscando multas completas com filtros: ${JSON.stringify(filters)}`);

    // ✅ PERÍODO AMPLO PARA PEGAR TODOS OS DADOS
    const dataInicio = filters.dataInicio || this.getStartOfYear();
    const dataFim = filters.dataFim || this.getEndOfYear();

    // Verifica se existem dados no cache para o período
    const dadosCache = await this.verificarDadosCache(dataInicio, dataFim);
    
    if (!dadosCache.existem || dadosCache.desatualizados) {
      this.logger.log(`📥 Dados não encontrados ou desatualizados no cache. Sincronizando...`);
      await this.sincronizarDadosOracle(dataInicio, dataFim);
    }

    // Busca dados no PostgreSQL com filtros
    const result = await this.buscarDadosLocal(filters, dataInicio, dataFim);

    // Se solicitado agrupamento, processa os grupos
    if (filters.groupBy) {
      result.groups = await this.processarAgrupamentos(filters, dataInicio, dataFim);
    }

    // Adiciona resumo estatístico
    result.summary = await this.gerarResumo(filters, dataInicio, dataFim);

    return result;
  }

  /**
   * ✅ FUNÇÕES AUXILIARES PARA DATAS - PERÍODO AMPLO
   */
  private getStartOfYear(): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1); // 1º de janeiro
    return start.toISOString().split('T')[0];
  }

  private getEndOfYear(): string {
    const now = new Date();
    const end = new Date(now.getFullYear(), 11, 31); // 31 de dezembro
    return end.toISOString().split('T')[0];
  }

  private getStartOfMonth(): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1); // ✅ ANO INTEIRO
    return start.toISOString().split('T')[0];
  }

  private getEndOfMonth(): string {
    const now = new Date();
    const end = new Date(now.getFullYear(), 11, 31); // ✅ ANO INTEIRO
    return end.toISOString().split('T')[0];
  }

  /**
   * Verifica se existem dados no cache para o período
   */
  private async verificarDadosCache(dataInicio: string, dataFim: string) {
    const count = await this.multaCompletaRepository.count({
      where: {
        dataEmissaoMulta: Between(new Date(dataInicio), new Date(dataFim))
      }
    });

    // Verifica se os dados foram sincronizados nas últimas 24 horas
    const ultimaSincronizacao = await this.multaCompletaRepository
      .createQueryBuilder('m')
      .select('MAX(m.sincronizadoEm)', 'ultimaSync')
      .where('m.dataEmissaoMulta BETWEEN :inicio AND :fim', { 
        inicio: dataInicio, 
        fim: dataFim 
      })
      .getRawOne();

    const agora = new Date();
    const ultimaSync = ultimaSincronizacao?.ultimaSync ? new Date(ultimaSincronizacao.ultimaSync) : null;
    const desatualizados = !ultimaSync || (agora.getTime() - ultimaSync.getTime()) > 24 * 60 * 60 * 1000;

    return {
      existem: count > 0,
      quantidade: count,
      desatualizados,
      ultimaSincronizacao: ultimaSync
    };
  }

  /**
   * Sincroniza dados do Oracle para PostgreSQL
   */
  private async sincronizarDadosOracle(dataInicio: string, dataFim: string): Promise<SyncResult> {
    this.logger.log(`🔄 Iniciando sincronização Oracle -> PostgreSQL (${dataInicio} a ${dataFim})`);

    const query = `
      SELECT 
        D.DESCRICAOINFRA,
        V.PREFIXOVEIC,
        M.*,
        A.COD_AGENTE_AUTUADOR AS "AGENTE_CODIGO",
        A.DESC_AGENTE_AUTUADOR AS "AGENTE_DESCRICAO",
        A.MATRICULAFISCAL AS "AGENTE_MATRICULA_FISCAL"
      FROM DVS_MULTA M,
           DVS_INFRACAO D,
           FRT_CADVEICULOS V,
           GLOBUS.DVS_AGENTE_AUTUADOR A
      WHERE M.CODIGOVEIC = V.CODIGOVEIC (+)
        AND M.CODIGOINFRA = D.CODIGOINFRA
        AND M.COD_AGENTE_AUTUADOR = A.COD_AGENTE_AUTUADOR (+)
        AND V.CODIGOEMPRESA = 4
        AND M.DATAEMISSAOMULTA BETWEEN TO_DATE('${dataInicio}', 'YYYY-MM-DD') 
                                   AND TO_DATE('${dataFim}', 'YYYY-MM-DD')
      ORDER BY M.DATAEMISSAOMULTA DESC, V.PREFIXOVEIC
    `;

    try {
      const dadosOracle = await this.oracleService.executeQuery(query);

      this.logger.log(`📊 Encontrados ${dadosOracle.length} registros no Oracle`);

      let novos = 0;
      let atualizados = 0;
      let erros = 0;

      for (const registro of dadosOracle) {
        try {
          const multaExistente = await this.multaCompletaRepository.findOne({
            where: { numeroAiMulta: registro.NUMEROAIMULTA }
          });

          const multaData = this.mapearDadosOracle(registro);

          if (multaExistente) {
            await this.multaCompletaRepository.update(
              { numeroAiMulta: registro.NUMEROAIMULTA },
              { ...multaData, sincronizadoEm: new Date() }
            );
            atualizados++;
          } else {
            await this.multaCompletaRepository.save({
              ...multaData,
              sincronizadoEm: new Date()
            });
            novos++;
          }
        } catch (error) {
          erros++;
          this.logger.warn(`⚠️ Erro ao processar registro ${registro.NUMEROAIMULTA}: ${error.message}`);
          // Continue processando outros registros
        }
      }

      this.logger.log(`✅ Sincronização concluída: ${novos} novos, ${atualizados} atualizados, ${erros} erros`);

      return {
        total: dadosOracle.length,
        novos,
        atualizados,
        periodo: { inicio: dataInicio, fim: dataFim },
        fonte: 'oracle'
      };

    } catch (error) {
      this.logger.error(`❌ Erro na sincronização Oracle: ${error.message}`);
      throw error;
    }
  }

  /**
   * ✅ MAPEAMENTO COMPLETO DE TODOS OS CAMPOS DO ORACLE
   */
  private mapearDadosOracle(registro: any): Partial<MultaCompleta> {
    return {
      // ✅ CAMPOS BÁSICOS
      numeroAiMulta: registro.NUMEROAIMULTA,
      descricaoInfra: registro.DESCRICAOINFRA,
      prefixoVeic: registro.PREFIXOVEIC,
      codIntFunc: registro.CODINTFUNC,
      codigoVeic: registro.CODIGOVEIC,
      codigoInfra: registro.CODIGOINFRA,
      codigoUf: registro.CODIGOUF,
      codMunic: registro.CODMUNIC,
      codigoOrg: registro.CODIGOORG,
      
      // ✅ DATAS PRINCIPAIS
      dataEmissaoMulta: this.parseOracleDate(registro.DATAEMISSAOMULTA),
      localMulta: registro.LOCALMULTA,
      numeroLocalMulta: registro.NUMEROLOCALMULTA,
      dataHoraMulta: this.parseOracleDate(registro.DATAHORAMULTA),
      dataVectoMulta: this.parseOracleDate(registro.DATAVECTOMULTA),
      
      // ✅ VALORES FINANCEIROS
      valorMulta: this.parseFloat(registro.VALORMULTA),
      totalParcelasMulta: this.parseInt(registro.TOTALPARCELASMULTA),
      valorTotalMulta: this.parseFloat(registro.VALORTOTALMULTA),
      dataPagtoMulta: this.parseOracleDate(registro.DATAPAGTOMULTA),
      responsavelMulta: registro.RESPONSAVELMULTA,
      
      // ✅ RECURSOS
      numeroRecursoMulta: registro.NUMERORECURSOMULTA,
      dataRecursoMulta: this.parseOracleDate(registro.DATARECURSOMULTA),
      condicaoRecursoMulta: registro.CONDICAORECURSOMULTA,
      numeroRecursoMulta2: registro.NUMERORECURSOMULTA2,
      dataRecursoMulta2: this.parseOracleDate(registro.DATARECURSOMULTA2),
      condicaoRecursoMulta2: registro.CONDICAORECURSOMULTA2,
      numeroRecursoMulta3: registro.NUMERORECURSOMULTA3,
      dataRecursoMulta3: this.parseOracleDate(registro.DATARECURSOMULTA3),
      condicaoRecursoMulta3: registro.CONDICAORECURSOMULTA3,
      
      // ✅ PAGAMENTOS E VALORES
      valorPago: this.parseFloat(registro.VALORPAGO),
      dataAutorizado: this.parseOracleDate(registro.DATAAUTORIZADO),
      autorizado: registro.AUTORIZADO,
      declImpressoMulta: registro.DECLIMPRESSOMULTA,
      documento: registro.DOCUMENTO,
      dataPagamentoPrev: this.parseOracleDate(registro.DATAPAGAMENTOPREV),
      vlrAcrescimo: this.parseFloat(registro.VLRACRESCIMO),
      vlrDesconto: this.parseFloat(registro.VLRDESCONTO),
      valorPagamento: this.parseFloat(registro.VALORPAGAMENTO),
      
      // ✅ CÓDIGOS DE CONTROLE
      codigoForn: registro.CODIGOFORN,
      codLanca: registro.CODLANCA,
      idPrest2: registro.ID_PREST2,
      codDocTocpg: registro.CODDOCTOCPG,
      codIntProaut: registro.CODINTPROAUT,
      observacao: registro.OBSERVACAO,
      dataLimiteCondutor: this.parseOracleDate(registro.DATALIMITECONDUTOR),
      
      // ✅ CÓDIGOS ADMINISTRATIVOS
      codMotivoNotificacao: registro.COD_MOTIVO_NOTIFICACAO,
      codAreaCompetencia: registro.COD_AREA_COMPETENCIA,
      codResponsavelNotificacao: registro.COD_RESPONSAVEL_NOTIFICACAO,
      codAgenteAutuador: registro.COD_AGENTE_AUTUADOR,
      codIntLinha: registro.CODINTLINHA,
      flgPrimParcelaPaga: registro.FLG_PRIMPARCELAPAGA,
      
      // ✅ ENTRADA E PARCELAS
      entradaVencimento: this.parseOracleDate(registro.ENTRADAVENCIMENTO),
      entradaPagamento: this.parseOracleDate(registro.ENTRADAPAGAMENTO),
      
      // ✅ AUTO DE INFRAÇÃO
      autoDeInfracao: registro.AUTODEINFRACAO,
      autoDeInfracaoEmissao: this.parseOracleDate(registro.AUTODEINFRACAOEMISSAO),
      autoDeInfracaoRecebimento: this.parseOracleDate(registro.AUTODEINFRACAORECEBIMENTO),
      autoDeInfracaoConsiderado: this.parseOracleDate(registro.AUTODEINFRACAOCONSIDERADO),
      autoDeInfracaoValorDoDoc: this.parseFloat(registro.AUTODEINFRACAOVALORDODOC),
      autoDeInfracaoValorConsiderado: this.parseFloat(registro.AUTODEINFRACAOVALORCONSIDERADO),
      
      // ✅ NOTIFICAÇÃO 1
      notificacao1: registro.NOTIFICACAO1,
      notificacao1Emissao: this.parseOracleDate(registro.NOTIFICACAO1EMISSAO),
      notificacao1Recebimento: this.parseOracleDate(registro.NOTIFICACAO1RECEBIMENTO),
      notificacao1Considerado: this.parseOracleDate(registro.NOTIFICACAO1CONSIDERADO),
      notificacao1ValorDoDoc: this.parseFloat(registro.NOTIFICACAO1VALORDODOC),
      notificacao1ValorConsiderado: this.parseFloat(registro.NOTIFICACAO1VALORCONSIDERADO),
      
      // ✅ NOTIFICAÇÃO 2
      notificacao2: registro.NOTIFICACAO2,
      notificacao2Emissao: this.parseOracleDate(registro.NOTIFICACAO2EMISSAO),
      notificacao2Recebimento: this.parseOracleDate(registro.NOTIFICACAO2RECEBIMENTO),
      notificacao2Considerado: this.parseOracleDate(registro.NOTIFICACAO2CONSIDERADO),
      notificacao2ValorDoDoc: this.parseFloat(registro.NOTIFICACAO2VALORDODOC),
      notificacao2ValorConsiderado: this.parseFloat(registro.NOTIFICACAO2VALORCONSIDERADO),
      
      // ✅ NOTIFICAÇÃO 3
      notificacao3: registro.NOTIFICACAO3,
      notificacao3Emissao: this.parseOracleDate(registro.NOTIFICACAO3EMISSAO),
      notificacao3Recebimento: this.parseOracleDate(registro.NOTIFICACAO3RECEBIMENTO),
      notificacao3Considerado: this.parseOracleDate(registro.NOTIFICACAO3CONSIDERADO),
      notificacao3ValorDoDoc: this.parseFloat(registro.NOTIFICACAO3VALORDODOC),
      notificacao3ValorConsiderado: this.parseFloat(registro.NOTIFICACAO3VALORCONSIDERADO),

      // ✅ VALORES ADICIONAIS
      valorAtualizado: this.parseFloat(registro.VALORATUALIZADO),
      pgtoIntempData: this.parseOracleDate(registro.PGTOINTEMPDATA),
      pgtoIntempValor: this.parseFloat(registro.PGTOINTEMPVALOR),
      depJudData: this.parseOracleDate(registro.DEPJUDDATA),
      depJudValor: this.parseFloat(registro.DEPJUDVALOR),
      depJudDtRecup: this.parseOracleDate(registro.DEPJUDDTRECUP),
      depJudVlrRecup: this.parseFloat(registro.DEPJUDVLRRECUP),
      numeroProcesso: registro.NUMEROPROCESSO,
      
      // ✅ PARCELAS
      parcValor: this.parseFloat(registro.PARCVALOR),
      parcTotalParcelas: this.parseInt(registro.PARCTOTALPARCELAS),
      parcValorParcelas: this.parseFloat(registro.PARCVALORPARCELAS),
      entVencimento: this.parseOracleDate(registro.ENTVENCIMENTO),
      entPagamento: this.parseOracleDate(registro.ENTPAGAMENTO),
      entValor: this.parseFloat(registro.ENTVALOR),
      parVencimento: this.parseOracleDate(registro.PARVENCIMENTO),
      parPagamento: this.parseOracleDate(registro.PARPAGAMENTO),
      parValor: this.parseFloat(registro.PARVALOR),
      ultParVencimento: this.parseOracleDate(registro.ULTPARVENCIMENTO),
      ultParPagamento: this.parseOracleDate(registro.ULTPARPAGAMENTO),
      ultParValor: this.parseFloat(registro.ULTPARVALOR),
      totalPago: this.parseFloat(registro.TOTALPAGO),
      recuso: registro.RECUSO,
      anistia: registro.ANISTIA,
      
      // ✅ INSTÂNCIAS
      instanciaEnvio1: this.parseOracleDate(registro.INSTANCIAENVIO1),
      instanciaPublicacaoDo1: this.parseOracleDate(registro.INSTANCIAPUBLICACAODO1),
      instanciaEnvio2: this.parseOracleDate(registro.INSTANCIAENVIO2),
      instanciaPublicacaoDo2: this.parseOracleDate(registro.INSTANCIAPUBLICACAODO2),
      instanciaEnvio3: this.parseOracleDate(registro.INSTANCIAENVIO3),
      instanciaPublicacaoDo3: this.parseOracleDate(registro.INSTANCIAPUBLICACAODO3),
      integrouPorVencimento: registro.INTEGROU_POR_VENCIMENTO,
      valorJulgado: this.parseFloat(registro.VALORJULGADO),
      codigoRecuperacao: registro.CODIGORECUPERACAO,
      nProcessoNotificacao: registro.NPROCESSONOTIFICACAO,
      
      // ✅ PRAZOS
      autoDeInfracaoPrazo: registro.AUTODEINFRACAOPRAZO,
      notificacao1Prazo: registro.NOTIFICACAO1PRAZO,
      notificacao2Prazo: registro.NOTIFICACAO2PRAZO,
      notificacao3Prazo: registro.NOTIFICACAO3PRAZO,
      pgtoIntempVenc: this.parseOracleDate(registro.PGTOINTEMPVENC),
      depJudVenc: this.parseOracleDate(registro.DEPJUDVENC),
      
      // ✅ CÓDIGOS ADMINISTRATIVOS EXTRAS
      codCausaPrincipal: registro.CODCAUSAPRINCIPAL,
      envPenalidade: registro.ENVPENALIDADE,
      revPenalidade: registro.REVPENALIDADE,
      obsNotificacao: registro.OBSNOTIFICACAO,
      recuperada: registro.RECUPERADA,
      palavraChave: registro.PALAVRACHAVE,
      tratamentoMulta: registro.TRATAMENTOMULTA,
      importacaoOk: registro.IMPORTACAOOK,
      tipoDeTrecho: registro.TIPODETRECHO,
      reembolsavel: registro.REEMBOLSAVEL,
      
      // ✅ LOCALIZAÇÃO
      kmLocalMulta: registro.KMLOCALMULTA,
      metrosLocalMulta: registro.METROSLOCALMULTA,
      sentidoLocalMulta: registro.SENTIDOLOCALMULTA,
      bairroLocalMulta: registro.BAIRROLOCALMULTA,
      observacaoRealMotivo: registro.OBSERVACAOREALMOTIVO,
      tipoTratamentoMulta: registro.TIPOTRATAMENTOMULTA,
      executor: registro.EXECUTOR,
      executorCnpjCpf: registro.EXECUTORCNPJCPF,
      ultAlteracao: this.parseOracleDate(registro.ULTALTERACAO),
      ocorrencia: registro.OCORRENCIA,
      codigoRessarc: registro.CODIGORESSARC,
      
      // ✅ SMARTEC
      flgSmartec: registro.FLG_SMARTEC,
      dataImpSmartec: this.parseOracleDate(registro.DATA_IMP_SMARTEC),
      urlFormulario: registro.URL_FORMULARIO,
      urlBoleto: registro.URL_BOLETO,
      flgSmartecMulta: registro.FLG_SMARTEC_MULTA,
      
      // ✅ CLASSIFICAÇÃO
      reincidencia: registro.REINCIDENCIA,
      pontuacaoInfracao: this.parseInt(registro.PONTUACAOINFRACAO),
      grupoInfracao: registro.GRUPOINFRACAO,
      codOrgOriginal: registro.COD_ORG_ORIGINAL,
      aitOriginal: registro.AIT_ORIGINAL,

      // ✅ DADOS DO AGENTE
      agenteCodigo: registro.AGENTE_CODIGO,
      agenteDescricao: registro.AGENTE_DESCRICAO,
      agenteMatriculaFiscal: registro.AGENTE_MATRICULA_FISCAL,

      // ✅ CONTROLE
      codigoEmpresa: 4
    };
  }

  /**
   * ✅ FUNÇÃO TOTALMENTE CORRIGIDA PARA CONVERTER DATAS DO ORACLE
   */
  private parseOracleDate(dateValue: any): Date | null {
    if (!dateValue) return null;
    
    try {
      // Se já é um objeto Date válido
      if (dateValue instanceof Date) {
        // Verificar se é uma data válida
        if (isNaN(dateValue.getTime())) {
          return null;
        }
        // Verificar se é a data padrão do Oracle (30/12/1899)
        if (dateValue.getFullYear() === 1899) {
          return null;
        }
        return dateValue;
      }
      
      // Se é string, tentar converter
      if (typeof dateValue === 'string') {
        // Remover espaços em branco
        const cleanValue = dateValue.trim();
        
        // Verificar se é vazio ou data padrão inválida
        if (!cleanValue || cleanValue === '30/12/1899' || cleanValue.includes('1899')) {
          return null;
        }
        
        // Tentar formato brasileiro DD/MM/YYYY ou DD/MM/YYYY HH:MM:SS
        if (cleanValue.includes('/')) {
          const parts = cleanValue.split(' ');
          const datePart = parts[0];
          const timePart = parts[1] || '00:00:00';
          
          const [day, month, year] = datePart.split('/');
          
          // Validar se os valores são números válidos
          const dayNum = parseInt(day, 10);
          const monthNum = parseInt(month, 10);
          const yearNum = parseInt(year, 10);
          
          if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
            return null;
          }
          
          // Validar ranges básicos
          if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
            return null;
          }
          
          // Processar horário se existir
          let hourNum = 0, minuteNum = 0, secondNum = 0;
          if (timePart && timePart !== '00:00:00') {
            const [hour, minute, second] = timePart.split(':');
            hourNum = parseInt(hour || '0', 10);
            minuteNum = parseInt(minute || '0', 10);
            secondNum = parseInt(second || '0', 10);
            
            // Validar horário
            if (isNaN(hourNum) || isNaN(minuteNum) || isNaN(secondNum) ||
                hourNum < 0 || hourNum > 23 || minuteNum < 0 || minuteNum > 59 || secondNum < 0 || secondNum > 59) {
              hourNum = minuteNum = secondNum = 0;
            }
          }
          
          // Criar data com validação
          const date = new Date(yearNum, monthNum - 1, dayNum, hourNum, minuteNum, secondNum);
          
          // Verificar se a data criada é válida
          if (isNaN(date.getTime()) || 
              date.getDate() !== dayNum || 
              date.getMonth() !== (monthNum - 1) || 
              date.getFullYear() !== yearNum) {
            return null;
          }
          
          return date;
        }
        
        // Tentar formato ISO ou outros formatos padrão
        const date = new Date(cleanValue);
        if (isNaN(date.getTime())) {
          return null;
        }
        
        // Verificar se não é data padrão inválida
        if (date.getFullYear() === 1899) {
          return null;
        }
        
        return date;
      }
      
      // Se é número (timestamp)
      if (typeof dateValue === 'number') {
        const date = new Date(dateValue);
        if (isNaN(date.getTime()) || date.getFullYear() === 1899) {
          return null;
        }
        return date;
      }
      
      return null;
    } catch (error) {
      // Não fazer log para evitar spam, apenas retornar null
      return null;
    }
  }

  /**
   * ✅ FUNÇÕES AUXILIARES PARA PARSING NUMÉRICO
   */
  private parseFloat(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    
    try {
      // Converter vírgula para ponto se for string
      let stringValue = value.toString().replace(',', '.');
      const parsed = parseFloat(stringValue);
      return isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  }

  private parseInt(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    
    try {
      const parsed = parseInt(value.toString(), 10);
      return isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  }

  /**
   * Busca dados no PostgreSQL local com filtros
   */
  private async buscarDadosLocal(
    filters: MultaCompletaFilterDto, 
    dataInicio: string, 
    dataFim: string
  ): Promise<MultaCompletaResult> {
    const queryBuilder = this.multaCompletaRepository.createQueryBuilder('m');

    // Filtro de período
    queryBuilder.where('m.dataEmissaoMulta BETWEEN :dataInicio AND :dataFim', {
      dataInicio,
      dataFim
    });

    // Aplicar filtros
    this.aplicarFiltros(queryBuilder, filters);

    // Contagem total
    const total = await queryBuilder.getCount();

    // Paginação
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 50, 1000); // Máximo 1000 registros
    const offset = (page - 1) * limit;

    // Ordenação
    const orderBy = filters.orderBy || 'dataEmissaoMulta';
    const orderDirection = filters.orderDirection || 'DESC';
    queryBuilder.orderBy(`m.${orderBy}`, orderDirection);

    // Aplicar paginação
    queryBuilder.skip(offset).take(limit);

    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Aplica filtros na query
   */
  private aplicarFiltros(queryBuilder: SelectQueryBuilder<MultaCompleta>, filters: MultaCompletaFilterDto) {
    if (filters.prefixoVeic) {
      queryBuilder.andWhere('m.prefixoVeic ILIKE :prefixoVeic', { 
        prefixoVeic: `%${filters.prefixoVeic}%` 
      });
    }

    if (filters.numeroAiMulta) {
      queryBuilder.andWhere('m.numeroAiMulta = :numeroAiMulta', { 
        numeroAiMulta: filters.numeroAiMulta 
      });
    }

    if (filters.codigoVeic) {
      queryBuilder.andWhere('m.codigoVeic = :codigoVeic', { 
        codigoVeic: filters.codigoVeic 
      });
    }

    if (filters.codigoInfra) {
      queryBuilder.andWhere('m.codigoInfra = :codigoInfra', { 
        codigoInfra: filters.codigoInfra 
      });
    }

    if (filters.agenteCodigo) {
      queryBuilder.andWhere('m.agenteCodigo = :agenteCodigo', { 
        agenteCodigo: filters.agenteCodigo 
      });
    }

    if (filters.agenteDescricao) {
      queryBuilder.andWhere('m.agenteDescricao ILIKE :agenteDescricao', { 
        agenteDescricao: `%${filters.agenteDescricao}%` 
      });
    }

    if (filters.localMulta) {
      queryBuilder.andWhere('m.localMulta ILIKE :localMulta', { 
        localMulta: `%${filters.localMulta}%` 
      });
    }

    if (filters.responsavelMulta) {
      queryBuilder.andWhere('m.responsavelMulta = :responsavelMulta', { 
        responsavelMulta: filters.responsavelMulta 
      });
    }

    if (filters.valorMinimo !== undefined) {
      queryBuilder.andWhere('m.valorMulta >= :valorMinimo', { 
        valorMinimo: filters.valorMinimo 
      });
    }

    if (filters.valorMaximo !== undefined) {
      queryBuilder.andWhere('m.valorMulta <= :valorMaximo', { 
        valorMaximo: filters.valorMaximo 
      });
    }

    if (filters.gruposInfracao && filters.gruposInfracao.length > 0) {
      queryBuilder.andWhere('m.grupoInfracao IN (:...gruposInfracao)', { 
        gruposInfracao: filters.gruposInfracao 
      });
    }

    // Filtro por situação
    if (filters.situacao) {
      switch (filters.situacao) {
        case 'paga':
          queryBuilder.andWhere('m.dataPagtoMulta IS NOT NULL');
          break;
        case 'vencida':
          queryBuilder.andWhere('m.dataVectoMulta < :hoje AND m.dataPagtoMulta IS NULL', { 
            hoje: new Date() 
          });
          break;
        case 'recurso':
          queryBuilder.andWhere('m.numeroRecursoMulta IS NOT NULL OR m.numeroRecursoMulta2 IS NOT NULL OR m.numeroRecursoMulta3 IS NOT NULL');
          break;
        case 'pendente':
          queryBuilder.andWhere('m.dataVectoMulta >= :hoje AND m.dataPagtoMulta IS NULL', { 
            hoje: new Date() 
          });
          break;
      }
    }

    // Busca geral
    if (filters.busca) {
      queryBuilder.andWhere(`(
        m.numeroAiMulta ILIKE :busca OR
        m.prefixoVeic ILIKE :busca OR
        m.descricaoInfra ILIKE :busca OR
        m.localMulta ILIKE :busca OR
        m.agenteDescricao ILIKE :busca OR
        m.observacao ILIKE :busca
      )`, { busca: `%${filters.busca}%` });
    }
  }

  /**
 * ✅ Processa agrupamentos dos dados COM TIPAGEM CORRETA
 */
private async processarAgrupamentos(
  filters: MultaCompletaFilterDto, 
  dataInicio: string, 
  dataFim: string
): Promise<AgrupamentoResult[]> {
  const queryBuilder = this.multaCompletaRepository.createQueryBuilder('m');

  queryBuilder.where('m.dataEmissaoMulta BETWEEN :dataInicio AND :dataFim', {
    dataInicio,
    dataFim
  });

  this.aplicarFiltros(queryBuilder, filters);

  switch (filters.groupBy) {
    case 'agente':
      return await queryBuilder
        .select([
          'm.agenteCodigo as codigo',
          'm.agenteDescricao as descricao',
          'COUNT(*) as total',
          'SUM(m.valorMulta) as "valorTotal"',
          'AVG(m.valorMulta) as "valorMedio"'
        ])
        .where('m.agenteCodigo IS NOT NULL')
        .groupBy('m.agenteCodigo, m.agenteDescricao')
        .orderBy('total', 'DESC')
        .getRawMany() as AgrupamentoPorAgente[];

    case 'veiculo':
      return await queryBuilder
        .select([
          'm.codigoVeic as codigo',
          'm.prefixoVeic as prefixo',
          'COUNT(*) as total',
          'SUM(m.valorMulta) as "valorTotal"',
          'AVG(m.valorMulta) as "valorMedio"'
        ])
        .where('m.codigoVeic IS NOT NULL')
        .groupBy('m.codigoVeic, m.prefixoVeic')
        .orderBy('total', 'DESC')
        .getRawMany() as AgrupamentoPorVeiculo[];

    case 'infracao':
      return await queryBuilder
        .select([
          'm.codigoInfra as codigo',
          'm.descricaoInfra as descricao',
          'm.grupoInfracao as grupo',
          'COUNT(*) as total',
          'SUM(m.valorMulta) as "valorTotal"',
          'AVG(m.valorMulta) as "valorMedio"'
        ])
        .where('m.codigoInfra IS NOT NULL')
        .groupBy('m.codigoInfra, m.descricaoInfra, m.grupoInfracao')
        .orderBy('total', 'DESC')
        .getRawMany() as AgrupamentoPorInfracao[];

    case 'mes':
    case 'dia':
      const formato = filters.groupBy === 'mes' ? 'YYYY-MM' : 'YYYY-MM-DD';
      return await queryBuilder
        .select([
          `TO_CHAR(m.dataEmissaoMulta, '${formato}') as periodo`,
          'COUNT(*) as total',
          'SUM(m.valorMulta) as "valorTotal"',
          'AVG(m.valorMulta) as "valorMedio"'
        ])
        .where('m.dataEmissaoMulta IS NOT NULL')
        .groupBy(`TO_CHAR(m.dataEmissaoMulta, '${formato}')`)
        .orderBy('periodo', 'ASC')
        .getRawMany() as AgrupamentoPorPeriodo[];

    default:
      return [];
  }
}

  /**
   * Gera resumo estatístico
   */
  private async gerarResumo(
    filters: MultaCompletaFilterDto, 
    dataInicio: string, 
    dataFim: string
  ): Promise<any> {
    const queryBuilder = this.multaCompletaRepository.createQueryBuilder('m');

    queryBuilder.where('m.dataEmissaoMulta BETWEEN :dataInicio AND :dataFim', {
      dataInicio,
      dataFim
    });

    this.aplicarFiltros(queryBuilder, filters);

    const resumo = await queryBuilder
      .select([
        'COUNT(*) as totalMultas',
        'SUM(m.valorMulta) as valorTotal',
        'AVG(m.valorMulta) as valorMedio',
        'MIN(m.valorMulta) as valorMinimo',
        'MAX(m.valorMulta) as valorMaximo',
        'COUNT(CASE WHEN m.dataPagtoMulta IS NOT NULL THEN 1 END) as multasPagas',
        'COUNT(CASE WHEN m.dataVectoMulta < NOW() AND m.dataPagtoMulta IS NULL THEN 1 END) as multasVencidas',
        'COUNT(CASE WHEN m.numeroRecursoMulta IS NOT NULL OR m.numeroRecursoMulta2 IS NOT NULL OR m.numeroRecursoMulta3 IS NOT NULL THEN 1 END) as multasComRecurso',
        'SUM(CASE WHEN m.dataPagtoMulta IS NOT NULL THEN m.valorPago ELSE 0 END) as valorArrecadado'
      ])
      .getRawOne();

    // Converte strings para números
    Object.keys(resumo).forEach(key => {
      if (resumo[key] && !isNaN(resumo[key])) {
        resumo[key] = parseFloat(resumo[key]);
      }
    });

    // Calcula percentuais
    const total = resumo.totalMultas || 0;
    resumo.percentualPagas = total > 0 ? (resumo.multasPagas / total * 100).toFixed(2) : 0;
    resumo.percentualVencidas = total > 0 ? (resumo.multasVencidas / total * 100).toFixed(2) : 0;
    resumo.percentualComRecurso = total > 0 ? (resumo.multasComRecurso / total * 100).toFixed(2) : 0;

    return resumo;
  }

  /**
   * Força sincronização manual
   */
  async sincronizarManual(dataInicio?: string, dataFim?: string): Promise<SyncResult> {
    const inicio = dataInicio || this.getStartOfYear();
    const fim = dataFim || this.getEndOfYear();

    return await this.sincronizarDadosOracle(inicio, fim);
  }

  /**
   * Busca multa específica por número
   */
  async buscarPorNumero(numeroAiMulta: string): Promise<MultaCompleta | null> {
    // Primeiro tenta no cache local
    let multa = await this.multaCompletaRepository.findOne({
      where: { numeroAiMulta }
    });

    // Se não encontrar, busca no Oracle
    if (!multa) {
      this.logger.log(`🔍 Multa ${numeroAiMulta} não encontrada no cache. Buscando no Oracle...`);
      
      const query = `
        SELECT 
          D.DESCRICAOINFRA,
          V.PREFIXOVEIC,
          M.*,
          A.COD_AGENTE_AUTUADOR AS "AGENTE_CODIGO",
          A.DESC_AGENTE_AUTUADOR AS "AGENTE_DESCRICAO",
          A.MATRICULAFISCAL AS "AGENTE_MATRICULA_FISCAL"
        FROM DVS_MULTA M,
             DVS_INFRACAO D,
             FRT_CADVEICULOS V,
             GLOBUS.DVS_AGENTE_AUTUADOR A
        WHERE M.CODIGOVEIC = V.CODIGOVEIC (+)
          AND M.CODIGOINFRA = D.CODIGOINFRA
          AND M.COD_AGENTE_AUTUADOR = A.COD_AGENTE_AUTUADOR (+)
          AND V.CODIGOEMPRESA = 4
          AND M.NUMEROAIMULTA = '${numeroAiMulta}'
      `;

      try {
        const resultado = await this.oracleService.executeQuery(query);
        
        if (resultado.length > 0) {
          const multaData = this.mapearDadosOracle(resultado[0]);
          multa = await this.multaCompletaRepository.save({
            ...multaData,
            sincronizadoEm: new Date()
          });
        }
      } catch (error) {
        this.logger.error(`❌ Erro ao buscar multa no Oracle: ${error.message}`);
      }
    }

    return multa;
  }

  /**
   * Estatísticas do cache
   */
  async estatisticasCache(): Promise<any> {
    const stats = await this.multaCompletaRepository
      .createQueryBuilder('m')
      .select([
        'COUNT(*) as totalRegistros',
        'MIN(m.dataEmissaoMulta) as dataMinima',
        'MAX(m.dataEmissaoMulta) as dataMaxima',
        'MIN(m.sincronizadoEm) as primeiraSincronizacao',
        'MAX(m.sincronizadoEm) as ultimaSincronizacao',
        'COUNT(DISTINCT m.codigoVeic) as totalVeiculos',
        'COUNT(DISTINCT m.agenteCodigo) as totalAgentes',
        'COUNT(DISTINCT m.codigoInfra) as totalInfracoes'
      ])
      .getRawOne();

    // Estatísticas por período
    const estatisticasPeriodo = await this.multaCompletaRepository
      .createQueryBuilder('m')
      .select([
        "TO_CHAR(m.dataEmissaoMulta, 'YYYY-MM') as mes",
        'COUNT(*) as quantidade'
      ])
      .groupBy("TO_CHAR(m.dataEmissaoMulta, 'YYYY-MM')")
      .orderBy('mes', 'DESC')
      .limit(12)
      .getRawMany();

    return {
      ...stats,
      estatisticasPorMes: estatisticasPeriodo
    };
  }

  /**
   * Limpa cache antigo
   */
  async limparCacheAntigo(diasAntigos: number = 90): Promise<number> {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - diasAntigos);

    const resultado = await this.multaCompletaRepository
      .createQueryBuilder()
      .delete()
      .where('dataEmissaoMulta < :dataLimite', { dataLimite })
      .execute();

    this.logger.log(`🧹 Removidos ${resultado.affected} registros antigos do cache`);
    return resultado.affected || 0;
  }
}