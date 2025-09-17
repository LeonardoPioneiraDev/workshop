// src/entities/man-os.entity.ts
import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('MAN_OS') // O nome da sua tabela no banco de dados
export class ManOs {
  @PrimaryColumn({ name: 'CODINTOS', type: 'number' }) // Exemplo de chave primária
  codIntOs: number;

  @Column({ name: 'CODIGOEMPRESA', type: 'number', nullable: true })
  codigoEmpresa: number;

  @Column({ name: 'NUMEROOS', type: 'number', nullable: true })
  numeroOs: number;

  @Column({ name: 'CODIGOVEIC', type: 'number', nullable: true })
  codigoVeic: number;

  @Column({ name: 'KMEXECUCAOOS', type: 'number', nullable: true })
  kmExecucaoOs: number;

  @Column({ name: 'TIPOOS', type: 'varchar', length: 1, nullable: true })
  tipoOs: string;

  @Column({ name: 'CONDICAOOS', type: 'varchar', length: 2, nullable: true })
  condicaoOs: string;

  @Column({ name: 'USUARIOABERTURAOS', type: 'varchar', length: 50, nullable: true })
  usuarioAberturaOs: string;

  @Column({ name: 'USUARIOFECHAMENTOOS', type: 'varchar', length: 50, nullable: true })
  usuarioFechamentoOs: string;

  @Column({ name: 'DATAABERTURAOS', type: 'date', nullable: true })
  dataAberturaOs: Date;

  @Column({ name: 'DATAFECHAMENTOOS', type: 'date', nullable: true })
  dataFechamentoOs: Date;

  @Column({ name: 'HORAFECHAMENTOOS', type: 'timestamp', nullable: true })
  horaFechamentoOs: Date; // Usar Date para TIMESTAMP

  // Adicione outras colunas conforme a estrutura da sua tabela MAN_OS
  // Lembre-se de mapear os nomes das colunas do banco (NAME: 'NOME_COLUNA')
  // e usar os tipos TypeScript apropriados.
}