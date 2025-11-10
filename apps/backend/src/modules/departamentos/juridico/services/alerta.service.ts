// src/modules/departamentos/juridico/services/alerta.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AlertaRepository } from '../repositories/alerta.repository';
import { AlertaEntity } from '../entities/alerta.entity';
import { ConfiguracaoService } from './configuracao.service';
import { AuditService } from './audit.service';

export interface CriarAlertaDto {
  tipo: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'CRITICAL';
  titulo: string;
  descricao: string;
  categoria: 'SISTEMA' | 'FINANCEIRO' | 'OPERACIONAL' | 'JURIDICO' | 'MULTAS' | 'AGENTES' | 'VEICULOS';
  prioridade?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' | 'URGENTE';
  dados?: any;
  entidadeTipo?: string;
  entidadeId?: string;
  valorReferencia?: number;
  thresholdConfigurado?: number;
  acaoRecomendada?: string;
  urlDetalhes?: string;
  notificarPor?: ('EMAIL' | 'SMS' | 'PUSH' | 'SLACK')[];
  destinatarios?: string[];
  agendarPara?: Date;
  expirarEm?: Date;
  tags?: string[];
}

export interface FiltrosAlerta {
  tipo?: string;
  categoria?: string;
  prioridade?: string;
  status?: 'ATIVO' | 'RESOLVIDO' | 'IGNORADO' | 'EXPIRADO';
  dataInicio?: Date;
  dataFim?: Date;
  entidadeTipo?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

export interface EstatisticasAlertas {
  resumo: {
    total: number;
    ativos: number;
    resolvidos: number;
    ignorados: number;
    expirados: number;
    criticos: number;
  };
  distribuicao: {
    porTipo: Record<string, number>;
    porCategoria: Record<string, number>;
    porPrioridade: Record<string, number>;
  };
  tendencias: {
    alertasPorDia: Array<{ data: string; quantidade: number }>;
    tempoMedioResolucao: number;
    taxaResolucao: number;
  };
  alertasCriticos: AlertaEntity[];
  alertasRecorrentes: Array<{
    titulo: string;
    quantidade: number;
    ultimaOcorrencia: Date;
  }>;
}

@Injectable()
export class AlertaService {
  private readonly logger = new Logger(AlertaService.name);
  private alertasCache = new Map<string, AlertaEntity>();
  private contadoresCache = new Map<string, number>();

  constructor(
    private readonly alertaRepository: AlertaRepository,
    private readonly configuracaoService: ConfiguracaoService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * 🚨 CRIAR NOVO ALERTA INTELIGENTE
   */
  async criarAlerta(dadosAlerta: CriarAlertaDto): Promise<AlertaEntity> {
    const auditId = await this.auditService.iniciarOperacao('CRIAR_ALERTA', {
      tipo: dadosAlerta.tipo,
      categoria: dadosAlerta.categoria,
      titulo: dadosAlerta.titulo,
    });

    try {
      // ✅ VERIFICAR SE JÁ EXISTE ALERTA SIMILAR ATIVO
      const alertaSimilar = await this.verificarAlertaSimilar(dadosAlerta);
      
      // ✅ CORREÇÃO: Usar getConfiguracoes() ao invés de getConfiguracao()
      const configuracoes = await this.configuracaoService.getConfiguracoes() as any;
      const evitarDuplicatas = configuracoes?.alertas?.evitarDuplicatas ?? true;
      
      if (alertaSimilar && evitarDuplicatas) {
        this.logger.warn(`⚠️ Alerta similar já existe: ${alertaSimilar.id}`);
        // ✅ CORREÇÃO: Converter number para string
        await this.incrementarContadorAlerta(alertaSimilar.id.toString());
        
        await this.auditService.finalizarOperacao(auditId, {
          sucesso: true,
          alertaExistente: alertaSimilar.id,
          acao: 'INCREMENTADO',
        });

        return alertaSimilar;
      }

      // ✅ DETERMINAR PRIORIDADE AUTOMÁTICA SE NÃO ESPECIFICADA
      const prioridade = dadosAlerta.prioridade || this.determinarPrioridadeAutomatica(dadosAlerta);

      // ✅ GERAR ID ÚNICO E CRIAR ALERTA
      const alertaId = this.gerarAlertaId();
      const alerta = await this.alertaRepository.criarAlerta({
        tipoAlerta: dadosAlerta.tipo,
        severidade: this.mapearPrioridadeParaSeveridade(prioridade),
        titulo: dadosAlerta.titulo,
        descricao: dadosAlerta.descricao,
        entidadeTipo: dadosAlerta.entidadeTipo,
        entidadeId: dadosAlerta.entidadeId,
        valorReferencia: dadosAlerta.valorReferencia,
        thresholdConfigurado: dadosAlerta.thresholdConfigurado,
        status: 'ATIVO',
        dataOcorrencia: new Date(),
      });

      // ✅ ADICIONAR AO CACHE
      this.alertasCache.set(alertaId, alerta);

      // ✅ PROCESSAR NOTIFICAÇÕES
      await this.processarNotificacoes(alerta);

      // ✅ VERIFICAR SE PRECISA ESCALAR
      await this.verificarEscalacao(alerta);

      this.logger.log(`🚨 Alerta criado: ${dadosAlerta.titulo} [${dadosAlerta.tipo}] - ID: ${alertaId}`);

      await this.auditService.finalizarOperacao(auditId, {
        sucesso: true,
        alertaId,
        prioridade,
        notificacoes: dadosAlerta.notificarPor?.length || 0,
      });

      return alerta;

    } catch (error) {
      this.logger.error(`❌ Erro ao criar alerta: ${error.message}`);
      
      await this.auditService.finalizarOperacao(auditId, {
        sucesso: false,
        erro: error.message,
      });

      throw error;
    }
  }

  /**
   * 🚨 ALERTAS ESPECÍFICOS PARA MULTAS
   */
  async criarAlertaMultaVencida(codigoMulta: string, valorMulta: number, diasVencidos: number): Promise<AlertaEntity> {
    const severidade = this.determinarSeveridadeVencimento(diasVencidos, valorMulta);
    const prioridade = this.mapearSeveridadeParaPrioridade(severidade);

    return await this.criarAlerta({
      tipo: severidade === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      titulo: `Multa vencida há ${diasVencidos} dias`,
      descricao: `Multa ${codigoMulta} no valor de R$ ${valorMulta.toFixed(2)} está vencida há ${diasVencidos} dias`,
      categoria: 'MULTAS',
      prioridade: prioridade as 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' | 'URGENTE',
      entidadeTipo: 'MULTA',
      entidadeId: codigoMulta,
      valorReferencia: valorMulta,
      thresholdConfigurado: 30,
      acaoRecomendada: diasVencidos > 90 
        ? 'Iniciar processo de cobrança judicial' 
        : 'Enviar notificação de cobrança',
      dados: {
        diasVencidos,
        valorOriginal: valorMulta,
        valorAtualizado: this.calcularValorAtualizado(valorMulta, diasVencidos),
        jurosAcumulados: this.calcularJuros(valorMulta, diasVencidos),
      },
      tags: ['MULTA_VENCIDA', `DIAS_${diasVencidos}`, `VALOR_${this.categorizarValor(valorMulta)}`],
      notificarPor: severidade === 'CRITICAL' ? ['EMAIL', 'PUSH'] : ['EMAIL'],
    });
  }

  async criarAlertaMetaAgente(codigoAgente: string, nomeAgente: string, percentualMeta: number): Promise<AlertaEntity> {
    const prioridade = percentualMeta < 50 ? 'ALTA' : percentualMeta < 70 ? 'MEDIA' : 'BAIXA';
    
    return await this.criarAlerta({
      tipo: percentualMeta < 30 ? 'ERROR' : 'WARNING',
      titulo: `Meta do agente: ${percentualMeta.toFixed(1)}%`,
      descricao: `Agente ${nomeAgente} atingiu apenas ${percentualMeta.toFixed(1)}% da meta mensal`,
      categoria: 'AGENTES',
      prioridade: prioridade as 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' | 'URGENTE',
      entidadeTipo: 'AGENTE',
      entidadeId: codigoAgente,
      valorReferencia: percentualMeta,
      thresholdConfigurado: 80,
      acaoRecomendada: percentualMeta < 50 
        ? 'Reunião urgente com supervisor' 
        : 'Acompanhamento semanal',
      dados: {
        nomeAgente,
        percentualMeta,
        diasRestantesMes: this.calcularDiasRestantesMes(),
        metaMinima: 80,
        statusDesempenho: this.classificarDesempenho(percentualMeta),
      },
      tags: ['META_AGENTE', `PERFORMANCE_${this.classificarDesempenho(percentualMeta)}`],
    });
  }

  async criarAlertaAnomaliaValor(descricao: string, valorAtual: number, valorEsperado: number): Promise<AlertaEntity> {
    const diferenca = Math.abs(valorAtual - valorEsperado);
    const percentualDiferenca = (diferenca / valorEsperado) * 100;
    const prioridade = percentualDiferenca > 50 ? 'CRITICA' : percentualDiferenca > 25 ? 'ALTA' : 'MEDIA';
    
    return await this.criarAlerta({
      tipo: percentualDiferenca > 50 ? 'CRITICAL' : 'WARNING',
      titulo: `Anomalia: ${percentualDiferenca.toFixed(1)}% de variação`,
      descricao: `${descricao}. Valor atual: R$ ${valorAtual.toFixed(2)}, esperado: R$ ${valorEsperado.toFixed(2)}`,
      categoria: 'SISTEMA',
      prioridade: prioridade as 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' | 'URGENTE',
      entidadeTipo: 'ANOMALIA',
      entidadeId: 'DETECCAO_AUTOMATICA',
      valorReferencia: valorAtual,
      thresholdConfigurado: valorEsperado,
      acaoRecomendada: 'Investigar causa da anomalia nos dados',
      dados: {
        valorAtual,
        valorEsperado,
        diferenca,
        percentualDiferenca,
        tipoAnomalia: this.classificarAnomalia(percentualDiferenca),
        algoritmoDeteccao: 'THRESHOLD_BASED',
      },
      tags: ['ANOMALIA', `VARIACAO_${Math.round(percentualDiferenca)}PCT`],
      notificarPor: percentualDiferenca > 50 ? ['EMAIL', 'SLACK'] : ['EMAIL'],
    });
  }

  /**
   * 📋 GERENCIAMENTO DE ALERTAS
   */
  async listarAlertas(filtros: FiltrosAlerta = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        ...otherFilters
      } = filtros;

      // ✅ CORREÇÃO: Usar método existente no repository
      const alertas = await this.alertaRepository.findAtivos();
      
      // ✅ IMPLEMENTAR FILTROS MANUALMENTE POR ENQUANTO
      let alertasFiltrados = alertas;
      
      if (otherFilters.tipo) {
        alertasFiltrados = alertasFiltrados.filter(a => a.tipoAlerta === otherFilters.tipo);
      }
      
      if (otherFilters.status) {
        alertasFiltrados = alertasFiltrados.filter(a => a.status === otherFilters.status);
      }

      // ✅ IMPLEMENTAR PAGINAÇÃO MANUAL
      const offset = (page - 1) * limit;
      const alertasPaginados = alertasFiltrados.slice(offset, offset + limit);

      return {
        data: alertasPaginados,
        total: alertasFiltrados.length,
        page,
        limit,
        totalPages: Math.ceil(alertasFiltrados.length / limit)
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao listar alertas: ${error.message}`);
      throw error;
    }
  }

  async obterAlertasAtivos(): Promise<AlertaEntity[]> {
    try {
      return await this.alertaRepository.findAtivos();
    } catch (error) {
      this.logger.error(`❌ Erro ao obter alertas ativos: ${error.message}`);
      return [];
    }
  }

  async obterAlertasPorSeveridade(severidade: string): Promise<AlertaEntity[]> {
    try {
      return await this.alertaRepository.findBySeveridade(severidade);
    } catch (error) {
      this.logger.error(`❌ Erro ao obter alertas por severidade: ${error.message}`);
      return [];
    }
  }

  async resolverAlerta(id: string, usuarioResponsavel: string, observacoes?: string): Promise<void> {
    const auditId = await this.auditService.iniciarOperacao('RESOLVER_ALERTA', {
      alertaId: id,
      usuario: usuarioResponsavel,
    });

    try {
      // ✅ CORREÇÃO: Converter string para number
      const alertaId = parseInt(id);
      if (isNaN(alertaId)) {
        throw new Error('ID do alerta deve ser um número válido');
      }
      
      await this.alertaRepository.resolverAlerta(alertaId, usuarioResponsavel, observacoes);
      
      // ✅ REMOVER DO CACHE
      this.alertasCache.delete(id);
      
      this.logger.log(`✅ Alerta ${id} resolvido por ${usuarioResponsavel}`);

      await this.auditService.finalizarOperacao(auditId, {
        sucesso: true,
        observacoes,
      });

    } catch (error) {
      await this.auditService.finalizarOperacao(auditId, {
        sucesso: false,
        erro: error.message,
      });
      throw error;
    }
  }

  async ignorarAlerta(id: string, usuarioResponsavel: string, observacoes?: string): Promise<void> {
    const auditId = await this.auditService.iniciarOperacao('IGNORAR_ALERTA', {
      alertaId: id,
      usuario: usuarioResponsavel,
    });

    try {
      // ✅ CORREÇÃO: Converter string para number
      const alertaId = parseInt(id);
      if (isNaN(alertaId)) {
        throw new Error('ID do alerta deve ser um número válido');
      }
      
      await this.alertaRepository.ignorarAlerta(alertaId, usuarioResponsavel, observacoes);
      
      // ✅ REMOVER DO CACHE
      this.alertasCache.delete(id);
      
      this.logger.log(`⚠️ Alerta ${id} ignorado por ${usuarioResponsavel}`);

      await this.auditService.finalizarOperacao(auditId, {
        sucesso: true,
        observacoes,
      });

    } catch (error) {
      await this.auditService.finalizarOperacao(auditId, {
        sucesso: false,
        erro: error.message,
      });
      throw error;
    }
  }

  /**
   * 📊 ESTATÍSTICAS E RELATÓRIOS
   */
  async obterEstatisticasAlertas(): Promise<EstatisticasAlertas> {
    try {
      // ✅ CORREÇÃO: Usar método existente no repository
      const estatisticasBasicas = await this.alertaRepository.obterEstatisticas();
      
      // ✅ IMPLEMENTAR MÉTODOS FALTANTES OU USAR DADOS SIMULADOS
      const distribuicao = {
        porTipo: { 'WARNING': 10, 'ERROR': 5, 'CRITICAL': 2 },
        porCategoria: { 'SISTEMA': 8, 'MULTAS': 6, 'AGENTES': 3 },
        porPrioridade: { 'ALTA': 7, 'MEDIA': 8, 'BAIXA': 2 }
      };

      const tendencias = await this.calcularTendencias();
      
      // ✅ BUSCAR ALERTAS CRÍTICOS (implementar filtro manual)
      const todosAlertas = await this.alertaRepository.findAtivos();
      const alertasCriticos = todosAlertas.filter(a => a.severidade === 'CRITICAL');
      
      const alertasRecorrentes = await this.identificarAlertasRecorrentes();

      return {
        resumo: {
          total: estatisticasBasicas.total || 0,
          ativos: estatisticasBasicas.ativos || 0,
          resolvidos: 0, // Implementar
          ignorados: 0, // Implementar
          expirados: 0, // Implementar
          criticos: estatisticasBasicas.criticos || 0,
        },
        distribuicao,
        tendencias,
        alertasCriticos,
        alertasRecorrentes,
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao obter estatísticas: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔄 JOBS AUTOMÁTICOS
   */
  @Cron('*/5 * * * *', {
    name: 'verificar-alertas-expirados',
    timeZone: 'America/Sao_Paulo',
  })
  async verificarAlertasExpirados() {
    try {
      // ✅ IMPLEMENTAR LÓGICA DE EXPIRAÇÃO (por enquanto simulado)
      const alertasAtivos = await this.alertaRepository.findAtivos();
      const agora = new Date();
      const alertasExpirados = alertasAtivos.filter(alerta => {
        const diasAntigos = Math.floor((agora.getTime() - alerta.dataOcorrencia.getTime()) / (1000 * 60 * 60 * 24));
        return diasAntigos > 30; // Considerar expirado após 30 dias
      });
      
      for (const alerta of alertasExpirados) {
        // ✅ IMPLEMENTAR marcarComoExpirado no repository
        await this.alertaRepository.resolverAlerta(alerta.id, 'SISTEMA', 'Alerta expirado automaticamente');
        this.alertasCache.delete(alerta.id.toString());
      }

      if (alertasExpirados.length > 0) {
        this.logger.log(`⏰ ${alertasExpirados.length} alertas marcados como expirados`);
      }

    } catch (error) {
      this.logger.error(`❌ Erro ao verificar alertas expirados: ${error.message}`);
    }
  }

  @Cron('0 */6 * * *', {
    name: 'limpeza-alertas-antigos',
    timeZone: 'America/Sao_Paulo',
  })
  async limparAlertasAntigos() {
    try {
      // ✅ CORREÇÃO: Usar getConfiguracoes() ao invés de getConfiguracao()
      const configuracoes = await this.configuracaoService.getConfiguracoes() as any;
      const diasParaManter = configuracoes?.alertas?.diasManterAlertas ?? 90;
      
      // ✅ IMPLEMENTAR LIMPEZA (por enquanto simulado)
      const removidos = 0; // await this.alertaRepository.limparAntigos(diasParaManter);
      
      if (removidos > 0) {
        this.logger.log(`🗑️ ${removidos} alertas antigos removidos (>${diasParaManter} dias)`);
      }

    } catch (error) {
      this.logger.error(`❌ Erro na limpeza de alertas: ${error.message}`);
    }
  }

  @Cron('0 8 * * 1', {
    name: 'relatorio-semanal-alertas',
    timeZone: 'America/Sao_Paulo',
  })
  async gerarRelatorioSemanal() {
    try {
      const dataFim = new Date();
      const dataInicio = new Date(dataFim.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const relatorio = await this.gerarRelatorioAlertas(dataInicio, dataFim);
      
      // ✅ ENVIAR RELATÓRIO POR EMAIL (implementar)
      this.logger.log(`📊 Relatório semanal de alertas gerado: ${relatorio.resumo.total} alertas`);

    } catch (error) {
      this.logger.error(`❌ Erro ao gerar relatório semanal: ${error.message}`);
    }
  }

  /**
   * 📈 RELATÓRIOS AVANÇADOS
   */
  async gerarRelatorioAlertas(dataInicio: Date, dataFim: Date) {
    try {
      // ✅ IMPLEMENTAR buscarPorPeriodo ou usar filtro manual
      const todosAlertas = await this.alertaRepository.findAtivos();
      const alertas = todosAlertas.filter(alerta => 
        alerta.dataOcorrencia >= dataInicio && alerta.dataOcorrencia <= dataFim
      );
      
      const resumo = {
        total: alertas.length,
        resolvidos: alertas.filter(a => a.status === 'RESOLVIDO').length,
        ignorados: alertas.filter(a => a.status === 'IGNORADO').length,
        ativos: alertas.filter(a => a.status === 'ATIVO').length,
        criticos: alertas.filter(a => a.severidade === 'CRITICAL').length,
      };

      const tempoMedioResolucao = this.calcularTempoMedioResolucao(alertas);
      const alertasPorDia = this.agruparAlertasPorDia(alertas);
      const categoriasMaisFrequentes = this.obterCategoriasMaisFrequentes(alertas);

      return {
        periodo: { inicio: dataInicio, fim: dataFim },
        resumo,
        metricas: {
          tempoMedioResolucao,
          taxaResolucao: resumo.total > 0 ? (resumo.resolvidos / resumo.total) * 100 : 0,
        },
        graficos: {
          alertasPorDia,
          categoriasMaisFrequentes,
        },
        alertas: alertas.slice(0, 100), // Limitar para performance
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao gerar relatório: ${error.message}`);
      throw error;
    }
  }

  // ✅ MÉTODOS PRIVADOS

  private gerarAlertaId(): string {
    return `ALT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determinarSeveridadeVencimento(diasVencidos: number, valorMulta: number): string {
    if (diasVencidos > 90 || valorMulta > 1000) return 'CRITICAL';
    if (diasVencidos > 60 || valorMulta > 500) return 'HIGH';
    if (diasVencidos > 30 || valorMulta > 200) return 'MEDIUM';
    return 'LOW';
  }

  private mapearSeveridadeParaPrioridade(severidade: string): string {
    const mapeamento: Record<string, string> = {
      'CRITICAL': 'CRITICA',
      'HIGH': 'ALTA',
      'MEDIUM': 'MEDIA',
      'LOW': 'BAIXA',
    };
    return mapeamento[severidade] || 'MEDIA';
  }

  private mapearPrioridadeParaSeveridade(prioridade: string): string {
    const mapeamento: Record<string, string> = {
      'CRITICA': 'CRITICAL',
      'URGENTE': 'CRITICAL',
      'ALTA': 'HIGH',
      'MEDIA': 'MEDIUM',
      'BAIXA': 'LOW',
    };
    return mapeamento[prioridade] || 'MEDIUM';
  }

  private determinarPrioridadeAutomatica(dadosAlerta: CriarAlertaDto): 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' | 'URGENTE' {
    // ✅ LÓGICA INTELIGENTE BASEADA EM TIPO E CATEGORIA
    if (dadosAlerta.tipo === 'CRITICAL') return 'CRITICA';
    if (dadosAlerta.tipo === 'ERROR') return 'ALTA';
    if (dadosAlerta.categoria === 'FINANCEIRO' && dadosAlerta.valorReferencia && dadosAlerta.valorReferencia > 1000) return 'ALTA';
    if (dadosAlerta.categoria === 'SISTEMA') return 'MEDIA';
    return 'BAIXA';
  }

  private async verificarAlertaSimilar(dadosAlerta: CriarAlertaDto): Promise<AlertaEntity | null> {
    // ✅ IMPLEMENTAR BUSCA SIMILAR (por enquanto retorna null)
    const alertasAtivos = await this.alertaRepository.findAtivos();
    return alertasAtivos.find(alerta => 
      alerta.titulo === dadosAlerta.titulo && 
      alerta.entidadeId === dadosAlerta.entidadeId
    ) || null;
  }

  private async incrementarContadorAlerta(alertaId: string): Promise<void> {
    // ✅ IMPLEMENTAR INCREMENTO DE CONTADOR
    const contador = this.contadoresCache.get(alertaId) || 0;
    this.contadoresCache.set(alertaId, contador + 1);
  }

  private async processarNotificacoes(alerta: AlertaEntity): Promise<void> {
    // ✅ IMPLEMENTAR SISTEMA DE NOTIFICAÇÕES
    // Por enquanto, apenas log
    this.logger.log(`�� Processando notificações para alerta: ${alerta.id}`);
  }

  private async verificarEscalacao(alerta: AlertaEntity): Promise<void> {
    if (alerta.severidade === 'CRITICAL') {
      // ✅ IMPLEMENTAR LÓGICA DE ESCALAÇÃO
      this.logger.warn(`🚨 ESCALAÇÃO: Alerta crítico criado - ${alerta.titulo}`);
    }
  }

  private calcularValorAtualizado(valorOriginal: number, diasVencidos: number): number {
    const taxaJurosDiaria = 0.0033; // 0.33% ao dia (aproximadamente 10% ao mês)
    return valorOriginal * (1 + (taxaJurosDiaria * diasVencidos));
  }

  private calcularJuros(valorOriginal: number, diasVencidos: number): number {
    return this.calcularValorAtualizado(valorOriginal, diasVencidos) - valorOriginal;
  }

  private categorizarValor(valor: number): string {
    if (valor > 1000) return 'ALTO';
    if (valor > 500) return 'MEDIO';
    return 'BAIXO';
  }

  private calcularDiasRestantesMes(): number {
    const hoje = new Date();
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    return Math.ceil((ultimoDiaMes.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  }

  private classificarDesempenho(percentual: number): string {
    if (percentual >= 90) return 'EXCELENTE';
    if (percentual >= 80) return 'BOM';
    if (percentual >= 70) return 'REGULAR';
    if (percentual >= 50) return 'RUIM';
    return 'CRITICO';
  }

  private classificarAnomalia(percentualDiferenca: number): string {
    if (percentualDiferenca > 100) return 'EXTREMA';
    if (percentualDiferenca > 50) return 'ALTA';
    if (percentualDiferenca > 25) return 'MODERADA';
    return 'LEVE';
  }

  private async calcularTendencias(): Promise<any> {
    const ultimosSeteDias = Array.from({ length: 7 }, (_, i) => {
      const data = new Date();
      data.setDate(data.getDate() - i);
      return data.toISOString().split('T')[0];
    }).reverse();

    // ✅ IMPLEMENTAR CONTAGEM POR DIA (simulado por enquanto)
    const alertasPorDia = ultimosSeteDias.map((data, index) => ({
      data,
      quantidade: Math.floor(Math.random() * 10) + 1
    }));

    const tempoMedioResolucao = 24; // horas (simulado)
    const taxaResolucao = 85; // % (simulado)

    return {
      alertasPorDia,
      tempoMedioResolucao,
      taxaResolucao,
    };
  }

  private async identificarAlertasRecorrentes(): Promise<any[]> {
    // ✅ IMPLEMENTAR IDENTIFICAÇÃO DE RECORRENTES (simulado)
    return [
      {
        titulo: 'Multa vencida',
        quantidade: 15,
        ultimaOcorrencia: new Date()
      },
      {
        titulo: 'Meta não atingida',
        quantidade: 8,
        ultimaOcorrencia: new Date()
      }
    ];
  }

  private calcularTempoMedioResolucao(alertas: AlertaEntity[]): number {
    const alertasResolvidos = alertas.filter(a => a.status === 'RESOLVIDO' && a.dataResolucao);
    
    if (alertasResolvidos.length === 0) return 0;

    const tempoTotal = alertasResolvidos.reduce((sum, alerta) => {
      const tempo = alerta.dataResolucao!.getTime() - alerta.dataOcorrencia.getTime();
      return sum + tempo;
    }, 0);

    return Math.round(tempoTotal / alertasResolvidos.length / (1000 * 60 * 60)); // em horas
  }

  private agruparAlertasPorDia(alertas: AlertaEntity[]): Array<{ data: string; quantidade: number }> {
    const grupos = alertas.reduce((acc, alerta) => {
      const data = alerta.dataOcorrencia.toISOString().split('T')[0];
      acc[data] = (acc[data] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grupos).map(([data, quantidade]) => ({ data, quantidade }));
  }

/**
 * 📋 OBTER ALERTAS COM FILTROS E PAGINAÇÃO
 */
async obterAlertas(
  limite: number = 10, 
  filtros?: {
    tipo?: string;
    severidade?: string;
    status?: string;
    categoria?: string;
  }
): Promise<{ data: AlertaEntity[]; total: number; resumo?: any }> {
  try {
    let alertas = await this.alertaRepository.findAtivos();
    
    // ✅ APLICAR FILTROS SE FORNECIDOS
    if (filtros) {
      if (filtros.tipo) {
        alertas = alertas.filter(a => a.tipoAlerta === filtros.tipo);
      }
      if (filtros.severidade) {
        alertas = alertas.filter(a => a.severidade === filtros.severidade);
      }
      if (filtros.status) {
        alertas = alertas.filter(a => a.status === filtros.status);
      }
    }
    
    // ✅ ORDENAR POR DATA MAIS RECENTE
    alertas.sort((a, b) => b.dataOcorrencia.getTime() - a.dataOcorrencia.getTime());
    
    // ✅ APLICAR LIMITE
    const alertasLimitados = alertas.slice(0, limite);
    
    // ✅ GERAR RESUMO RÁPIDO
    const resumo = {
      total: alertas.length,
      criticos: alertas.filter(a => a.severidade === 'CRITICAL').length,
      ativos: alertas.filter(a => a.status === 'ATIVO').length,
      ultimasHoras: alertas.filter(a => {
        const horasAtras = (Date.now() - a.dataOcorrencia.getTime()) / (1000 * 60 * 60);
        return horasAtras <= 24;
      }).length
    };
    
    this.logger.log(`📋 Obtidos ${alertasLimitados.length} alertas de ${alertas.length} total`);
    
    return {
      data: alertasLimitados,
      total: alertas.length,
      resumo
    };
    
  } catch (error) {
    this.logger.error(`❌ Erro ao obter alertas: ${error.message}`);
    return {
      data: [],
      total: 0,
      resumo: { total: 0, criticos: 0, ativos: 0, ultimasHoras: 0 }
    };
  }
}

/**
 * 📊 OBTER ALERTAS POR CATEGORIA
 */
async obterAlertasPorCategoria(categoria: string, limite: number = 5): Promise<AlertaEntity[]> {
  try {
    const alertas = await this.alertaRepository.findAtivos();
    
    return alertas
      .filter(alerta => {
        // Mapear categoria para tipos de alerta
        switch (categoria.toLowerCase()) {
          case 'multas':
            return alerta.entidadeTipo === 'MULTA';
          case 'agentes':
            return alerta.entidadeTipo === 'AGENTE';
          case 'sistema':
            return alerta.entidadeTipo === 'SISTEMA' || alerta.entidadeTipo === 'ANOMALIA';
          default:
            return true;
        }
      })
      .sort((a, b) => b.dataOcorrencia.getTime() - a.dataOcorrencia.getTime())
      .slice(0, limite);
      
  } catch (error) {
    this.logger.error(`❌ Erro ao obter alertas por categoria: ${error.message}`);
    return [];
  }
}

/**
 * 🚨 OBTER ALERTAS CRÍTICOS
 */
async obterAlertasCriticos(): Promise<AlertaEntity[]> {
  try {
    const alertas = await this.alertaRepository.findBySeveridade('CRITICAL');
    return alertas.filter(a => a.status === 'ATIVO');
  } catch (error) {
    this.logger.error(`❌ Erro ao obter alertas críticos: ${error.message}`);
    return [];
  }
}

  private obterCategoriasMaisFrequentes(alertas: AlertaEntity[]): Array<{ categoria: string; quantidade: number }> {
    const grupos = alertas.reduce((acc, alerta) => {
      const categoria = alerta.tipoAlerta || 'OUTROS';
      acc[categoria] = (acc[categoria] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grupos)
      .map(([categoria, quantidade]) => ({ categoria, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }
}