// src/modules/departamentos/juridico/entities/infracao.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { MultaCacheEntity } from './multa-cache.entity';

@Entity('juridico_infracoes')
@Index(['codigoInfracao'], { unique: true })
@Index(['categoria'])
@Index(['gravidade'])
@Index(['ativo'])
export class InfracaoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'codigo_infracao', type: 'varchar', length: 20, unique: true })
  codigoInfracao: string;

  @Column({ name: 'descricao_completa', type: 'text', nullable: true })
  descricaoCompleta: string;

  @Column({ name: 'descricao_resumida', type: 'varchar', length: 200, nullable: true })
  descricaoResumida: string;

  @Column({ name: 'artigo_lei', type: 'varchar', length: 50, nullable: true })
  artigoLei: string;

  @Column({ name: 'inciso', type: 'varchar', length: 10, nullable: true })
  inciso: string;

  @Column({ name: 'paragrafo', type: 'varchar', length: 10, nullable: true })
  paragrafo: string;

  @Column({ name: 'valor_base', type: 'decimal', precision: 10, scale: 2, nullable: true })
  valorBase: number;

  @Column({ name: 'pontuacao', type: 'int', nullable: true })
  pontuacao: number;

  @Column({ name: 'gravidade', type: 'varchar', length: 20, nullable: true })
  gravidade: string;

  @Column({ name: 'categoria', type: 'varchar', length: 50, nullable: true })
  categoria: string;

  @Column({ name: 'tipo_fiscalizacao', type: 'varchar', length: 30, nullable: true })
  tipoFiscalizacao: string;

  @Column({ name: 'permite_recurso', type: 'boolean', default: true })
  permiteRecurso: boolean;

  @Column({ name: 'prazo_recurso_dias', type: 'int', default: 30 })
  prazoRecursoDias: number;

  @Column({ name: 'multiplicador_reincidencia', type: 'decimal', precision: 3, scale: 2, default: 1.0 })
  multiplicadorReincidencia: number;

  @Column({ name: 'ativo', type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ✅ RELACIONAMENTO COMENTADO TEMPORARIAMENTE
  /*
  @OneToMany(() => MultaCacheEntity, multa => multa.infracao)
  multas: MultaCacheEntity[];
  */
}