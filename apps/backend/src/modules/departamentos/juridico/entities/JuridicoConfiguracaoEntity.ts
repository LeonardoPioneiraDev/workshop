// src/modules/departamentos/juridico/entities/configuracao.entity.ts (Corrigido para JuridicoConfiguracaoEntity)

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('configuracao') // Mapeia para o nome da tabela presumido
@Index(['chave'], { unique: true })
@Index(['categoria'])
export class JuridicoConfiguracaoEntity { // Classe renomeada com prefixo Juridico
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'chave', type: 'varchar', length: 100, unique: true })
  chave: string;

  @Column({ name: 'valor', type: 'text' })
  valor: string;

  @Column({ name: 'tipo_valor', type: 'varchar', length: 20 })
  tipoValor: string;

  @Column({ name: 'categoria', type: 'varchar', length: 50 })
  categoria: string;

  @Column({ name: 'descricao', type: 'text', nullable: true })
  descricao: string;

  @Column({ name: 'valor_padrao', type: 'text', nullable: true })
  valorPadrao: string;

  @Column({ name: 'editavel', type: 'boolean', default: true })
  editavel: boolean;

  @Column({ name: 'requer_reinicio', type: 'boolean', default: false })
  requerReinicio: boolean;

  @Column({ name: 'validacao_regex', type: 'varchar', length: 200, nullable: true })
  validacaoRegex: string;

  @Column({ name: 'valores_permitidos', type: 'text', nullable: true })
  valoresPermitidos: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
