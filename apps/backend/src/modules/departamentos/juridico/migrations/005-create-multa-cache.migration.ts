// src/database/migrations/1704067200005-CreateMultaCache.ts
import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateMultaCache1704067200005 implements MigrationInterface {
  name = 'CreateMultaCache1704067200005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ✅ CRIAR EXTENSÃO UUID PRIMEIRO
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.createTable(
      new Table({
        name: 'multa_cache',
        columns: [
          // ✅ CHAVE PRIMÁRIA
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },

          // ✅ CAMPOS MAPEADOS DO ORACLE DVS_MULTA - TODOS EM SNAKE_CASE
          {
            name: 'numero_ait',
            type: 'varchar',
            length: '30',
            isNullable: false,
            isUnique: true,
          },
          {
            name: 'prefixo_veiculo',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'placa_veiculo',
            type: 'varchar',
            length: '15',
            isNullable: true,
          },
          {
            name: 'codigo_veiculo',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },

          // ✅ INFRAÇÃO
          {
            name: 'codigo_infracao',
            type: 'varchar',
            length: '12',
            isNullable: true,
          },
          {
            name: 'descricao_infracao',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'gravidade_infracao',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'pontuacao_infracao',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'grupo_infracao',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },

          // ✅ VALORES E STATUS
          {
            name: 'valor_multa',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'valor_atualizado',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'valor_pago',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'status_multa',
            type: 'varchar',
            length: '20',
            isNullable: true,
            default: "'PENDENTE'",
          },

          // ✅ DATAS IMPORTANTES
          {
            name: 'data_emissao',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'data_vencimento',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'data_pagamento',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'data_recurso',
            type: 'timestamp',
            isNullable: true,
          },

          // ✅ LOCALIZAÇÃO
          {
            name: 'local_infracao',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'numero_local_multa',
            type: 'varchar',
            length: '25',
            isNullable: true,
          },
          {
            name: 'km_local_multa',
            type: 'decimal',
            precision: 22,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'sentido_local_multa',
            type: 'varchar',
            length: '40',
            isNullable: true,
          },
          {
            name: 'bairro_local_multa',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },

          // ✅ AGENTE E EMPRESA
          {
            name: 'codigo_agente_autuador',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'nome_agente',
            type: 'varchar',
            length: '40',
            isNullable: true,
          },
          {
            name: 'matricula_agente',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },

          // ✅ EMPRESA E GARAGEM
          {
            name: 'codigo_empresa',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codigo_garagem',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'nome_garagem',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },

          // ✅ RECURSOS E PROCESSOS
          {
            name: 'numero_recurso',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'condicao_recurso',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'numero_processo',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },

          // ✅ NOTIFICAÇÕES
          {
            name: 'auto_infracao',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'notificacao1',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'notificacao2',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'notificacao3',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },

          // ✅ CONTROLE E OBSERVAÇÕES
          {
            name: 'observacao',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'responsavel_multa',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'reincidencia',
            type: 'varchar',
            length: '5',
            isNullable: true,
          },

          // ✅ CAMPOS CALCULADOS E DERIVADOS
          {
            name: 'dias_vencidos',
            type: 'integer',
            isNullable: true,
            default: 0,
          },
          {
            name: 'juros_calculados',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
            default: 0,
          },
          {
            name: 'multa_vencimento',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
            default: 0,
          },

          // ✅ CLASSIFICAÇÕES E TAGS
          {
            name: 'prioridade_cobranca',
            type: 'varchar',
            length: '10',
            isNullable: true,
            default: "'BAIXA'",
          },
          {
            name: 'score_cobranca',
            type: 'integer',
            isNullable: true,
            default: 0,
          },
          {
            name: 'tags',
            type: 'text',
            isNullable: true,
            comment: 'JSON array de tags para classificação',
          },

          // ✅ CONTROLE DE CACHE E SINCRONIZAÇÃO
          {
            name: 'data_cache',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'ultima_atualizacao',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'fonte_dados',
            type: 'varchar',
            length: '20',
            default: "'ORACLE_DVS'",
            isNullable: false,
          },
          {
            name: 'hash_dados',
            type: 'varchar',
            length: '64',
            isNullable: true,
            comment: 'Hash MD5 dos dados para detectar alterações',
          },

          // ✅ CONTROLE DE QUALIDADE
          {
            name: 'dados_completos',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'dados_validados',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'erros_validacao',
            type: 'text',
            isNullable: true,
            comment: 'JSON array de erros de validação',
          },

          // ✅ AUDITORIA
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '50',
            isNullable: true,
            default: "'SYSTEM'",
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '50',
            isNullable: true,
            default: "'SYSTEM'",
          },
        ],
      }),
      true,
    );

    // ✅ CRIAR ÍNDICES OTIMIZADOS PARA PERFORMANCE - TODOS COM NOMES CORRETOS
    
    // Índice único para numero_ait
    await queryRunner.createIndex(
      'multa_cache',
      new TableIndex({
        name: 'IDX_MULTA_CACHE_NUMERO_AIT',
        columnNames: ['numero_ait'],
        isUnique: true,
      }),
    );

    // Índices para consultas frequentes
    await queryRunner.createIndex(
      'multa_cache',
      new TableIndex({
        name: 'IDX_MULTA_CACHE_STATUS_DATA',
        columnNames: ['status_multa', 'data_emissao'],
      }),
    );

    await queryRunner.createIndex(
      'multa_cache',
      new TableIndex({
        name: 'IDX_MULTA_CACHE_VEICULO',
        columnNames: ['prefixo_veiculo', 'placa_veiculo'],
      }),
    );

    await queryRunner.createIndex(
      'multa_cache',
      new TableIndex({
        name: 'IDX_MULTA_CACHE_GARAGEM_DATA',
        columnNames: ['codigo_garagem', 'data_emissao'],
      }),
    );

    await queryRunner.createIndex(
      'multa_cache',
      new TableIndex({
        name: 'IDX_MULTA_CACHE_AGENTE',
        columnNames: ['codigo_agente_autuador'],
      }),
    );

    await queryRunner.createIndex(
      'multa_cache',
      new TableIndex({
        name: 'IDX_MULTA_CACHE_INFRACAO',
        columnNames: ['codigo_infracao', 'gravidade_infracao'],
      }),
    );

    await queryRunner.createIndex(
      'multa_cache',
      new TableIndex({
        name: 'IDX_MULTA_CACHE_VENCIMENTO',
        columnNames: ['data_vencimento', 'status_multa'],
      }),
    );

    await queryRunner.createIndex(
      'multa_cache',
      new TableIndex({
        name: 'IDX_MULTA_CACHE_VALOR',
        columnNames: ['valor_multa', 'status_multa'],
      }),
    );

    await queryRunner.createIndex(
      'multa_cache',
      new TableIndex({
        name: 'IDX_MULTA_CACHE_DATA_CACHE',
        columnNames: ['data_cache'],
      }),
    );

    await queryRunner.createIndex(
      'multa_cache',
      new TableIndex({
        name: 'IDX_MULTA_CACHE_PRIORIDADE',
        columnNames: ['prioridade_cobranca', 'score_cobranca'],
      }),
    );

    // ✅ ÍNDICES COMPOSTOS PARA ANÁLISES
    await queryRunner.createIndex(
      'multa_cache',
      new TableIndex({
        name: 'IDX_MULTA_CACHE_EMPRESA_GARAGEM_DATA',
        columnNames: ['codigo_empresa', 'codigo_garagem', 'data_emissao'],
      }),
    );

    await queryRunner.createIndex(
      'multa_cache',
      new TableIndex({
        name: 'IDX_MULTA_CACHE_GRAVIDADE_VALOR',
        columnNames: ['gravidade_infracao', 'valor_multa'],
      }),
    );

    // ✅ ÍNDICE PARA BUSCA TEXTUAL
    await queryRunner.createIndex(
      'multa_cache',
      new TableIndex({
        name: 'IDX_MULTA_CACHE_BUSCA_TEXTUAL',
        columnNames: ['prefixo_veiculo', 'placa_veiculo', 'numero_ait'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ✅ REMOVER TABELA (os índices são removidos automaticamente)
    await queryRunner.dropTable('multa_cache');
  }
}