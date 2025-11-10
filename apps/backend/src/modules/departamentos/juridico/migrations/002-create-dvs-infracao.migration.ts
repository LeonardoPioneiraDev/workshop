// src/modules/departamentos/juridico/migrations/002-create-dvs-infracao.migration.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDvsInfracao1704067200002 implements MigrationInterface {
  name = 'CreateDvsInfracao1704067200002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'dvs_infracao',
        columns: [
          {
            name: 'codigoinfra',
            type: 'varchar',
            length: '12',
            isPrimary: true,
          },
          {
            name: 'descricaoinfra',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'pontuacaoinfra',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'grupoinfra',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'artigoinfra',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'ufirinfra',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'tipomulta',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'orgao',
            type: 'varchar',
            length: '5',
            isNullable: true,
          },
          {
            name: 'data_sincronizacao',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'origem_dados',
            type: 'varchar',
            length: '20',
            default: "'ORACLE_DVS_INFRACAO'",
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
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // ✅ CRIAR ÍNDICES CORRIGIDOS
    await queryRunner.createIndex(
      'dvs_infracao',
      new TableIndex({
        name: 'IDX_DVS_INFRACAO_CODIGOINFRA',
        columnNames: ['codigoinfra'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'dvs_infracao',
      new TableIndex({
        name: 'IDX_DVS_INFRACAO_DESCRICAO',
        columnNames: ['descricaoinfra'],
      }),
    );

    await queryRunner.createIndex(
      'dvs_infracao',
      new TableIndex({
        name: 'IDX_DVS_INFRACAO_GRUPO',
        columnNames: ['grupoinfra'],
      }),
    );

    await queryRunner.createIndex(
      'dvs_infracao',
      new TableIndex({
        name: 'IDX_DVS_INFRACAO_TIPOMULTA',
        columnNames: ['tipomulta'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('dvs_infracao');
  }
}