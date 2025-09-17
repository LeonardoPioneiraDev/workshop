import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'cumprimento_servico' })
export class CumprimentoServico {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  idservico: string;

  @Column()
  idempresa: string;

  @Column()
  numerolinha: string;

  @Column()
  prefixoprevisto: string;

  @Column()
  statusini: string;

  @Column()
  statusfim: string;

  @Column()
  dia: string;
}
