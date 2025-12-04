import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'dept_pessoal_snapshot', schema: 'workshop' })
export class DeptPessoalSnapshot {
  @PrimaryColumn({ name: 'empresa', type: 'int' })
  empresa: number;

  @PrimaryColumn({ name: 'codintfunc', type: 'int' })
  codintfunc: number;

  @PrimaryColumn({ name: 'referencia_date', type: 'date' })
  referenciaDate: Date;

  @Column({ name: 'cracha', nullable: true })
  cracha: string | null;

  @Column({ name: 'chapa', nullable: true })
  chapa: string | null;

  @Column({ name: 'nome', nullable: true })
  nome: string | null;

  @Column({ name: 'cpf', nullable: true })
  cpf: string | null;

  @Column({ name: 'funcao', nullable: true })
  funcao: string | null;

  @Column({ name: 'departamento', nullable: true })
  departamento: string | null;

  @Column({ name: 'area', nullable: true })
  area: string | null;

  @Column({ name: 'cidade', nullable: true })
  cidade: string | null;

  @Column({ name: 'admissao', type: 'date', nullable: true })
  admissao: Date | null;

  @Column({ name: 'situacao', nullable: true })
  situacao: string | null;

  @Column({ name: 'salbase', type: 'numeric', nullable: true })
  salbase: string | null;

  @Column({ name: 'salaux1', type: 'numeric', nullable: true })
  salaux1: string | null;

  @Column({ name: 'salaux2', type: 'numeric', nullable: true })
  salaux2: string | null;

  @Column({ name: 'dtcompet_quita', type: 'date', nullable: true })
  dtcompetQuita: Date | null;

  @Column({ name: 'id_quita', nullable: true })
  idQuita: string | null;

  @Column({ name: 'dt_deslig_quita', type: 'date', nullable: true })
  dtDesligQuita: Date | null;

  @Column({ name: 'idade', type: 'int', nullable: true })
  idade: number | null;

  @Column({ name: 'tempo_empresa_dias', type: 'int', nullable: true })
  tempoEmpresaDias: number | null;

  @Column({ name: 'tempo_empresa_anos', type: 'numeric', nullable: true })
  tempoEmpresaAnos: string | null;

  @Column({ name: 'valerefeicfunc', nullable: true })
  valerefeicfunc: string | null;

  @Column({ name: 'dttransffunc', type: 'date', nullable: true })
  dttransffunc: Date | null;

  @Column({ name: 'mae', nullable: true })
  mae: string | null;

  @Column({ name: 'descsecao', nullable: true })
  descsecao: string | null;

  @Column({ name: 'descsetor', nullable: true })
  descsetor: string | null;

  @Column({ name: 'endereco', nullable: true })
  endereco: string | null;

  @Column({ name: 'casa', nullable: true })
  casa: string | null;

  @Column({ name: 'bairro', nullable: true })
  bairro: string | null;

  @Column({ name: 'fonefunc', nullable: true })
  fonefunc: string | null;

  @Column({ name: 'fone2func', nullable: true })
  fone2func: string | null;
}

