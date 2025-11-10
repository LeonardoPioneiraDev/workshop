// src/modules/departamentos/juridico/entities/dvs-infracao.entity.ts
import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { DvsMultaEntity } from './dvs-multa.entity';

@Entity('dvs_infracao')
@Index(['codigoinfra'], { unique: true })
@Index(['descricaoinfra'])
@Index(['grupoinfra'])
@Index(['tipomulta'])
export class DvsInfracaoEntity {
  // ✅ CHAVE PRIMÁRIA
  @PrimaryColumn({ name: 'codigoinfra', type: 'varchar', length: 12 })
  codigoinfra: string;
a
  // ✅ CAMPOS PRINCIPAIS
  @Column({ name: 'descricaoinfra', type: 'varchar', length: 255, nullable: false })
  descricaoinfra: string;

  @Column({ name: 'pontuacaoinfra', type: 'decimal', precision: 22, scale: 0, nullable: true })
  pontuacaoinfra: number;

  @Column({ name: 'grupoinfra', type: 'varchar', length: 50, nullable: true })
  grupoinfra: string;

  @Column({ name: 'artigoinfra', type: 'varchar', length: 50, nullable: true })
  artigoinfra: string;

  @Column({ name: 'ufirinfra', type: 'decimal', precision: 22, scale: 4, nullable: true })
  ufirinfra: number;

  @Column({ name: 'tipomulta', type: 'varchar', length: 1, nullable: true })
  tipomulta: string;

  @Column({ name: 'orgao', type: 'varchar', length: 5, nullable: true })
  orgao: string;

  // ✅ CONTROLE DE SINCRONIZAÇÃO
  @Column({ name: 'data_sincronizacao', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data_sincronizacao: Date;

  @Column({ name: 'origem_dados', type: 'varchar', length: 20, default: 'ORACLE_DVS_INFRACAO' })
  origem_dados: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // ✅ RELACIONAMENTOS
  @OneToMany(() => DvsMultaEntity, multa => multa.infracao)
  multas: DvsMultaEntity[];
}