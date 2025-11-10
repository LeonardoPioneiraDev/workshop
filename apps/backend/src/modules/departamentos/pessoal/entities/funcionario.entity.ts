// src/modules/departamentos/pessoal/entities/funcionario.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('pessoal_funcionarios')
@Index(['codigoEmpresa', 'codfunc'])
@Index(['chapafunc'])
@Index(['cpf'])
@Index(['dtadmfunc'])
@Index(['dtafast'])
@Index(['mesReferencia'])
@Index(['situacaoCalculada'])
export class FuncionarioEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'codigo_empresa', type: 'integer' })
  codigoEmpresa: number;

  @Column({ name: 'codfunc', type: 'integer' })
  codfunc: number;

  @Column({ name: 'chapafunc', type: 'varchar', length: 20, nullable: true })
  chapafunc: string;

  @Column({ name: 'descfuncao', type: 'varchar', length: 100, nullable: true })
  descfuncao: string;

  @Column({ name: 'nomefunc', type: 'varchar', length: 100 })
  nomefunc: string;

  @Column({ name: 'sexofunc', type: 'varchar', length: 1, nullable: true })
  sexofunc: string;

  @Column({ name: 'dtnasctofunc', type: 'date', nullable: true })
  dtnasctofunc: Date;

  @Column({ name: 'cpf', type: 'varchar', length: 14, nullable: true })
  cpf: string;

  @Column({ name: 'dtadmfunc', type: 'date', nullable: true })
  dtadmfunc: Date;

  @Column({ name: 'dtafast', type: 'date', nullable: true })
  dtafast: Date;

  @Column({ name: 'desccondi', type: 'varchar', length: 50, nullable: true })
  desccondi: string;

  @Column({ name: 'codcid', type: 'varchar', length: 10, nullable: true })
  codcid: string;

  @Column({ name: 'desccid', type: 'varchar', length: 100, nullable: true })
  desccid: string;

  // ✅ CAMPOS CALCULADOS
  @Column({ name: 'idade', type: 'integer', nullable: true })
  idade: number;

  @Column({ name: 'tempo_empresa_dias', type: 'integer', nullable: true })
  tempoEmpresaDias: number;

  @Column({ name: 'situacao_calculada', type: 'varchar', length: 20, nullable: true })
  situacaoCalculada: string; // ATIVO, AFASTADO, DEMITIDO

  @Column({ name: 'mes_referencia', type: 'varchar', length: 7 })
  mesReferencia: string; // YYYY-MM

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'sincronizado_em', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sincronizadoEm: Date;
}