// src/modules/departamentos/juridico/entities/alerta.entity.ts (Corrigido para JuridicoAlertaEntity)

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('alerta') // Mapeia para o nome da tabela presumido
@Index(['tipoAlerta'])
@Index(['status'])
@Index(['dataOcorrencia'])
@Index(['severidade'])
export class JuridicoAlertaEntity { // Classe renomeada com prefixo Juridico
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'tipo_alerta', type: 'varchar', length: 30 })
  tipoAlerta: string;

  @Column({ name: 'severidade', type: 'varchar', length: 10 })
  severidade: string;

  @Column({ name: 'titulo', type: 'varchar', length: 200 })
  titulo: string;

  @Column({ name: 'descricao', type: 'text', nullable: true })
  descricao: string;

  @Column({ name: 'entidade_tipo', type: 'varchar', length: 30, nullable: true })
  entidadeTipo: string;

  @Column({ name: 'entidade_id', type: 'varchar', length: 50, nullable: true })
  entidadeId: string;

  @Column({ name: 'valor_referencia', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorReferencia: number;

  @Column({ name: 'threshold_configurado', type: 'decimal', precision: 15, scale: 2, nullable: true })
  thresholdConfigurado: number;

  @Column({ name: 'data_ocorrencia', type: 'timestamp' })
  dataOcorrencia: Date;

  @Column({ name: 'status', type: 'varchar', length: 20, default: 'ATIVO' })
  status: string;

  @Column({ name: 'usuario_responsavel', type: 'varchar', length: 50, nullable: true })
  usuarioResponsavel: string;

  @Column({ name: 'data_resolucao', type: 'timestamp', nullable: true })
  dataResolucao: Date;

  @Column({ name: 'observacoes_resolucao', type: 'text', nullable: true })
  observacoesResolucao: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
