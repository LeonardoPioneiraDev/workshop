// src/modules/departamentos/juridico/services/juridico-dashboard.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { DvsMultaService } from './dvs-multa.service';
import { DvsInfracaoService } from './dvs-infracao.service';
import { FrtCadveiculosService } from './frt-cadveiculos.service';
import { DvsAgenteAutuadorService } from './dvs-agente-autuador.service';

@Injectable()
export class JuridicoDashboardService {
  private readonly logger = new Logger(JuridicoDashboardService.name);

  constructor(
    private readonly multaService: DvsMultaService,
    private readonly infracaoService: DvsInfracaoService,
    private readonly veiculoService: FrtCadveiculosService,
    private readonly agenteService: DvsAgenteAutuadorService,
  ) {}

  // ✅ DASHBOARD PRINCIPAL
  async getDashboardPrincipal() {
    this.logger.log('Gerando dashboard principal...');

    try {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      const inicioAno = new Date(hoje.getFullYear(), 0, 1);

      const [
        statsGeral,
        statsMes,
        statsAno,
        multasVencidas,
        multasRecurso,
        topInfracoes,
        topVeiculos,
        topAgentesResult // ✅ RENOMEAR PARA EVITAR CONFLITO
      ] = await Promise.all([
        this.multaService.getStats(),
        this.multaService.getStats({ dataEmissaoInicio: inicioMes, dataEmissaoFim: fimMes }),
        this.multaService.getStats({ dataEmissaoInicio: inicioAno, dataEmissaoFim: hoje }),
        this.multaService.getMultasVencidas(),
        this.multaService.getMultasEmRecurso(),
        this.infracaoService.getMaisFrequentes(5),
        this.veiculoService.getComMaisMultas(5),
        this.agenteService.getTopAgentes({ limit: 5 }), // ✅ RETORNA CacheResult
      ]);

      // ✅ EXTRAIR DADOS DO RESULTADO
    const topAgentes = topAgentesResult.data || []; // ✅ ACESSAR .data

      return {
        resumoGeral: {
          totalMultas: statsGeral.totalMultas,
          valorTotalMultas: statsGeral.valorTotalMultas,
          multasPagas: statsGeral.multasPagas,
          multasPendentes: statsGeral.multasPendentes,
          valorPendente: statsGeral.valorPendente,
        },
        mesAtual: {
          totalMultas: statsMes.totalMultas,
          valorTotal: statsMes.valorTotalMultas,
          crescimentoPercentual: this.calcularCrescimento(statsMes.totalMultas, statsGeral.totalMultas),
        },
        anoAtual: {
          totalMultas: statsAno.totalMultas,
          valorTotal: statsAno.valorTotalMultas,
        },
        alertas: {
          multasVencidas: {
            quantidade: multasVencidas.length,
            valor: multasVencidas.reduce((sum, m) => sum + (m.valorAtualizadoCalculado || 0), 0),
          },
          multasRecurso: {
            quantidade: multasRecurso.length,
            valor: multasRecurso.reduce((sum, m) => sum + (m.valorAtualizadoCalculado || 0), 0),
          },
        },
        rankings: {
          topInfracoes: topInfracoes.slice(0, 5),
          topVeiculos: topVeiculos.slice(0, 5),
          topAgentes: topAgentes.slice(0, 5), // ✅ AGORA FUNCIONA
        },
        periodo: {
          mes: { inicio: inicioMes, fim: fimMes },
          ano: { inicio: inicioAno, fim: hoje },
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao gerar dashboard principal: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ✅ DASHBOARD FINANCEIRO
  async getDashboardFinanceiro() {
    this.logger.log('Gerando dashboard financeiro...');

    try {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      const [statsGeral, multasVencidas] = await Promise.all([
        this.multaService.getStats(),
        this.multaService.getMultasVencidas(),
      ]);

      // ✅ CALCULAR VALORES POR SITUAÇÃO
      const valorVencido = multasVencidas.reduce((sum, m) => sum + (m.valorAtualizadoCalculado || 0), 0);
      const valorRecuperavel = valorVencido * 0.7; // Estimativa de 70% recuperável

      return {
        resumoFinanceiro: {
          valorTotalMultas: statsGeral.valorTotalMultas,
          valorArrecadado: statsGeral.valorTotalPago,
          valorPendente: statsGeral.valorPendente,
          valorVencido,
          valorRecuperavel,
          taxaArrecadacao: statsGeral.valorTotalMultas > 0 
            ? (statsGeral.valorTotalPago / statsGeral.valorTotalMultas) * 100 
            : 0,
        },
        projecoes: {
          metaMensal: 1000000, // Definir meta
          realizadoMes: statsGeral.valorTotalPago,
          percentualMeta: (statsGeral.valorTotalPago / 1000000) * 100,
        },
        inadimplencia: {
          totalVencido: valorVencido,
          quantidadeVencidas: multasVencidas.length,
          ticketMedio: multasVencidas.length > 0 ? valorVencido / multasVencidas.length : 0,
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao gerar dashboard financeiro: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ✅ DASHBOARD OPERACIONAL
  async getDashboardOperacional() {
    this.logger.log('Gerando dashboard operacional...');

    try {
      const [
        statsMultas,
        statsInfracoes,
        statsVeiculos,
        statsAgentesResult // ✅ RENOMEAR
      ] = await Promise.all([
        this.multaService.getStats(),
        this.infracaoService.getStats(),
        this.veiculoService.getStats(),
        this.agenteService.getStats(), // ✅ RETORNA CacheResult<AgenteStats>
      ]);
      // ✅ EXTRAIR DADOS DO RESULTADO
      const statsAgentes = statsAgentesResult.data; // ✅ ACESSAR .data
      
      return {
        resumoOperacional: {
          totalMultas: statsMultas.totalMultas,
          totalInfracoes: statsInfracoes.totalInfracoes,
          totalVeiculos: statsVeiculos.totalVeiculos,
          totalAgentes: statsAgentes.totalAgentes,
        },
        eficiencia: {
          multasPorAgente: statsAgentes.mediaMultasPorAgente,
          multasPorVeiculo: statsVeiculos.totalVeiculos > 0 
            ? statsMultas.totalMultas / statsVeiculos.totalVeiculos 
            : 0,
          infracoesComMaisMultas: statsInfracoes.gruposInfracao?.slice(0, 5) || [],
        },
        distribuicao: {
          multasPorSituacao: {
            pagas: statsMultas.multasPagas,
            pendentes: statsMultas.multasPendentes,
            vencidas: statsMultas.multasVencidas,
            recurso: statsMultas.multasComRecurso,
            anistiadas: statsMultas.multasAnistiadas,
          },
          veiculosPorCondicao: {
            ativos: statsVeiculos.veiculosAtivos,
            inativos: statsVeiculos.veiculosInativos,
            manutencao: statsVeiculos.veiculosManutencao,
            vendidos: statsVeiculos.veiculosVendidos,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Erro ao gerar dashboard operacional: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ✅ MÉTODOS PRIVADOS
  private calcularCrescimento(valorAtual: number, valorTotal: number): number {
    if (valorTotal === 0) return 0;
    return ((valorAtual / valorTotal) * 100) - 100;
  }
}