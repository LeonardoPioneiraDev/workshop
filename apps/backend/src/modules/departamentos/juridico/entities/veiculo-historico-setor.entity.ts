// src/modules/departamentos/juridico/entities/veiculo-historico-setor.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('juridico_veiculo_historico_setor')
@Index(['prefixoVeiculo', 'dataInicio', 'dataFim'])
@Index(['codigoGaragem', 'dataInicio'])
export class VeiculoHistoricoSetorEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'prefixo_veiculo', type: 'varchar', length: 20 })
  prefixoVeiculo: string;

  @Column({ name: 'codigo_empresa', type: 'integer' })
  codigoEmpresa: number;

  @Column({ name: 'codigo_garagem', type: 'integer' })
  codigoGaragem: number;

  @Column({ name: 'nome_garagem', type: 'varchar', length: 50 })
  nomeGaragem: string;

  @Column({ name: 'data_inicio', type: 'date' })
  dataInicio: Date;

  @Column({ name: 'data_fim', type: 'date', nullable: true })
  dataFim: Date | null; // NULL = período atual

  @Column({ name: 'motivo_mudanca', type: 'varchar', length: 100, nullable: true })
  motivoMudanca: string;

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string;

  @Column({ name: 'usuario_alteracao', type: 'varchar', length: 50, nullable: true })
  usuarioAlteracao: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}