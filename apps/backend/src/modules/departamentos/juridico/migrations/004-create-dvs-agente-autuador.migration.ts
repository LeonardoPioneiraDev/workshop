// src/modules/departamentos/juridico/migrations/004-create-dvs-agente-autuador.migration.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDvsAgenteAutuador1704067200004 implements MigrationInterface {
  name = 'CreateDvsAgenteAutuador1704067200004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'dvs_agente_autuador',
        columns: [
          // ✅ CHAVE PRIMÁRIA
          {
            name: 'cod_agente_autuador',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isPrimary: true,
          },

          // ✅ CAMPOS PRINCIPAIS
          {
            name: 'desc_agente_autuador',
            type: 'varchar',
            length: '40',
            isNullable: false,
          },
          {
            name: 'matriculafiscal',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },

          // ✅ CONTROLE DE SINCRONIZAÇÃO
          {
            name: 'data_sincronizacao',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'origem_dados',
            type: 'varchar',
            length: '20',
            default: "'ORACLE_DVS_AGENTE'",
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

    // ✅ CRIAR ÍNDICES
    await queryRunner.createIndex(
      'dvs_agente_autuador',
      new TableIndex({
        name: 'IDX_DVS_AGENTE_COD_AGENTE',
        columnNames: ['cod_agente_autuador'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'dvs_agente_autuador',
      new TableIndex({
        name: 'IDX_DVS_AGENTE_DESCRICAO',
        columnNames: ['desc_agente_autuador'],
      }),
    );

    await queryRunner.createIndex(
      'dvs_agente_autuador',
      new TableIndex({
        name: 'IDX_DVS_AGENTE_MATRICULA',
        columnNames: ['matriculafiscal'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('dvs_agente_autuador');
  }
}