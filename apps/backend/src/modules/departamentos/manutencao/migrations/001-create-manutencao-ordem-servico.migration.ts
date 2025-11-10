// src/modules/departamentos/manutencao/migrations/001-create-manutencao-ordem-servico.migration.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateManutencaoOrdemServico1730000000001 implements MigrationInterface {
  name = 'CreateManutencaoOrdemServico1730000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela manutencao_ordem_servico
    await queryRunner.createTable(
      new Table({
        name: 'manutencao_ordem_servico',
        columns: [
          {
            name: 'codigo_interno_os',
            type: 'integer',
            isPrimary: true,
            comment: 'Código interno da OS no sistema Globus',
          },
          {
            name: 'numero_os',
            type: 'varchar',
            length: '50',
            comment: 'Número da Ordem de Serviço',
          },
          {
            name: 'codigo_veiculo',
            type: 'integer',
            comment: 'Código do veículo',
          },
          {
            name: 'codigo_garagem',
            type: 'integer',
            comment: 'Código da garagem',
          },
          {
            name: 'prefixo_veiculo',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'Prefixo do veículo',
          },
          {
            name: 'placa_veiculo',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'Placa do veículo',
          },
          {
            name: 'condicao_veiculo',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Condição do veículo (Ativo, Inativo)',
          },
          {
            name: 'data_abertura',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'Data de abertura da OS (DD/MM/YYYY)',
          },
          {
            name: 'data_fechamento',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'Data de fechamento da OS (DD/MM/YYYY)',
          },
          {
            name: 'hora_abertura',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'Hora de abertura da OS',
          },
          {
            name: 'tipo_os_descricao',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Descrição do tipo de OS (Corretiva, Preventiva)',
          },
          {
            name: 'tipo_os',
            type: 'varchar',
            length: '10',
            isNullable: true,
            comment: 'Código do tipo de OS',
          },
          {
            name: 'condicao_os_descricao',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Descrição da condição da OS (Aberta, Fechada)',
          },
          {
            name: 'condicao_os',
            type: 'varchar',
            length: '10',
            isNullable: true,
            comment: 'Código da condição da OS',
          },
          {
            name: 'codigo_origem_os',
            type: 'integer',
            isNullable: true,
            comment: 'Código da origem da OS',
          },
          {
            name: 'usuario_abertura',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Usuário que abriu a OS',
          },
          {
            name: 'descricao_origem',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Descrição da origem da OS',
          },
          {
            name: 'descricao_servico',
            type: 'text',
            isNullable: true,
            comment: 'Descrição do serviço realizado',
          },
          {
            name: 'codigo_setor',
            type: 'integer',
            isNullable: true,
            comment: 'Código do setor',
          },
          {
            name: 'codigo_grupo_servico',
            type: 'integer',
            isNullable: true,
            comment: 'Código do grupo de serviço',
          },
          {
            name: 'grupo_servico',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Descrição do grupo de serviço',
          },
          {
            name: 'garagem',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'Nome da garagem',
          },
          {
            name: 'tipo_problema',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Tipo de problema (QUEBRA, DEFEITO)',
          },
          {
            name: 'dias_em_andamento',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Dias em andamento da OS',
          },
          {
            name: 'km_execucao',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Quilometragem na execução',
          },
          {
            name: 'valor_mao_obra_terceiros',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
            default: 0,
            comment: 'Valor da mão de obra de terceiros',
          },
          {
            name: 'valor_pecas_terceiros',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
            default: 0,
            comment: 'Valor de peças de terceiros',
          },
          {
            name: 'eh_socorro',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'Indica se é socorro (Sim/Não)',
          },
          {
            name: 'data_sincronizacao',
            type: 'date',
            isNullable: true,
            comment: 'Data da sincronização dos dados',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            comment: 'Data de criação do registro',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
            isNullable: true,
            comment: 'Data de atualização do registro',
          },
        ],
      }),
      true,
    );

    // Criar índices para otimizar consultas
    await queryRunner.createIndex(
      'manutencao_ordem_servico',
      new TableIndex({
        name: 'idx_manutencao_os_numero',
        columnNames: ['numero_os'],
      }),
    );

    await queryRunner.createIndex(
      'manutencao_ordem_servico',
      new TableIndex({
        name: 'idx_manutencao_os_veiculo',
        columnNames: ['codigo_veiculo'],
      }),
    );

    await queryRunner.createIndex(
      'manutencao_ordem_servico',
      new TableIndex({
        name: 'idx_manutencao_os_garagem',
        columnNames: ['codigo_garagem'],
      }),
    );

    await queryRunner.createIndex(
      'manutencao_ordem_servico',
      new TableIndex({
        name: 'idx_manutencao_os_prefixo',
        columnNames: ['prefixo_veiculo'],
      }),
    );

    await queryRunner.createIndex(
      'manutencao_ordem_servico',
      new TableIndex({
        name: 'idx_manutencao_os_placa',
        columnNames: ['placa_veiculo'],
      }),
    );

    await queryRunner.createIndex(
      'manutencao_ordem_servico',
      new TableIndex({
        name: 'idx_manutencao_os_tipo',
        columnNames: ['tipo_os'],
      }),
    );

    await queryRunner.createIndex(
      'manutencao_ordem_servico',
      new TableIndex({
        name: 'idx_manutencao_os_condicao',
        columnNames: ['condicao_os'],
      }),
    );

    await queryRunner.createIndex(
      'manutencao_ordem_servico',
      new TableIndex({
        name: 'idx_manutencao_os_data_abertura',
        columnNames: ['data_abertura'],
      }),
    );

    await queryRunner.createIndex(
      'manutencao_ordem_servico',
      new TableIndex({
        name: 'idx_manutencao_os_data_sincronizacao',
        columnNames: ['data_sincronizacao'],
      }),
    );

    await queryRunner.createIndex(
      'manutencao_ordem_servico',
      new TableIndex({
        name: 'idx_manutencao_os_garagem_nome',
        columnNames: ['garagem'],
      }),
    );

    console.log('✅ Tabela manutencao_ordem_servico criada com sucesso!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices
    await queryRunner.dropIndex('manutencao_ordem_servico', 'idx_manutencao_os_garagem_nome');
    await queryRunner.dropIndex('manutencao_ordem_servico', 'idx_manutencao_os_data_sincronizacao');
    await queryRunner.dropIndex('manutencao_ordem_servico', 'idx_manutencao_os_data_abertura');
    await queryRunner.dropIndex('manutencao_ordem_servico', 'idx_manutencao_os_condicao');
    await queryRunner.dropIndex('manutencao_ordem_servico', 'idx_manutencao_os_tipo');
    await queryRunner.dropIndex('manutencao_ordem_servico', 'idx_manutencao_os_placa');
    await queryRunner.dropIndex('manutencao_ordem_servico', 'idx_manutencao_os_prefixo');
    await queryRunner.dropIndex('manutencao_ordem_servico', 'idx_manutencao_os_garagem');
    await queryRunner.dropIndex('manutencao_ordem_servico', 'idx_manutencao_os_veiculo');
    await queryRunner.dropIndex('manutencao_ordem_servico', 'idx_manutencao_os_numero');

    // Remover tabela
    await queryRunner.dropTable('manutencao_ordem_servico');

    console.log('✅ Tabela manutencao_ordem_servico removida com sucesso!');
  }
}
