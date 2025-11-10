// src/modules/departamentos/juridico/entities/dvs-agente-autuador.entity.ts
import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { DvsMultaEntity } from './dvs-multa.entity';

@Entity('dvs_agente_autuador')
@Index(['cod_agente_autuador'], { unique: true })
@Index(['desc_agente_autuador'])
@Index(['matriculafiscal'])
export class DvsAgenteAutuadorEntity {
  // ✅ CHAVE PRIMÁRIA
  @PrimaryColumn({ name: 'cod_agente_autuador', type: 'decimal', precision: 22, scale: 0 })
  cod_agente_autuador: number;

  // ✅ CAMPOS PRINCIPAIS
  @Column({ name: 'desc_agente_autuador', type: 'varchar', length: 40, nullable: false })
  desc_agente_autuador: string;

  @Column({ name: 'matriculafiscal', type: 'varchar', length: 50, nullable: true })
  matriculafiscal: string;

  // ✅ CONTROLE DE SINCRONIZAÇÃO
  @Column({ name: 'data_sincronizacao', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data_sincronizacao: Date;

  @Column({ name: 'origem_dados', type: 'varchar', length: 20, default: 'ORACLE_DVS_AGENTE' })
  origem_dados: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // ✅ RELACIONAMENTOS
  @OneToMany(() => DvsMultaEntity, multa => multa.agente)
  multas: DvsMultaEntity[];
}