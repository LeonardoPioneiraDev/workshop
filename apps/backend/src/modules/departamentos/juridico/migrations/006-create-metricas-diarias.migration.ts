// src/modules/departamentos/juridico/migrations/006-create-metricas-diarias.migration.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateMetricasDiarias1704067200006 implements MigrationInterface {
  name = 'CreateMetricasDiarias1704067200006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'metricas_diarias',
        columns: [
          // ✅ CHAVE PRIMÁRIA
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },

          // ✅ DATA DE REFERÊNCIA
          {
            name: 'dataReferencia',
            type: 'date',
            isNullable: false,
            isUnique: true,
          },

          // ✅ MÉTRICAS BÁSICAS
          {
            name: 'totalMultas',
            type: 'integer',
            default: 0,
          },
          {
            name: 'valorTotal',
            type: 'decimal',
            precision: 22,
            scale: 4,
            default: 0,
          },
          {
            name: 'multasPagas',
            type: 'integer',
            default: 0,
          },
          {
            name: 'multasPendentes',
            type: 'integer',
            default: 0,
          },
          {
            name: 'multasVencidas',
            type: 'integer',
            default: 0,
          },
          {
            name: 'valorMedio',
            type: 'decimal',
            precision: 22,
            scale: 4,
            default: 0,
          },
          {
            name: 'taxaPagamento',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },

          // ✅ ANÁLISES COMPORTAMENTAIS (JSON)
          {
            name: 'infracoesFrequentes',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'veiculosComMaisMultas',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'agentesComMaisMultas',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'garagensComMaisMultas',
            type: 'jsonb',
            isNullable: true,
          },

          // ✅ ANÁLISES TEMPORAIS (JSON)
          {
            name: 'distribuicaoHoraria',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'picos',
            type: 'jsonb',
            isNullable: true,
          },

          // ✅ ANÁLISES FINANCEIRAS (JSON)
          {
            name: 'valorPorGravidade',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'projecaoArrecadacao',
            type: 'decimal',
            precision: 22,
            scale: 4,
            default: 0,
          },

          // ✅ ANÁLISES OPERACIONAIS
          {
            name: 'eficienciaAgentes',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'utilizacaoFrota',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },
          {
            name: 'diversidadeInfracoes',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 0,
          },

          // ✅ INDICADORES DE QUALIDADE
          {
            name: 'consistenciaDados',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 100,
          },
          {
            name: 'completudeDados',
            type: 'decimal',
            precision: 5,
            scale: 2,
            default: 100,
          },

          // ✅ ALERTAS GERADOS (JSON)
          {
            name: 'alertasGerados',
            type: 'jsonb',
            isNullable: true,
          },

          // ✅ CONTROLE
          {
            name: 'calculado_em',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'tempo_calculo_ms',
            type: 'integer',
            isNullable: true,
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
      'metricas_diarias',
      new TableIndex({
        name: 'IDX_METRICAS_DATA_REFERENCIA',
        columnNames: ['dataReferencia'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'metricas_diarias',
      new TableIndex({
        name: 'IDX_METRICAS_CALCULADO_EM',
        columnNames: ['calculado_em'],
      }),
    );

    await queryRunner.createIndex(
      'metricas_diarias',
      new TableIndex({
        name: 'IDX_METRICAS_TOTAL_MULTAS',
        columnNames: ['totalMultas'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('metricas_diarias');
  }
}