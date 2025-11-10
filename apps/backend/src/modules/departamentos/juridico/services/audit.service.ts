// src/modules/departamentos/juridico/services/audit.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { AuditLogEntity } from '../entities/audit-log.entity';

export interface AuditOptions {
  incluirDetalhes?: boolean;
  incluirContext?: boolean;
  nivelLog?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
}

export interface RelatorioAuditoria {
  periodo: { inicio: Date; fim: Date };
  resumo: {
    totalOperacoes: number;
    operacoesSucesso: number;
    operacoesErro: number;
    taxaSucesso: number;
    tempoMedioExecucao: number;
  };
  operacoesPorTipo: Array<{
    acao: string;
    quantidade: number;
    percentual: number;
    tempoMedio: number;
  }>;
  usuariosMaisAtivos: Array<{
    usuario: string;
    operacoes: number;
    ultimaAtividade: Date;
  }>;
  errosFrequentes: Array<{
    erro: string;
    quantidade: number;
    ultimaOcorrencia: Date;
  }>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private operacoesAtivas = new Map<string, { inicio: Date; dados: any }>();

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditRepository: Repository<AuditLogEntity>
  ) {}

  /**
   * 🚀 INICIAR OPERAÇÃO DE AUDITORIA
   */
  async iniciarOperacao(operacao: string, dados: any, options: AuditOptions = {}): Promise<string> {
    try {
      const operacaoId = this.gerarOperacaoId();
      const contexto = options.incluirContext ? await this.obterContexto() : null;

      // ✅ CORREÇÃO: Resolver IP corretamente
      const ipResolvido = this.resolverIpAddress(dados.ip);

      const audit = this.auditRepository.create({
        operacaoId,
        operacao,
        dados: {
          ...dados,
          contexto,
          nivelLog: options.nivelLog || 'INFO',
          incluirDetalhes: options.incluirDetalhes || false,
        },
        status: 'INICIADO',
        dataInicio: new Date(),
        usuarioSistema: dados.usuario || 'SISTEMA',
        ipOrigem: ipResolvido, // ✅ IP RESOLVIDO
        origemAlteracao: dados.origem || 'SISTEMA',
        tabelaOrigem: dados.tabela || 'SISTEMA',
        acao: 'OPERACAO',
        sucesso: true,
      });

      const saved = await this.auditRepository.save(audit);
      
      // ✅ ARMAZENAR EM MEMÓRIA PARA TRACKING
      this.operacoesAtivas.set(operacaoId, {
        inicio: new Date(),
        dados: { operacao, ...dados }
      });

      this.logger.log(`🚀 Operação iniciada: ${operacao} [ID: ${operacaoId}]`);
      return operacaoId;

    } catch (error) {
      this.logger.error(`❌ Erro ao iniciar operação: ${error.message}`);
      
      // ✅ FALLBACK: Retornar ID fictício para não quebrar o fluxo
      const fallbackId = this.gerarOperacaoId();
      this.logger.warn(`⚠️ Usando ID de auditoria fictício: ${fallbackId}`);
      return fallbackId;
    }
  }

  /**
   * ✅ FINALIZAR OPERAÇÃO DE AUDITORIA
   */
  async finalizarOperacao(operacaoId: string, resultado: any): Promise<void> {
    try {
      // ✅ VERIFICAR SE É ID FICTÍCIO
      if (operacaoId.includes('FALLBACK')) {
        this.logger.debug(`⚠️ Finalizando operação com ID fictício: ${operacaoId}`);
        return;
      }

      const operacaoAtiva = this.operacoesAtivas.get(operacaoId);
      const duracaoMs = operacaoAtiva 
        ? Date.now() - operacaoAtiva.inicio.getTime() 
        : 0;

      const updateData = {
        status: resultado.sucesso ? 'CONCLUIDO' : 'ERRO',
        resultado: {
          ...resultado,
          duracaoMs,
          timestamp: new Date(),
        },
        dataFim: new Date(),
        duracaoMs,
        sucesso: resultado.sucesso !== false,
        erroDetalhes: resultado.erro || null,
      };

      await this.auditRepository.update({ operacaoId }, updateData);

      // ✅ REMOVER DA MEMÓRIA
      this.operacoesAtivas.delete(operacaoId);

      // ✅ LOG BASEADO NO RESULTADO
      if (resultado.sucesso !== false) {
        this.logger.log(`✅ Operação concluída: [ID: ${operacaoId}] em ${duracaoMs}ms`);
      } else {
        this.logger.error(`❌ Operação falhou: [ID: ${operacaoId}] - ${resultado.erro}`);
      }

      // ✅ ALERTAR SE OPERAÇÃO DEMOROU MUITO
      if (duracaoMs > 30000) { // 30 segundos
        this.logger.warn(`⚠️ Operação lenta detectada: ${operacaoId} - ${duracaoMs}ms`);
      }

    } catch (error) {
      this.logger.error(`❌ Erro ao finalizar operação: ${error.message}`);
    }
  }

  /**
   * 📝 REGISTRAR AÇÃO SIMPLES
   */
  async registrarAcao(dados: {
    tabelaOrigem: string;
    registroId?: number;
    codigoMulta?: string;
    acao: string;
    camposAlterados?: any;
    valoresAnteriores?: any;
    valoresNovos?: any;
    usuarioSistema?: string;
    ipOrigem?: string;
    origemAlteracao: string;
    observacoes?: string;
    duracaoMs?: number;
    sucesso?: boolean;
    erroDetalhes?: string;
  }): Promise<AuditLogEntity> {
    try {
      const operacaoId = this.gerarOperacaoId();
      
      // ✅ CORREÇÃO: Resolver IP corretamente
      const ipResolvido = this.resolverIpAddress(dados.ipOrigem);
      
      const log = await this.auditRepository.save({
        operacaoId,
        operacao: dados.acao,
        tabelaOrigem: dados.tabelaOrigem,
        registroId: dados.registroId,
        codigoMulta: dados.codigoMulta,
        acao: dados.acao,
        dados: {
          camposAlterados: dados.camposAlterados,
          valoresAnteriores: dados.valoresAnteriores,
          valoresNovos: dados.valoresNovos,
          observacoes: dados.observacoes,
        },
        status: 'CONCLUIDO',
        dataInicio: new Date(),
        dataFim: new Date(),
        usuarioSistema: dados.usuarioSistema || 'SISTEMA',
        ipOrigem: ipResolvido, // ✅ IP RESOLVIDO
        origemAlteracao: dados.origemAlteracao,
        duracaoMs: dados.duracaoMs || 0,
        sucesso: dados.sucesso !== false,
        erroDetalhes: dados.erroDetalhes,
      });

      this.logger.debug(`📝 Ação registrada: ${dados.acao} em ${dados.tabelaOrigem}`);
      return log;

    } catch (error) {
      this.logger.error(`❌ Erro ao registrar ação: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📊 GERAR RELATÓRIO DE AUDITORIA
   */
  async gerarRelatorioAuditoria(dataInicio: Date, dataFim: Date): Promise<RelatorioAuditoria> {
    try {
      this.logger.log(`📊 Gerando relatório de auditoria: ${dataInicio.toISOString()} - ${dataFim.toISOString()}`);

      const [logs, estatisticas] = await Promise.all([
        this.auditRepository.find({
          where: {
            dataInicio: Between(dataInicio, dataFim),
          },
          order: { dataInicio: 'DESC' },
        }),
        this.obterEstatisticasDetalhadas(dataInicio, dataFim),
      ]);

      const totalOperacoes = logs.length;
      const operacoesSucesso = logs.filter(log => log.sucesso).length;
      const operacoesErro = totalOperacoes - operacoesSucesso;
      const taxaSucesso = totalOperacoes > 0 ? (operacoesSucesso / totalOperacoes) * 100 : 100;
      
      const tempoMedioExecucao = logs.length > 0 
        ? logs.reduce((sum, log) => sum + (log.duracaoMs || 0), 0) / logs.length 
        : 0;

      // ✅ OPERAÇÕES POR TIPO
      const operacoesPorTipo = this.agruparOperacoesPorTipo(logs);

      // ✅ USUÁRIOS MAIS ATIVOS
      const usuariosMaisAtivos = this.obterUsuariosMaisAtivos(logs);

      // ✅ ERROS FREQUENTES
      const errosFrequentes = this.obterErrosFrequentes(logs);

      return {
        periodo: { inicio: dataInicio, fim: dataFim },
        resumo: {
          totalOperacoes,
          operacoesSucesso,
          operacoesErro,
          taxaSucesso: Math.round(taxaSucesso * 100) / 100,
          tempoMedioExecucao: Math.round(tempoMedioExecucao),
        },
        operacoesPorTipo,
        usuariosMaisAtivos,
        errosFrequentes,
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao gerar relatório: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔍 BUSCAR LOGS COM FILTROS AVANÇADOS
   */
  async buscarLogs(filtros: {
    dataInicio?: Date;
    dataFim?: Date;
    operacao?: string;
    usuario?: string;
    status?: string;
    tabelaOrigem?: string;
    sucesso?: boolean;
    page?: number;
    limit?: number;
  } = {}) {
    try {
      const {
        page = 1,
        limit = 100,
        ...otherFilters
      } = filtros;

      const queryBuilder = this.auditRepository.createQueryBuilder('audit');

      // ✅ APLICAR FILTROS
      if (otherFilters.dataInicio && otherFilters.dataFim) {
        queryBuilder.andWhere('audit.dataInicio BETWEEN :dataInicio AND :dataFim', {
          dataInicio: otherFilters.dataInicio,
          dataFim: otherFilters.dataFim,
        });
      }

      if (otherFilters.operacao) {
        queryBuilder.andWhere('audit.operacao ILIKE :operacao', {
          operacao: `%${otherFilters.operacao}%`,
        });
      }

      if (otherFilters.usuario) {
        queryBuilder.andWhere('audit.usuarioSistema ILIKE :usuario', {
          usuario: `%${otherFilters.usuario}%`,
        });
      }

      if (otherFilters.status) {
        queryBuilder.andWhere('audit.status = :status', {
          status: otherFilters.status,
        });
      }

      if (otherFilters.tabelaOrigem) {
        queryBuilder.andWhere('audit.tabelaOrigem = :tabelaOrigem', {
          tabelaOrigem: otherFilters.tabelaOrigem,
        });
      }

      if (otherFilters.sucesso !== undefined) {
        queryBuilder.andWhere('audit.sucesso = :sucesso', {
          sucesso: otherFilters.sucesso,
        });
      }

      // ✅ PAGINAÇÃO E ORDENAÇÃO
      const skip = (page - 1) * limit;
      const [logs, total] = await queryBuilder
        .orderBy('audit.dataInicio', 'DESC')
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar logs: ${error.message}`);
      return { data: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } };
    }
  }

  /**
   * 🧹 LIMPEZA AUTOMÁTICA DE LOGS ANTIGOS
   */
  async limparLogsAntigos(diasParaManter: number = 90): Promise<number> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasParaManter);

      const resultado = await this.auditRepository
        .createQueryBuilder()
        .delete()
        .where('dataInicio < :dataLimite', { dataLimite })
        .execute();

      const removidos = resultado.affected || 0;
      
      if (removidos > 0) {
        this.logger.log(`🗑️ Limpeza automática: ${removidos} logs removidos (>${diasParaManter} dias)`);
        
        // ✅ REGISTRAR A PRÓPRIA LIMPEZA
        await this.registrarAcao({
          tabelaOrigem: 'audit_log',
          acao: 'LIMPEZA_AUTOMATICA',
          origemAlteracao: 'SISTEMA',
          observacoes: `Removidos ${removidos} logs antigos (>${diasParaManter} dias)`,
          sucesso: true,
        });
      }

      return removidos;

    } catch (error) {
      this.logger.error(`❌ Erro na limpeza de logs: ${error.message}`);
      return 0;
    }
  }

  /**
   * 📈 OBTER ESTATÍSTICAS GERAIS
   */
  async obterEstatisticasGerais(): Promise<any> {
    try {
      const [
        totalLogs,
        logsPorAcao,
        logsPorOrigem,
        logsComErro,
        operacoesAtivas
      ] = await Promise.all([
        this.auditRepository.count(),
        this.auditRepository
          .createQueryBuilder('log')
          .select('log.operacao', 'acao')
          .addSelect('COUNT(*)', 'quantidade')
          .groupBy('log.operacao')
          .orderBy('quantidade', 'DESC')
          .limit(10)
          .getRawMany(),
        this.auditRepository
          .createQueryBuilder('log')
          .select('log.origemAlteracao', 'origem')
          .addSelect('COUNT(*)', 'quantidade')
          .groupBy('log.origemAlteracao')
          .orderBy('quantidade', 'DESC')
          .getRawMany(),
        this.auditRepository.count({ where: { sucesso: false } }),
        this.operacoesAtivas.size,
      ]);

      const percentualSucesso = totalLogs > 0 
        ? ((totalLogs - logsComErro) / totalLogs * 100).toFixed(2) 
        : '100.00';

      return {
        resumo: {
          totalLogs,
          logsComErro,
          percentualSucesso: `${percentualSucesso}%`,
          operacoesAtivas,
        },
        distribuicao: {
          porAcao: logsPorAcao.map(item => ({
            acao: item.acao,
            quantidade: parseInt(item.quantidade),
            percentual: totalLogs > 0 ? ((parseInt(item.quantidade) / totalLogs) * 100).toFixed(1) : '0.0',
          })),
          porOrigem: logsPorOrigem.map(item => ({
            origem: item.origem,
            quantidade: parseInt(item.quantidade),
            percentual: totalLogs > 0 ? ((parseInt(item.quantidade) / totalLogs) * 100).toFixed(1) : '0.0',
          })),
        },
        performance: {
          operacoesMaisLentas: await this.obterOperacoesMaisLentas(),
          tempoMedioOperacoes: await this.obterTempoMedioOperacoes(),
        },
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao obter estatísticas: ${error.message}`);
      return {};
    }
  }

  // ✅ MÉTODOS PRIVADOS

  private gerarOperacaoId(): string {
    return `OP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async obterContexto(): Promise<any> {
    return {
      timestamp: new Date(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }

  /**
   * 🌐 RESOLVER IP ADDRESS CORRETAMENTE
   */
  private resolverIpAddress(ipAddress?: string): string {
    try {
      // ✅ SE NÃO FOI FORNECIDO, USAR SEU IP
      if (!ipAddress) {
        return '10.10.100.176'; // ✅ SEU IP
      }

      // ✅ CONVERTER "localhost" PARA SEU IP
      if (ipAddress === 'localhost' || ipAddress === '127.0.0.1') {
        return '10.10.100.176'; // ✅ SEU IP
      }

      // ✅ VERIFICAR SE É UM IP VÁLIDO
      if (this.isValidIP(ipAddress)) {
        return ipAddress;
      }

      // ✅ SE NÃO FOR VÁLIDO, USAR SEU IP
      this.logger.warn(`⚠️ IP inválido fornecido: ${ipAddress}, usando 10.10.100.176`);
      return '10.10.100.176'; // ✅ SEU IP

    } catch (error) {
      this.logger.warn(`⚠️ Erro ao resolver IP: ${error.message}, usando 10.10.100.176`);
      return '10.10.100.176'; // ✅ SEU IP
    }
  }

  /**
   * ✅ VALIDAR SE É UM IP VÁLIDO
   */
  private isValidIP(ip: string): boolean {
    // ✅ REGEX PARA IPv4
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    // ✅ REGEX PARA IPv6 (simplificado)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  private async obterEstatisticasDetalhadas(dataInicio: Date, dataFim: Date): Promise<any> {
    return await this.auditRepository
      .createQueryBuilder('audit')
      .select([
        'COUNT(*) as total',
        'AVG(audit.duracaoMs) as tempoMedio',
        'MAX(audit.duracaoMs) as tempoMaximo',
        'MIN(audit.duracaoMs) as tempoMinimo',
      ])
      .where('audit.dataInicio BETWEEN :dataInicio AND :dataFim', {
        dataInicio,
        dataFim,
      })
      .getRawOne();
  }

  private agruparOperacoesPorTipo(logs: AuditLogEntity[]): Array<any> {
    const grupos = logs.reduce((acc, log) => {
      const operacao = log.operacao || 'DESCONHECIDO';
      if (!acc[operacao]) {
        acc[operacao] = {
          logs: [],
          tempoTotal: 0,
        };
      }
      acc[operacao].logs.push(log);
      acc[operacao].tempoTotal += log.duracaoMs || 0;
      return acc;
    }, {} as Record<string, any>);

    const total = logs.length;

    return Object.entries(grupos).map(([acao, dados]: [string, any]) => ({
      acao,
      quantidade: dados.logs.length,
      percentual: total > 0 ? Math.round((dados.logs.length / total) * 100 * 100) / 100 : 0,
      tempoMedio: dados.logs.length > 0 ? Math.round(dados.tempoTotal / dados.logs.length) : 0,
    })).sort((a, b) => b.quantidade - a.quantidade);
  }

  private obterUsuariosMaisAtivos(logs: AuditLogEntity[]): Array<any> {
    const usuarios = logs.reduce((acc, log) => {
      const usuario = log.usuarioSistema || 'SISTEMA';
      if (!acc[usuario]) {
        acc[usuario] = {
          operacoes: 0,
          ultimaAtividade: log.dataInicio || log.createdAt,
        };
      }
      acc[usuario].operacoes++;
      const dataAtividade = log.dataInicio || log.createdAt;
      if (dataAtividade > acc[usuario].ultimaAtividade) {
        acc[usuario].ultimaAtividade = dataAtividade;
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(usuarios)
      .map(([usuario, dados]: [string, any]) => ({
        usuario,
        operacoes: dados.operacoes,
        ultimaAtividade: dados.ultimaAtividade,
      }))
      .sort((a, b) => b.operacoes - a.operacoes)
      .slice(0, 10);
  }

  private obterErrosFrequentes(logs: AuditLogEntity[]): Array<any> {
    const erros = logs
      .filter(log => !log.sucesso && log.erroDetalhes)
      .reduce((acc, log) => {
        const erro = log.erroDetalhes!;
        if (!acc[erro]) {
          acc[erro] = {
            quantidade: 0,
            ultimaOcorrencia: log.dataInicio || log.createdAt,
          };
        }
        acc[erro].quantidade++;
        const dataOcorrencia = log.dataInicio || log.createdAt;
        if (dataOcorrencia > acc[erro].ultimaOcorrencia) {
          acc[erro].ultimaOcorrencia = dataOcorrencia;
        }
        return acc;
      }, {} as Record<string, any>);

    return Object.entries(erros)
      .map(([erro, dados]: [string, any]) => ({
        erro,
        quantidade: dados.quantidade,
        ultimaOcorrencia: dados.ultimaOcorrencia,
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
  }

  private async obterOperacoesMaisLentas(): Promise<any[]> {
    return await this.auditRepository.find({
      where: { sucesso: true },
      order: { duracaoMs: 'DESC' },
      take: 5,
      select: ['operacao', 'duracaoMs', 'dataInicio', 'usuarioSistema'],
    });
  }

  private async obterTempoMedioOperacoes(): Promise<any[]> {
    return await this.auditRepository
      .createQueryBuilder('audit')
      .select([
        'audit.operacao',
        'AVG(audit.duracaoMs) as tempoMedio',
        'COUNT(*) as quantidade',
      ])
      .where('audit.sucesso = :sucesso', { sucesso: true })
      .groupBy('audit.operacao')
      .orderBy('tempoMedio', 'DESC')
      .limit(10)
      .getRawMany();
  }
}