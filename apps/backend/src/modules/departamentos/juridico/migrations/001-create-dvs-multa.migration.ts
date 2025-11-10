// src/modules/departamentos/juridico/migrations/001-create-dvs-multa.migration.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDvsMulta1704067200001 implements MigrationInterface {
  name = 'CreateDvsMulta1704067200001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'dvs_multa',
        columns: [
          // ✅ CHAVE PRIMÁRIA
          {
            name: 'numeroaimulta',
            type: 'varchar',
            length: '30',
            isPrimary: true,
          },

          // ✅ CAMPOS BÁSICOS (1-21)
          {
            name: 'codintfunc',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codigoveic',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codigoinfra',
            type: 'varchar',
            length: '12',
            isNullable: true,
          },
          {
            name: 'codigouf',
            type: 'varchar',
            length: '3',
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
            name: 'codigoorg',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'dataemissaomulta',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'localmulta',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'numerolocalmulta',
            type: 'varchar',
            length: '25',
            isNullable: true,
          },
          {
            name: 'datahoramulta',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'datavectomulta',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'valormulta',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'totalparcelasmulta',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'valortotalmulta',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'datapagtomulta',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'responsavelmulta',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'numerorecursomulta',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'datarecursomulta',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'condicaorecursomulta',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'valorpago',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },

          // ✅ CAMPOS ADICIONAIS (22-42)
          {
            name: 'dataautorizado',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'autorizado',
            type: 'varchar',
            length: '15',
            isNullable: true,
          },
          {
            name: 'declimpressomulta',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'documento',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'datapagamentoprev',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'vlracrescimo',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'vlrdesconto',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'valorpagamento',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'codigoforn',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codlanca',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'id_prest2',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'coddoctocpg',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codintproaut',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'observacao',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'datalimitecondutor',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'numerorecursomulta2',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'datarecursomulta2',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'condicaorecursomulta2',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'cod_motivo_notificacao',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'cod_area_competencia',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'cod_responsavel_notificacao',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },

          // ✅ AGENTE E LINHA (43-44)
          {
            name: 'cod_agente_autuador',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codintlinha',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },

          // ✅ RECURSOS ADICIONAIS (45-47)
          {
            name: 'numerorecursomulta3',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'datarecursomulta3',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'condicaorecursomulta3',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },

          // ✅ PARCELAS (48-50)
          {
            name: 'flg_primparcelapaga',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'entradavencimento',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'entradapagamento',
            type: 'timestamp',
            isNullable: true,
          },

          // ✅ AUTO DE INFRAÇÃO (51-56)
          {
            name: 'autodeinfracao',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'autodeinfracaoemissao',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'autodeinfracaorecebimento',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'autodeinfracaoconsiderado',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'autodeinfracaovalordodoc',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'autodeinfracaovalorconsiderado',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },

          // ✅ NOTIFICAÇÃO 1 (57-62)
          {
            name: 'notificacao1',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'notificacao1emissao',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notificacao1recebimento',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notificacao1considerado',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notificacao1valordodoc',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'notificacao1valorconsiderado',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },

          // ✅ NOTIFICAÇÃO 2 (63-68)
          {
            name: 'notificacao2',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'notificacao2emissao',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notificacao2recebimento',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notificacao2considerado',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notificacao2valordodoc',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'notificacao2valorconsiderado',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },

          // ✅ NOTIFICAÇÃO 3 (69-74)
          {
            name: 'notificacao3',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'notificacao3emissao',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notificacao3recebimento',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notificacao3considerado',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notificacao3valordodoc',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'notificacao3valorconsiderado',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },

          // ✅ VALORES E PAGAMENTOS (75-95)
          {
            name: 'valoratualizado',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'pgtointempdata',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'pgtointempvalor',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'depjuddata',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'depjudvalor',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'depjuddtrecup',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'depjudvlrrecup',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'numeroprocesso',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'parcvalor',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'parctotalparcelas',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'parcvalorparcelas',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'entvencimento',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'entpagamento',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'entvalor',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'parvencimento',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'parpagamento',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'parvalor',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'ultparvencimento',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'ultparpagamento',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'ultparvalor',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'totalpago',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },

          // ✅ CONTROLE (96-97)
          {
            name: 'recuso',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'anistia',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },

          // ✅ INSTÂNCIAS (98-103)
          {
            name: 'instanciaenvio1',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'instanciapublicacaodo1',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'instanciaenvio2',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'instanciapublicacaodo2',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'instanciaenvio3',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'instanciapublicacaodo3',
            type: 'timestamp',
            isNullable: true,
          },

          // ✅ INTEGRAÇÃO E RECUPERAÇÃO (104-107)
          {
            name: 'integrou_por_vencimento',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'valorjulgado',
            type: 'decimal',
            precision: 22,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'codigorecuperacao',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'nprocessonotificacao',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },

          // ✅ PRAZOS (108-113)
          {
            name: 'autodeinfracaoprazo',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notificacao1prazo',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notificacao2prazo',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'notificacao3prazo',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'pgtointempvenc',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'depjudvenc',
            type: 'timestamp',
            isNullable: true,
          },

          // ✅ CAUSA E PENALIDADES (114-116)
          {
            name: 'codcausaprincipal',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'envpenalidade',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'revpenalidade',
            type: 'timestamp',
            isNullable: true,
          },

          // ✅ OBSERVAÇÕES E CONTROLE (117-123)
          {
            name: 'obsnotificacao',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'recuperada',
            type: 'varchar',
            length: '2',
            isNullable: true,
          },
          {
            name: 'palavrachave',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'tratamentomulta',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'importacaook',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'tipodetrecho',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'reembolsavel',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },

          // ✅ LOCALIZAÇÃO (124-128)
          {
            name: 'kmlocalmulta',
            type: 'decimal',
            precision: 22,
            scale: 3,
            isNullable: true,
          },
          {
            name: 'metroslocalmulta',
            type: 'decimal',
            precision: 22,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'sentidolocalmulta',
            type: 'varchar',
            length: '40',
            isNullable: true,
          },
          {
            name: 'bairrolocalmulta',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'observacaorealmotivo',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },

          // ✅ TRATAMENTO E EXECUTOR (129-134)
          {
            name: 'tipotratamentomulta',
            type: 'varchar',
            length: '2',
            isNullable: true,
          },
          {
            name: 'executor',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          {
            name: 'executorcnpjcpf',
            type: 'varchar',
            length: '14',
            isNullable: true,
          },
          {
            name: 'ultalteracao',
            type: 'varchar',
            length: '34',
            isNullable: true,
          },
          {
            name: 'ocorrencia',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'codigoressarc',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },

          // ✅ SMARTEC (135-139)
          {
            name: 'flg_smartec',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'data_imp_smartec',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'url_formulario',
            type: 'varchar',
            length: '256',
            isNullable: true,
          },
          {
            name: 'url_boleto',
            type: 'varchar',
            length: '256',
            isNullable: true,
          },
          {
            name: 'flg_smartec_multa',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },

          // ✅ CAMPOS FINAIS (140-144)
          {
            name: 'reincidencia',
            type: 'varchar',
            length: '5',
            isNullable: true,
          },
          {
            name: 'pontuacaoinfracao',
            type: 'decimal',
            precision: 22,
            scale: 0,
            isNullable: true,
          },
          {
            name: 'grupoinfracao',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'cod_org_original',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'ait_original',
            type: 'varchar',
            length: '60',
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
            default: "'ORACLE_DVS_MULTA'",
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
      'dvs_multa',
      new TableIndex({
        name: 'IDX_DVS_MULTA_NUMEROAIMULTA',
        columnNames: ['numeroaimulta'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'dvs_multa',
      new TableIndex({
        name: 'IDX_DVS_MULTA_DATAEMISSAO_VEICULO',
        columnNames: ['dataemissaomulta', 'codigoveic'],
      }),
    );

    await queryRunner.createIndex(
      'dvs_multa',
      new TableIndex({
        name: 'IDX_DVS_MULTA_CODIGOINFRA',
        columnNames: ['codigoinfra'],
      }),
    );

    await queryRunner.createIndex(
      'dvs_multa',
      new TableIndex({
        name: 'IDX_DVS_MULTA_COD_AGENTE',
        columnNames: ['cod_agente_autuador'],
      }),
    );

    await queryRunner.createIndex(
      'dvs_multa',
      new TableIndex({
        name: 'IDX_DVS_MULTA_NUMEROPROCESSO',
        columnNames: ['numeroprocesso'],
      }),
    );

    await queryRunner.createIndex(
      'dvs_multa',
      new TableIndex({
        name: 'IDX_DVS_MULTA_AUTODEINFRACAO',
        columnNames: ['autodeinfracao'],
      }),
    );

    await queryRunner.createIndex(
      'dvs_multa',
      new TableIndex({
        name: 'IDX_DVS_MULTA_DATAEMISSAO',
        columnNames: ['dataemissaomulta'],
      }),
    );

    await queryRunner.createIndex(
      'dvs_multa',
      new TableIndex({
        name: 'IDX_DVS_MULTA_CODIGOVEIC',
        columnNames: ['codigoveic'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('dvs_multa');
  }
}