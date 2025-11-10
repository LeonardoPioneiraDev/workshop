// apps/backend/src/modules/departamentos/pessoal/entities/funcionario-completo.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('pessoal_funcionarios_completos')
@Index(['empresa', 'cracha'])
@Index(['mesReferencia'])
@Index(['cpf'])
@Index(['nome'])
@Index(['situacao'])
@Index(['departamento'])
@Index(['area'])
@Index(['cidade'])
@Index(['dataAdmissao'])
@Index(['sincronizadoEm'])
export class FuncionarioCompletoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'vale_refeicao', type: 'varchar', length: 1, default: 'N' })
  valeRefeicao: string;

  @Column({ name: 'data_transferencia', type: 'date', nullable: true })
  dataTransferencia: Date;

  @Column({ name: 'empresa', type: 'integer' })
  empresa: number;

  @Column({ name: 'codint_func', type: 'integer' })
  codintFunc: number;

  @Column({ name: 'cracha', type: 'integer' })
  cracha: number;

  @Column({ name: 'chapa', type: 'varchar', length: 50, nullable: true })
  chapa: string;

  @Column({ name: 'nome', type: 'varchar', length: 300 }) // ✅ CORRIGIDO
  nome: string;

  @Column({ name: 'mae', type: 'varchar', length: 300, nullable: true }) // ✅ CORRIGIDO
  mae: string;

  @Column({ name: 'cpf', type: 'varchar', length: 14, nullable: true })
  cpf: string;

  @Column({ name: 'funcao', type: 'varchar', length: 500, nullable: true }) // ✅ CORRIGIDO
  funcao: string;

  @Column({ name: 'departamento', type: 'varchar', length: 300, nullable: true }) // ✅ CORRIGIDO
  departamento: string;

  @Column({ name: 'area', type: 'varchar', length: 300, nullable: true }) // ✅ CORRIGIDO
  area: string;

  @Column({ name: 'secao', type: 'varchar', length: 300, nullable: true }) // ✅ CORRIGIDO
  secao: string;

  @Column({ name: 'setor', type: 'varchar', length: 300, nullable: true }) // ✅ CORRIGIDO
  setor: string;

  @Column({ name: 'endereco', type: 'varchar', length: 800, nullable: true }) // ✅ CORRIGIDO
  endereco: string;

  @Column({ name: 'casa', type: 'varchar', length: 20, nullable: true })
  casa: string;

  @Column({ name: 'bairro', type: 'varchar', length: 300, nullable: true }) // ✅ CORRIGIDO
  bairro: string;

  @Column({ name: 'cidade', type: 'varchar', length: 300, nullable: true }) // ✅ CORRIGIDO
  cidade: string;

  @Column({ name: 'fone_func', type: 'varchar', length: 20, nullable: true })
  foneFunc: string;

  @Column({ name: 'fone2_func', type: 'varchar', length: 20, nullable: true })
  fone2Func: string;

  @Column({ name: 'data_admissao', type: 'date', nullable: true })
  dataAdmissao: Date;

  @Column({ name: 'situacao', type: 'varchar', length: 1 })
  situacao: string;

  @Column({ name: 'situacao_descricao', type: 'varchar', length: 100, nullable: true }) // ✅ CORRIGIDO
  situacaoDescricao: string;

  @Column({ name: 'sal_base', type: 'decimal', precision: 10, scale: 2, default: 0 })
  salBase: number;

  @Column({ name: 'sal_aux1', type: 'decimal', precision: 10, scale: 2, default: 0 })
  salAux1: number;

  @Column({ name: 'sal_aux2', type: 'decimal', precision: 10, scale: 2, default: 0 })
  salAux2: number;

  @Column({ name: 'salario_total', type: 'decimal', precision: 10, scale: 2, default: 0 })
  salarioTotal: number;

  @Column({ name: 'dt_compet_quita', type: 'date', nullable: true })
  dtCompetQuita: Date;

  @Column({ name: 'id_quita', type: 'integer', nullable: true })
  idQuita: number;

  @Column({ name: 'dt_deslig_quita', type: 'date', nullable: true })
  dtDesligQuita: Date;

  @Column({ name: 'idade', type: 'integer', nullable: true })
  idade: number;

  @Column({ name: 'tempo_empresa_dias', type: 'integer', nullable: true })
  tempoEmpresaDias: number;

  @Column({ name: 'tempo_empresa_anos', type: 'decimal', precision: 5, scale: 2, nullable: true })
  tempoEmpresaAnos: number;

  @Column({ name: 'tem_quitacao', type: 'boolean', default: false })
  temQuitacao: boolean;

  @Column({ name: 'ativo', type: 'boolean', default: true })
  ativo: boolean;

  @Column({ name: 'mes_referencia', type: 'varchar', length: 7 })
  mesReferencia: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'sincronizado_em', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sincronizadoEm: Date;
}