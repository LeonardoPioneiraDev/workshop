// src/modules/departamentos/juridico/migrations/003-create-frt-cadveiculos.migration.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateFrtCadveiculos1704067200003 implements MigrationInterface {
  name = 'CreateFrtCadveiculos1704067200003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'frt_cadveiculos',
        columns: [
          // ✅ CHAVE PRIMÁRIA
          {
            name: 'codigoveic',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isPrimary: true,
          },

          // ✅ CAMPOS BÁSICOS (1-21)
          {
            name: 'codigopdrcor',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codmunic',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'cod_intgrupolinha',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codigoespcarroc',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codigositveic',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codigotpveic',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: false,
          },
          {
            name: 'codintlinha',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codigoga',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: false,
          },
          {
            name: 'codigouf',
            type: 'varchar',
            length: '3',
            isNullable: false,
          },
          {
            name: 'codigoempresa',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: false,
          },
          {
            name: 'codigofl',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: false,
          },
          {
            name: 'codigocategoriaveic',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: false,
          },
          {
            name: 'codgrprev',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: false,
          },
          {
            name: 'codigomodmotor',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codigomodcarroc',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: false,
          },
          {
            name: 'codigomodchassi',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: false,
          },
          {
            name: 'codigotpfrota',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: false,
          },
          {
            name: 'codigoclassveic',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'prefixoveic',
            type: 'varchar',
            length: '17',
            isNullable: false,
          },
          {
            name: 'prefixoantveic',
            type: 'varchar',
            length: '17',
            isNullable: true,
          },

          // ✅ PLACAS E IDENTIFICAÇÃO (22-24)
          {
            name: 'placaatualveic',
            type: 'varchar',
            length: '15',
            isNullable: false,
          },
          {
            name: 'placaanteriorveic',
            type: 'varchar',
            length: '15',
            isNullable: true,
          },
          {
            name: 'condicaoveic',
            type: 'varchar',
            length: '1',
            isNullable: false,
          },

          // ✅ DATAS E CAPACIDADES (25-28)
          {
            name: 'dtinicioutilveic',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'capacidadetanqueveic',
            type: 'decimal',
            precision: 22,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'capacidadetqsecveic',
            type: 'decimal',
            precision: 22,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'kminicialveic',
            type: 'decimal',
            precision: 22,
            scale: 2,
            isNullable: true,
          },

          // ✅ OBSERVAÇÕES E CONFIGURAÇÕES (29-39)
          {
            name: 'obsveic',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'viradaroletaveic',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: false,
          },
          {
            name: 'viradavelocveic',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: false,
          },
          {
            name: 'venctogarantiakmveic',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'venctogarantiadataveic',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'kmlitroveic',
            type: 'decimal',
            precision: 22,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'qtdecombulttroleo',
            type: 'decimal',
            precision: 22,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'kmlitrosecveic',
            type: 'decimal',
            precision: 22,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'apresentarelatorioveic',
            type: 'varchar',
            length: '1',
            isNullable: false,
          },
          {
            name: 'qtderepulttroleo',
            type: 'decimal',
            precision: 22,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'sitescalaveic',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },

          // ✅ CÓDIGOS TÉCNICOS (40-51)
          {
            name: 'codreltrans',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codtpfreio',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codtpcb',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'capcarrocveic',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codigoumcapcarroc',
            type: 'varchar',
            length: '3',
            isNullable: true,
          },
          {
            name: 'qtderoletasveic',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'capacempeveic',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'capacsentadoveic',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codempanterior',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codflanterior',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codgaanterior',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'mediakmdiaveic',
            type: 'decimal',
            precision: 22,
            scale: 2,
            isNullable: true,
          },

          // ✅ CONFIGURAÇÕES ESPECIAIS (52-62)
          {
            name: 'utilizahorimetroveic',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'aceitamovvendaveic',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'renavanveic',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'possuicobrador',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'codclaslicenciamento',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'tiposervico',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codmunicemplacamento',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'numeromotor',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'numerorastreador',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'numeroinmetro',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'possivelvenda',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },

          // ✅ CUSTOS E CÓDIGOS EXTERNOS (63-66)
          {
            name: 'codcustofin',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codigoexternoveic',
            type: 'varchar',
            length: '15',
            isNullable: true,
          },
          {
            name: 'capac_cxcambio',
            type: 'decimal',
            precision: 22,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'capac_cxdiferencial',
            type: 'decimal',
            precision: 22,
            scale: 2,
            isNullable: true,
          },

          // ✅ GARANTIA E CONFIGURAÇÕES ESPECIAIS (67-71)
          {
            name: 'dt_prazogarantia',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'roletadupla',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'tagravo',
            type: 'varchar',
            length: '19',
            isNullable: true,
          },
          {
            name: 'tpveicgtfrota',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'mover_patio_fora_escala',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },

          // ✅ IDENTIFICAÇÃO E COMUNICAÇÃO (72-74)
          {
            name: 'codigo_sigla',
            type: 'varchar',
            length: '12',
            isNullable: true,
          },
          {
            name: 'telefone_chip_um',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'telefone_chip_dois',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },

          // ✅ AFERIÇÕES E TACÓGRAFO (75-76)
          {
            name: 'afericaocronotacografoini',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'afericaocronotacografofin',
            type: 'timestamp',
            isNullable: true,
          },

          // ✅ METAS E REGISTROS (77-80)
          {
            name: 'metamediakml',
            type: 'decimal',
            precision: 22,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'rntrc',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'flgnaoenviarsmartec',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'garagemmanutencao',
            type: 'decimal',
            precision: 22,
            scale: 0,
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
            default: "'ORACLE_FRT_CADVEICULOS'",
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
      'frt_cadveiculos',
      new TableIndex({
        name: 'IDX_FRT_CADVEICULOS_CODIGOVEIC',
        columnNames: ['codigoveic'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'frt_cadveiculos',
      new TableIndex({
        name: 'IDX_FRT_CADVEICULOS_PREFIXOVEIC',
        columnNames: ['prefixoveic'],
      }),
    );

    await queryRunner.createIndex(
      'frt_cadveiculos',
      new TableIndex({
        name: 'IDX_FRT_CADVEICULOS_PLACAATUAL',
        columnNames: ['placaatualveic'],
      }),
    );

    await queryRunner.createIndex(
      'frt_cadveiculos',
      new TableIndex({
        name: 'IDX_FRT_CADVEICULOS_EMPRESA',
        columnNames: ['codigoempresa'],
      }),
    );

    await queryRunner.createIndex(
      'frt_cadveiculos',
      new TableIndex({
        name: 'IDX_FRT_CADVEICULOS_GARAGEM',
        columnNames: ['codigoga'],
      }),
    );

    await queryRunner.createIndex(
      'frt_cadveiculos',
      new TableIndex({
        name: 'IDX_FRT_CADVEICULOS_CONDICAO',
        columnNames: ['condicaoveic'],
      }),
    );

    await queryRunner.createIndex(
      'frt_cadveiculos',
      new TableIndex({
        name: 'IDX_FRT_CADVEICULOS_EMPRESA_GARAGEM',
        columnNames: ['codigoempresa', 'codigoga'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('frt_cadveiculos');
  }
}