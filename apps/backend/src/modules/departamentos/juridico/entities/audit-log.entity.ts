// src/modules/departamentos/juridico/entities/audit-log.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('juridico_audit_log')
@Index(['tabelaOrigem'])
@Index(['codigoMulta'])
@Index(['createdAt'])
@Index(['usuarioSistema'])
@Index(['operacaoId'])
@Index(['dataInicio'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // ✅ ADICIONADO: ID da operação para tracking
  @Column({ name: 'operacao_id', type: 'varchar', length: 100, nullable: true })
  operacaoId: string;

  // ✅ ADICIONADO: Nome da operação
  @Column({ name: 'operacao', type: 'varchar', length: 100, nullable: true })
  operacao: string;

  // ✅ ADICIONADO: Data de início da operação
  @Column({ name: 'data_inicio', type: 'timestamp', nullable: true })
  dataInicio: Date;

  // ✅ ADICIONADO: Data de fim da operação
  @Column({ name: 'data_fim', type: 'timestamp', nullable: true })
  dataFim: Date;

  // ✅ ADICIONADO: Status da operação
  @Column({ name: 'status', type: 'varchar', length: 20, default: 'INICIADO' })
  status: string; // 'INICIADO', 'CONCLUIDO', 'ERRO'

  // ✅ ADICIONADO: Dados da operação
  @Column({ name: 'dados', type: 'jsonb', nullable: true })
  dados: any;

  // ✅ ADICIONADO: Resultado da operação
  @Column({ name: 'resultado', type: 'jsonb', nullable: true })
  resultado: any;

  @Column({ name: 'tabela_origem', type: 'varchar', length: 50 })
  tabelaOrigem: string;

  @Column({ name: 'registro_id', type: 'int', nullable: true })
  registroId: number;

  @Column({ name: 'codigo_multa', type: 'varchar', length: 50, nullable: true })
  codigoMulta: string;

  @Column({ name: 'acao', type: 'varchar', length: 20 })
  acao: string; // 'INSERT', 'UPDATE', 'DELETE', 'SYNC', 'VIEW'

  @Column({ name: 'campos_alterados', type: 'jsonb', nullable: true })
  camposAlterados: any;

  @Column({ name: 'valores_anteriores', type: 'jsonb', nullable: true })
  valoresAnteriores: any;

  @Column({ name: 'valores_novos', type: 'jsonb', nullable: true })
  valoresNovos: any;

  @Column({ name: 'usuario_sistema', type: 'varchar', length: 50, nullable: true })
  usuarioSistema: string;

  @Column({ name: 'ip_origem', type: 'inet', nullable: true })
  ipOrigem: string;

  @Column({ name: 'origem_alteracao', type: 'varchar', length: 30 })
  origemAlteracao: string; // 'ORACLE_SYNC', 'MANUAL', 'API', 'JOB'

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string;

  @Column({ name: 'duracao_ms', type: 'int', nullable: true })
  duracaoMs: number;

  @Column({ name: 'sucesso', type: 'boolean', default: true })
  sucesso: boolean;

  @Column({ name: 'erro_detalhes', type: 'text', nullable: true })
  erroDetalhes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}