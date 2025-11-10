// src/modules/departamentos/juridico/services/analytics.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AgenteRepository } from '../repositories/agente.repository';
import { MetricasRepository } from '../repositories/metricas.repository';
import { MultaCacheRepository, FiltrosCache } from '../repositories/multa-cache.repository';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly agenteRepository: AgenteRepository,
    private readonly metricasRepository: MetricasRepository,
    private readonly multaCacheRepository: MultaCacheRepository
  ) {}

  async getDashboardExecutivo(periodo?: string, garagem?: string): Promise<any> {
    try {
      this.logger.log('📊 Gerando dashboard executivo');

      const [
        resumoGeral,
        rankingAgentes,
        tendencias,
        distribuicaoGravidade
      ] = await Promise.all([
        this.obterResumoGeral(periodo, garagem),
        this.obterRankingAgentes(periodo),
        this.obterTendenciasSimplificadas(periodo),
        this.obterDistribuicaoGravidade(periodo, garagem)
      ]);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        periodo: periodo || 'ULTIMO_MES',
        garagem: garagem || 'TODAS',
        resumo: resumoGeral,
        rankings: {
          agentes: rankingAgentes
        },
        tendencias,
        distribuicoes: {
          gravidade: distribuicaoGravidade
        }
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao gerar dashboard: ${error.message}`);
      throw error;
    }
  }

  async getRankings(tipo: string, periodo?: string): Promise<any> {
    try {
      this.logger.log(`🏆 Gerando ranking: ${tipo}`);

      switch (tipo.toLowerCase()) {
        case 'agentes':
          return await this.obterRankingAgentes(periodo);
        case 'garagens':
          return await this.obterRankingGaragens(periodo);
        case 'infracoes':
          return await this.obterRankingInfracoes(periodo);
        default:
          throw new Error(`Tipo de ranking não suportado: ${tipo}`);
      }

    } catch (error) {
      this.logger.error(`❌ Erro ao gerar ranking: ${error.message}`);
      throw error;
    }
  }

  async getTendencias(tipo: string, categoria?: string): Promise<any> {
    try {
      this.logger.log(`📈 Analisando tendências: ${tipo}`);

      const periodo = this.calcularPeriodoTendencia(tipo);
      
      // ✅ USAR MÉTODO CORRETO DO REPOSITORY
      const dados = await this.multaCacheRepository.buscarPorPeriodo(
        periodo.inicio,
        periodo.fim
      );

      return this.analisarTendencias(dados, tipo);

    } catch (error) {
      this.logger.error(`❌ Erro ao analisar tendências: ${error.message}`);
      throw error;
    }
  }

  // ✅ MÉTODOS PRIVADOS CORRIGIDOS

  private async obterResumoGeral(periodo?: string, garagem?: string): Promise<any> {
    try {
      const filtros = this.construirFiltrosPeriodo(periodo);
      
      // ✅ USAR FILTROS CORRETOS
      const filtrosCache: FiltrosCache = {
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
      };

      if (garagem) {
        filtrosCache.codigoGaragem = [parseInt(garagem)];
      }

      // ✅ USAR MÉTODO CORRETO DO REPOSITORY
      const resultado = await this.multaCacheRepository.buscarComFiltros(filtrosCache);
      const dados = resultado.dados;

      return {
        totalMultas: dados.length,
        valorTotal: dados.reduce((sum, m) => sum + (m.valor_multa || 0), 0),
        multasPagas: dados.filter(m => m.status_multa === 'PAGA').length,
        multasVencidas: dados.filter(m => m.status_multa === 'VENCIDA').length,
        taxaArrecadacao: this.calcularTaxaArrecadacao(dados)
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao obter resumo geral: ${error.message}`);
      return {
        totalMultas: 0,
        valorTotal: 0,
        multasPagas: 0,
        multasVencidas: 0,
        taxaArrecadacao: 0
      };
    }
  }

  private async obterRankingAgentes(periodo?: string): Promise<any> {
    try {
      const filtros = this.construirFiltrosPeriodo(periodo);
      
      // ✅ BUSCAR DADOS E PROCESSAR LOCALMENTE
      const dados = await this.multaCacheRepository.buscarPorPeriodo(
        filtros.dataInicio,
        filtros.dataFim
      );

      // ✅ AGRUPAR POR AGENTE
      const agentesMap = new Map();
      
      dados.forEach(multa => {
        const codigoAgente = multa.codigo_agente_autuador || 'SEM_AGENTE';
        const nomeAgente = multa.nome_agente || 'Não informado';
        
        if (!agentesMap.has(codigoAgente)) {
          agentesMap.set(codigoAgente, {
            codigo: codigoAgente,
            nome: nomeAgente,
            totalMultas: 0,
            valorTotal: 0,
            multasPorDia: 0,
            valorMedio: 0,
            eficiencia: 0,
            classificacao: 'NORMAL'
          });
        }
        
        const agente = agentesMap.get(codigoAgente);
        agente.totalMultas++;
        agente.valorTotal += multa.valor_multa || 0;
      });

      // ✅ CALCULAR MÉTRICAS E ORDENAR
      const ranking = Array.from(agentesMap.values())
        .map(agente => {
          agente.valorMedio = agente.totalMultas > 0 ? agente.valorTotal / agente.totalMultas : 0;
          agente.multasPorDia = agente.totalMultas / 30; // Estimativa baseada em 30 dias
          agente.eficiencia = this.calcularEficienciaAgente(agente);
          agente.classificacao = this.classificarAgente(agente);
          return agente;
        })
        .sort((a, b) => b.totalMultas - a.totalMultas)
        .slice(0, 10);

      return {
        tipo: 'AGENTES_PRODUTIVIDADE',
        periodo: periodo || 'GERAL',
        dados: ranking.map((agente, index) => ({
          posicao: index + 1,
          codigo: agente.codigo,
          nome: agente.nome,
          totalMultas: agente.totalMultas,
          valorTotal: agente.valorTotal,
          meta: 0, // Buscar da base se necessário
          percentualMeta: '0.0',
          multasPorDia: Number(agente.multasPorDia.toFixed(1)),
          valorMedio: Number(agente.valorMedio.toFixed(2)),
          eficiencia: agente.eficiencia,
          classificacao: agente.classificacao
        }))
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao obter ranking de agentes: ${error.message}`);
      return {
        tipo: 'AGENTES_PRODUTIVIDADE',
        periodo: periodo || 'GERAL',
        dados: []
      };
    }
  }

  private async obterRankingGaragens(periodo?: string): Promise<any> {
    try {
      const filtros = this.construirFiltrosPeriodo(periodo);
      
      const dados = await this.multaCacheRepository.buscarPorPeriodo(
        filtros.dataInicio,
        filtros.dataFim
      );

      const garagensMap = new Map();
      
      dados.forEach(multa => {
        const garagem = multa.nome_garagem || 'NAO_INFORMADO';
        if (!garagensMap.has(garagem)) {
          garagensMap.set(garagem, {
            nome: garagem,
            codigo: multa.codigo_garagem || 0,
            totalMultas: 0,
            valorTotal: 0
          });
        }
        
        const item = garagensMap.get(garagem);
        item.totalMultas++;
        item.valorTotal += multa.valor_multa || 0;
      });

      const ranking = Array.from(garagensMap.values())
        .sort((a, b) => b.totalMultas - a.totalMultas)
        .map((item, index) => ({
          posicao: index + 1,
          ...item,
          valorMedio: item.totalMultas > 0 ? (item.valorTotal / item.totalMultas).toFixed(2) : '0.00'
        }));

      return {
        tipo: 'GARAGENS_PRODUTIVIDADE',
        periodo: periodo || 'ULTIMO_MES',
        dados: ranking
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao obter ranking de garagens: ${error.message}`);
      return {
        tipo: 'GARAGENS_PRODUTIVIDADE',
        periodo: periodo || 'ULTIMO_MES',
        dados: []
      };
    }
  }

  private async obterRankingInfracoes(periodo?: string): Promise<any> {
    try {
      const filtros = this.construirFiltrosPeriodo(periodo);
      
      const dados = await this.multaCacheRepository.buscarPorPeriodo(
        filtros.dataInicio,
        filtros.dataFim
      );

      const infracoesMap = new Map();
      
      dados.forEach(multa => {
        const infracao = multa.descricao_infracao || 'NAO_INFORMADO';
        if (!infracoesMap.has(infracao)) {
          infracoesMap.set(infracao, {
            descricao: infracao,
            codigo: multa.codigo_infracao || 'N/A',
            quantidade: 0,
            valorTotal: 0,
            gravidade: multa.gravidade_infracao || 'MEDIA'
          });
        }
        
        const item = infracoesMap.get(infracao);
        item.quantidade++;
        item.valorTotal += multa.valor_multa || 0;
      });

      const ranking = Array.from(infracoesMap.values())
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 15)
        .map((item, index) => ({
          posicao: index + 1,
          ...item,
          percentualTotal: dados.length > 0 ? ((item.quantidade / dados.length) * 100).toFixed(2) : '0.00'
        }));

      return {
        tipo: 'INFRACOES_MAIS_FREQUENTES',
        periodo: periodo || 'ULTIMO_MES',
        dados: ranking
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao obter ranking de infrações: ${error.message}`);
      return {
        tipo: 'INFRACOES_MAIS_FREQUENTES',
        periodo: periodo || 'ULTIMO_MES',
        dados: []
      };
    }
  }

  private async obterDistribuicaoGravidade(periodo?: string, garagem?: string): Promise<any> {
    try {
      const filtros = this.construirFiltrosPeriodo(periodo);
      
      const filtrosCache: FiltrosCache = {
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim,
      };

      if (garagem) {
        filtrosCache.codigoGaragem = [parseInt(garagem)];
      }

      const resultado = await this.multaCacheRepository.buscarComFiltros(filtrosCache);
      const dados = resultado.dados;

      const distribuicao = {
        LEVE: 0,
        MEDIA: 0,
        GRAVE: 0,
        GRAVISSIMA: 0
      };

      dados.forEach(multa => {
        const gravidade = multa.gravidade_infracao || 'MEDIA';
        if (distribuicao.hasOwnProperty(gravidade)) {
          distribuicao[gravidade as keyof typeof distribuicao]++;
        }
      });

      const total = dados.length;
      
      return Object.entries(distribuicao).map(([gravidade, quantidade]) => ({
        gravidade,
        quantidade,
        percentual: total > 0 ? ((quantidade / total) * 100).toFixed(2) : '0.00'
      }));
    } catch (error) {
      this.logger.error(`❌ Erro ao obter distribuição por gravidade: ${error.message}`);
      return [];
    }
  }

  private async obterTendenciasSimplificadas(periodo?: string): Promise<any> {
    try {
      const filtros = this.calcularPeriodoTendencia('mensal');
      
      const dados = await this.multaCacheRepository.buscarPorPeriodo(
        filtros.inicio,
        filtros.fim
      );

      // ✅ AGRUPAR POR MÊS
      const dadosPorMes = new Map();
      
      dados.forEach(multa => {
        if (multa.data_emissao) {
          const mes = multa.data_emissao.toISOString().substring(0, 7); // YYYY-MM
          if (!dadosPorMes.has(mes)) {
            dadosPorMes.set(mes, { quantidade: 0, valor: 0 });
          }
          const item = dadosPorMes.get(mes);
          item.quantidade++;
          item.valor += multa.valor_multa || 0;
        }
      });

      const tendencias = Array.from(dadosPorMes.entries())
        .map(([mes, dados]) => ({
          periodo: mes,
          quantidade: dados.quantidade,
          valor: dados.valor
        }))
        .sort((a, b) => a.periodo.localeCompare(b.periodo));

      return {
        tipo: 'MENSAL',
        dados: tendencias,
        analise: this.calcularTendencia(tendencias),
        previsao: this.calcularPrevisao(tendencias)
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao obter tendências: ${error.message}`);
      return {
        tipo: 'MENSAL',
        dados: [],
        analise: 'ERRO',
        previsao: null
      };
    }
  }

  // ✅ MÉTODOS AUXILIARES

  private construirFiltrosPeriodo(periodo?: string): { dataInicio: Date; dataFim: Date } {
    const hoje = new Date();
    let dataInicio: Date;
    let dataFim: Date = hoje;

    switch (periodo?.toUpperCase()) {
      case 'HOJE':
        dataInicio = new Date(hoje);
        dataInicio.setHours(0, 0, 0, 0);
        break;
      case 'SEMANA':
        dataInicio = new Date(hoje);
        dataInicio.setDate(hoje.getDate() - 7);
        break;
      case 'MES':
        dataInicio = new Date(hoje);
        dataInicio.setMonth(hoje.getMonth() - 1);
        break;
      case 'TRIMESTRE':
        dataInicio = new Date(hoje);
        dataInicio.setMonth(hoje.getMonth() - 3);
        break;
      case 'ANO':
        dataInicio = new Date(hoje);
        dataInicio.setFullYear(hoje.getFullYear() - 1);
        break;
      default:
        dataInicio = new Date(hoje);
        dataInicio.setMonth(hoje.getMonth() - 1);
    }

    return { dataInicio, dataFim };
  }

  private calcularPeriodoTendencia(tipo: string): { inicio: Date; fim: Date } {
    const hoje = new Date();
    let meses: number;

    switch (tipo.toLowerCase()) {
      case 'mensal':
        meses = 12;
        break;
      case 'trimestral':
        meses = 24;
        break;
      case 'anual':
        meses = 60;
        break;
      default:
        meses = 6;
    }

    const inicio = new Date(hoje);
    inicio.setMonth(hoje.getMonth() - meses);

    return { inicio, fim: hoje };
  }

  private analisarTendencias(dados: any[], tipo: string): any {
    try {
      const dadosAgrupados = this.agruparDadosPorPeriodo(dados, tipo);
      
      return {
        tipo,
        dados: dadosAgrupados,
        analise: this.calcularTendencia(dadosAgrupados),
        previsao: this.calcularPrevisao(dadosAgrupados)
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao analisar tendências: ${error.message}`);
      return {
        tipo,
        dados: [],
        analise: 'ERRO',
        previsao: null
      };
    }
  }

  private agruparDadosPorPeriodo(dados: any[], tipo: string): any[] {
    try {
      const agrupados = new Map();
      
      dados.forEach(item => {
        if (item.data_emissao) {
          let chave: string;
          
          switch (tipo.toLowerCase()) {
            case 'mensal':
              chave = item.data_emissao.toISOString().substring(0, 7); // YYYY-MM
              break;
            case 'diario':
              chave = item.data_emissao.toISOString().substring(0, 10); // YYYY-MM-DD
              break;
            default:
              chave = item.data_emissao.toISOString().substring(0, 7);
          }
          
          if (!agrupados.has(chave)) {
            agrupados.set(chave, { periodo: chave, valor: 0, valorTotal: 0 });
          }
          
          const grupo = agrupados.get(chave);
          grupo.valor++;
          grupo.valorTotal += item.valor_multa || 0;
        }
      });

      return Array.from(agrupados.values()).sort((a, b) => a.periodo.localeCompare(b.periodo));
    } catch (error) {
      this.logger.error(`❌ Erro ao agrupar dados: ${error.message}`);
      return [];
    }
  }

  private calcularTendencia(dados: any[]): string {
    if (dados.length < 2) return 'INSUFICIENTE';
    
    try {
      const primeiro = dados[0]?.valor || 0;
      const ultimo = dados[dados.length - 1]?.valor || 0;
      
      if (ultimo > primeiro * 1.1) return 'CRESCENTE';
      if (ultimo < primeiro * 0.9) return 'DECRESCENTE';
      return 'ESTAVEL';
    } catch (error) {
      this.logger.error(`❌ Erro ao calcular tendência: ${error.message}`);
      return 'ERRO';
    }
  }

  private calcularPrevisao(dados: any[]): any {
    try {
      if (dados.length < 3) return null;
      
      const ultimos3 = dados.slice(-3);
      const media = ultimos3.reduce((sum, item) => sum + (item?.valor || 0), 0) / 3;
      
      return {
        proximoPeriodo: Math.round(media),
        confianca: 'BAIXA'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao calcular previsão: ${error.message}`);
      return null;
    }
  }

  private calcularTaxaArrecadacao(dados: any[]): number {
    try {
      const total = dados.length;
      const pagas = dados.filter(m => m.status_multa === 'PAGA').length;
      
      return total > 0 ? Number(((pagas / total) * 100).toFixed(2)) : 0;
    } catch (error) {
      this.logger.error(`❌ Erro ao calcular taxa de arrecadação: ${error.message}`);
      return 0;
    }
  }

  private calcularEficienciaAgente(agente: any): number {
    // ✅ CÁLCULO SIMPLES DE EFICIÊNCIA
    if (agente.totalMultas === 0) return 0;
    
    const eficienciaBase = Math.min(100, (agente.totalMultas / 50) * 100); // Base: 50 multas = 100%
    const bonusValor = agente.valorMedio > 200 ? 10 : 0; // Bônus por valor médio alto
    
    return Math.min(100, Math.round(eficienciaBase + bonusValor));
  }

  private classificarAgente(agente: any): string {
    if (agente.totalMultas >= 100) return 'EXCELENTE';
    if (agente.totalMultas >= 50) return 'BOM';
    if (agente.totalMultas >= 20) return 'REGULAR';
    return 'BAIXO';
  }

  // ✅ MÉTODOS ADICIONAIS PARA COMPATIBILIDADE

  async obterAnaliseComparativa(periodo1: string, periodo2: string): Promise<any> {
    try {
      const [dados1, dados2] = await Promise.all([
        this.obterResumoGeral(periodo1),
        this.obterResumoGeral(periodo2)
      ]);

      return {
        periodo1: { nome: periodo1, dados: dados1 },
        periodo2: { nome: periodo2, dados: dados2 },
        comparacao: {
          variacaoMultas: this.calcularVariacao(dados1.totalMultas, dados2.totalMultas),
          variacaoValor: this.calcularVariacao(dados1.valorTotal, dados2.valorTotal),
          variacaoTaxa: this.calcularVariacao(dados1.taxaArrecadacao, dados2.taxaArrecadacao)
        }
      };
    } catch (error) {
      this.logger.error(`❌ Erro na análise comparativa: ${error.message}`);
      throw error;
    }
  }

  async obterPrevisaoProducao(mesesFuturos: number = 3): Promise<any> {
    try {
      const periodo = this.calcularPeriodoTendencia('mensal');
      const dados = await this.multaCacheRepository.buscarPorPeriodo(
        periodo.inicio,
        periodo.fim
      );

      const tendencia = this.analisarTendencias(dados, 'mensal');
      const previsoes = [];

      for (let i = 1; i <= mesesFuturos; i++) {
        const dataPrevisao = new Date();
        dataPrevisao.setMonth(dataPrevisao.getMonth() + i);
        
        previsoes.push({
          mes: dataPrevisao.toISOString().substring(0, 7),
          multasEstimadas: this.calcularEstimativaMultas(tendencia, i),
          valorEstimado: this.calcularEstimativaValor(tendencia, i),
          confianca: this.calcularConfiancaPrevisao(i)
        });
      }

      return {
        baseadoEm: `${dados.length} registros de dados históricos`,
        tendenciaGeral: tendencia.analise,
        previsoes
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar previsão: ${error.message}`);
      throw error;
    }
  }

  private calcularVariacao(valorAtual: number, valorAnterior: number): number {
    if (valorAnterior === 0) return valorAtual > 0 ? 100 : 0;
    return Number((((valorAtual - valorAnterior) / valorAnterior) * 100).toFixed(2));
  }

  private calcularEstimativaMultas(tendencia: any, mesesFuturos: number): number {
    const baseValue = tendencia.dados[tendencia.dados.length - 1]?.valor || 0;
    const crescimento = tendencia.analise === 'CRESCENTE' ? 0.05 : 
                       tendencia.analise === 'DECRESCENTE' ? -0.05 : 0;
    
    return Math.round(baseValue * (1 + (crescimento * mesesFuturos)));
  }

  private calcularEstimativaValor(tendencia: any, mesesFuturos: number): number {
    const baseValue = tendencia.dados[tendencia.dados.length - 1]?.valorTotal || 0;
    const crescimento = tendencia.analise === 'CRESCENTE' ? 0.05 : 
                       tendencia.analise === 'DECRESCENTE' ? -0.05 : 0;
    
    return Math.round(baseValue * (1 + (crescimento * mesesFuturos)));
  }

  private calcularConfiancaPrevisao(mesesFuturos: number): string {
    if (mesesFuturos <= 1) return 'ALTA';
    if (mesesFuturos <= 3) return 'MEDIA';
    return 'BAIXA';
  }
}