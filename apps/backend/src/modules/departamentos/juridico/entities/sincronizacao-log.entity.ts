// src/modules/departamentos/juridico/entities/sincronizacao-log.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('sincronizacao_log')
@Index(['tabela_origem'])
@Index(['data_sincronizacao'])
@Index(['status'])
export class SincronizacaoLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tabela_origem', type: 'varchar', length: 50 })
  tabela_origem: string;

  @Column({ name: 'data_inicio', type: 'timestamp' })
  data_inicio: Date;

  @Column({ name: 'data_fim', type: 'timestamp', nullable: true })
  data_fim: Date;

  @Column({ name: 'periodo_sincronizado_inicio', type: 'timestamp', nullable: true })
  periodo_sincronizado_inicio: Date;

  @Column({ name: 'periodo_sincronizado_fim', type: 'timestamp', nullable: true })
  periodo_sincronizado_fim: Date;

  @Column({ name: 'registros_oracle', type: 'int', default: 0 })
  registros_oracle: number;

  @Column({ name: 'registros_inseridos', type: 'int', default: 0 })
  registros_inseridos: number;

  @Column({ name: 'registros_atualizados', type: 'int', default: 0 })
  registros_atualizados: number;

  @Column({ name: 'registros_erro', type: 'int', default: 0 })
  registros_erro: number;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'EM_ANDAMENTO' })
  status: string; // EM_ANDAMENTO, SUCESSO, ERRO, CANCELADO

  @Column({ name: 'tempo_execucao_ms', type: 'int', nullable: true })
  tempo_execucao_ms: number;

  @Column({ name: 'erro_detalhes', type: 'text', nullable: true })
  erro_detalhes: string;

  @Column({ name: 'usuario_solicitante', type: 'varchar', length: 100, nullable: true })
  usuario_solicitante: string;

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string;

  @CreateDateColumn({ name: 'data_sincronizacao' })
  data_sincronizacao: Date;
}