// src/modules/departamentos/juridico/services/juridico-sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SincronizacaoLogEntity } from '../entities/sincronizacao-log.entity';
import { SyncService } from './sync.service';

@Injectable()
export class JuridicoSyncService {
  private readonly logger = new Logger(JuridicoSyncService.name);

  constructor(
    @InjectRepository(SincronizacaoLogEntity)
    private readonly sincronizacaoLogRepository: Repository<SincronizacaoLogEntity>,
    private readonly syncService: SyncService
  ) {}

  /**
   * 📊 Obter status da sincronização
   */
  async getStatusSincronizacao() {
    try {
      // Buscar último log de sincronização
      const ultimoLog = await this.sincronizacaoLogRepository
        .createQueryBuilder('log')
        .orderBy('log.data_sincronizacao', 'DESC')
        .getOne();

      // Obter status do SyncService
      const statusSync = await this.syncService.getStatusSincronizacao();

      return {
        ...statusSync,
        ultimoLog: ultimoLog ? {
          id: ultimoLog.id,
          tabelaOrigem: ultimoLog.tabela_origem,
          status: ultimoLog.status,
          dataInicio: ultimoLog.data_inicio,
          dataFim: ultimoLog.data_fim,
          registrosOracle: ultimoLog.registros_oracle,
          registrosInseridos: ultimoLog.registros_inseridos,
          registrosAtualizados: ultimoLog.registros_atualizados,
          registrosErro: ultimoLog.registros_erro,
          tempoExecucaoMs: ultimoLog.tempo_execucao_ms,
          usuarioSolicitante: ultimoLog.usuario_solicitante
        } : null
      };
    } catch (error) {
      this.logger.error(`Erro ao obter status da sincronização: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔄 Sincronizar dados manualmente
   */
  async sincronizarDados() {
    const logId = await this.criarLogSincronizacao('MANUAL', 'Sistema');
    
    try {
      const resultado = await this.syncService.executarSincronizacaoCompleta();
      
      await this.finalizarLogSincronizacao(logId, 'SUCESSO', resultado);
      
      return {
        success: true,
        message: 'Sincronização executada com sucesso',
        logId,
        ...resultado
      };
    } catch (error) {
      await this.finalizarLogSincronizacao(logId, 'ERRO', null, error.message);
      throw error;
    }
  }

  /**
   * 📝 Criar log de sincronização
   */
  private async criarLogSincronizacao(tipo: string, usuario: string): Promise<number> {
    const log = this.sincronizacaoLogRepository.create({
      tabela_origem: 'TODAS',
      data_inicio: new Date(),
      status: 'EM_ANDAMENTO',
      usuario_solicitante: usuario,
      observacoes: `Sincronização ${tipo} iniciada`
    });

    const savedLog = await this.sincronizacaoLogRepository.save(log);
    return savedLog.id;
  }

  /**
   * ✅ Finalizar log de sincronização
   */
  private async finalizarLogSincronizacao(
    logId: number, 
    status: string, 
    resultado?: any, 
    erro?: string
  ): Promise<void> {
    const dataFim = new Date();
    
    const updateData: Partial<SincronizacaoLogEntity> = {
      data_fim: dataFim,
      status,
      erro_detalhes: erro
    };

    if (resultado) {
      updateData.registros_oracle = resultado.resultado?.multas?.processados || 0;
      updateData.registros_inseridos = resultado.resultado?.multas?.inseridos || 0;
      updateData.registros_atualizados = resultado.resultado?.multas?.atualizados || 0;
      updateData.registros_erro = resultado.resultado?.multas?.erros || 0;
      updateData.tempo_execucao_ms = parseInt(resultado.executionTime?.replace('ms', '')) || 0;
    }

    await this.sincronizacaoLogRepository.update(logId, updateData);
  }

  /**
   * 📊 Obter histórico de sincronizações
   */
  async getHistoricoSincronizacao(limite: number = 50) {
    return await this.sincronizacaoLogRepository
      .createQueryBuilder('log')
      .orderBy('log.data_sincronizacao', 'DESC')
      .limit(limite)
      .getMany();
  }
}