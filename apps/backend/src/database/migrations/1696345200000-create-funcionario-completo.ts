// apps/backend/src/database/migrations/1696345200000-create-funcionario-completo.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateFuncionarioCompleto1696345200000 implements MigrationInterface {
  name = 'CreateFuncionarioCompleto1696345200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'funcionario_completo',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'vale_refeicao',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'data_transferencia',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'empresa',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'codint_func',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'cracha',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'chapa',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'nome',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'mae',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'cpf',
            type: 'varchar',
            length: '11',
            isNullable: true,
          },
          {
            name: 'funcao',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'departamento',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'area',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'secao',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'setor',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'endereco',
            type: 'varchar',
            length: '300',
            isNullable: true,
          },
          {
            name: 'casa',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'bairro',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'cidade',
            type: 'varchar',
            length: '200',
            isNullable: true,
          },
          {
            name: 'fone_func',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'fone2_func',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'data_admissao',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'situacao',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'situacao_descricao',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'sal_base',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'sal_aux1',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'sal_aux2',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'salario_total',
            type: 'decimal',
            precision: 10,
            scale: 2,
            default: 0,
          },
          {
            name: 'dt_compet_quita',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'id_quita',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'dt_deslig_quita',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'idade',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'tempo_empresa_dias',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'tempo_empresa_anos',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'tem_quitacao',
            type: 'boolean',
            default: false,
          },
          {
            name: 'ativo',
            type: 'boolean',
            default: true,
          },
          {
            name: 'mes_referencia',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'sincronizado_em',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        // ✅ ÍNDICES CORRIGIDOS - Sintaxe correta
        indices: [
          {
            name: 'idx_funcionario_completo_empresa_cracha_mes',
            columnNames: ['empresa', 'cracha', 'mes_referencia'],
            isUnique: false,
          },
          {
            name: 'idx_funcionario_completo_mes_referencia',
            columnNames: ['mes_referencia'],
            isUnique: false,
          },
          {
            name: 'idx_funcionario_completo_cpf',
            columnNames: ['cpf'],
            isUnique: false,
          },
          {
            name: 'idx_funcionario_completo_departamento',
            columnNames: ['departamento'],
            isUnique: false,
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('funcionario_completo');
  }
}