// apps/backend/src/modules/departamentos/juridico/services/multa-completa-enhanced.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Between, In, Like, MoreThanOrEqual, LessThanOrEqual, IsNull, Not } from 'typeorm';
import { MultaCompleta } from '../entities/multa-completa.entity';
import { OracleReadOnlyService } from '../../../../oracle/services/oracle-readonly.service';

// ✅ Interface completa com todas as propriedades
export interface MultaEnhancedFilter {
  // Filtros temporais
  dataInicio?: string;
  dataFim?: string;
  
  // Filtros específicos das novas regras
  tipoMulta?: 'TODOS' | 'TRANSITO' | 'SEMOB';
  responsavelMulta?: 'F' | 'E' | 'TODOS'; // F=Funcionário, E=Empresa
  gravidadeMulta?: 'A' | 'B' | 'C' | 'TODOS'; // A=495, B=990, C=1980
  
  // Filtros por área
  codAreaCompetencia?: string; // 1-7
  codResponsavelNotificacao?: string; // 1-6
  
  // Filtros de busca
  agenteCodigo?: string;
  prefixoVeic?: string;
  numeroAiMulta?: string;
  observacaoRealMotivo?: string;
  
  // Alertas
  alertaDefesa?: boolean; // data_limite_condutor próxima
  
  // Paginação
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  
  // Analytics
  includeAnalytics?: boolean;
  groupBy?: 'agente' | 'area' | 'responsavel' | 'gravidade' | 'tipo' | 'mes' | 'horario';
  
  // ✅ Busca avançada
  buscaAvancada?: {
    texto: string;
    campos: string[];
    operador: 'AND' | 'OR';
  };
}

export interface MultaEnhancedResult {
  success: boolean;
  message: string;
  data: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  resumo: any;
  analytics?: any;
  groups?: any[];
}

export interface SyncResult {
  total: number;
  novos: number;
  atualizados: number;
  periodo: { inicio: string; fim: string };
  fonte: 'oracle' | 'cache';
  tempoExecucao?: string;
  erros?: string[];
}

@Injectable()
export class MultaCompletaEnhancedService {
  private readonly logger = new Logger(MultaCompletaEnhancedService.name);

  constructor(
    @InjectRepository(MultaCompleta)
    private readonly multaRepository: Repository<MultaCompleta>,
    private readonly oracleService: OracleReadOnlyService,
  ) {}

  /**
   * 🎯 Busca principal com todas as novas regras de negócio
   */
  async buscarMultasEnhanced(filters: MultaEnhancedFilter = {}): Promise<MultaEnhancedResult> {
    try {
      this.logger.log('🔍 Buscando multas com filtros enhanced:', filters);

      const startTime = Date.now();

      // ✅ Definir período padrão se não especificado
      const dataInicio = filters.dataInicio || this.getStartOfYear();
      const dataFim = filters.dataFim || this.getEndOfYear();

      // ✅ Verificar cache e sincronizar se necessário
      const dadosCache = await this.verificarDadosCache(dataInicio, dataFim);
      if (!dadosCache.existem || dadosCache.desatualizados) {
        this.logger.log(`📥 Dados não encontrados ou desatualizados no cache. Sincronizando...`);
        await this.sincronizarDadosOracle(dataInicio, dataFim);
      }

      const queryBuilder = this.multaRepository.createQueryBuilder('multa');

      // ✅ Aplicar filtros temporais
      queryBuilder.where('multa.dataEmissaoMulta BETWEEN :dataInicio AND :dataFim', {
        dataInicio,
        dataFim
      });

      // ✅ Aplicar todos os filtros
      this.aplicarFiltrosEnhanced(queryBuilder, filters);

      // ✅ Contagem total
      const total = await queryBuilder.getCount();

      // ✅ Paginação
      const page = filters.page || 1;
      const limit = Math.min(filters.limit || 50, 1000);
      const skip = (page - 1) * limit;

      // ✅ Ordenação
      const orderBy = filters.orderBy || 'dataEmissaoMulta';
      const orderDirection = filters.orderDirection || 'DESC';
      queryBuilder.orderBy(`multa.${orderBy}`, orderDirection);

      // ✅ Aplicar paginação
      queryBuilder.skip(skip).take(limit);

      // ✅ Executar consulta
      const multas = await queryBuilder.getMany();

      // ✅ Enriquecer dados com classificações
      const multasEnriquecidas = multas.map(multa => this.enriquecerMulta(multa));

      // ✅ Calcular resumo
      const resumo = this.calcularResumo(multasEnriquecidas);

      // ✅ Analytics se solicitado
      let analytics = null;
      if (filters.includeAnalytics) {
        analytics = await this.calcularAnalytics(filters, dataInicio, dataFim);
      }

      // ✅ Agrupamentos se solicitado
      let groups = null;
      if (filters.groupBy) {
        groups = await this.processarAgrupamentos(filters, dataInicio, dataFim);
      }

      return {
        success: true,
        message: `Encontradas ${total} multas`,
        data: multasEnriquecidas,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        resumo,
        analytics,
        groups
      };

    } catch (error) {
      this.logger.error('❌ Erro ao buscar multas enhanced:', error);
      throw new Error('Falha ao buscar multas com filtros avançados');
    }
  }

  /**
   * 🔍 Aplicar filtros enhanced na query
   */
  private aplicarFiltrosEnhanced(queryBuilder: SelectQueryBuilder<MultaCompleta>, filters: MultaEnhancedFilter) {
    // ✅ Filtro de busca avançada
    if (filters.buscaAvancada) {
      const { texto, campos, operador } = filters.buscaAvancada;
      
      if (texto && campos.length > 0) {
        const condicoes = campos.map(campo => `multa.${campo} ILIKE :textoLivre`);
        const operadorSQL = operador === 'AND' ? ' AND ' : ' OR ';
        
        queryBuilder.andWhere(`(${condicoes.join(operadorSQL)})`, {
          textoLivre: `%${texto}%`
        });
      }
    }

    // ✅ Filtro por tipo de multa (SEMOB vs TRÂNSITO)
    if (filters.tipoMulta && filters.tipoMulta !== 'TODOS') {
      if (filters.tipoMulta === 'SEMOB') {
        queryBuilder.andWhere('multa.codigoOrg = :codigoOrg', { codigoOrg: '16' });
      } else if (filters.tipoMulta === 'TRANSITO') {
        queryBuilder.andWhere('(multa.codigoOrg != :codigoOrg OR multa.codigoOrg IS NULL)', { codigoOrg: '16' });
      }
    }

    // ✅ Filtro por responsável (F=Funcionário, E=Empresa)
    if (filters.responsavelMulta && filters.responsavelMulta !== 'TODOS') {
      queryBuilder.andWhere('multa.responsavelMulta = :responsavelMulta', {
        responsavelMulta: filters.responsavelMulta
      });
    }

    // ✅ Filtro por gravidade baseado no valor
    if (filters.gravidadeMulta && filters.gravidadeMulta !== 'TODOS') {
      switch (filters.gravidadeMulta) {
        case 'A':
          queryBuilder.andWhere('multa.valorMulta = :valorA', { valorA: 495 });
          break;
        case 'B':
          queryBuilder.andWhere('multa.valorMulta = :valorB', { valorB: 990 });
          break;
        case 'C':
          queryBuilder.andWhere('multa.valorMulta = :valorC', { valorC: 1980 });
          break;
      }
    }

    // ✅ Filtro por área de competência
    if (filters.codAreaCompetencia) {
      queryBuilder.andWhere('multa.codAreaCompetencia = :codAreaCompetencia', {
        codAreaCompetencia: filters.codAreaCompetencia
      });
    }

    // ✅ Filtro por responsável da notificação
    if (filters.codResponsavelNotificacao) {
      queryBuilder.andWhere('multa.codResponsavelNotificacao = :codResponsavelNotificacao', {
        codResponsavelNotificacao: filters.codResponsavelNotificacao
      });
    }

    // ✅ Filtros de busca específica
    if (filters.agenteCodigo) {
      queryBuilder.andWhere('multa.agenteCodigo = :agenteCodigo', {
        agenteCodigo: filters.agenteCodigo
      });
    }

    if (filters.prefixoVeic) {
      queryBuilder.andWhere('multa.prefixoVeic ILIKE :prefixoVeic', {
        prefixoVeic: `%${filters.prefixoVeic}%`
      });
    }

    if (filters.numeroAiMulta) {
      queryBuilder.andWhere('multa.numeroAiMulta = :numeroAiMulta', {
        numeroAiMulta: filters.numeroAiMulta
      });
    }

    if (filters.observacaoRealMotivo) {
      queryBuilder.andWhere('multa.observacaoRealMotivo ILIKE :observacaoRealMotivo', {
        observacaoRealMotivo: `%${filters.observacaoRealMotivo}%`
      });
    }

    // ✅ Alerta de defesa (1 semana antes do vencimento)
    if (filters.alertaDefesa) {
      const hoje = new Date();
      const umaSemana = new Date();
      umaSemana.setDate(hoje.getDate() + 7);
      
      queryBuilder.andWhere('multa.dataLimiteCondutor BETWEEN :hoje AND :umaSemana', {
        hoje: hoje.toISOString().split('T')[0],
        umaSemana: umaSemana.toISOString().split('T')[0]
      });
    }
  }

  /**
   * 🔍 Enriquecer multa com classificações e informações derivadas
   */
  private enriquecerMulta(multa: any) {
    return {
      ...multa,
      
      // ✅ Classificação por tipo
      tipoMulta: multa.codigoOrg === '16' ? 'SEMOB' : 'TRANSITO',
      
      // ✅ Classificação por responsável
      tipoResponsavel: multa.responsavelMulta === 'F' ? 'FUNCIONARIO' : 
                      multa.responsavelMulta === 'E' ? 'EMPRESA' : 'INDEFINIDO',
      
      // ✅ Classificação por gravidade baseada no valor
      gravidadeValor: this.classificarGravidadePorValor(multa.valorMulta),
      
      // ✅ Área de competência descritiva
      areaCompetenciaDesc: this.obterDescricaoAreaCompetencia(multa.codAreaCompetencia),
      
      // ✅ Responsável notificação descritivo
      responsavelNotificacaoDesc: this.obterDescricaoResponsavelNotificacao(multa.codResponsavelNotificacao),
      
      // ✅ Status de alerta para defesa
      alertaDefesa: this.verificarAlertaDefesa(multa.dataLimiteCondutor),
      
      // ✅ Informações de horário para análise
      horarioInfracao: multa.dataHoraMulta ? new Date(multa.dataHoraMulta).getHours() : null,
      
      // ✅ Campos importantes destacados
      temProcessoNotificacao: !!multa.nProcessoNotificacao,
      temObservacaoRealMotivo: !!multa.observacaoRealMotivo,
      temCodigoLinha: !!multa.codIntLinha,
      
      // ✅ Data de recebimento pela empresa
      dataRecebimentoEmpresa: multa.autoDeInfracaoEmissao,
      
      // ✅ Última alteração para auditoria
      ultimaAlteracao: multa.ultAlteracao,
      
      // ✅ Status da multa baseado em regras
      statusMulta: this.determinarStatusMulta(multa),
      
      // ✅ Dias para vencimento de defesa
      diasParaDefesa: this.calcularDiasParaDefesa(multa.dataLimiteCondutor),
    };
  }

  /**
   * 📊 Calcular analytics específicos
   */
  async calcularAnalytics(filters: MultaEnhancedFilter, dataInicio: string, dataFim: string) {
    const queryBuilder = this.multaRepository.createQueryBuilder('multa');
    
    queryBuilder.where('multa.dataEmissaoMulta BETWEEN :dataInicio AND :dataFim', {
      dataInicio,
      dataFim
    });

    this.aplicarFiltrosEnhanced(queryBuilder, filters);
    const resultados = await queryBuilder.getMany();

    return {
      distribuicaoPorTipo: this.calcularDistribuicaoPorTipo(resultados),
      distribuicaoPorGravidade: this.calcularDistribuicaoPorGravidade(resultados),
      distribuicaoPorArea: this.calcularDistribuicaoPorArea(resultados),
      distribuicaoPorResponsavel: this.calcularDistribuicaoPorResponsavel(resultados),
      distribuicaoPorHorario: this.calcularDistribuicaoPorHorario(resultados),
      topAgentes: this.calcularTopAgentes(resultados),
      topLocais: this.calcularTopLocais(resultados),
      topCausasReais: this.calcularTopCausasReais(resultados),
      alertasDefesa: this.calcularAlertasDefesa(resultados),
      evolucaoMensal: this.calcularEvolucaoMensal(resultados),
      estatisticasHorario: this.calcularEstatisticasHorario(resultados),
    };
  }

  /**
   * 📈 Processar agrupamentos
   */
  async processarAgrupamentos(filters: MultaEnhancedFilter, dataInicio: string, dataFim: string) {
    const queryBuilder = this.multaRepository.createQueryBuilder('multa');
    
    queryBuilder.where('multa.dataEmissaoMulta BETWEEN :dataInicio AND :dataFim', {
      dataInicio,
      dataFim
    });

    this.aplicarFiltrosEnhanced(queryBuilder, filters);

    switch (filters.groupBy) {
      case 'agente':
        return await queryBuilder
          .select([
            'multa.agenteCodigo as codigo',
            'multa.agenteDescricao as descricao',
            'COUNT(*) as total',
            'SUM(multa.valorMulta) as "valorTotal"',
            'AVG(multa.valorMulta) as "valorMedio"'
          ])
          .where('multa.agenteCodigo IS NOT NULL')
          .groupBy('multa.agenteCodigo, multa.agenteDescricao')
          .orderBy('total', 'DESC')
          .limit(20)
          .getRawMany();

      case 'area':
        return await queryBuilder
          .select([
            'multa.codAreaCompetencia as codigo',
            'COUNT(*) as total',
            'SUM(multa.valorMulta) as "valorTotal"',
            'AVG(multa.valorMulta) as "valorMedio"'
          ])
          .where('multa.codAreaCompetencia IS NOT NULL')
          .groupBy('multa.codAreaCompetencia')
          .orderBy('total', 'DESC')
          .getRawMany()
          .then(results => results.map(r => ({
            ...r,
            descricao: this.obterDescricaoAreaCompetencia(r.codigo)
          })));

      case 'responsavel':
        return await queryBuilder
          .select([
            'multa.codResponsavelNotificacao as codigo',
            'COUNT(*) as total',
            'SUM(multa.valorMulta) as "valorTotal"',
            'AVG(multa.valorMulta) as "valorMedio"'
          ])
          .where('multa.codResponsavelNotificacao IS NOT NULL')
          .groupBy('multa.codResponsavelNotificacao')
          .orderBy('total', 'DESC')
          .getRawMany()
          .then(results => results.map(r => ({
            ...r,
            descricao: this.obterDescricaoResponsavelNotificacao(r.codigo)
          })));

      case 'gravidade':
        return await queryBuilder
          .select([
            'multa.valorMulta as valor',
            'COUNT(*) as total',
            'SUM(multa.valorMulta) as "valorTotal"'
          ])
          .where('multa.valorMulta IN (:...valores)', { valores: [495, 990, 1980] })
          .groupBy('multa.valorMulta')
          .orderBy('total', 'DESC')
          .getRawMany()
          .then(results => results.map(r => ({
            ...r,
            codigo: r.valor,
            descricao: this.classificarGravidadePorValor(r.valor)
          })));

      case 'tipo':
        return await queryBuilder
          .select([
            'CASE WHEN multa.codigoOrg = \'16\' THEN \'SEMOB\' ELSE \'TRANSITO\' END as tipo',
            'COUNT(*) as total',
            'SUM(multa.valorMulta) as "valorTotal"',
            'AVG(multa.valorMulta) as "valorMedio"'
          ])
          .groupBy('CASE WHEN multa.codigoOrg = \'16\' THEN \'SEMOB\' ELSE \'TRANSITO\' END')
          .orderBy('total', 'DESC')
          .getRawMany();

      case 'mes':
        return await queryBuilder
          .select([
            'TO_CHAR(multa.dataEmissaoMulta, \'YYYY-MM\') as periodo',
            'COUNT(*) as total',
            'SUM(multa.valorMulta) as "valorTotal"',
            'AVG(multa.valorMulta) as "valorMedio"'
          ])
          .groupBy('TO_CHAR(multa.dataEmissaoMulta, \'YYYY-MM\')')
          .orderBy('periodo', 'ASC')
          .getRawMany();

      case 'horario':
        return await queryBuilder
          .select([
            'EXTRACT(HOUR FROM multa.dataHoraMulta) as hora',
            'COUNT(*) as total',
            'SUM(multa.valorMulta) as "valorTotal"'
          ])
          .where('multa.dataHoraMulta IS NOT NULL')
          .groupBy('EXTRACT(HOUR FROM multa.dataHoraMulta)')
          .orderBy('total', 'DESC')
          .getRawMany();

      default:
        return [];
    }
  }

  /**
   * 🏷️ Métodos auxiliares para classificações
   */
  private classificarGravidadePorValor(valor: number): string {
    if (valor === 495) return 'A - LEVE';
    if (valor === 990) return 'B - MÉDIA';
    if (valor === 1980) return 'C - GRAVE/REINCIDÊNCIA';
    return 'INDEFINIDO';
  }

  private obterDescricaoAreaCompetencia(codigo: string): string {
    const areas = {
      '1': 'ADMINISTRAÇÃO',
      '2': 'MANUTENÇÃO',
      '3': 'OPERAÇÃO',
      '4': 'CANCELAMENTO',
      '5': 'PORTARIA',
      '6': 'ELETRICISTA',
      '7': 'PCQC/PORTARIA'
    };
    return areas[codigo] || 'NÃO INFORMADO';
  }

  private obterDescricaoResponsavelNotificacao(codigo: string): string {
    const responsaveis = {
      '1': 'OPERAÇÃO',
      '2': 'MANUTENÇÃO',
      '3': 'ADMINISTRAÇÃO',
      '4': 'PORTARIA',
      '5': 'ELETRICISTA',
      '6': 'PCQC/PORTARIA'
    };
    return responsaveis[codigo] || 'NÃO INFORMADO';
  }

  private verificarAlertaDefesa(dataLimite: string): boolean {
    if (!dataLimite) return false;
    
    const limite = new Date(dataLimite);
    const hoje = new Date();
    const umaSemana = new Date();
    umaSemana.setDate(hoje.getDate() + 7);
    
    return limite <= umaSemana && limite >= hoje;
  }

  private determinarStatusMulta(multa: any): string {
    if (multa.dataPagtoMulta || multa.valorPago > 0) return 'PAGA';
    if (multa.numeroRecursoMulta || multa.numeroRecursoMulta2 || multa.numeroRecursoMulta3) return 'RECURSO';
    if (multa.dataVectoMulta && new Date(multa.dataVectoMulta) < new Date()) return 'VENCIDA';
    return 'PENDENTE';
  }

  private calcularDiasParaDefesa(dataLimite: string): number | null {
    if (!dataLimite) return null;
    
    const limite = new Date(dataLimite);
    const hoje = new Date();
    const diferenca = limite.getTime() - hoje.getTime();
    
    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
  }

  /**
   * 📈 Métodos de cálculo de analytics
   */
  private calcularDistribuicaoPorTipo(multas: any[]) {
    const transito = multas.filter(m => m.codigoOrg !== '16');
    const semob = multas.filter(m => m.codigoOrg === '16');
    
    return [
      {
        tipo: 'TRÂNSITO',
        total: transito.length,
        valor: transito.reduce((sum, m) => sum + (Number(m.valorMulta) || 0), 0),
        percentual: multas.length > 0 ? (transito.length / multas.length) * 100 : 0
      },
      {
        tipo: 'SEMOB',
        total: semob.length,
        valor: semob.reduce((sum, m) => sum + (Number(m.valorMulta) || 0), 0),
        percentual: multas.length > 0 ? (semob.length / multas.length) * 100 : 0
      }
    ];
  }

  private calcularDistribuicaoPorGravidade(multas: any[]) {
    const grupos = {
      'A - LEVE': multas.filter(m => m.valorMulta === 495),
      'B - MÉDIA': multas.filter(m => m.valorMulta === 990),
      'C - GRAVE': multas.filter(m => m.valorMulta === 1980),
      'OUTROS': multas.filter(m => ![495, 990, 1980].includes(m.valorMulta))
    };

    return Object.entries(grupos).map(([gravidade, items]) => ({
      gravidade,
      total: items.length,
      valor: items.reduce((sum, m) => sum + (Number(m.valorMulta) || 0), 0),
      percentual: multas.length > 0 ? (items.length / multas.length) * 100 : 0
    }));
  }

  // ✅ Corrigir os tipos nas funções de distribuição
  private calcularDistribuicaoPorArea(multas: any[]) {
    const areas: Record<string, { codigo: string; descricao: string; total: number; valor: number }> = {};
    
    multas.forEach(multa => {
      const codigo = multa.codAreaCompetencia || 'NAO_INFORMADO';
      const descricao = this.obterDescricaoAreaCompetencia(codigo);
      
      if (!areas[codigo]) {
        areas[codigo] = {
          codigo,
          descricao,
          total: 0,
          valor: 0
        };
      }
      
      areas[codigo].total++;
      areas[codigo].valor += Number(multa.valorMulta) || 0;
    });

    return Object.values(areas)
      .sort((a, b) => Number(b.total) - Number(a.total)); // ✅ Conversão explícita para number
  }

  private calcularDistribuicaoPorResponsavel(multas: any[]) {
    const responsaveis: Record<string, { codigo: string; descricao: string; total: number; valor: number }> = {};
    
    multas.forEach(multa => {
      const codigo = multa.codResponsavelNotificacao || 'NAO_INFORMADO';
      const descricao = this.obterDescricaoResponsavelNotificacao(codigo);
      
      if (!responsaveis[codigo]) {
        responsaveis[codigo] = {
          codigo,
          descricao,
          total: 0,
          valor: 0
        };
      }
      
      responsaveis[codigo].total++;
      responsaveis[codigo].valor += Number(multa.valorMulta) || 0;
    });

    return Object.values(responsaveis)
      .sort((a, b) => Number(b.total) - Number(a.total)); // ✅ Conversão explícita para number
  }

  private calcularDistribuicaoPorHorario(multas: any[]) {
    const horarios: Record<number, number> = {};
    
    multas.forEach(multa => {
      if (multa.dataHoraMulta) {
        const hora = new Date(multa.dataHoraMulta).getHours();
        horarios[hora] = (horarios[hora] || 0) + 1;
      }
    });

    return Object.entries(horarios)
      .map(([hora, total]) => ({ 
        hora: parseInt(hora), 
        total: Number(total),
        periodo: this.obterPeriodoHorario(parseInt(hora))
      }))
      .sort((a, b) => Number(b.total) - Number(a.total));
  }

  private calcularTopAgentes(multas: any[]) {
    const agentes: Record<string, { codigo: string; nome: string; matricula?: string; total: number; valor: number }> = {};
    
    multas.filter(m => m.agenteCodigo).forEach(multa => {
      const key = multa.agenteCodigo;
      if (!agentes[key]) {
        agentes[key] = {
          codigo: multa.agenteCodigo,
          nome: multa.agenteDescricao || 'NÃO INFORMADO',
          matricula: multa.agenteMatriculaFiscal,
          total: 0,
          valor: 0
        };
      }
      agentes[key].total++;
      agentes[key].valor += Number(multa.valorMulta) || 0;
    });
  
    return Object.values(agentes)
      .sort((a, b) => Number(b.total) - Number(a.total)) // ✅ Conversão explícita para number
      .slice(0, 15);
  }

  private calcularTopLocais(multas: any[]) {
    const locais: Record<string, { local: string; total: number; valor: number }> = {};
    
    multas.forEach(multa => {
      const local = multa.localMulta || 'Local não informado';
      if (!locais[local]) {
        locais[local] = {
          local,
          total: 0,
          valor: 0
        };
      }
      locais[local].total++;
      locais[local].valor += Number(multa.valorMulta) || 0;
    });
  
    return Object.values(locais)
      .sort((a, b) => Number(b.total) - Number(a.total)) // ✅ Conversão explícita para number
      .slice(0, 15);
  }

  private calcularTopCausasReais(multas: any[]) {
    const causas: Record<string, { motivo: string; total: number; valor: number }> = {};
    
    multas.filter(m => m.observacaoRealMotivo).forEach(multa => {
      const motivo = multa.observacaoRealMotivo.trim();
      if (!causas[motivo]) {
        causas[motivo] = {
          motivo,
          total: 0,
          valor: 0
        };
      }
      causas[motivo].total++;
      causas[motivo].valor += Number(multa.valorMulta) || 0;
    });

    return Object.values(causas)
      .sort((a, b) => Number(b.total) - Number(a.total)) // ✅ Conversão explícita para number
      .slice(0, 10);
  }

  private calcularAlertasDefesa(multas: any[]) {
    return multas.filter(m => this.verificarAlertaDefesa(m.dataLimiteCondutor)).length;
  }

  private calcularEvolucaoMensal(multas: any[]) {
    const evolucao: Record<string, {
      mes: string;
      totalTransito: number;
      totalSemob: number;
      valorTransito: number;
      valorSemob: number;
    }> = {};
    
    multas.forEach(multa => {
      if (multa.dataEmissaoMulta) {
        const data = new Date(multa.dataEmissaoMulta);
        const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
        
        if (!evolucao[mesAno]) {
          evolucao[mesAno] = {
            mes: mesAno,
            totalTransito: 0,
            totalSemob: 0,
            valorTransito: 0,
            valorSemob: 0
          };
        }
        
        if (multa.codigoOrg === '16') {
          evolucao[mesAno].totalSemob++;
          evolucao[mesAno].valorSemob += Number(multa.valorMulta) || 0;
        } else {
          evolucao[mesAno].totalTransito++;
          evolucao[mesAno].valorTransito += Number(multa.valorMulta) || 0;
        }
      }
    });

    return Object.values(evolucao)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .slice(-12); // Últimos 12 meses
  }

  private calcularEstatisticasHorario(multas: any[]) {
    const stats = {
      horarioPico: null as number | null,
      horarioMenor: null as number | null,
      mediaHoraria: 0,
      distribuicaoPorPeriodo: {
        manha: 0,      // 6-12h
        tarde: 0,      // 12-18h
        noite: 0,      // 18-24h
        madrugada: 0   // 0-6h
      }
    };

    const horarios: Record<number, number> = {};
    let totalComHorario = 0;

    multas.forEach(multa => {
      if (multa.dataHoraMulta) {
        const hora = new Date(multa.dataHoraMulta).getHours();
        horarios[hora] = (horarios[hora] || 0) + 1;
        totalComHorario++;

        // Distribuição por período
        if (hora >= 6 && hora < 12) stats.distribuicaoPorPeriodo.manha++;
        else if (hora >= 12 && hora < 18) stats.distribuicaoPorPeriodo.tarde++;
        else if (hora >= 18 && hora < 24) stats.distribuicaoPorPeriodo.noite++;
        else stats.distribuicaoPorPeriodo.madrugada++;
      }
    });

    if (totalComHorario > 0) {
      const horariosOrdenados = Object.entries(horarios)
        .map(([hora, total]) => ({ hora: parseInt(hora), total: Number(total) }))
        .sort((a, b) => Number(b.total) - Number(a.total));

      stats.horarioPico = horariosOrdenados[0]?.hora || null;
      stats.horarioMenor = horariosOrdenados[horariosOrdenados.length - 1]?.hora || null;
      stats.mediaHoraria = totalComHorario / 24;
    }

    return stats;
  }

  private obterPeriodoHorario(hora: number): string {
    if (hora >= 6 && hora < 12) return 'Manhã';
    if (hora >= 12 && hora < 18) return 'Tarde';
    if (hora >= 18 && hora < 24) return 'Noite';
    return 'Madrugada';
  }

  private calcularResumo(multas: any[]) {
    const resumo = {
      totalMultas: multas.length,
      valorTotal: multas.reduce((sum, m) => sum + (Number(m.valorMulta) || 0), 0),
      valorMedio: 0,
      
      // Por tipo
      multasTransito: multas.filter(m => m.tipoMulta === 'TRANSITO').length,
      multasSemob: multas.filter(m => m.tipoMulta === 'SEMOB').length,
      
      // Por responsável
      multasFuncionario: multas.filter(m => m.responsavelMulta === 'F').length,
      multasEmpresa: multas.filter(m => m.responsavelMulta === 'E').length,
      
      // Por gravidade
      multasLeves: multas.filter(m => m.valorMulta === 495).length,
      multasMedias: multas.filter(m => m.valorMulta === 990).length,
      multasGraves: multas.filter(m => m.valorMulta === 1980).length,
      
      // Alertas e campos importantes
      alertasDefesa: multas.filter(m => m.alertaDefesa).length,
      comProcessoNotificacao: multas.filter(m => m.temProcessoNotificacao).length,
      comObservacaoRealMotivo: multas.filter(m => m.temObservacaoRealMotivo).length,
      comCodigoLinha: multas.filter(m => m.temCodigoLinha).length,
      
      // Status
      multasPagas: multas.filter(m => m.statusMulta === 'PAGA').length,
      multasVencidas: multas.filter(m => m.statusMulta === 'VENCIDA').length,
      multasRecurso: multas.filter(m => m.statusMulta === 'RECURSO').length,
      multasPendentes: multas.filter(m => m.statusMulta === 'PENDENTE').length,
      
      // Estatísticas
      agentesUnicos: [...new Set(multas.filter(m => m.agenteCodigo).map(m => m.agenteCodigo))].length,
      veiculosUnicos: [...new Set(multas.filter(m => m.prefixoVeic).map(m => m.prefixoVeic))].length,
      locaisUnicos: [...new Set(multas.filter(m => m.localMulta).map(m => m.localMulta))].length,
    };

    // Calcular valor médio
    resumo.valorMedio = resumo.totalMultas > 0 ? resumo.valorTotal / resumo.totalMultas : 0;

    return resumo;
  }

  /**
   * 🔄 Métodos de sincronização (reutilizados do service original)
   */
  private getStartOfYear(): string {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return start.toISOString().split('T')[0];
  }

  private getEndOfYear(): string {
    const now = new Date();
    const end = new Date(now.getFullYear(), 11, 31);
    return end.toISOString().split('T')[0];
  }

  private async verificarDadosCache(dataInicio: string, dataFim: string) {
    const count = await this.multaRepository.count({
      where: {
        dataEmissaoMulta: Between(new Date(dataInicio), new Date(dataFim))
      }
    });

    const ultimaSincronizacao = await this.multaRepository
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
          const multaExistente = await this.multaRepository.findOne({
            where: { numeroAiMulta: registro.NUMEROAIMULTA }
          });

          const multaData = this.mapearDadosOracle(registro);

          if (multaExistente) {
            await this.multaRepository.update(
              { numeroAiMulta: registro.NUMEROAIMULTA },
              { ...multaData, sincronizadoEm: new Date() }
            );
            atualizados++;
          } else {
            await this.multaRepository.save({
              ...multaData,
              sincronizadoEm: new Date()
            });
            novos++;
          }
        } catch (error) {
          erros++;
          this.logger.warn(`⚠️ Erro ao processar registro ${registro.NUMEROAIMULTA}: ${error.message}`);
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

  private mapearDadosOracle(registro: any): Partial<MultaCompleta> {
    return {
      // Campos básicos
      numeroAiMulta: registro.NUMEROAIMULTA,
      descricaoInfra: registro.DESCRICAOINFRA,
      prefixoVeic: registro.PREFIXOVEIC,
      codIntFunc: registro.CODINTFUNC,
      codigoVeic: registro.CODIGOVEIC,
      codigoInfra: registro.CODIGOINFRA,
      codigoUf: registro.CODIGOUF,
      codMunic: registro.CODMUNIC,
      codigoOrg: registro.CODIGOORG,
      
      // Datas principais
      dataEmissaoMulta: this.parseOracleDate(registro.DATAEMISSAOMULTA),
      localMulta: registro.LOCALMULTA,
      numeroLocalMulta: registro.NUMEROLOCALMULTA,
      dataHoraMulta: this.parseOracleDate(registro.DATAHORAMULTA),
      dataVectoMulta: this.parseOracleDate(registro.DATAVECTOMULTA),
      
      // Valores financeiros
      valorMulta: this.parseFloat(registro.VALORMULTA),
      totalParcelasMulta: this.parseInt(registro.TOTALPARCELASMULTA),
      valorTotalMulta: this.parseFloat(registro.VALORTOTALMULTA),
      dataPagtoMulta: this.parseOracleDate(registro.DATAPAGTOMULTA),
      responsavelMulta: registro.RESPONSAVELMULTA,
      
      // Recursos
      numeroRecursoMulta: registro.NUMERORECURSOMULTA,
      dataRecursoMulta: this.parseOracleDate(registro.DATARECURSOMULTA),
      condicaoRecursoMulta: registro.CONDICAORECURSOMULTA,
      numeroRecursoMulta2: registro.NUMERORECURSOMULTA2,
      dataRecursoMulta2: this.parseOracleDate(registro.DATARECURSOMULTA2),
      condicaoRecursoMulta2: registro.CONDICAORECURSOMULTA2,
      numeroRecursoMulta3: registro.NUMERORECURSOMULTA3,
      dataRecursoMulta3: this.parseOracleDate(registro.DATARECURSOMULTA3),
      condicaoRecursoMulta3: registro.CONDICAORECURSOMULTA3,
      
            // Campos importantes para as novas funcionalidades
            dataLimiteCondutor: this.parseOracleDate(registro.DATALIMITECONDUTOR),
            codAreaCompetencia: registro.COD_AREA_COMPETENCIA,
            codResponsavelNotificacao: registro.COD_RESPONSAVEL_NOTIFICACAO,
            codAgenteAutuador: registro.COD_AGENTE_AUTUADOR,
            codIntLinha: registro.CODINTLINHA,
            nProcessoNotificacao: registro.NPROCESSONOTIFICACAO,
            observacaoRealMotivo: registro.OBSERVACAOREALMOTIVO,
            autoDeInfracaoEmissao: this.parseOracleDate(registro.AUTODEINFRACAOEMISSAO),
            ultAlteracao: this.parseOracleDate(registro.ULTALTERACAO),
            
            // Dados do agente
            agenteCodigo: registro.AGENTE_CODIGO,
            agenteDescricao: registro.AGENTE_DESCRICAO,
            agenteMatriculaFiscal: registro.AGENTE_MATRICULA_FISCAL,
      
            // Controle
            codigoEmpresa: 4
          };
        }
      
        private parseOracleDate(dateValue: any): Date | null {
          if (!dateValue) return null;
          
          try {
            if (dateValue instanceof Date) {
              if (isNaN(dateValue.getTime()) || dateValue.getFullYear() === 1899) {
                return null;
              }
              return dateValue;
            }
            
            if (typeof dateValue === 'string') {
              const cleanValue = dateValue.trim();
              if (!cleanValue || cleanValue === '30/12/1899' || cleanValue.includes('1899')) {
                return null;
              }
              
              if (cleanValue.includes('/')) {
                const parts = cleanValue.split(' ');
                const datePart = parts[0];
                const timePart = parts[1] || '00:00:00';
                
                const [day, month, year] = datePart.split('/');
                
                const dayNum = parseInt(day, 10);
                const monthNum = parseInt(month, 10);
                const yearNum = parseInt(year, 10);
                
                if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) {
                  return null;
                }
                
                if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
                  return null;
                }
                
                let hourNum = 0, minuteNum = 0, secondNum = 0;
                if (timePart && timePart !== '00:00:00') {
                  const [hour, minute, second] = timePart.split(':');
                  hourNum = parseInt(hour || '0', 10);
                  minuteNum = parseInt(minute || '0', 10);
                  secondNum = parseInt(second || '0', 10);
                  
                  if (isNaN(hourNum) || isNaN(minuteNum) || isNaN(secondNum) ||
                      hourNum < 0 || hourNum > 23 || minuteNum < 0 || minuteNum > 59 || secondNum < 0 || secondNum > 59) {
                    hourNum = minuteNum = secondNum = 0;
                  }
                }
                
                const date = new Date(yearNum, monthNum - 1, dayNum, hourNum, minuteNum, secondNum);
                
                if (isNaN(date.getTime()) || 
                    date.getDate() !== dayNum || 
                    date.getMonth() !== (monthNum - 1) || 
                    date.getFullYear() !== yearNum) {
                  return null;
                }
                
                return date;
              }
              
              const date = new Date(cleanValue);
              if (isNaN(date.getTime()) || date.getFullYear() === 1899) {
                return null;
              }
              
              return date;
            }
            
            if (typeof dateValue === 'number') {
              const date = new Date(dateValue);
              if (isNaN(date.getTime()) || date.getFullYear() === 1899) {
                return null;
              }
              return date;
            }
            
            return null;
          } catch (error) {
            return null;
          }
        }
      
        private parseFloat(value: any): number {
          if (value === null || value === undefined || value === '') return 0;
          
          try {
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
         * 🔍 Buscar multa específica por número
         */
        async buscarPorNumero(numeroAiMulta: string): Promise<any | null> {
          let multa = await this.multaRepository.findOne({
            where: { numeroAiMulta }
          });
      
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
                multa = await this.multaRepository.save({
                  ...multaData,
                  sincronizadoEm: new Date()
                });
              }
            } catch (error) {
              this.logger.error(`❌ Erro ao buscar multa no Oracle: ${error.message}`);
            }
          }
      
          return multa ? this.enriquecerMulta(multa) : null;
        }
      
        /**
         * 🔄 Sincronização manual
         */
        async sincronizarManual(dataInicio?: string, dataFim?: string): Promise<SyncResult> {
          const inicio = dataInicio || this.getStartOfYear();
          const fim = dataFim || this.getEndOfYear();
      
          return await this.sincronizarDadosOracle(inicio, fim);
        }
      
        /**
         * 📊 Estatísticas do cache
         */
        async estatisticasCache(): Promise<any> {
          const stats = await this.multaRepository
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
      
          const estatisticasPeriodo = await this.multaRepository
            .createQueryBuilder('m')
            .select([
              "TO_CHAR(m.dataEmissaoMulta, 'YYYY-MM') as mes",
              'COUNT(*) as quantidade',
              'SUM(m.valorMulta) as valor'
            ])
            .groupBy("TO_CHAR(m.dataEmissaoMulta, 'YYYY-MM')")
            .orderBy('mes', 'DESC')
            .limit(12)
            .getRawMany();
      
          // Estatísticas específicas das novas funcionalidades
          const estatisticasEnhanced = await this.multaRepository
            .createQueryBuilder('m')
            .select([
              'COUNT(CASE WHEN m.codigoOrg = \'16\' THEN 1 END) as totalSemob',
              'COUNT(CASE WHEN m.codigoOrg != \'16\' OR m.codigoOrg IS NULL THEN 1 END) as totalTransito',
              'COUNT(CASE WHEN m.responsavelMulta = \'F\' THEN 1 END) as totalFuncionario',
              'COUNT(CASE WHEN m.responsavelMulta = \'E\' THEN 1 END) as totalEmpresa',
              'COUNT(CASE WHEN m.valorMulta = 495 THEN 1 END) as totalLeves',
              'COUNT(CASE WHEN m.valorMulta = 990 THEN 1 END) as totalMedias',
              'COUNT(CASE WHEN m.valorMulta = 1980 THEN 1 END) as totalGraves',
              'COUNT(CASE WHEN m.nProcessoNotificacao IS NOT NULL THEN 1 END) as comProcessoNotificacao',
              'COUNT(CASE WHEN m.observacaoRealMotivo IS NOT NULL THEN 1 END) as comObservacaoRealMotivo',
              'COUNT(CASE WHEN m.codIntLinha IS NOT NULL THEN 1 END) as comCodigoLinha'
            ])
            .getRawOne();
      
          return {
            ...stats,
            ...estatisticasEnhanced,
            estatisticasPorMes: estatisticasPeriodo
          };
        }
      
        /**
         * 🧹 Limpar cache antigo
         */
        async limparCacheAntigo(diasAntigos: number = 90): Promise<number> {
          const dataLimite = new Date();
          dataLimite.setDate(dataLimite.getDate() - diasAntigos);
      
          const resultado = await this.multaRepository
            .createQueryBuilder()
            .delete()
            .where('dataEmissaoMulta < :dataLimite', { dataLimite })
            .execute();
      
          this.logger.log(`🧹 Removidos ${resultado.affected} registros antigos do cache`);
          return resultado.affected || 0;
        }
      
        /**
         * 🚨 Obter alertas de defesa
         */
        async obterAlertasDefesa(): Promise<any[]> {
          const hoje = new Date();
          const umaSemana = new Date();
          umaSemana.setDate(hoje.getDate() + 7);
      
          const multas = await this.multaRepository
            .createQueryBuilder('m')
            .where('m.dataLimiteCondutor BETWEEN :hoje AND :umaSemana', {
              hoje: hoje.toISOString().split('T')[0],
              umaSemana: umaSemana.toISOString().split('T')[0]
            })
            .orderBy('m.dataLimiteCondutor', 'ASC')
            .getMany();
      
          return multas.map(multa => this.enriquecerMulta(multa));
        }
      
        /**
         * 📈 Dashboard executivo
         */
        async obterDashboardExecutivo(filters: MultaEnhancedFilter = {}): Promise<any> {
          const resultado = await this.buscarMultasEnhanced({
            ...filters,
            includeAnalytics: true,
            limit: 10000 // Para cálculos completos
          });
      
          const alertasDefesa = await this.obterAlertasDefesa();
      
          return {
            kpis: resultado.resumo,
            analytics: resultado.analytics,
            alertas: {
              defesaVencendo: alertasDefesa.length,
              semProcessoNotificacao: resultado.resumo.comProcessoNotificacao,
              semObservacaoMotivo: resultado.resumo.comObservacaoRealMotivo,
            },
            alertasDetalhados: alertasDefesa.slice(0, 10) // Top 10 alertas mais urgentes
          };
        }
      
        /**
         * 📊 Relatório de comparação por período
         */
        async compararPeriodos(periodo1: { inicio: string; fim: string }, periodo2: { inicio: string; fim: string }): Promise<any> {
          const [dados1, dados2] = await Promise.all([
            this.buscarMultasEnhanced({
              dataInicio: periodo1.inicio,
              dataFim: periodo1.fim,
              includeAnalytics: true,
              limit: 10000
            }),
            this.buscarMultasEnhanced({
              dataInicio: periodo2.inicio,
              dataFim: periodo2.fim,
              includeAnalytics: true,
              limit: 10000
            })
          ]);
      
          return {
            periodo1: {
              periodo: periodo1,
              resumo: dados1.resumo,
              analytics: dados1.analytics
            },
            periodo2: {
              periodo: periodo2,
              resumo: dados2.resumo,
              analytics: dados2.analytics
            },
            comparacao: {
              variacaoTotal: dados2.resumo.totalMultas - dados1.resumo.totalMultas,
              variacaoValor: dados2.resumo.valorTotal - dados1.resumo.valorTotal,
              variacaoPercentual: dados1.resumo.totalMultas > 0 ? 
                ((dados2.resumo.totalMultas - dados1.resumo.totalMultas) / dados1.resumo.totalMultas) * 100 : 0
            }
          };
        }
      
        /**
         * 🔍 Busca avançada com múltiplos critérios
         */
        async buscaAvancada(criterios: {
          textoLivre?: string;
          campos?: string[];
          operador?: 'AND' | 'OR';
        } & MultaEnhancedFilter): Promise<MultaEnhancedResult> {
          // ✅ Criar uma cópia dos filtros com tipagem correta
          const filters: MultaEnhancedFilter = { ...criterios };
          
          // Se há texto livre, aplicar busca em múltiplos campos
          if (criterios.textoLivre) {
            const campos = criterios.campos || [
              'numeroAiMulta',
              'prefixoVeic',
              'descricaoInfra',
              'localMulta',
              'agenteDescricao',
              'observacao',
              'observacaoRealMotivo'
            ];
            
            // ✅ Agora a propriedade existe na interface
            filters.buscaAvancada = {
              texto: criterios.textoLivre,
              campos,
              operador: criterios.operador || 'OR'
            };
          }
      
          return this.buscarMultasEnhanced(filters);
        }
      
        /**
         * 📋 Validar dados de multa
         */
        async validarDados(numeroAiMulta: string): Promise<{
          valido: boolean;
          erros: string[];
          warnings: string[];
          sugestoes: string[];
        }> {
          const multa = await this.buscarPorNumero(numeroAiMulta);
          
          if (!multa) {
            return {
              valido: false,
              erros: ['Multa não encontrada'],
              warnings: [],
              sugestoes: ['Verifique o número da multa e tente novamente']
            };
          }
      
          const erros: string[] = [];
          const warnings: string[] = [];
          const sugestoes: string[] = [];
      
          // Validações obrigatórias
          if (!multa.prefixoVeic) erros.push('Prefixo do veículo não informado');
          if (!multa.dataEmissaoMulta) erros.push('Data de emissão não informada');
          if (!multa.valorMulta || multa.valorMulta <= 0) erros.push('Valor da multa inválido');
          if (!multa.descricaoInfra) erros.push('Descrição da infração não informada');
      
          // Warnings para campos importantes
          if (!multa.nProcessoNotificacao) warnings.push('Número do processo de notificação não informado');
          if (!multa.observacaoRealMotivo) warnings.push('Observação do real motivo não informada');
          if (!multa.codIntLinha) warnings.push('Código da linha não informado');
          if (!multa.dataLimiteCondutor) warnings.push('Data limite para defesa não informada');
      
          // Sugestões baseadas no tipo de multa
          if (multa.tipoMulta === 'SEMOB' && !multa.agenteCodigo) {
            sugestoes.push('Para multas SEMOB, é recomendado informar o código do agente');
          }
      
          if (multa.alertaDefesa) {
            sugestoes.push('Esta multa está próxima do prazo de defesa. Verificar urgência.');
          }
      
          return {
            valido: erros.length === 0,
            erros,
            warnings,
            sugestoes
          };
        }
      
        /**
         * 📜 Obter histórico de alterações (simulado)
         */
        async obterHistorico(numeroAiMulta: string): Promise<Array<{
          data: string;
          usuario: string;
          acao: string;
          detalhes: string;
          valorAnterior?: any;
          valorNovo?: any;
        }>> {
          const multa = await this.buscarPorNumero(numeroAiMulta);
          
          if (!multa) {
            return [];
          }
      
          // Histórico simulado baseado nos dados da multa
          const historico = [];
      
          if (multa.sincronizadoEm) {
            historico.push({
              data: multa.sincronizadoEm,
              usuario: 'SISTEMA_SYNC',
              acao: 'SINCRONIZACAO',
              detalhes: 'Dados sincronizados do Oracle'
            });
          }
      
          if (multa.ultimaAlteracao) {
            historico.push({
              data: multa.ultimaAlteracao,
              usuario: 'USUARIO_ORACLE',
              acao: 'ALTERACAO',
              detalhes: 'Última alteração registrada no Oracle'
            });
          }
      
          if (multa.dataPagtoMulta) {
            historico.push({
              data: multa.dataPagtoMulta,
              usuario: 'SISTEMA_PAGAMENTO',
              acao: 'PAGAMENTO',
              detalhes: `Pagamento realizado no valor de R$ ${multa.valorPago || multa.valorMulta}`
            });
          }
      
          return historico.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        }
      }