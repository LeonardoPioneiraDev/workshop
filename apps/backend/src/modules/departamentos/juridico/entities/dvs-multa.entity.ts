// src/modules/departamentos/juridico/entities/dvs-multa.entity.ts
import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { DvsInfracaoEntity } from './dvs-infracao.entity';
import { FrtCadveiculosEntity } from './frt-cadveiculos.entity';
import { DvsAgenteAutuadorEntity } from './dvs-agente-autuador.entity';

@Entity('dvs_multa')
@Index(['numeroaimulta'], { unique: true })
@Index(['dataemissaomulta', 'codigoveic'])
@Index(['codigoinfra'])
@Index(['cod_agente_autuador'])
@Index(['numeroprocesso'])
@Index(['autodeinfracao'])
export class DvsMultaEntity {
  // ✅ CHAVE PRIMÁRIA
  @PrimaryColumn({ name: 'numeroaimulta', type: 'varchar', length: 30 })
  numeroaimulta: string;

  // ✅ CAMPOS BÁSICOS (1-21)
  @Column({ name: 'codintfunc', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codintfunc?: number;

  @Column({ name: 'codigoveic', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codigoveic?: number;

  @Column({ name: 'codigoinfra', type: 'varchar', length: 12, nullable: true })
  codigoinfra?: string;

  @Column({ name: 'codigouf', type: 'varchar', length: 3, nullable: true })
  codigouf?: string;

  @Column({ name: 'codmunic', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codmunic?: number;

  @Column({ name: 'codigoorg', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codigoorg?: number;

  @Column({ name: 'dataemissaomulta', type: 'timestamp', nullable: true })
  dataemissaomulta?: Date;

  @Column({ name: 'localmulta', type: 'varchar', length: 255, nullable: true })
  localmulta?: string;

  @Column({ name: 'numerolocalmulta', type: 'varchar', length: 25, nullable: true })
  numerolocalmulta?: string;

  @Column({ name: 'datahoramulta', type: 'timestamp', nullable: true })
  datahoramulta?: Date;

  @Column({ name: 'datavectomulta', type: 'timestamp', nullable: true })
  datavectomulta?: Date;

  @Column({ name: 'valormulta', type: 'decimal', precision: 22, scale: 4, nullable: true })
  valormulta?: number;

  @Column({ name: 'totalparcelasmulta', type: 'decimal', precision: 22, scale: 0, nullable: true })
  totalparcelasmulta?: number;

  @Column({ name: 'valortotalmulta', type: 'decimal', precision: 22, scale: 4, nullable: true })
  valortotalmulta?: number;

  @Column({ name: 'datapagtomulta', type: 'timestamp', nullable: true })
  datapagtomulta?: Date;

  @Column({ name: 'responsavelmulta', type: 'varchar', length: 1, nullable: true })
  responsavelmulta?: string;

  @Column({ name: 'numerorecursomulta', type: 'varchar', length: 30, nullable: true })
  numerorecursomulta?: string;

  @Column({ name: 'datarecursomulta', type: 'timestamp', nullable: true })
  datarecursomulta?: Date;

  @Column({ name: 'condicaorecursomulta', type: 'varchar', length: 1, nullable: true })
  condicaorecursomulta?: string;

  @Column({ name: 'valorpago', type: 'decimal', precision: 22, scale: 4, nullable: true })
  valorpago?: number;

  // ✅ CAMPOS ADICIONAIS (22-42)
  @Column({ name: 'dataautorizado', type: 'timestamp', nullable: true })
  dataautorizado?: Date;

  @Column({ name: 'autorizado', type: 'varchar', length: 15, nullable: true })
  autorizado?: string;

  @Column({ name: 'declimpressomulta', type: 'varchar', length: 1, nullable: true })
  declimpressomulta?: string;

  @Column({ name: 'documento', type: 'varchar', length: 30, nullable: true })
  documento?: string;

  @Column({ name: 'datapagamentoprev', type: 'timestamp', nullable: true })
  datapagamentoprev?: Date;

  @Column({ name: 'vlracrescimo', type: 'decimal', precision: 22, scale: 4, nullable: true })
  vlracrescimo?: number;

  @Column({ name: 'vlrdesconto', type: 'decimal', precision: 22, scale: 4, nullable: true })
  vlrdesconto?: number;

  @Column({ name: 'valorpagamento', type: 'decimal', precision: 22, scale: 4, nullable: true })
  valorpagamento?: number;

  @Column({ name: 'codigoforn', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codigoforn?: number;

  @Column({ name: 'codlanca', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codlanca?: number;

  @Column({ name: 'id_prest2', type: 'decimal', precision: 22, scale: 0, nullable: true })
  id_prest2?: number;

  @Column({ name: 'coddoctocpg', type: 'decimal', precision: 22, scale: 0, nullable: true })
  coddoctocpg?: number;

  @Column({ name: 'codintproaut', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codintproaut?: number;

  @Column({ name: 'observacao', type: 'varchar', length: 500, nullable: true })
  observacao?: string;

  @Column({ name: 'datalimitecondutor', type: 'timestamp', nullable: true })
  datalimitecondutor?: Date;

  @Column({ name: 'numerorecursomulta2', type: 'varchar', length: 30, nullable: true })
  numerorecursomulta2?: string;

  @Column({ name: 'datarecursomulta2', type: 'timestamp', nullable: true })
  datarecursomulta2?: Date;

  @Column({ name: 'condicaorecursomulta2', type: 'varchar', length: 1, nullable: true })
  condicaorecursomulta2?: string;

  @Column({ name: 'cod_motivo_notificacao', type: 'decimal', precision: 22, scale: 0, nullable: true })
  cod_motivo_notificacao?: number;

  @Column({ name: 'cod_area_competencia', type: 'decimal', precision: 22, scale: 0, nullable: true })
  cod_area_competencia?: number;

  @Column({ name: 'cod_responsavel_notificacao', type: 'decimal', precision: 22, scale: 0, nullable: true })
  cod_responsavel_notificacao?: number;

  // ✅ AGENTE E LINHA (43-44)
  @Column({ name: 'cod_agente_autuador', type: 'decimal', precision: 22, scale: 0, nullable: true })
  cod_agente_autuador?: number;

  @Column({ name: 'codintlinha', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codintlinha?: number;

  // ✅ RECURSOS ADICIONAIS (45-47)
  @Column({ name: 'numerorecursomulta3', type: 'varchar', length: 30, nullable: true })
  numerorecursomulta3?: string;

  @Column({ name: 'datarecursomulta3', type: 'timestamp', nullable: true })
  datarecursomulta3?: Date;

  @Column({ name: 'condicaorecursomulta3', type: 'varchar', length: 1, nullable: true })
  condicaorecursomulta3?: string;

  // ✅ PARCELAS (48-50)
  @Column({ name: 'flg_primparcelapaga', type: 'varchar', length: 1, nullable: true })
  flg_primparcelapaga?: string;

  @Column({ name: 'entradavencimento', type: 'timestamp', nullable: true })
  entradavencimento?: Date;

  @Column({ name: 'entradapagamento', type: 'timestamp', nullable: true })
  entradapagamento?: Date;

  // ✅ AUTO DE INFRAÇÃO (51-56)
  @Column({ name: 'autodeinfracao', type: 'varchar', length: 50, nullable: true })
  autodeinfracao?: string;

  @Column({ name: 'autodeinfracaoemissao', type: 'timestamp', nullable: true })
  autodeinfracaoemissao?: Date;

  @Column({ name: 'autodeinfracaorecebimento', type: 'timestamp', nullable: true })
  autodeinfracaorecebimento?: Date;

  @Column({ name: 'autodeinfracaoconsiderado', type: 'timestamp', nullable: true })
  autodeinfracaoconsiderado?: Date;

  @Column({ name: 'autodeinfracaovalordodoc', type: 'decimal', precision: 22, scale: 4, nullable: true })
  autodeinfracaovalordodoc?: number;

  @Column({ name: 'autodeinfracaovalorconsiderado', type: 'decimal', precision: 22, scale: 4, nullable: true })
  autodeinfracaovalorconsiderado?: number;

  // ✅ NOTIFICAÇÃO 1 (57-62)
  @Column({ name: 'notificacao1', type: 'varchar', length: 50, nullable: true })
  notificacao1?: string;

  @Column({ name: 'notificacao1emissao', type: 'timestamp', nullable: true })
  notificacao1emissao?: Date;

  @Column({ name: 'notificacao1recebimento', type: 'timestamp', nullable: true })
  notificacao1recebimento?: Date;

  @Column({ name: 'notificacao1considerado', type: 'timestamp', nullable: true })
  notificacao1considerado?: Date;

  @Column({ name: 'notificacao1valordodoc', type: 'decimal', precision: 22, scale: 4, nullable: true })
  notificacao1valordodoc?: number;

  @Column({ name: 'notificacao1valorconsiderado', type: 'decimal', precision: 22, scale: 4, nullable: true })
  notificacao1valorconsiderado?: number;

  // ✅ NOTIFICAÇÃO 2 (63-68)
  @Column({ name: 'notificacao2', type: 'varchar', length: 50, nullable: true })
  notificacao2?: string;

  @Column({ name: 'notificacao2emissao', type: 'timestamp', nullable: true })
  notificacao2emissao?: Date;

  @Column({ name: 'notificacao2recebimento', type: 'timestamp', nullable: true })
  notificacao2recebimento?: Date;

  @Column({ name: 'notificacao2considerado', type: 'timestamp', nullable: true })
  notificacao2considerado?: Date;

  @Column({ name: 'notificacao2valordodoc', type: 'decimal', precision: 22, scale: 4, nullable: true })
  notificacao2valordodoc?: number;

  @Column({ name: 'notificacao2valorconsiderado', type: 'decimal', precision: 22, scale: 4, nullable: true })
  notificacao2valorconsiderado?: number;

  // ✅ NOTIFICAÇÃO 3 (69-74)
  @Column({ name: 'notificacao3', type: 'varchar', length: 50, nullable: true })
  notificacao3?: string;

  @Column({ name: 'notificacao3emissao', type: 'timestamp', nullable: true })
  notificacao3emissao?: Date;

  @Column({ name: 'notificacao3recebimento', type: 'timestamp', nullable: true })
  notificacao3recebimento?: Date;

  @Column({ name: 'notificacao3considerado', type: 'timestamp', nullable: true })
  notificacao3considerado?: Date;

  @Column({ name: 'notificacao3valordodoc', type: 'decimal', precision: 22, scale: 4, nullable: true })
  notificacao3valordodoc?: number;

  @Column({ name: 'notificacao3valorconsiderado', type: 'decimal', precision: 22, scale: 4, nullable: true })
  notificacao3valorconsiderado?: number;

  // ✅ VALORES E PAGAMENTOS (75-95)
  @Column({ name: 'valoratualizado', type: 'decimal', precision: 22, scale: 4, nullable: true })
  valoratualizado?: number;

  @Column({ name: 'pgtointempdata', type: 'timestamp', nullable: true })
  pgtointempdata?: Date;

  @Column({ name: 'pgtointempvalor', type: 'decimal', precision: 22, scale: 4, nullable: true })
  pgtointempvalor?: number;

  @Column({ name: 'depjuddata', type: 'timestamp', nullable: true })
  depjuddata?: Date;

  @Column({ name: 'depjudvalor', type: 'decimal', precision: 22, scale: 4, nullable: true })
  depjudvalor?: number;

  @Column({ name: 'depjuddtrecup', type: 'timestamp', nullable: true })
  depjuddtrecup?: Date;

  @Column({ name: 'depjudvlrrecup', type: 'decimal', precision: 22, scale: 4, nullable: true })
  depjudvlrrecup?: number;

  @Column({ name: 'numeroprocesso', type: 'varchar', length: 50, nullable: true })
  numeroprocesso?: string;

  @Column({ name: 'parcvalor', type: 'decimal', precision: 22, scale: 4, nullable: true })
  parcvalor?: number;

  @Column({ name: 'parctotalparcelas', type: 'decimal', precision: 22, scale: 0, nullable: true })
  parctotalparcelas?: number;

  @Column({ name: 'parcvalorparcelas', type: 'decimal', precision: 22, scale: 4, nullable: true })
  parcvalorparcelas?: number;

  @Column({ name: 'entvencimento', type: 'timestamp', nullable: true })
  entvencimento?: Date;

  @Column({ name: 'entpagamento', type: 'timestamp', nullable: true })
  entpagamento?: Date;

  @Column({ name: 'entvalor', type: 'decimal', precision: 22, scale: 4, nullable: true })
  entvalor?: number;

  @Column({ name: 'parvencimento', type: 'timestamp', nullable: true })
  parvencimento?: Date;

  @Column({ name: 'parpagamento', type: 'timestamp', nullable: true })
  parpagamento?: Date;

  @Column({ name: 'parvalor', type: 'decimal', precision: 22, scale: 4, nullable: true })
  parvalor?: number;

  @Column({ name: 'ultparvencimento', type: 'timestamp', nullable: true })
  ultparvencimento?: Date;

  @Column({ name: 'ultparpagamento', type: 'timestamp', nullable: true })
  ultparpagamento?: Date;

  @Column({ name: 'ultparvalor', type: 'decimal', precision: 22, scale: 4, nullable: true })
  ultparvalor?: number;

  @Column({ name: 'totalpago', type: 'decimal', precision: 22, scale: 4, nullable: true })
  totalpago?: number;

  // ✅ CONTROLE (96-97)
  @Column({ name: 'recuso', type: 'varchar', length: 1, nullable: true })
  recuso?: string;

  @Column({ name: 'anistia', type: 'varchar', length: 1, nullable: true })
  anistia?: string;

  // ✅ INSTÂNCIAS (98-103)
  @Column({ name: 'instanciaenvio1', type: 'timestamp', nullable: true })
  instanciaenvio1?: Date;

  @Column({ name: 'instanciapublicacaodo1', type: 'timestamp', nullable: true })
  instanciapublicacaodo1?: Date;

  @Column({ name: 'instanciaenvio2', type: 'timestamp', nullable: true })
  instanciaenvio2?: Date;

  @Column({ name: 'instanciapublicacaodo2', type: 'timestamp', nullable: true })
  instanciapublicacaodo2?: Date;

  @Column({ name: 'instanciaenvio3', type: 'timestamp', nullable: true })
  instanciaenvio3?: Date;

  @Column({ name: 'instanciapublicacaodo3', type: 'timestamp', nullable: true })
  instanciapublicacaodo3?: Date;

  // ✅ INTEGRAÇÃO E RECUPERAÇÃO (104-107)
  @Column({ name: 'integrou_por_vencimento', type: 'varchar', length: 1, nullable: true })
  integrou_por_vencimento?: string;

  @Column({ name: 'valorjulgado', type: 'decimal', precision: 22, scale: 4, nullable: true })
  valorjulgado?: number;

  @Column({ name: 'codigorecuperacao', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codigorecuperacao?: number;

  @Column({ name: 'nprocessonotificacao', type: 'varchar', length: 30, nullable: true })
  nprocessonotificacao?: string;

  // ✅ PRAZOS (108-113)
  @Column({ name: 'autodeinfracaoprazo', type: 'timestamp', nullable: true })
  autodeinfracaoprazo?: Date;

  @Column({ name: 'notificacao1prazo', type: 'timestamp', nullable: true })
  notificacao1prazo?: Date;

  @Column({ name: 'notificacao2prazo', type: 'timestamp', nullable: true })
  notificacao2prazo?: Date;

  @Column({ name: 'notificacao3prazo', type: 'timestamp', nullable: true })
  notificacao3prazo?: Date;

  @Column({ name: 'pgtointempvenc', type: 'timestamp', nullable: true })
  pgtointempvenc?: Date;

  @Column({ name: 'depjudvenc', type: 'timestamp', nullable: true })
  depjudvenc?: Date;

  // ✅ CAUSA E PENALIDADES (114-116)
  @Column({ name: 'codcausaprincipal', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codcausaprincipal?: number;

  @Column({ name: 'envpenalidade', type: 'timestamp', nullable: true })
  envpenalidade?: Date;

  @Column({ name: 'revpenalidade', type: 'timestamp', nullable: true })
  revpenalidade?: Date;

  // ✅ OBSERVAÇÕES E CONTROLE (117-123)
  @Column({ name: 'obsnotificacao', type: 'varchar', length: 255, nullable: true })
  obsnotificacao?: string;

  @Column({ name: 'recuperada', type: 'varchar', length: 2, nullable: true })
  recuperada?: string;

  @Column({ name: 'palavrachave', type: 'varchar', length: 20, nullable: true })
  palavrachave?: string;

  @Column({ name: 'tratamentomulta', type: 'varchar', length: 500, nullable: true })
  tratamentomulta?: string;

  @Column({ name: 'importacaook', type: 'varchar', length: 1, nullable: true })
  importacaook?: string;

  @Column({ name: 'tipodetrecho', type: 'varchar', length: 1, nullable: true })
  tipodetrecho?: string;

  @Column({ name: 'reembolsavel', type: 'varchar', length: 1, nullable: true })
  reembolsavel?: string;

  // ✅ LOCALIZAÇÃO (124-128)
  @Column({ name: 'kmlocalmulta', type: 'decimal', precision: 22, scale: 3, nullable: true })
  kmlocalmulta?: number;

  @Column({ name: 'metroslocalmulta', type: 'decimal', precision: 22, scale: 2, nullable: true })
  metroslocalmulta?: number;

  @Column({ name: 'sentidolocalmulta', type: 'varchar', length: 40, nullable: true })
  sentidolocalmulta?: string;

  @Column({ name: 'bairrolocalmulta', type: 'varchar', length: 30, nullable: true })
  bairrolocalmulta?: string;

  @Column({ name: 'observacaorealmotivo', type: 'varchar', length: 255, nullable: true })
  observacaorealmotivo?: string;

  // ✅ TRATAMENTO E EXECUTOR (129-134)
  @Column({ name: 'tipotratamentomulta', type: 'varchar', length: 2, nullable: true })
  tipotratamentomulta?: string;

  @Column({ name: 'executor', type: 'varchar', length: 30, nullable: true })
  executor?: string;

  @Column({ name: 'executorcnpjcpf', type: 'varchar', length: 14, nullable: true })
  executorcnpjcpf?: string;

  @Column({ name: 'ultalteracao', type: 'varchar', length: 34, nullable: true })
  ultalteracao?: string;

  @Column({ name: 'ocorrencia', type: 'decimal', precision: 22, scale: 0, nullable: true })
  ocorrencia?: number;

  @Column({ name: 'codigoressarc', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codigoressarc?: number;

  // ✅ SMARTEC (135-139)
  @Column({ name: 'flg_smartec', type: 'varchar', length: 1, nullable: true })
  flg_smartec?: string;

  @Column({ name: 'data_imp_smartec', type: 'timestamp', nullable: true })
  data_imp_smartec?: Date;

  @Column({ name: 'url_formulario', type: 'varchar', length: 256, nullable: true })
  url_formulario?: string;

  @Column({ name: 'url_boleto', type: 'varchar', length: 256, nullable: true })
  url_boleto?: string;

  @Column({ name: 'flg_smartec_multa', type: 'varchar', length: 1, nullable: true })
  flg_smartec_multa?: string;

  // ✅ CAMPOS FINAIS (140-144)
  @Column({ name: 'reincidencia', type: 'varchar', length: 5, nullable: true })
  reincidencia?: string;

  @Column({ name: 'pontuacaoinfracao', type: 'decimal', precision: 22, scale: 0, nullable: true })
  pontuacaoinfracao?: number;

  @Column({ name: 'grupoinfracao', type: 'varchar', length: 50, nullable: true })
  grupoinfracao?: string;

  @Column({ name: 'cod_org_original', type: 'varchar', length: 20, nullable: true })
  cod_org_original?: string;

  @Column({ name: 'ait_original', type: 'varchar', length: 60, nullable: true })
  ait_original?: string;

  // ✅ CONTROLE DE SINCRONIZAÇÃO
  @Column({ name: 'data_sincronizacao', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data_sincronizacao?: Date;

  @Column({ name: 'origem_dados', type: 'varchar', length: 20, default: 'ORACLE_DVS_MULTA' })
  origem_dados?: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at?: Date;

  // ✅ RELACIONAMENTOS
  @ManyToOne(() => DvsInfracaoEntity, { nullable: true, lazy: true })
  @JoinColumn({ name: 'codigoinfra', referencedColumnName: 'codigoinfra' })
  infracao?: Promise<DvsInfracaoEntity>;

  @ManyToOne(() => FrtCadveiculosEntity, { nullable: true, lazy: true })
  @JoinColumn({ name: 'codigoveic', referencedColumnName: 'codigoveic' })
  veiculo?: Promise<FrtCadveiculosEntity>;

  @ManyToOne(() => DvsAgenteAutuadorEntity, { nullable: true, lazy: true })
  @JoinColumn({ name: 'cod_agente_autuador', referencedColumnName: 'cod_agente_autuador' })
  agente?: Promise<DvsAgenteAutuadorEntity>;

  // ✅ CAMPOS ADICIONAIS PARA MAPEAMENTO (SE NECESSÁRIO)
  @Column({ name: 'nome_garagem', type: 'varchar', length: 100, nullable: true })
  nomegaragem?: string;

  @Column({ name: 'prefixo_veiculo', type: 'varchar', length: 20, nullable: true })
  prefixoveiculo?: string;

  @Column({ name: 'placa_veiculo', type: 'varchar', length: 10, nullable: true })
  placaveiculo?: string;

  @Column({ name: 'gravidade_infracao', type: 'varchar', length: 20, nullable: true })
  gravidadeinfracao?: string;

  @Column({ name: 'descricao_infracao', type: 'varchar', length: 255, nullable: true })
  descricaoinfracao?: string;

  @Column({ name: 'situacao_multa', type: 'varchar', length: 20, nullable: true })
  situacaomulta?: string;

  @Column({ name: 'nome_agente', type: 'varchar', length: 100, nullable: true })
  nomeagente?: string;

  @Column({ name: 'local_infracao', type: 'varchar', length: 255, nullable: true })
  localinfracao?: string;
}