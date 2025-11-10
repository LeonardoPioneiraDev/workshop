// apps/backend/src/modules/departamentos/pessoal/services/pessoal.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { FuncionarioEntity } from '../entities/funcionario.entity';
import { FuncionarioCompletoEntity } from '../entities/funcionario-completo.entity';
import { OracleReadOnlyService } from '../../../../oracle/services/oracle-readonly.service';

// ✅ INTERFACES EXISTENTES

export interface FuncionarioFilters {
  codigoEmpresa?: number;
  codfunc?: number;
  chapafunc?: string;
  nomefunc?: string;
  cpf?: string;
  situacao?: string;
  mesReferencia?: string;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface DashboardPessoal {
  resumo: {
    totalFuncionarios: number;
    funcionariosAtivos: number;
    funcionariosAfastados: number;
    funcionariosDemitidos: number;
    novasAdmissoes: number;
    demissoes: number;
    percentualAtivos: number;
    percentualAfastados: number;
  };
  distribuicao: {
    porSexo: Array<{ sexo: string; total: number; percentual: number }>;
    porIdade: Array<{ faixaEtaria: string; total: number; percentual: number }>;
    porTempoEmpresa: Array<{ faixa: string; total: number; percentual: number }>;
    porCidade: Array<{ cidade: string; total: number; percentual: number }>;
    porSituacao: Array<{ situacao: string; total: number; percentual: number }>;
  };
  estatisticas: {
    idadeMedia: number;
    tempoMedioEmpresa: number;
    admissoesMesAtual: number;
    demissoesMesAtual: number;
    funcionarioMaisAntigo: string;
    funcionarioMaisNovo: string;
  };
}

export interface DashboardComparativo {
  meses: {
    mesAtual: string;
    mesAnterior1: string;
    mesAnterior2: string;
    mesAnoAnterior: string;
  };
  mesesInfo: {
    mesAtual: { referencia: string; nome: string; tipo: string; fonte: string };
    mesAnterior1: { referencia: string; nome: string; tipo: string; fonte: string };
    mesAnterior2: { referencia: string; nome: string; tipo: string; fonte: string };
    mesAnoAnterior: { referencia: string; nome: string; tipo: string; fonte: string };
  };
  dashboards: {
    mesAtual: DashboardPessoal;
    mesAnterior1: DashboardPessoal;
    mesAnterior2: DashboardPessoal;
    mesAnoAnterior: DashboardPessoal;
  };
  metadados: {
    totalConsultasOracle: number;
    totalConsultasCache: number;
    tempoTotalExecucao: string;
  };
}

export interface DashboardAcumulado {
  periodoInicio: string;
  periodoFim: string;
  nomeCompleto: string;
  fonte: string;
  resumo: {
    totalFuncionarios: number;
    funcionariosAtivos: number;
    funcionariosAfastados: number;
    funcionariosDemitidos: number;
    novasAdmissoes: number;
    demissoes: number;
    percentualAtivos: number;
    percentualAfastados: number;
  };
  distribuicao: {
    porSexo: Array<{ sexo: string; total: number; percentual: number }>;
    porIdade: Array<{ faixaEtaria: string; total: number; percentual: number }>;
    porTempoEmpresa: Array<{ faixa: string; total: number; percentual: number }>;
    porCidade: Array<{ cidade: string; total: number; percentual: number }>;
    porSituacao: Array<{ situacao: string; total: number; percentual: number }>;
  };
  estatisticas: {
    idadeMedia: number;
    tempoMedioEmpresa: number;
    admissoesPeriodo: number;
    demissoesPeriodo: number;
    funcionarioMaisAntigo: string;
    funcionarioMaisNovo: string;
  };
  detalhamentoMensal: Array<{
    mes: string;
    mesFormatado: string;
    totalFuncionarios: number;
    funcionariosAtivos: number;
    funcionariosAfastados: number;
    funcionariosDemitidos: number;
    percentualAfastados: number;
    fonte: string;
  }>;
}

export interface DashboardAcumuladoComparativo {
  meses: {
    mesAnterior2: string;
    mesAnterior1: string;
    mesAtual: string;
    mesAnoAnterior: string;
  };
  mesesInfo: {
    mesAnterior2: { referencia: string; nome: string; tipo: string; fonte: string };
    mesAnterior1: { referencia: string; nome: string; tipo: string; fonte: string };
    mesAtual: { referencia: string; nome: string; tipo: string; fonte: string };
    mesAnoAnterior: { referencia: string; nome: string; tipo: string; fonte: string };
  };
  dashboards: {
    mesAnterior2: DashboardAcumulado;
    mesAnterior1: DashboardAcumulado;
    mesAtual: DashboardAcumulado;
    mesAnoAnterior: DashboardAcumulado;
  };
  metadados: {
    totalConsultasOracle: number;
    totalConsultasCache: number;
    tempoTotalExecucao: string;
  };
}

export interface FuncionarioOracleData {
  CODIGOEMPRESA: number;
  CODFUNC: number;
  CHAPAFUNC?: string;
  DESCFUNCAO?: string;
  NOMEFUNC: string;
  SEXOFUNC?: string;
  DTNASCTOFUNC?: Date;
  CPF?: string;
  DTADMFUNC?: Date;
  DTAFAST?: Date;
  DESCCONDI?: string;
  CODCID?: string;
  DESCCID?: string;
}

export interface FuncionarioProcessado {
  codigoEmpresa: number;
  codfunc: number;
  chapafunc?: string;
  descfuncao?: string;
  nomefunc: string;
  sexofunc?: string;
  dtnasctofunc?: Date;
  cpf?: string;
  dtadmfunc?: Date;
  dtafast?: Date;
  desccondi?: string;
  codcid?: string;
  desccid?: string;
  idade?: number;
  tempoEmpresaDias?: number;
  situacaoCalculada?: string;
  mesReferencia?: string;
}

export interface ResultadoSincronizacao {
  totalProcessados: number;
  novos: number;
  atualizados: number;
  erros: number;
  mesReferencia: string;
  tempoExecucao: string;
  fonte: 'oracle' | 'cache';
  detalhesErros?: Array<{
    codfunc: number;
    nome: string;
    erro: string;
  }>;
}

export interface StatusCache {
  mes: string;
  existeNoCache: boolean;
  totalRegistros: number;
  ultimaAtualizacao: Date | null;
  idadeCache: string;
  precisaAtualizar: boolean;
}

export interface FuncionarioCompletoFilters {
  empresa?: number;
  cracha?: number;
  chapa?: string;
  nome?: string;
  cpf?: string;
  mae?: string;
  funcao?: string;
  departamento?: string;
  area?: string;
  secao?: string;
  setor?: string;
  cidade?: string;
  bairro?: string;
  situacao?: 'A' | 'F' | 'D';
  dataAdmissaoInicio?: string;
  dataAdmissaoFim?: string;
  salarioMinimo?: number;
  salarioMaximo?: number;
  valeRefeicao?: 'S' | 'N';
  temQuitacao?: boolean;
  dataDesligamentoInicio?: string;
  dataDesligamentoFim?: string;
  ativo?: boolean;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  mesReferencia?: string;
}

export interface FuncionarioCompletoOracleData {
  VALEREFEICFUNC: string;
  DTTRANSFFUNC: Date;
  EMPRESA: number;
  CODINTFUNC: number;
  CRACHA: number;
  CHAPA: string;
  NOME: string;
  MAE: string;
  CPF: string;
  FUNCAO: string;
  DEPARTAMENTO: string;
  AREA: string;
  DESCSECAO: string;
  DESCSETOR: string;
  ENDERECO: string;
  CASA: string;
  BAIRRO: string;
  CIDADE: string;
  FONEFUNC: string;
  FONE2FUNC: string;
  ADMISSAO: Date;
  SITUACAO: string;
  SALBASE: number;
  SALAUX1: number;
  SALAUX2: number;
  DTCOMPETQUITA: Date;
  IDQUITA: number;
  DTDESLIGQUITA: Date;
}

export interface DashboardFuncionariosCompletos {
  resumo: {
    totalFuncionarios: number;
    ativos: number;
    funcionarios: number;
    demitidos: number;
    comQuitacao: number;
    semQuitacao: number;
    salarioMedio: number;
    tempoMedioEmpresa: number;
  };
  distribuicao: {
    porSituacao: Array<{ situacao: string; total: number; percentual: number }>;
    porDepartamento: Array<{ departamento: string; total: number; percentual: number }>;
    porArea: Array<{ area: string; total: number; percentual: number }>;
    porCidade: Array<{ cidade: string; total: number; percentual: number }>;
    porFaixaSalarial: Array<{ faixa: string; total: number; percentual: number }>;
    porTempoEmpresa: Array<{ faixa: string; total: number; percentual: number }>;
  };
  estatisticas: {
    maiorSalario: number;
    menorSalario: number;
    funcionarioMaisAntigo: string;
    funcionarioMaisNovo: string;
    departamentoMaior: string;
    cidadeMaior: string;
  };
}

@Injectable()
export class PessoalService {
  private readonly logger = new Logger(PessoalService.name);
  private readonly CACHE_EXPIRY_HOURS = 24;

  constructor(
    @InjectRepository(FuncionarioEntity)
    private readonly funcionarioRepository: Repository<FuncionarioEntity>,
    
    @InjectRepository(FuncionarioCompletoEntity)
    private readonly funcionarioCompletoRepository: Repository<FuncionarioCompletoEntity>,
    
    private readonly oracleService: OracleReadOnlyService
  ) {}

  // ✅ MÉTODO PRINCIPAL: VERIFICAR CACHE E DECIDIR FONTE DE DADOS
  async verificarStatusCache(mesReferencia: string): Promise<StatusCache> {
    try {
      const count = await this.funcionarioRepository.count({
        where: { mesReferencia }
      });

      let ultimaAtualizacao: Date | null = null;
      let precisaAtualizar = false;

      if (count > 0) {
        const funcionarioMaisRecente = await this.funcionarioRepository.findOne({
          where: { mesReferencia },
          order: { sincronizadoEm: 'DESC' }
        });

        if (funcionarioMaisRecente?.sincronizadoEm) {
          ultimaAtualizacao = funcionarioMaisRecente.sincronizadoEm;
          
          const agora = new Date();
          const diferencaHoras = (agora.getTime() - ultimaAtualizacao.getTime()) / (1000 * 60 * 60);
          precisaAtualizar = diferencaHoras > this.CACHE_EXPIRY_HOURS;
        }
      }

      const idadeCache = ultimaAtualizacao ? this.calcularIdadeCache(ultimaAtualizacao) : 'Nunca sincronizado';

      return {
        mes: mesReferencia,
        existeNoCache: count > 0,
        totalRegistros: count,
        ultimaAtualizacao,
        idadeCache,
        precisaAtualizar: count === 0 || precisaAtualizar
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao verificar status do cache para ${mesReferencia}: ${error.message}`);
      return {
        mes: mesReferencia,
        existeNoCache: false,
        totalRegistros: 0,
        ultimaAtualizacao: null,
        idadeCache: 'Erro ao verificar',
        precisaAtualizar: true
      };
    }
  }

  // ✅ MÉTODO OTIMIZADO: OBTER DADOS COM CACHE INTELIGENTE
  async obterDadosComCache(mesReferencia: string, forcarSincronizacao = false): Promise<{
    funcionarios: FuncionarioEntity[];
    fonte: 'cache' | 'oracle';
    statusCache: StatusCache;
  }> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`🔍 Verificando dados para ${mesReferencia}...`);
      
      const statusCache = await this.verificarStatusCache(mesReferencia);
      
      let usarCache = false;
      let fonte: 'cache' | 'oracle' = 'oracle';

      if (!forcarSincronizacao && statusCache.existeNoCache && !statusCache.precisaAtualizar) {
        usarCache = true;
        fonte = 'cache';
        this.logger.log(`💾 Usando dados do cache para ${mesReferencia} (${statusCache.totalRegistros} registros, atualizado ${statusCache.idadeCache})`);
      } else {
        if (forcarSincronizacao) {
          this.logger.log(`🔄 Forçando sincronização para ${mesReferencia}...`);
        } else if (!statusCache.existeNoCache) {
          this.logger.log(`📊 Dados não encontrados no cache para ${mesReferencia}, buscando no Oracle...`);
        } else if (statusCache.precisaAtualizar) {
          this.logger.log(`⏰ Cache expirado para ${mesReferencia} (${statusCache.idadeCache}), atualizando...`);
        }
      }

      let funcionarios: FuncionarioEntity[];

      if (usarCache) {
        funcionarios = await this.funcionarioRepository.find({
          where: { mesReferencia }
        });
      } else {
        await this.sincronizarFuncionarios(mesReferencia);
        funcionarios = await this.funcionarioRepository.find({
          where: { mesReferencia }
        });
      }

      const tempoExecucao = Date.now() - startTime;
      this.logger.log(`✅ Dados obtidos para ${mesReferencia}: ${funcionarios.length} funcionários (fonte: ${fonte}, tempo: ${tempoExecucao}ms)`);

      return {
        funcionarios,
        fonte,
        statusCache
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao obter dados para ${mesReferencia}: ${error.message}`);
      throw error;
    }
  }

  // ✅ MÉTODO OTIMIZADO: DASHBOARD COMPARATIVO COM CACHE INTELIGENTE
  async gerarDashboardComparativo(dataReferencia: Date = new Date(), forcarSincronizacao = false): Promise<DashboardComparativo> {
    const startTime = Date.now();
    
    try {
      const meses = this.calcularMesesComparacao(dataReferencia);
      
      this.logger.log(`📊 Gerando dashboard comparativo otimizado para os meses: ${Object.values(meses).join(', ')}`);

      const [dadosM0, dadosM1, dadosM2, dadosM12] = await Promise.all([
        this.obterDadosComCache(meses.mesAtual, forcarSincronizacao),
        this.obterDadosComCache(meses.mesAnterior1, false),
        this.obterDadosComCache(meses.mesAnterior2, false),
        this.obterDadosComCache(meses.mesAnoAnterior, false)
      ]);

      const [dashboardM0, dashboardM1, dashboardM2, dashboardM12] = [
        this.calcularDashboard(dadosM0.funcionarios, meses.mesAtual),
        this.calcularDashboard(dadosM1.funcionarios, meses.mesAnterior1),
        this.calcularDashboard(dadosM2.funcionarios, meses.mesAnterior2),
        this.calcularDashboard(dadosM12.funcionarios, meses.mesAnoAnterior)
      ];

      const mesesInfo = {
        mesAtual: { 
          referencia: meses.mesAtual,
          nome: this.formatarNomeMes(meses.mesAtual),
          tipo: 'atual',
          fonte: dadosM0.fonte
        },
        mesAnterior1: { 
          referencia: meses.mesAnterior1,
          nome: this.formatarNomeMes(meses.mesAnterior1),
          tipo: 'anterior',
          fonte: dadosM1.fonte
        },
        mesAnterior2: { 
          referencia: meses.mesAnterior2,
          nome: this.formatarNomeMes(meses.mesAnterior2),
          tipo: 'anterior',
          fonte: dadosM2.fonte
        },
        mesAnoAnterior: { 
          referencia: meses.mesAnoAnterior,
          nome: this.formatarNomeMes(meses.mesAnoAnterior),
          tipo: 'anoAnterior',
          fonte: dadosM12.fonte
        }
      };

      const totalConsultasOracle = [dadosM0, dadosM1, dadosM2, dadosM12].filter(d => d.fonte === 'oracle').length;
      const totalConsultasCache = [dadosM0, dadosM1, dadosM2, dadosM12].filter(d => d.fonte === 'cache').length;
      const tempoTotalExecucao = `${Date.now() - startTime}ms`;

      const resultado: DashboardComparativo = {
        meses,
        mesesInfo,
        dashboards: {
          mesAtual: dashboardM0,
          mesAnterior1: dashboardM1,
          mesAnterior2: dashboardM2,
          mesAnoAnterior: dashboardM12
        },
        metadados: {
          totalConsultasOracle,
          totalConsultasCache,
          tempoTotalExecucao
        }
      };

      this.logger.log(`✅ Dashboard comparativo gerado com sucesso (Oracle: ${totalConsultasOracle}, Cache: ${totalConsultasCache}, Tempo: ${tempoTotalExecucao})`);
      return resultado;

    } catch (error) {
      this.logger.error(`❌ Erro ao gerar dashboard comparativo: ${error.message}`);
      throw error;
    }
  }

  // ✅ MÉTODO OTIMIZADO: DASHBOARD ACUMULADO COM CACHE INTELIGENTE
  async gerarDashboardAcumulado(mesReferencia?: string, forcarSincronizacao = false): Promise<DashboardAcumulado> {
    const startTime = Date.now();
    
    try {
      const mes = mesReferencia || new Date().toISOString().slice(0, 7);
      const chaveAcumulada = `${mes}-ACUM`;
      
      this.logger.log(`📊 Gerando dashboard acumulado para Janeiro até ${mes}...`);

      const statusCache = await this.verificarStatusCache(chaveAcumulada);
      let fonte: 'cache' | 'oracle' = 'cache';

      if (forcarSincronizacao || statusCache.precisaAtualizar) {
        this.logger.log(`�� Sincronizando dados acumulados para ${mes}...`);
        await this.sincronizarFuncionariosAcumulado(mes);
        fonte = 'oracle';
      } else if (statusCache.existeNoCache) {
        this.logger.log(`💾 Usando dados acumulados do cache para ${mes} (${statusCache.totalRegistros} registros)`);
      } else {
        this.logger.log(`�� Dados acumulados não encontrados, sincronizando...`);
        await this.sincronizarFuncionariosAcumulado(mes);
        fonte = 'oracle';
      }

      const funcionarios = await this.funcionarioRepository.find({
        where: { mesReferencia: chaveAcumulada }
      });

      const dashboard = this.calcularDashboardAcumulado(funcionarios, mes, fonte);
      
      const tempoExecucao = Date.now() - startTime;
      this.logger.log(`✅ Dashboard acumulado gerado (fonte: ${fonte}, tempo: ${tempoExecucao}ms)`);

      return dashboard;

    } catch (error) {
      this.logger.error(`❌ Erro ao gerar dashboard acumulado: ${error.message}`);
      throw error;
    }
  }

  // ✅ MÉTODO OTIMIZADO: DASHBOARD ACUMULADO COMPARATIVO
  async gerarDashboardAcumuladoComparativo(dataReferencia: Date = new Date(), forcarSincronizacao = false): Promise<DashboardAcumuladoComparativo> {
    const startTime = Date.now();
    
    try {
      const meses = this.calcularMesesComparacao(dataReferencia);
      
      this.logger.log(`📊 Gerando dashboard acumulado comparativo otimizado...`);

      const [dashboardM2, dashboardM1, dashboardM0, dashboardM12] = await Promise.all([
        this.gerarDashboardAcumulado(meses.mesAnterior2, false),
        this.gerarDashboardAcumulado(meses.mesAnterior1, false),
        this.gerarDashboardAcumulado(meses.mesAtual, forcarSincronizacao),
        this.gerarDashboardAcumulado(meses.mesAnoAnterior, false)
      ]);

      const mesesInfo = {
        mesAnterior2: { 
          referencia: meses.mesAnterior2,
          nome: `Janeiro a ${this.formatarNomeMes(meses.mesAnterior2).split(' de ')[0]}`,
          tipo: 'anterior',
          fonte: dashboardM2.fonte
        },
        mesAnterior1: { 
          referencia: meses.mesAnterior1,
          nome: `Janeiro a ${this.formatarNomeMes(meses.mesAnterior1).split(' de ')[0]}`,
          tipo: 'anterior',
          fonte: dashboardM1.fonte
        },
        mesAtual: { 
          referencia: meses.mesAtual,
          nome: `Janeiro a ${this.formatarNomeMes(meses.mesAtual).split(' de ')[0]}`,
          tipo: 'atual',
          fonte: dashboardM0.fonte
        },
        mesAnoAnterior: { 
          referencia: meses.mesAnoAnterior,
          nome: `Janeiro a ${this.formatarNomeMes(meses.mesAnoAnterior)}`,
          tipo: 'anoAnterior',
          fonte: dashboardM12.fonte
        }
      };

      const dashboards = [dashboardM0, dashboardM1, dashboardM2, dashboardM12];
      const totalConsultasOracle = dashboards.filter(d => d.fonte === 'oracle').length;
      const totalConsultasCache = dashboards.filter(d => d.fonte === 'cache').length;
      const tempoTotalExecucao = `${Date.now() - startTime}ms`;

      const resultado: DashboardAcumuladoComparativo = {
        meses,
        mesesInfo,
        dashboards: {
          mesAnterior2: dashboardM2,
          mesAnterior1: dashboardM1,
          mesAtual: dashboardM0,
          mesAnoAnterior: dashboardM12
        },
        metadados: {
          totalConsultasOracle,
          totalConsultasCache,
          tempoTotalExecucao
        }
      };

      this.logger.log(`✅ Dashboard acumulado comparativo gerado (Oracle: ${totalConsultasOracle}, Cache: ${totalConsultasCache}, Tempo: ${tempoTotalExecucao})`);
      return resultado;

    } catch (error) {
      this.logger.error(`❌ Erro ao gerar dashboard acumulado comparativo: ${error.message}`);
      throw error;
    }
  }

  // ✅ MÉTODO OTIMIZADO: DASHBOARD SIMPLES
  async gerarDashboard(mesReferencia?: string, forcarSincronizacao = false): Promise<DashboardPessoal> {
    try {
      const mes = mesReferencia || new Date().toISOString().slice(0, 7);
      
      const dados = await this.obterDadosComCache(mes, forcarSincronizacao);
      
      return this.calcularDashboard(dados.funcionarios, mes);

    } catch (error) {
      this.logger.error(`❌ Erro ao gerar dashboard: ${error.message}`);
      throw error;
    }
  }

  // ✅ MÉTODO PARA OBTER STATUS DE MÚLTIPLOS MESES
  async obterStatusMultiplosMeses(): Promise<StatusCache[]> {
    try {
      const dataRef = new Date();
      const meses = this.calcularMesesComparacao(dataRef);
      const mesesArray = Object.values(meses);

      const statusPromises = mesesArray.map(mes => this.verificarStatusCache(mes));
      const status = await Promise.all(statusPromises);

      return status;
    } catch (error) {
      this.logger.error(`❌ Erro ao obter status de múltiplos meses: ${error.message}`);
      throw error;
    }
  }

  // ✅ MÉTODO EXISTENTE: SINCRONIZAR FUNCIONÁRIOS (MANTIDO)
  async sincronizarFuncionarios(mesReferencia: string): Promise<ResultadoSincronizacao> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`🔄 Iniciando sincronização de funcionários para ${mesReferencia}...`);

      if (!this.oracleService.isEnabled()) {
        throw new Error('Oracle não está habilitado');
      }

      const [ano, mes] = mesReferencia.split('-');
      const dataInicio = new Date(parseInt(ano), parseInt(mes) - 1, 1);
      const dataFim = new Date(parseInt(ano), parseInt(mes), 0);
      
      const formatarDataOracle = (data: Date): string => {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
      };

      const dataInicioOracle = formatarDataOracle(dataInicio);
      const dataFimOracle = formatarDataOracle(dataFim);

      this.logger.debug(`📅 Período Oracle: ${dataInicioOracle} a ${dataFimOracle}`);

      const query = `
        SELECT G.CODIGOEMPRESA,
               G.CODFUNC,
               G.CHAPAFUNC,
               G.DESCFUNCAO,
               G.NOMEFUNC,
               G.SEXOFUNC,
               G.DTNASCTOFUNC,
               G.CPF,
               G.DTADMFUNC,
               G.DTAFAST,
               G.DESCCONDI,
               G.CODCID,
               G.DESCCID 
        FROM (
          SELECT A.CODIGOEMPRESA,
                 A.CODFUNC,
                 A.CHAPAFUNC,
                 A.DESCFUNCAO,
                 A.NOMEFUNC,
                 A.SEXOFUNC,
                 A.DTNASCTOFUNC,
                 A.CPF,
                 A.DTADMFUNC,
                 A.DTAFAST,
                 B.DESCCONDI,
                 A.CODCID,
                 C.DESCCID 
          FROM (
            SELECT F.CODIGOEMPRESA,
                   F.CODFUNC,
                   F.CHAPAFUNC,
                   F.DESCFUNCAO,
                   F.NOMEFUNC,
                   F.SEXOFUNC,
                   F.DTNASCTOFUNC,
                   (SELECT D.NRDOCTO FROM FLP_DOCUMENTOS D 
                    WHERE D.CODINTFUNC = F.CODINTFUNC AND D.TIPODOCTO = 'CPF') AS CPF,
                   MAX(F.DTADMFUNC) AS DTADMFUNC,
                   MAX(A.DTAFAST) AS DTAFAST,
                   MAX(A.CODCID) AS CODCID
            FROM VW_FUNCIONARIOS F,
                 FLP_AFASTADOS A
            WHERE F.CODINTFUNC = A.CODINTFUNC AND
                  F.SITUACAOFUNC = 'F' AND
                  F.CODIGOEMPRESA = 4 AND
                  (
                    (F.DTADMFUNC >= TO_DATE('${dataInicioOracle}', 'DD/MM/YYYY') AND 
                     F.DTADMFUNC <= TO_DATE('${dataFimOracle}', 'DD/MM/YYYY'))
                    OR
                    (A.DTAFAST >= TO_DATE('${dataInicioOracle}', 'DD/MM/YYYY') AND 
                     A.DTAFAST <= TO_DATE('${dataFimOracle}', 'DD/MM/YYYY'))
                    OR
                    (F.DTADMFUNC <= TO_DATE('${dataFimOracle}', 'DD/MM/YYYY') AND 
                     (A.DTAFAST IS NULL OR A.DTAFAST > TO_DATE('${dataFimOracle}', 'DD/MM/YYYY')))
                  )
            GROUP BY F.CODINTFUNC,
                     F.CODIGOEMPRESA,
                     F.CODFUNC,
                     F.CHAPAFUNC,
                     F.DESCFUNCAO,
                     F.NOMEFUNC,
                     F.DTNASCTOFUNC,
                     F.SEXOFUNC
          ) A,
          FRQ_CID C,
          (SELECT F.CODFUNC,
                  A.DTAFAST,
                  O.DESCCONDI 
           FROM VW_FUNCIONARIOS F,
                FLP_AFASTADOS A,
                FLP_CONDICAO O
           WHERE F.CODINTFUNC = A.CODINTFUNC AND
                 A.CODCONDI = O.CODCONDI AND
                 F.SITUACAOFUNC = 'F'
          ) B
          WHERE A.CODFUNC = B.CODFUNC(+) AND 
                A.DTAFAST = B.DTAFAST(+) AND
                A.CODCID = C.CODCID(+)
        ) G
        ORDER BY G.CODIGOEMPRESA, G.NOMEFUNC
      `;

      const funcionariosOracle: FuncionarioOracleData[] = await this.oracleService.executeReadOnlyQuery(query);

      let totalProcessados = 0;
      let novos = 0;
      let atualizados = 0;
      let erros = 0;
      const detalhesErros: Array<{ codfunc: number; nome: string; erro: string }> = [];

      for (const funcionarioData of funcionariosOracle) {
        try {
          this.logger.debug(`🔄 Processando funcionário ${funcionarioData.CODFUNC} - ${funcionarioData.NOMEFUNC}`);
          
          const funcionarioExistente = await this.funcionarioRepository.findOne({
            where: {
              codigoEmpresa: funcionarioData.CODIGOEMPRESA,
              codfunc: funcionarioData.CODFUNC,
              mesReferencia: mesReferencia
            }
          });

          const dadosProcessados = this.processarDadosFuncionario(funcionarioData, mesReferencia, dataFim);

          if (funcionarioExistente) {
            await this.funcionarioRepository.update(funcionarioExistente.id, {
              ...dadosProcessados,
              sincronizadoEm: new Date()
            });
            atualizados++;
          } else {
            await this.funcionarioRepository.save({
              ...dadosProcessados,
              mesReferencia: mesReferencia,
              sincronizadoEm: new Date()
            });
            novos++;
          }

          totalProcessados++;
        } catch (error) {
          this.logger.error(`❌ Erro ao processar funcionário ${funcionarioData.CODFUNC}: ${error.message}`);
          detalhesErros.push({
            codfunc: funcionarioData.CODFUNC,
            nome: funcionarioData.NOMEFUNC || 'Nome não informado',
            erro: error.message
          });
          erros++;
        }
      }

      const tempoExecucao = `${Date.now() - startTime}ms`;

      this.logger.log(`✅ Sincronização concluída: ${totalProcessados} processados, ${novos} novos, ${atualizados} atualizados, ${erros} erros em ${tempoExecucao}`);

      return {
        totalProcessados,
        novos,
        atualizados,
        erros,
        mesReferencia: mesReferencia,
        tempoExecucao,
        fonte: 'oracle',
        detalhesErros: detalhesErros.length > 0 ? detalhesErros : undefined
      };

    } catch (error) {
      this.logger.error(`❌ Erro na sincronização: ${error.message}`);
      throw error;
    }
  }

  // ✅ SUBSTITUA O MÉTODO COMPLETO POR ESTA VERSÃO SIMPLIFICADA:

  async sincronizarFuncionariosAcumulado(mesReferencia: string): Promise<ResultadoSincronizacao> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`🔄 Iniciando sincronização acumulada para ${mesReferencia}...`);
  
      if (!this.oracleService.isEnabled()) {
        throw new Error('Oracle não está habilitado');
      }
  
      // ✅ QUERY COMPLETA - BUSCAR TODOS: ATIVOS + AFASTADOS + DEMITIDOS
      const query = `
        SELECT 
          'S' as VALEREFEICFUNC,
          NULL as DTTRANSFFUNC,
          F.CODIGOEMPRESA as EMPRESA,
          F.CODINTFUNC,
          F.CODFUNC as CRACHA,
          F.CHAPAFUNC as CHAPA,
          F.NOMEFUNC as NOME,
          NULL as MAE,
          (SELECT D.NRDOCTO FROM FLP_DOCUMENTOS D 
           WHERE D.CODINTFUNC = F.CODINTFUNC AND D.TIPODOCTO = 'CPF') as CPF,
          F.DESCFUNCAO as FUNCAO,
          'OPERACAO' as DEPARTAMENTO,
          'TRANSPORTE' as AREA,
          NULL as DESCSECAO,
          NULL as DESCSETOR,
          NULL as ENDERECO,
          NULL as CASA,
          NULL as BAIRRO,
          COALESCE(C.DESCCID, 'SEM AFASTAMENTO') as CIDADE,
          NULL as FONEFUNC,
          NULL as FONE2FUNC,
          F.DTADMFUNC as ADMISSAO,
          F.SITUACAOFUNC as SITUACAO,
          0 as SALBASE,
          0 as SALAUX1,
          0 as SALAUX2,
          NULL as DTCOMPETQUITA,
          NULL as IDQUITA,
          A.DTAFAST as DTDESLIGQUITA
        FROM VW_FUNCIONARIOS F
        LEFT JOIN FLP_AFASTADOS A ON F.CODINTFUNC = A.CODINTFUNC
        LEFT JOIN FRQ_CID C ON A.CODCID = C.CODCID
        WHERE F.CODIGOEMPRESA = 4
          AND F.SITUACAOFUNC IN ('A', 'F', 'D')
        ORDER BY F.NOMEFUNC
      `;
  
      const funcionariosOracle: FuncionarioCompletoOracleData[] = await this.oracleService.executeReadOnlyQuery(query);
  
      let totalProcessados = 0;
      let novos = 0;
      let atualizados = 0;
      let erros = 0;
      const detalhesErros: Array<{ codfunc: number; nome: string; erro: string }> = [];
  
      const chaveAcumulada = `${mesReferencia}-ACUM`;
  
      for (const funcionarioData of funcionariosOracle) {
        try {
          const funcionarioExistente = await this.funcionarioCompletoRepository.findOne({
            where: {
              empresa: funcionarioData.EMPRESA,
              cracha: funcionarioData.CRACHA,
              mesReferencia: chaveAcumulada
            }
          });
  
          const dadosProcessados = this.processarDadosFuncionarioCompleto(funcionarioData, chaveAcumulada);
  
          if (funcionarioExistente) {
            await this.funcionarioCompletoRepository.update(funcionarioExistente.id, {
              ...dadosProcessados,
              sincronizadoEm: new Date()
            });
            atualizados++;
          } else {
            await this.funcionarioCompletoRepository.save({
              ...dadosProcessados,
              mesReferencia: chaveAcumulada,
              sincronizadoEm: new Date()
            });
            novos++;
          }
  
          totalProcessados++;
        } catch (error) {
          this.logger.error(`❌ Erro ao processar funcionário acumulado ${funcionarioData.CRACHA}: ${error.message}`);
          detalhesErros.push({
            codfunc: funcionarioData.CRACHA,
            nome: funcionarioData.NOME || 'Nome não informado',
            erro: error.message
          });
          erros++;
        }
      }
  
      const tempoExecucao = `${Date.now() - startTime}ms`;
  
      this.logger.log(`✅ Sincronização acumulada concluída: ${totalProcessados} processados, ${novos} novos, ${atualizados} atualizados, ${erros} erros em ${tempoExecucao}`);
  
      return {
        totalProcessados,
        novos,
        atualizados,
        erros,
        mesReferencia: chaveAcumulada,
        tempoExecucao,
        fonte: 'oracle',
        detalhesErros: detalhesErros.length > 0 ? detalhesErros : undefined
      };
  
    } catch (error) {
      this.logger.error(`❌ Erro na sincronização acumulada: ${error.message}`);
      throw error;
    }
  }

 

  // ✅ MANTER COMPATIBILIDADE: Sincronizar mês atual
  async sincronizarFuncionariosMesAtual(): Promise<ResultadoSincronizacao> {
    const mesAtual = new Date().toISOString().slice(0, 7);
    return this.sincronizarFuncionarios(mesAtual);
  }

  // ✅ BUSCAR FUNCIONÁRIOS COM CACHE LOCAL (OTIMIZADO)
  async buscarFuncionarios(filters: FuncionarioFilters = {}): Promise<{
    data: FuncionarioEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const mesAtual = filters.mesReferencia || new Date().toISOString().slice(0, 7);
      
      await this.obterDadosComCache(mesAtual);

      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const skip = (page - 1) * limit;

      const queryBuilder = this.funcionarioRepository.createQueryBuilder('f')
        .where('f.mesReferencia = :mesReferencia', { mesReferencia: mesAtual });

      if (filters.codigoEmpresa) {
        queryBuilder.andWhere('f.codigoEmpresa = :codigoEmpresa', { codigoEmpresa: filters.codigoEmpresa });
      }

      if (filters.codfunc) {
        queryBuilder.andWhere('f.codfunc = :codfunc', { codfunc: filters.codfunc });
      }

      if (filters.chapafunc) {
        queryBuilder.andWhere('f.chapafunc ILIKE :chapafunc', { chapafunc: `%${filters.chapafunc}%` });
      }

      if (filters.nomefunc) {
        queryBuilder.andWhere('f.nomefunc ILIKE :nomefunc', { nomefunc: `%${filters.nomefunc}%` });
      }

      if (filters.cpf) {
        queryBuilder.andWhere('f.cpf = :cpf', { cpf: filters.cpf.replace(/\D/g, '') });
      }

      if (filters.situacao) {
        queryBuilder.andWhere('f.situacaoCalculada = :situacao', { situacao: filters.situacao });
      }

      const orderBy = filters.orderBy || 'nomefunc';
      const orderDirection = filters.orderDirection || 'ASC';
      queryBuilder.orderBy(`f.${orderBy}`, orderDirection);

      const [data, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar funcionários: ${error.message}`);
      throw error;
    }
  }

   // apps/backend/src/modules/departamentos/pessoal/services/pessoal.service.ts
// ✅ SUBSTITUIR O MÉTODO sincronizarFuncionariosCompletos POR ESTA VERSÃO:

/**
 * Sincronizar funcionários completos do Oracle - VERSÃO CORRIGIDA
 */
async sincronizarFuncionariosCompletos(mesReferencia?: string): Promise<ResultadoSincronizacao> {
  const startTime = Date.now();
  const mes = mesReferencia || new Date().toISOString().slice(0, 7);
  
  try {
    this.logger.log(`🔄 Iniciando sincronização de funcionários completos para ${mes}...`);

    if (!this.oracleService.isEnabled()) {
      throw new Error('Oracle não está habilitado');
    }

    // ✅ QUERY ORACLE COMPLETA E CORRIGIDA
    const query = `
      SELECT 
        'S' as VALEREFEICFUNC,
        NULL as DTTRANSFFUNC,
        F.CODIGOEMPRESA as EMPRESA,
        F.CODINTFUNC,
        F.CODFUNC as CRACHA,
        F.CHAPAFUNC as CHAPA,
        F.NOMEFUNC as NOME,
        NULL as MAE,
        (SELECT D.NRDOCTO FROM FLP_DOCUMENTOS D 
         WHERE D.CODINTFUNC = F.CODINTFUNC AND D.TIPODOCTO = 'CPF') as CPF,
        F.DESCFUNCAO as FUNCAO,
        CASE 
          WHEN F.CODIGOEMPRESA = 4 THEN 'OPERACAO'
          ELSE 'ADMINISTRATIVO'
        END as DEPARTAMENTO,
        CASE 
          WHEN F.CODIGOEMPRESA = 4 THEN 'TRANSPORTE'
          ELSE 'GESTAO'
        END as AREA,
        NULL as DESCSECAO,
        NULL as DESCSETOR,
        NULL as ENDERECO,
        NULL as CASA,
        NULL as BAIRRO,
        COALESCE(C.DESCCID, 'BRASILIA') as CIDADE,
        NULL as FONEFUNC,
        NULL as FONE2FUNC,
        F.DTADMFUNC as ADMISSAO,
        F.SITUACAOFUNC as SITUACAO,
        0 as SALBASE,
        0 as SALAUX1,
        0 as SALAUX2,
        NULL as DTCOMPETQUITA,
        NULL as IDQUITA,
        A.DTAFAST as DTDESLIGQUITA,
        -- ✅ CALCULAR IDADE
        CASE 
          WHEN F.DTNASCTOFUNC IS NOT NULL THEN 
            TRUNC(MONTHS_BETWEEN(SYSDATE, F.DTNASCTOFUNC) / 12)
          ELSE NULL
        END as IDADE,
        -- ✅ CALCULAR TEMPO EMPRESA EM DIAS
        CASE 
          WHEN F.DTADMFUNC IS NOT NULL THEN 
            TRUNC(SYSDATE - F.DTADMFUNC)
          ELSE NULL
        END as TEMPO_EMPRESA_DIAS,
        -- ✅ CALCULAR TEMPO EMPRESA EM ANOS
        CASE 
          WHEN F.DTADMFUNC IS NOT NULL THEN 
            TRUNC(MONTHS_BETWEEN(SYSDATE, F.DTADMFUNC) / 12, 2)
          ELSE NULL
        END as TEMPO_EMPRESA_ANOS
      FROM VW_FUNCIONARIOS F
      LEFT JOIN FLP_AFASTADOS A ON F.CODINTFUNC = A.CODINTFUNC
      LEFT JOIN FRQ_CID C ON A.CODCID = C.CODCID
      WHERE F.CODIGOEMPRESA = 4
        AND F.SITUACAOFUNC IN ('A', 'F', 'D')
      ORDER BY F.NOMEFUNC
    `;

    this.logger.log(`🔍 Executando consulta Oracle para funcionários completos...`);
    const funcionariosOracle: any[] = await this.oracleService.executeReadOnlyQuery(query);
    this.logger.log(`✅ Oracle retornou ${funcionariosOracle.length} funcionários`);

    let totalProcessados = 0;
    let novos = 0;
    let atualizados = 0;
    let erros = 0;
    const detalhesErros: Array<{ codfunc: number; nome: string; erro: string }> = [];

    // ✅ PROCESSAR EM LOTES PARA MELHOR PERFORMANCE
    const batchSize = 50;
    for (let i = 0; i < funcionariosOracle.length; i += batchSize) {
      const batch = funcionariosOracle.slice(i, i + batchSize);
      
      for (const funcionarioData of batch) {
        try {
          const funcionarioExistente = await this.funcionarioCompletoRepository.findOne({
            where: {
              empresa: funcionarioData.EMPRESA,
              cracha: funcionarioData.CRACHA,
              mesReferencia: mes
            }
          });

          const dadosProcessados = this.processarDadosFuncionarioCompletoCorrigido(funcionarioData, mes);

          if (funcionarioExistente) {
            await this.funcionarioCompletoRepository.update(funcionarioExistente.id, {
              ...dadosProcessados,
              sincronizadoEm: new Date()
            });
            atualizados++;
          } else {
            const novoFuncionario = this.funcionarioCompletoRepository.create({
              ...dadosProcessados,
              mesReferencia: mes,
              sincronizadoEm: new Date()
            });
            await this.funcionarioCompletoRepository.save(novoFuncionario);
            novos++;
          }

          totalProcessados++;

          // ✅ LOG A CADA 100 REGISTROS
          if (totalProcessados % 100 === 0) {
            this.logger.log(`📊 Processados: ${totalProcessados}/${funcionariosOracle.length}`);
          }

        } catch (error) {
          this.logger.error(`❌ Erro ao processar funcionário ${funcionarioData.CRACHA}: ${error.message}`);
          detalhesErros.push({
            codfunc: funcionarioData.CRACHA,
            nome: funcionarioData.NOME || 'Nome não informado',
            erro: error.message
          });
          erros++;
        }
      }
    }

    const tempoExecucao = `${Date.now() - startTime}ms`;

    this.logger.log(`✅ Sincronização de funcionários completos concluída: ${totalProcessados} processados, ${novos} novos, ${atualizados} atualizados, ${erros} erros em ${tempoExecucao}`);

    return {
      totalProcessados,
      novos,
      atualizados,
      erros,
      mesReferencia: mes,
      tempoExecucao,
      fonte: 'oracle',
      detalhesErros: detalhesErros.length > 0 ? detalhesErros.slice(0, 10) : undefined
    };

  } catch (error) {
    this.logger.error(`❌ Erro na sincronização de funcionários completos: ${error.message}`);
    throw error;
  }
}

/**
 * Processar dados do funcionário completo - VERSÃO CORRIGIDA COM TRUNCAMENTO
 */
private processarDadosFuncionarioCompletoCorrigido(data: any, mesReferencia: string): Partial<FuncionarioCompletoEntity> {
  // ✅ FUNÇÃO AUXILIAR PARA TRUNCAR STRINGS
  const truncateString = (value: any, maxLength: number): string | null => {
    if (!value) return null;
    const str = String(value);
    if (str.length <= maxLength) return str;
    
    this.logger.warn(`⚠️ Campo truncado de ${str.length} para ${maxLength} caracteres`);
    return str.substring(0, maxLength - 3) + '...';
  };

  // ✅ CALCULAR SALÁRIO TOTAL
  const salarioTotal = (data.SALBASE || 0) + (data.SALAUX1 || 0) + (data.SALAUX2 || 0);
  
  // ✅ VERIFICAR QUITAÇÃO
  const temQuitacao = !!(data.DTCOMPETQUITA && data.IDQUITA);
  
  // ✅ MAPEAR SITUAÇÃO
  const situacaoMap = {
    'A': 'ATIVO',
    'F': 'AFASTADO',  
    'D': 'DEMITIDO'
  };

  // ✅ DETERMINAR SE ESTÁ ATIVO
  const estaAtivo = data.SITUACAO === 'A' && !data.DTDESLIGQUITA;

  return {
    valeRefeicao: data.VALEREFEICFUNC || 'N',
    dataTransferencia: data.DTTRANSFFUNC,
    empresa: data.EMPRESA,
    codintFunc: data.CODINTFUNC,
    cracha: data.CRACHA,
    chapa: truncateString(data.CHAPA, 50),
    nome: truncateString(data.NOME, 300) || 'NOME NÃO INFORMADO',
    mae: truncateString(data.MAE, 300),
    cpf: data.CPF ? String(data.CPF).replace(/\D/g, '').substring(0, 14) : null,
    funcao: truncateString(data.FUNCAO, 500),
    departamento: truncateString(data.DEPARTAMENTO, 300),
    area: truncateString(data.AREA, 300),
    secao: truncateString(data.DESCSECAO, 300),
    setor: truncateString(data.DESCSETOR, 300),
    endereco: truncateString(data.ENDERECO, 800),
    casa: truncateString(data.CASA, 20),
    bairro: truncateString(data.BAIRRO, 300),
    cidade: truncateString(data.CIDADE, 300),
    foneFunc: truncateString(data.FONEFUNC, 20),
    fone2Func: truncateString(data.FONE2FUNC, 20),
    dataAdmissao: data.ADMISSAO,
    situacao: data.SITUACAO,
    situacaoDescricao: truncateString(situacaoMap[data.SITUACAO] || data.SITUACAO, 100),
    salBase: data.SALBASE || 0,
    salAux1: data.SALAUX1 || 0,
    salAux2: data.SALAUX2 || 0,
    salarioTotal,
    dtCompetQuita: data.DTCOMPETQUITA,
    idQuita: data.IDQUITA,
    dtDesligQuita: data.DTDESLIGQUITA,
    idade: data.IDADE,
    tempoEmpresaDias: data.TEMPO_EMPRESA_DIAS,
    tempoEmpresaAnos: data.TEMPO_EMPRESA_ANOS,
    temQuitacao,
    ativo: estaAtivo,
    mesReferencia
  };
}

  /**
   * Buscar funcionários completos com filtros avançados
   */
  async buscarFuncionariosCompletos(filters: FuncionarioCompletoFilters = {}): Promise<{
    data: FuncionarioCompletoEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const mesAtual = filters.mesReferencia || new Date().toISOString().slice(0, 7);
      
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const skip = (page - 1) * limit;

      const queryBuilder = this.funcionarioCompletoRepository.createQueryBuilder('f')
        .where('f.mesReferencia = :mesReferencia', { mesReferencia: mesAtual });

      // Aplicar filtros
      if (filters.empresa) {
        queryBuilder.andWhere('f.empresa = :empresa', { empresa: filters.empresa });
      }

      if (filters.cracha) {
        queryBuilder.andWhere('f.cracha = :cracha', { cracha: filters.cracha });
      }

      if (filters.chapa) {
        queryBuilder.andWhere('f.chapa ILIKE :chapa', { chapa: `%${filters.chapa}%` });
      }

      if (filters.nome) {
        queryBuilder.andWhere('f.nome ILIKE :nome', { nome: `%${filters.nome}%` });
      }

      if (filters.cpf) {
        queryBuilder.andWhere('f.cpf = :cpf', { cpf: filters.cpf.replace(/\D/g, '') });
      }

      if (filters.mae) {
        queryBuilder.andWhere('f.mae ILIKE :mae', { mae: `%${filters.mae}%` });
      }

      if (filters.funcao) {
        queryBuilder.andWhere('f.funcao ILIKE :funcao', { funcao: `%${filters.funcao}%` });
      }

      if (filters.departamento) {
        queryBuilder.andWhere('f.departamento ILIKE :departamento', { departamento: `%${filters.departamento}%` });
      }

      if (filters.area) {
        queryBuilder.andWhere('f.area ILIKE :area', { area: `%${filters.area}%` });
      }

      if (filters.setor) {
        queryBuilder.andWhere('f.setor ILIKE :setor', { setor: `%${filters.setor}%` });
      }

      if (filters.cidade) {
        queryBuilder.andWhere('f.cidade ILIKE :cidade', { cidade: `%${filters.cidade}%` });
      }

      if (filters.bairro) {
        queryBuilder.andWhere('f.bairro ILIKE :bairro', { bairro: `%${filters.bairro}%` });
      }

      if (filters.situacao) {
        queryBuilder.andWhere('f.situacao = :situacao', { situacao: filters.situacao });
      }

      if (filters.dataAdmissaoInicio && filters.dataAdmissaoFim) {
        queryBuilder.andWhere('f.dataAdmissao BETWEEN :dataInicio AND :dataFim', {
          dataInicio: filters.dataAdmissaoInicio,
          dataFim: filters.dataAdmissaoFim
        });
      }

      if (filters.salarioMinimo) {
        queryBuilder.andWhere('f.salarioTotal >= :salarioMinimo', { salarioMinimo: filters.salarioMinimo });
      }

      if (filters.salarioMaximo) {
        queryBuilder.andWhere('f.salarioTotal <= :salarioMaximo', { salarioMaximo: filters.salarioMaximo });
      }

      if (filters.valeRefeicao) {
        queryBuilder.andWhere('f.valeRefeicao = :valeRefeicao', { valeRefeicao: filters.valeRefeicao });
      }

      if (filters.temQuitacao !== undefined) {
        queryBuilder.andWhere('f.temQuitacao = :temQuitacao', { temQuitacao: filters.temQuitacao });
      }

      if (filters.ativo !== undefined) {
        queryBuilder.andWhere('f.ativo = :ativo', { ativo: filters.ativo });
      }

      const orderBy = filters.orderBy || 'nome';
      const orderDirection = filters.orderDirection || 'ASC';
      queryBuilder.orderBy(`f.${orderBy}`, orderDirection);

      const [data, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar funcionários completos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gerar dashboard de funcionários completos
   */
  async gerarDashboardFuncionariosCompletos(mesReferencia?: string): Promise<DashboardFuncionariosCompletos> {
    try {
      const mes = mesReferencia || new Date().toISOString().slice(0, 7);
      
      const funcionarios = await this.funcionarioCompletoRepository.find({
        where: { mesReferencia: mes }
      });

      if (funcionarios.length === 0) {
        // Sincronizar se não houver dados
        await this.sincronizarFuncionariosCompletos(mes);
        const funcionariosSincronizados = await this.funcionarioCompletoRepository.find({
          where: { mesReferencia: mes }
        });
        return this.calcularDashboardFuncionariosCompletos(funcionariosSincronizados);
      }

      return this.calcularDashboardFuncionariosCompletos(funcionarios);

    } catch (error) {
      this.logger.error(`❌ Erro ao gerar dashboard de funcionários completos: ${error.message}`);
      throw error;
    }
  }

  async buscaAvancadaFuncionariosCompletos(filtros: any): Promise<{
    data: FuncionarioCompletoEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    filtrosAplicados: string[];
    resumo?: any;
  }> {
    try {
      const page = filtros.page || 1;
      const limit = filtros.limit || 50;
      const skip = (page - 1) * limit;
  
      const queryBuilder = this.funcionarioCompletoRepository.createQueryBuilder('f');
      const filtrosAplicados: string[] = [];
  
      const mesReferencia = filtros.mesReferencia || new Date().toISOString().slice(0, 7);
      queryBuilder.where('f.mesReferencia = :mesReferencia', { mesReferencia });
  
      // Aplicar filtros dinâmicos
      Object.keys(filtros).forEach(campo => {
        if (filtros[campo] && filtros[campo] !== '' && campo !== 'page' && campo !== 'limit' && campo !== 'mesReferencia') {
          switch (campo) {
            case 'salarioRange':
              const [min, max] = filtros[campo].split('-').map(Number);
              queryBuilder.andWhere('f.salarioTotal BETWEEN :min AND :max', { min, max });
              filtrosAplicados.push(`Salário: R$ ${min} - R$ ${max}`);
              break;
            case 'idadeRange':
              const [idadeMin, idadeMax] = filtros[campo].split('-').map(Number);
              queryBuilder.andWhere('f.idade BETWEEN :idadeMin AND :idadeMax', { idadeMin, idadeMax });
              filtrosAplicados.push(`Idade: ${idadeMin} - ${idadeMax} anos`);
              break;
            case 'tempoEmpresaRange':
              const [tempoMin, tempoMax] = filtros[campo].split('-').map(Number);
              queryBuilder.andWhere('f.tempoEmpresaAnos BETWEEN :tempoMin AND :tempoMax', { tempoMin, tempoMax });
              filtrosAplicados.push(`Tempo de empresa: ${tempoMin} - ${tempoMax} anos`);
              break;
            case 'salarioMinimo':
              queryBuilder.andWhere('f.salarioTotal >= :salarioMinimo', { salarioMinimo: filtros[campo] });
              filtrosAplicados.push(`Salário mínimo: R$ ${filtros[campo]}`);
              break;
            case 'salarioMaximo':
              queryBuilder.andWhere('f.salarioTotal <= :salarioMaximo', { salarioMaximo: filtros[campo] });
              filtrosAplicados.push(`Salário máximo: R$ ${filtros[campo]}`);
              break;
            case 'nome':
              queryBuilder.andWhere('f.nome ILIKE :nome', { nome: `%${filtros[campo]}%` });
              filtrosAplicados.push(`Nome: ${filtros[campo]}`);
              break;
            case 'departamento':
              queryBuilder.andWhere('f.departamento ILIKE :departamento', { departamento: `%${filtros[campo]}%` });
              filtrosAplicados.push(`Departamento: ${filtros[campo]}`);
              break;
            case 'cidade':
              queryBuilder.andWhere('f.cidade ILIKE :cidade', { cidade: `%${filtros[campo]}%` });
              filtrosAplicados.push(`Cidade: ${filtros[campo]}`);
              break;
            case 'situacao':
              queryBuilder.andWhere('f.situacao = :situacao', { situacao: filtros[campo] });
              filtrosAplicados.push(`Situação: ${filtros[campo]}`);
              break;
            case 'temQuitacao':
              queryBuilder.andWhere('f.temQuitacao = :temQuitacao', { temQuitacao: filtros[campo] });
              filtrosAplicados.push(`Tem quitação: ${filtros[campo] ? 'Sim' : 'Não'}`);
              break;
            default:
              if (typeof filtros[campo] === 'string') {
                queryBuilder.andWhere(`f.${campo} ILIKE :${campo}`, { [campo]: `%${filtros[campo]}%` });
                filtrosAplicados.push(`${campo}: ${filtros[campo]}`);
              } else {
                queryBuilder.andWhere(`f.${campo} = :${campo}`, { [campo]: filtros[campo] });
                filtrosAplicados.push(`${campo}: ${filtros[campo]}`);
              }
          }
        }
      });
  
      const orderBy = filtros.orderBy || 'nome';
      const orderDirection = filtros.orderDirection || 'ASC';
      queryBuilder.orderBy(`f.${orderBy}`, orderDirection);
  
      const [data, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();
  
      // Calcular resumo básico
      const resumo = {
        totalEncontrados: total,
        salarioMedio: data.length > 0 ? Math.round((data.reduce((acc, f) => acc + (f.salarioTotal || 0), 0) / data.length) * 100) / 100 : 0,
        idadeMedia: data.length > 0 ? Math.round((data.reduce((acc, f) => acc + (f.idade || 0), 0) / data.length) * 100) / 100 : 0,
        funcionariosAtivos: data.filter(f => f.situacao === 'A').length,
        funcionariosFuncionarios: data.filter(f => f.situacao === 'F').length,
        funcionariosDemitidos: data.filter(f => f.situacao === 'D').length
      };
  
      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        filtrosAplicados,
        resumo
      };
  
    } catch (error) {
      this.logger.error(`❌ Erro na busca avançada: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obter agrupamentos de funcionários completos
   */
  async obterAgrupamentosFuncionariosCompletos(tipo: 'departamento' | 'area' | 'cidade' | 'faixaSalarial', mesReferencia?: string): Promise<any[]> {
    try {
      const mes = mesReferencia || new Date().toISOString().slice(0, 7);
      
      const queryBuilder = this.funcionarioCompletoRepository.createQueryBuilder('f')
        .where('f.mesReferencia = :mes', { mes });

      switch (tipo) {
        case 'departamento':
          return await queryBuilder
            .select('f.departamento', 'grupo')
            .addSelect('COUNT(*)', 'total')
            .addSelect('AVG(f.salarioTotal)', 'salarioMedio')
            .groupBy('f.departamento')
            .orderBy('total', 'DESC')
            .getRawMany();

        case 'area':
          return await queryBuilder
            .select('f.area', 'grupo')
            .addSelect('COUNT(*)', 'total')
            .addSelect('AVG(f.salarioTotal)', 'salarioMedio')
            .groupBy('f.area')
            .orderBy('total', 'DESC')
            .getRawMany();

        case 'cidade':
          return await queryBuilder
            .select('f.cidade', 'grupo')
            .addSelect('COUNT(*)', 'total')
            .addSelect('AVG(f.salarioTotal)', 'salarioMedio')
            .groupBy('f.cidade')
            .orderBy('total', 'DESC')
            .getRawMany();

        case 'faixaSalarial':
          return await queryBuilder
            .select(`
              CASE 
                WHEN f.salarioTotal < 2000 THEN 'Até R$ 2.000'
                WHEN f.salarioTotal < 4000 THEN 'R$ 2.001 - R$ 4.000'
                WHEN f.salarioTotal < 6000 THEN 'R$ 4.001 - R$ 6.000'
                WHEN f.salarioTotal < 10000 THEN 'R$ 6.001 - R$ 10.000'
                ELSE 'Acima de R$ 10.000'
              END
            `, 'grupo')
            .addSelect('COUNT(*)', 'total')
            .addSelect('AVG(f.salarioTotal)', 'salarioMedio')
            .groupBy('grupo')
            .orderBy('salarioMedio', 'ASC')
            .getRawMany();

        default:
          throw new Error(`Tipo de agrupamento não suportado: ${tipo}`);
      }

    } catch (error) {
      this.logger.error(`❌ Erro ao obter agrupamentos: ${error.message}`);
      throw error;
    }
  }

  // ✅ MÉTODOS AUXILIARES EXISTENTES

  /**
   * Obter estatísticas comparativas
   */
  async obterEstatisticasComparativas(): Promise<any> {
    try {
      const dataRef = new Date();
      const meses = this.calcularMesesComparacao(dataRef);
      
      const [statsM0, statsM1, statsM2, statsM12] = await Promise.all([
        this.obterEstatisticas(meses.mesAtual),
        this.obterEstatisticas(meses.mesAnterior1),
        this.obterEstatisticas(meses.mesAnterior2),
        this.obterEstatisticas(meses.mesAnoAnterior)
      ]);

      return {
        meses,
        estatisticas: {
          mesAtual: statsM0,
          mesAnterior1: statsM1,
          mesAnterior2: statsM2,
          mesAnoAnterior: statsM12
        }
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao obter estatísticas comparativas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obter estatísticas básicas
   */
  async obterEstatisticas(mesReferencia?: string): Promise<any> {
    try {
      const mes = mesReferencia || new Date().toISOString().slice(0, 7);
      
      const funcionarios = await this.funcionarioRepository.find({
        where: { mesReferencia: mes }
      });

      if (funcionarios.length === 0) {
        return {
          totalFuncionarios: 0,
          funcionariosAtivos: 0,
          funcionariosAfastados: 0,
          funcionariosDemitidos: 0,
          percentualAtivos: 0,
          percentualAfastados: 0
        };
      }

      const total = funcionarios.length;
      const ativos = funcionarios.filter(f => f.situacaoCalculada === 'ATIVO').length;
      const afastados = funcionarios.filter(f => f.situacaoCalculada === 'AFASTADO').length;
      const demitidos = funcionarios.filter(f => f.situacaoCalculada === 'DEMITIDO').length;

      return {
        totalFuncionarios: total,
        funcionariosAtivos: ativos,
        funcionariosAfastados: afastados,
        funcionariosDemitidos: demitidos,
        percentualAtivos: Math.round((ativos / total) * 100 * 10) / 10,
        percentualAfastados: Math.round((afastados / total) * 100 * 10) / 10
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao obter estatísticas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar funcionário por código
   */
  async buscarPorCodigo(codfunc: number, mesReferencia?: string): Promise<FuncionarioEntity | null> {
    try {
      const mes = mesReferencia || new Date().toISOString().slice(0, 7);
      
      return await this.funcionarioRepository.findOne({
        where: {
          codfunc,
          mesReferencia: mes
        }
      });

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar funcionário por código: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar funcionário por CPF
   */
  async buscarPorCpf(cpf: string, mesReferencia?: string): Promise<FuncionarioEntity | null> {
    try {
      const mes = mesReferencia || new Date().toISOString().slice(0, 7);
      const cpfLimpo = cpf.replace(/\D/g, '');
      
      return await this.funcionarioRepository.findOne({
        where: {
          cpf: cpfLimpo,
          mesReferencia: mes
        }
      });

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar funcionário por CPF: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar funcionário completo por crachá
   */
  async buscarPorCracha(cracha: number, mesReferencia?: string): Promise<FuncionarioCompletoEntity | null> {
    try {
      const mes = mesReferencia || new Date().toISOString().slice(0, 7);
      
      return await this.funcionarioCompletoRepository.findOne({
        where: {
          cracha,
          mesReferencia: mes
        }
      });

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar funcionário por crachá: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar funcionário completo por CPF
   */
  async buscarPorCpfCompleto(cpf: string, mesReferencia?: string): Promise<FuncionarioCompletoEntity | null> {
    try {
      const mes = mesReferencia || new Date().toISOString().slice(0, 7);
      const cpfLimpo = cpf.replace(/\D/g, '');
      
      return await this.funcionarioCompletoRepository.findOne({
        where: {
          cpf: cpfLimpo,
          mesReferencia: mes
        }
      });

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar funcionário completo por CPF: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar funcionários por departamento
   */
  async buscarPorDepartamento(departamento: string, filters: FuncionarioCompletoFilters = {}): Promise<{
    data: FuncionarioCompletoEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const mes = filters.mesReferencia || new Date().toISOString().slice(0, 7);
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const skip = (page - 1) * limit;

      const queryBuilder = this.funcionarioCompletoRepository.createQueryBuilder('f')
        .where('f.mesReferencia = :mes', { mes })
        .andWhere('f.departamento ILIKE :departamento', { departamento: `%${departamento}%` });

      if (filters.situacao) {
        queryBuilder.andWhere('f.situacao = :situacao', { situacao: filters.situacao });
      }

      if (filters.ativo !== undefined) {
        queryBuilder.andWhere('f.ativo = :ativo', { ativo: filters.ativo });
      }

      const orderBy = filters.orderBy || 'nome';
      const orderDirection = filters.orderDirection || 'ASC';
      queryBuilder.orderBy(`f.${orderBy}`, orderDirection);

      const [data, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar funcionários por departamento: ${error.message}`);
      throw error;
    }
  }

  /**
   * Buscar funcionários por situação
   */
  async buscarPorSituacaoCompleto(situacao: string, filters: FuncionarioCompletoFilters = {}): Promise<{
    data: FuncionarioCompletoEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const mes = filters.mesReferencia || new Date().toISOString().slice(0, 7);
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const skip = (page - 1) * limit;

      const queryBuilder = this.funcionarioCompletoRepository.createQueryBuilder('f')
        .where('f.mesReferencia = :mes', { mes })
        .andWhere('f.situacao = :situacao', { situacao });

      if (filters.departamento) {
        queryBuilder.andWhere('f.departamento ILIKE :departamento', { departamento: `%${filters.departamento}%` });
      }

      if (filters.ativo !== undefined) {
        queryBuilder.andWhere('f.ativo = :ativo', { ativo: filters.ativo });
      }

      const orderBy = filters.orderBy || 'nome';
      const orderDirection = filters.orderDirection || 'ASC';
      queryBuilder.orderBy(`f.${orderBy}`, orderDirection);

      const [data, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar funcionários por situação: ${error.message}`);
      throw error;
    }
  }

  // ✅ MÉTODOS PRIVADOS IMPLEMENTADOS

  /**
   * Processar dados do funcionário completo do Oracle
   */
   // No pessoal.service.ts - MÉTODO CORRIGIDO
   private processarDadosFuncionarioCompleto(data: FuncionarioCompletoOracleData, mesReferencia: string): Partial<FuncionarioCompletoEntity> {
    // Calcular idade
    const idade = data.ADMISSAO ? this.calcularIdade(data.ADMISSAO) : null;
    
    // Calcular tempo de empresa
    const tempoEmpresaDias = data.ADMISSAO ? this.calcularDiasEntreDatas(data.ADMISSAO, new Date()) : null;
    const tempoEmpresaAnos = tempoEmpresaDias ? Math.round((tempoEmpresaDias / 365) * 100) / 100 : null;
    
    // Calcular salário total
    const salarioTotal = (data.SALBASE || 0) + (data.SALAUX1 || 0) + (data.SALAUX2 || 0);
    
    // Verificar quitação
    const temQuitacao = !!(data.DTCOMPETQUITA && data.IDQUITA);
    
    // ✅ MAPEAR SITUAÇÃO CORRETAMENTE
    const situacaoMap = {
      'A': 'ATIVO',      // ✅ Funcionário ativo
      'F': 'AFASTADO',   // ✅ Funcionário afastado  
      'D': 'DEMITIDO'    // ✅ Funcionário demitido
    };
  
    // ✅ LÓGICA DE ATIVO CORRIGIDA
    const estaAtivo = data.SITUACAO === 'A' && !data.DTDESLIGQUITA;
  
    return {
      valeRefeicao: data.VALEREFEICFUNC || 'N',
      dataTransferencia: data.DTTRANSFFUNC,
      empresa: data.EMPRESA,
      codintFunc: data.CODINTFUNC,
      cracha: data.CRACHA,
      chapa: data.CHAPA ? String(data.CHAPA).substring(0, 50) : null,
      nome: data.NOME ? String(data.NOME).substring(0, 200) : '',
      mae: data.MAE ? String(data.MAE).substring(0, 200) : null,
      cpf: data.CPF,
      funcao: data.FUNCAO ? String(data.FUNCAO).substring(0, 200) : null,
      departamento: data.DEPARTAMENTO ? String(data.DEPARTAMENTO).substring(0, 200) : null,
      area: data.AREA ? String(data.AREA).substring(0, 200) : null,
      secao: data.DESCSECAO ? String(data.DESCSECAO).substring(0, 200) : null,
      setor: data.DESCSETOR ? String(data.DESCSETOR).substring(0, 200) : null,
      endereco: data.ENDERECO ? String(data.ENDERECO).substring(0, 300) : null,
      casa: data.CASA ? String(data.CASA).substring(0, 50) : null,
      bairro: data.BAIRRO ? String(data.BAIRRO).substring(0, 200) : null,
      cidade: data.CIDADE ? String(data.CIDADE).substring(0, 200) : null,
      foneFunc: data.FONEFUNC ? String(data.FONEFUNC).substring(0, 20) : null,
      fone2Func: data.FONE2FUNC ? String(data.FONE2FUNC).substring(0, 20) : null,
      dataAdmissao: data.ADMISSAO,
      situacao: data.SITUACAO,
      situacaoDescricao: situacaoMap[data.SITUACAO] || data.SITUACAO,
      salBase: data.SALBASE || 0,
      salAux1: data.SALAUX1 || 0,
      salAux2: data.SALAUX2 || 0,
      salarioTotal,
      dtCompetQuita: data.DTCOMPETQUITA,
      idQuita: data.IDQUITA,
      dtDesligQuita: data.DTDESLIGQUITA,
      idade,
      tempoEmpresaDias,
      tempoEmpresaAnos,
      temQuitacao,
      ativo: estaAtivo, // ✅ CORRIGIDO
      mesReferencia
    };
  }

  /**
   * Calcular dashboard de funcionários completos
   */
  private calcularDashboardFuncionariosCompletos(funcionarios: FuncionarioCompletoEntity[]): DashboardFuncionariosCompletos {
    const total = funcionarios.length;
    
    if (total === 0) {
      return {
        resumo: {
          totalFuncionarios: 0,
          ativos: 0,
          funcionarios: 0,
          demitidos: 0,
          comQuitacao: 0,
          semQuitacao: 0,
          salarioMedio: 0,
          tempoMedioEmpresa: 0
        },
        distribuicao: {
          porSituacao: [],
          porDepartamento: [],
          porArea: [],
          porCidade: [],
          porFaixaSalarial: [],
          porTempoEmpresa: []
        },
        estatisticas: {
          maiorSalario: 0,
          menorSalario: 0,
          funcionarioMaisAntigo: '',
          funcionarioMaisNovo: '',
          departamentoMaior: '',
          cidadeMaior: ''
        }
      };
    }

    // Resumo
    const ativos = funcionarios.filter(f => f.situacao === 'A').length;
    const funcionariosSituacao = funcionarios.filter(f => f.situacao === 'F').length;
    const demitidos = funcionarios.filter(f => f.situacao === 'D').length;
    const comQuitacao = funcionarios.filter(f => f.temQuitacao).length;
    const semQuitacao = total - comQuitacao;
    
    const salarios = funcionarios.map(f => f.salarioTotal || 0).filter(s => s > 0);
    const salarioMedio = salarios.length > 0 ? salarios.reduce((a, b) => a + b, 0) / salarios.length : 0;
    
    const temposEmpresa = funcionarios.map(f => f.tempoEmpresaAnos || 0).filter(t => t > 0);
    const tempoMedioEmpresa = temposEmpresa.length > 0 ? temposEmpresa.reduce((a, b) => a + b, 0) / temposEmpresa.length : 0;

    // Distribuições
    const distribuicaoPorSituacao = this.calcularDistribuicao(funcionarios, 'situacaoDescricao');
    const distribuicaoPorDepartamento = this.calcularDistribuicao(funcionarios, 'departamento');
    const distribuicaoPorArea = this.calcularDistribuicao(funcionarios, 'area');
    const distribuicaoPorCidade = this.calcularDistribuicao(funcionarios, 'cidade');
    
    // Faixa salarial
    const faixasSalariais = funcionarios.map(f => {
      const salario = f.salarioTotal || 0;
      if (salario < 2000) return 'Até R$ 2.000';
      if (salario < 4000) return 'R$ 2.001 - R$ 4.000';
      if (salario < 6000) return 'R$ 4.001 - R$ 6.000';
      if (salario < 10000) return 'R$ 6.001 - R$ 10.000';
      return 'Acima de R$ 10.000';
    });
    const distribuicaoPorFaixaSalarial = this.calcularDistribuicaoArray(faixasSalariais);

    // Tempo de empresa
    const faixasTempoEmpresa = funcionarios.map(f => {
      const tempo = f.tempoEmpresaAnos || 0;
      if (tempo < 1) return 'Menos de 1 ano';
      if (tempo < 3) return '1 - 3 anos';
      if (tempo < 5) return '3 - 5 anos';
      if (tempo < 10) return '5 - 10 anos';
      return 'Mais de 10 anos';
    });
    const distribuicaoPorTempoEmpresa = this.calcularDistribuicaoArray(faixasTempoEmpresa);

    // Estatísticas
    const maiorSalario = Math.max(...salarios, 0);
    const menorSalario = salarios.length > 0 ? Math.min(...salarios) : 0;
    
    const funcionarioMaisAntigo = funcionarios
      .filter(f => f.tempoEmpresaAnos)
      .sort((a, b) => (b.tempoEmpresaAnos || 0) - (a.tempoEmpresaAnos || 0))[0]?.nome || '';
    
    const funcionarioMaisNovo = funcionarios
      .filter(f => f.tempoEmpresaAnos)
      .sort((a, b) => (a.tempoEmpresaAnos || 0) - (b.tempoEmpresaAnos || 0))[0]?.nome || '';
    
    const departamentoMaior = distribuicaoPorDepartamento[0]?.departamento || '';
    const cidadeMaior = distribuicaoPorCidade[0]?.cidade || '';

    return {
      resumo: {
        totalFuncionarios: total,
        ativos,
        funcionarios: funcionariosSituacao,
        demitidos,
        comQuitacao,
        semQuitacao,
        salarioMedio: Math.round(salarioMedio * 100) / 100,
        tempoMedioEmpresa: Math.round(tempoMedioEmpresa * 100) / 100
      },
      distribuicao: {
        porSituacao: distribuicaoPorSituacao,
        porDepartamento: distribuicaoPorDepartamento,
        porArea: distribuicaoPorArea,
        porCidade: distribuicaoPorCidade,
        porFaixaSalarial: distribuicaoPorFaixaSalarial,
        porTempoEmpresa: distribuicaoPorTempoEmpresa
      },
      estatisticas: {
        maiorSalario,
        menorSalario,
        funcionarioMaisAntigo,
        funcionarioMaisNovo,
        departamentoMaior,
        cidadeMaior
      }
    };
  }

  // ✅ MÉTODOS AUXILIARES IMPLEMENTADOS

  private calcularIdadeCache(dataAtualizacao: Date): string {
    const agora = new Date();
    const diferencaMs = agora.getTime() - dataAtualizacao.getTime();
    const diferencaHoras = Math.floor(diferencaMs / (1000 * 60 * 60));
    const diferencaDias = Math.floor(diferencaHoras / 24);

    if (diferencaHoras < 1) {
      const minutos = Math.floor(diferencaMs / (1000 * 60));
      return `${minutos} minuto${minutos !== 1 ? 's' : ''} atrás`;
    } else if (diferencaHoras < 24) {
      return `${diferencaHoras} hora${diferencaHoras !== 1 ? 's' : ''} atrás`;
    } else {
      return `${diferencaDias} dia${diferencaDias !== 1 ? 's' : ''} atrás`;
    }
  }

  private calcularMesesComparacao(dataReferencia: Date) {
    const mesAtual = dataReferencia.toISOString().slice(0, 7);
    
    const dataAnterior1 = new Date(dataReferencia);
    dataAnterior1.setMonth(dataAnterior1.getMonth() - 1);
    const mesAnterior1 = dataAnterior1.toISOString().slice(0, 7);
    
    const dataAnterior2 = new Date(dataReferencia);
    dataAnterior2.setMonth(dataAnterior2.getMonth() - 2);
    const mesAnterior2 = dataAnterior2.toISOString().slice(0, 7);
    
    const dataAnoAnterior = new Date(dataReferencia);
    dataAnoAnterior.setFullYear(dataAnoAnterior.getFullYear() - 1);
    const mesAnoAnterior = dataAnoAnterior.toISOString().slice(0, 7);

    return {
      mesAtual,
      mesAnterior1,
      mesAnterior2,
      mesAnoAnterior
    };
  }

  private formatarNomeMes(mesReferencia: string): string {
    const [ano, mes] = mesReferencia.split('-');
    const nomesMeses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${nomesMeses[parseInt(mes) - 1]} de ${ano}`;
  }

  // ✅ MÉTODOS DE DASHBOARD IMPLEMENTADOS

  private calcularDashboard(funcionarios: FuncionarioEntity[], mesReferencia: string): DashboardPessoal {
    const total = funcionarios.length;
    
    if (total === 0) {
      return {
        resumo: {
          totalFuncionarios: 0,
          funcionariosAtivos: 0,
          funcionariosAfastados: 0,
          funcionariosDemitidos: 0,
          novasAdmissoes: 0,
          demissoes: 0,
          percentualAtivos: 0,
          percentualAfastados: 0
        },
        distribuicao: {
          porSexo: [],
          porIdade: [],
          porTempoEmpresa: [],
          porCidade: [],
          porSituacao: []
        },
        estatisticas: {
          idadeMedia: 0,
          tempoMedioEmpresa: 0,
          admissoesMesAtual: 0,
          demissoesMesAtual: 0,
          funcionarioMaisAntigo: '',
          funcionarioMaisNovo: ''
        }
      };
    }

    // Calcular resumo
    const ativos = funcionarios.filter(f => f.situacaoCalculada === 'ATIVO').length;
    const afastados = funcionarios.filter(f => f.situacaoCalculada === 'AFASTADO').length;
    const demitidos = funcionarios.filter(f => f.situacaoCalculada === 'DEMITIDO').length;

    // Calcular distribuições
    const porSexo = this.calcularDistribuicaoEspecifica(funcionarios, 'sexofunc', 'sexo');
    const porSituacao = this.calcularDistribuicaoEspecifica(funcionarios, 'situacaoCalculada', 'situacao');
    const porCidade = this.calcularDistribuicaoEspecifica(funcionarios, 'desccid', 'cidade');

    // Calcular faixas etárias
    const faixasEtarias = funcionarios.map(f => {
      const idade = f.idade || 0;
      if (idade < 25) return 'Até 25 anos';
      if (idade < 35) return '25-35 anos';
      if (idade < 45) return '35-45 anos';
      if (idade < 55) return '45-55 anos';
      return 'Acima de 55 anos';
    });
    const porIdade = this.calcularDistribuicaoArray(faixasEtarias).map(item => ({
      faixaEtaria: item.faixa,
      total: item.total,
      percentual: item.percentual
    }));

        // Calcular tempo de empresa
        const faixasTempoEmpresa = funcionarios.map(f => {
          const dias = f.tempoEmpresaDias || 0;
          const anos = dias / 365;
          if (anos < 1) return 'Menos de 1 ano';
          if (anos < 3) return '1-3 anos';
          if (anos < 5) return '3-5 anos';
          if (anos < 10) return '5-10 anos';
          return 'Mais de 10 anos';
        });
        const porTempoEmpresa = this.calcularDistribuicaoArray(faixasTempoEmpresa).map(item => ({
          faixa: item.faixa,
          total: item.total,
          percentual: item.percentual
        }));
    
        // Calcular estatísticas
        const idades = funcionarios.map(f => f.idade || 0).filter(i => i > 0);
        const idadeMedia = idades.length > 0 ? idades.reduce((a, b) => a + b, 0) / idades.length : 0;
    
        const tempos = funcionarios.map(f => f.tempoEmpresaDias || 0).filter(t => t > 0);
        const tempoMedioEmpresa = tempos.length > 0 ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;
    
        const funcionarioMaisAntigo = funcionarios
          .filter(f => f.tempoEmpresaDias)
          .sort((a, b) => (b.tempoEmpresaDias || 0) - (a.tempoEmpresaDias || 0))[0]?.nomefunc || '';
    
        const funcionarioMaisNovo = funcionarios
          .filter(f => f.tempoEmpresaDias)
          .sort((a, b) => (a.tempoEmpresaDias || 0) - (b.tempoEmpresaDias || 0))[0]?.nomefunc || '';
    
        return {
          resumo: {
            totalFuncionarios: total,
            funcionariosAtivos: ativos,
            funcionariosAfastados: afastados,
            funcionariosDemitidos: demitidos,
            novasAdmissoes: 0, // Calcular baseado em dtadmfunc
            demissoes: 0, // Calcular baseado em dtafast
            percentualAtivos: Math.round((ativos / total) * 100 * 10) / 10,
            percentualAfastados: Math.round((afastados / total) * 100 * 10) / 10
          },
          distribuicao: {
            porSexo,
            porIdade,
            porTempoEmpresa,
            porCidade,
            porSituacao
          },
          estatisticas: {
            idadeMedia: Math.round(idadeMedia * 10) / 10,
            tempoMedioEmpresa: Math.round(tempoMedioEmpresa * 10) / 10,
            admissoesMesAtual: 0,
            demissoesMesAtual: 0,
            funcionarioMaisAntigo,
            funcionarioMaisNovo
          }
        };
      }
    
      private calcularDashboardAcumulado(funcionarios: FuncionarioEntity[], mesReferencia: string, fonte: string): DashboardAcumulado {
        const dashboard = this.calcularDashboard(funcionarios, mesReferencia);
        const [ano, mes] = mesReferencia.replace('-ACUM', '').split('-');
        
        return {
          periodoInicio: `${ano}-01`,
          periodoFim: mesReferencia.replace('-ACUM', ''),
          nomeCompleto: `Janeiro a ${this.formatarNomeMes(mesReferencia.replace('-ACUM', ''))}`,
          fonte,
          resumo: dashboard.resumo,
          distribuicao: dashboard.distribuicao,
          estatisticas: {
            // ✅ CORRIGIR: Mapear as propriedades corretas
            idadeMedia: dashboard.estatisticas.idadeMedia,
            tempoMedioEmpresa: dashboard.estatisticas.tempoMedioEmpresa,
            admissoesPeriodo: dashboard.estatisticas.admissoesMesAtual, // ✅ RENOMEAR
            demissoesPeriodo: dashboard.estatisticas.demissoesMesAtual, // ✅ RENOMEAR
            funcionarioMaisAntigo: dashboard.estatisticas.funcionarioMaisAntigo,
            funcionarioMaisNovo: dashboard.estatisticas.funcionarioMaisNovo
          },
          detalhamentoMensal: [] // Implementar se necessário
        };
      }
    
      private processarDadosFuncionario(data: FuncionarioOracleData, mesReferencia: string, dataReferencia: Date): Partial<FuncionarioEntity> {
        // Calcular idade
        const idade = data.DTNASCTOFUNC ? this.calcularIdade(data.DTNASCTOFUNC) : null;
        
        // Calcular tempo de empresa
        const tempoEmpresaDias = data.DTADMFUNC ? this.calcularDiasEntreDatas(data.DTADMFUNC, dataReferencia) : null;
        
        // Calcular situação
        let situacaoCalculada = 'ATIVO';
        if (data.DTAFAST) {
          situacaoCalculada = 'AFASTADO';
        }
    
        return {
          codigoEmpresa: data.CODIGOEMPRESA,
          codfunc: data.CODFUNC,
          chapafunc: data.CHAPAFUNC,
          descfuncao: data.DESCFUNCAO,
          nomefunc: data.NOMEFUNC,
          sexofunc: data.SEXOFUNC,
          dtnasctofunc: data.DTNASCTOFUNC,
          cpf: data.CPF,
          dtadmfunc: data.DTADMFUNC,
          dtafast: data.DTAFAST,
          desccondi: data.DESCCONDI,
          codcid: data.CODCID,
          desccid: data.DESCCID,
          idade,
          tempoEmpresaDias,
          situacaoCalculada,
          mesReferencia
        };
      }
    
      // ✅ MÉTODOS DE DISTRIBUIÇÃO CORRIGIDOS
    
      private calcularDistribuicao(array: any[], campo: string): any[] {
        const contagem = {};
        const total = array.length;
      
        array.forEach(item => {
          const valor = item[campo] || 'Não informado';
          contagem[valor] = (contagem[valor] || 0) + 1;
        });
      
        return Object.entries(contagem)
          .map(([key, value]) => {
            const resultado: any = {
              total: value as number,
              percentual: Math.round(((value as number) / total) * 100 * 10) / 10
            };
            
            // ✅ ADICIONAR A PROPRIEDADE ESPECÍFICA BASEADA NO CAMPO
            switch (campo) {
              case 'situacaoDescricao':
                resultado.situacao = key;
                break;
              case 'departamento':
                resultado.departamento = key;
                break;
              case 'area':
                resultado.area = key;
                break;
              case 'cidade':
                resultado.cidade = key;
                break;
              default:
                resultado[campo] = key;
            }
            
            return resultado;
          })
          .sort((a, b) => b.total - a.total);
      }
    
      private calcularDistribuicaoEspecifica(array: any[], campo: string, propriedadeRetorno: string): any[] {
        const contagem = {};
        const total = array.length;
    
        array.forEach(item => {
          const valor = item[campo] || 'Não informado';
          contagem[valor] = (contagem[valor] || 0) + 1;
        });
    
        return Object.entries(contagem)
          .map(([key, value]) => ({
            [propriedadeRetorno]: key,
            total: value as number,
            percentual: Math.round(((value as number) / total) * 100 * 10) / 10
          }))
          .sort((a, b) => b.total - a.total);
      }
    
      private calcularDistribuicaoArray(array: string[]): Array<{ faixa: string; total: number; percentual: number }> {
        const contagem = {};
        const total = array.length;
    
        array.forEach(valor => {
          contagem[valor] = (contagem[valor] || 0) + 1;
        });
    
        return Object.entries(contagem)
          .map(([key, value]) => ({
            faixa: key,
            total: value as number,
            percentual: Math.round(((value as number) / total) * 100 * 10) / 10
          }))
          .sort((a, b) => b.total - a.total);
      }
    
      // ✅ MÉTODOS AUXILIARES FINAIS
    
      private calcularIdade(dataNascimento: Date): number {
        const hoje = new Date();
        let idade = hoje.getFullYear() - dataNascimento.getFullYear();
        const mesAtual = hoje.getMonth();
        const mesNascimento = dataNascimento.getMonth();
        
        if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < dataNascimento.getDate())) {
          idade--;
        }
        
        return idade;
      }
    
      private calcularDiasEntreDatas(dataInicio: Date, dataFim: Date): number {
        const diffTime = Math.abs(dataFim.getTime() - dataInicio.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      /**
       * Formatar data para Oracle (DD/MM/YYYY)
       */
      private formatarDataOracle(data: Date): string {
        const dia = data.getDate().toString().padStart(2, '0');
        const mes = (data.getMonth() + 1).toString().padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
      }

      // ✅ ADICIONAR ESTE MÉTODO NO FINAL DA CLASSE PessoalService

    /**
 * Obter dashboard acumulado - MÉTODO QUE ESTAVA FALTANDO
 */
async obterDashboardAcumulado(mesReferencia?: string): Promise<DashboardAcumulado> {
  const startTime = Date.now();
  
  try {
    const mesRef = mesReferencia || new Date().toISOString().slice(0, 7);
    const chaveAcumulada = `${mesRef}-ACUM`;
    
    this.logger.log(`📊 Obtendo dashboard acumulado para ${chaveAcumulada}...`);

    // ✅ USAR FUNCIONARIO_COMPLETO_REPOSITORY (tabela correta)
    const funcionarios = await this.funcionarioCompletoRepository.find({
      where: { mesReferencia: chaveAcumulada }
    });

    if (funcionarios.length === 0) {
      this.logger.warn(`⚠️ Nenhum funcionário encontrado para ${chaveAcumulada}. Executando sincronização...`);
      
      // Tentar sincronizar automaticamente
      await this.sincronizarFuncionariosAcumulado(mesRef);
      
      // Buscar novamente
      const funcionariosAposSincronizacao = await this.funcionarioCompletoRepository.find({
        where: { mesReferencia: chaveAcumulada }
      });
      
      if (funcionariosAposSincronizacao.length === 0) {
        throw new Error(`Nenhum funcionário encontrado após sincronização para ${chaveAcumulada}`);
      }
      
      return this.calcularDashboardAcumuladoCompleto(funcionariosAposSincronizacao, mesRef, 'oracle');
    }

    const tempoExecucao = Date.now() - startTime;
    this.logger.log(`✅ Dashboard acumulado obtido em ${tempoExecucao}ms para ${funcionarios.length} funcionários`);

    return this.calcularDashboardAcumuladoCompleto(funcionarios, mesRef, 'cache');

  } catch (error) {
    this.logger.error(`❌ Erro ao obter dashboard acumulado: ${error.message}`);
    throw error;
  }
}

/**
 * Calcular dashboard acumulado completo - MÉTODO AUXILIAR
 */
private calcularDashboardAcumuladoCompleto(funcionarios: FuncionarioCompletoEntity[], mesReferencia: string, fonte: string): DashboardAcumulado {
  const [ano, mes] = mesReferencia.split('-');
  
  // ✅ CALCULAR RESUMO CORRIGIDO
  const total = funcionarios.length;
  const ativos = funcionarios.filter(f => f.situacao === 'A').length;
  const afastados = funcionarios.filter(f => f.situacao === 'F').length;
  const demitidos = funcionarios.filter(f => f.situacao === 'D').length;

  // Calcular distribuições usando os métodos existentes
  const porSituacao = this.calcularDistribuicaoEspecifica(funcionarios, 'situacaoDescricao', 'situacao');
  const porCidade = this.calcularDistribuicaoEspecifica(funcionarios, 'cidade', 'cidade');

  // Calcular faixas etárias
  const faixasEtarias = funcionarios.map(f => {
    const idade = f.idade || 0;
    if (idade < 25) return 'Até 25 anos';
    if (idade < 35) return '25-35 anos';
    if (idade < 45) return '35-45 anos';
    if (idade < 55) return '45-55 anos';
    return 'Acima de 55 anos';
  });
  const porIdade = this.calcularDistribuicaoArray(faixasEtarias).map(item => ({
    faixaEtaria: item.faixa,
    total: item.total,
    percentual: item.percentual
  }));

  // Calcular tempo de empresa
  const faixasTempoEmpresa = funcionarios.map(f => {
    const anos = f.tempoEmpresaAnos || 0;
    if (anos < 1) return 'Menos de 1 ano';
    if (anos < 3) return '1 - 3 anos';
    if (anos < 5) return '3 - 5 anos';
    if (anos < 10) return '5 - 10 anos';
    return 'Mais de 10 anos';
  });
  const porTempoEmpresa = this.calcularDistribuicaoArray(faixasTempoEmpresa).map(item => ({
    faixa: item.faixa,
    total: item.total,
    percentual: item.percentual
  }));

  // Calcular distribuição por sexo (se disponível)
  const porSexo = []; // Implementar se necessário

  // Calcular estatísticas
  const idades = funcionarios.map(f => f.idade || 0).filter(i => i > 0);
  const idadeMedia = idades.length > 0 ? idades.reduce((a, b) => a + b, 0) / idades.length : 0;

  const tempos = funcionarios.map(f => f.tempoEmpresaDias || 0).filter(t => t > 0);
  const tempoMedioEmpresa = tempos.length > 0 ? tempos.reduce((a, b) => a + b, 0) / tempos.length : 0;

  const funcionarioMaisAntigo = funcionarios
    .filter(f => f.tempoEmpresaDias)
    .sort((a, b) => (b.tempoEmpresaDias || 0) - (a.tempoEmpresaDias || 0))[0]?.nome || '';

  const funcionarioMaisNovo = funcionarios
    .filter(f => f.tempoEmpresaDias)
    .sort((a, b) => (a.tempoEmpresaDias || 0) - (b.tempoEmpresaDias || 0))[0]?.nome || '';

  return {
    periodoInicio: `${ano}-01`,
    periodoFim: mesReferencia,
    nomeCompleto: `Janeiro a ${this.formatarNomeMes(mesReferencia)}`,
    fonte,
    resumo: {
      totalFuncionarios: total,
      funcionariosAtivos: ativos,
      funcionariosAfastados: afastados,
      funcionariosDemitidos: demitidos,
      novasAdmissoes: 0,
      demissoes: 0,
      percentualAtivos: total > 0 ? Math.round((ativos / total) * 100 * 10) / 10 : 0,
      percentualAfastados: total > 0 ? Math.round((afastados / total) * 100 * 10) / 10 : 0
    },
    distribuicao: {
      porSexo,
      porIdade,
      porTempoEmpresa,
      porCidade,
      porSituacao
    },
    estatisticas: {
      idadeMedia: Math.round(idadeMedia * 10) / 10,
      tempoMedioEmpresa: Math.round(tempoMedioEmpresa * 10) / 10,
      admissoesPeriodo: 0,
      demissoesPeriodo: 0,
      funcionarioMaisAntigo,
      funcionarioMaisNovo
    },
    detalhamentoMensal: []
  };
}

    
    }