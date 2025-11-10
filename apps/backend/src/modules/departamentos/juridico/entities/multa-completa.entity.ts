// apps/backend/src/modules/departamentos/juridico/entities/multa-completa.entity.ts

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('multas_completas')
@Index(['dataEmissaoMulta', 'codigoEmpresa'])
@Index(['prefixoVeic'])
@Index(['numeroAiMulta'])
@Index(['codigoVeic'])
@Index(['codigoInfra'])
@Index(['agenteCodigo'])
export class MultaCompleta {
  @PrimaryColumn({ name: 'numero_ai_multa' })
  numeroAiMulta: string;

  // Dados da infração
  @Column({ name: 'descricao_infra', type: 'text', nullable: true })
  descricaoInfra: string;

  // Dados do veículo
  @Column({ name: 'prefixo_veic', nullable: true })
  prefixoVeic: string;

  // Dados básicos da multa
  @Column({ name: 'cod_int_func', nullable: true })
  codIntFunc: string;

  @Column({ name: 'codigo_veic', nullable: true })
  codigoVeic: string;

  @Column({ name: 'codigo_infra', nullable: true })
  codigoInfra: string;

  @Column({ name: 'codigo_uf', nullable: true })
  codigoUf: string;

  @Column({ name: 'cod_munic', nullable: true })
  codMunic: string;

  @Column({ name: 'codigo_org', nullable: true })
  codigoOrg: string;

  @Column({ name: 'data_emissao_multa', type: 'timestamp', nullable: true })
  dataEmissaoMulta: Date;

  @Column({ name: 'local_multa', type: 'text', nullable: true })
  localMulta: string;

  @Column({ name: 'numero_local_multa', nullable: true })
  numeroLocalMulta: string;

  @Column({ name: 'data_hora_multa', type: 'timestamp', nullable: true })
  dataHoraMulta: Date;

  @Column({ name: 'data_vecto_multa', type: 'date', nullable: true })
  dataVectoMulta: Date;

  @Column({ name: 'valor_multa', type: 'decimal', precision: 10, scale: 4, nullable: true })
  valorMulta: number;

  @Column({ name: 'total_parcelas_multa', nullable: true })
  totalParcelasMulta: number;

  @Column({ name: 'valor_total_multa', type: 'decimal', precision: 10, scale: 4, nullable: true })
  valorTotalMulta: number;

  @Column({ name: 'data_pagto_multa', type: 'date', nullable: true })
  dataPagtoMulta: Date;

  @Column({ name: 'responsavel_multa', nullable: true })
  responsavelMulta: string;

  @Column({ name: 'numero_recurso_multa', nullable: true })
  numeroRecursoMulta: string;

  @Column({ name: 'data_recurso_multa', type: 'date', nullable: true })
  dataRecursoMulta: Date;

  @Column({ name: 'condicao_recurso_multa', nullable: true })
  condicaoRecursoMulta: string;

  @Column({ name: 'valor_pago', type: 'decimal', precision: 10, scale: 4, nullable: true })
  valorPago: number;

  @Column({ name: 'data_autorizado', type: 'date', nullable: true })
  dataAutorizado: Date;

  @Column({ name: 'autorizado', nullable: true })
  autorizado: string;

  @Column({ name: 'decl_impresso_multa', nullable: true })
  declImpressoMulta: string;

  @Column({ name: 'documento', nullable: true })
  documento: string;

  @Column({ name: 'data_pagamento_prev', type: 'date', nullable: true })
  dataPagamentoPrev: Date;

  @Column({ name: 'vlr_acrescimo', type: 'decimal', precision: 10, scale: 4, nullable: true })
  vlrAcrescimo: number;

  @Column({ name: 'vlr_desconto', type: 'decimal', precision: 10, scale: 4, nullable: true })
  vlrDesconto: number;

  @Column({ name: 'valor_pagamento', type: 'decimal', precision: 10, scale: 4, nullable: true })
  valorPagamento: number;

  @Column({ name: 'codigo_forn', nullable: true })
  codigoForn: string;

  @Column({ name: 'cod_lanca', nullable: true })
  codLanca: string;

  @Column({ name: 'id_prest2', nullable: true })
  idPrest2: string;

  @Column({ name: 'cod_doc_tocpg', nullable: true })
  codDocTocpg: string;

  @Column({ name: 'cod_int_proaut', nullable: true })
  codIntProaut: string;

  @Column({ name: 'observacao', type: 'text', nullable: true })
  observacao: string;

  @Column({ name: 'data_limite_condutor', type: 'date', nullable: true })
  dataLimiteCondutor: Date;

  @Column({ name: 'numero_recurso_multa2', nullable: true })
  numeroRecursoMulta2: string;

  @Column({ name: 'data_recurso_multa2', type: 'date', nullable: true })
  dataRecursoMulta2: Date;

  @Column({ name: 'condicao_recurso_multa2', nullable: true })
  condicaoRecursoMulta2: string;

  @Column({ name: 'cod_motivo_notificacao', nullable: true })
  codMotivoNotificacao: string;

  @Column({ name: 'cod_area_competencia', nullable: true })
  codAreaCompetencia: string;

  @Column({ name: 'cod_responsavel_notificacao', nullable: true })
  codResponsavelNotificacao: string;

  @Column({ name: 'cod_agente_autuador', nullable: true })
  codAgenteAutuador: string;

  @Column({ name: 'cod_int_linha', nullable: true })
  codIntLinha: string;

  @Column({ name: 'codlinha', nullable: true })
  codLinha: string;

  @Column({ name: 'numero_recurso_multa3', nullable: true })
  numeroRecursoMulta3: string;

  @Column({ name: 'data_recurso_multa3', type: 'date', nullable: true })
  dataRecursoMulta3: Date;

  @Column({ name: 'condicao_recurso_multa3', nullable: true })
  condicaoRecursoMulta3: string;

  @Column({ name: 'flg_prim_parcela_paga', nullable: true })
  flgPrimParcelaPaga: string;

  @Column({ name: 'entrada_vencimento', type: 'date', nullable: true })
  entradaVencimento: Date;

  @Column({ name: 'entrada_pagamento', type: 'date', nullable: true })
  entradaPagamento: Date;

  @Column({ name: 'auto_de_infracao', nullable: true })
  autoDeInfracao: string;

  @Column({ name: 'auto_de_infracao_emissao', type: 'date', nullable: true })
  autoDeInfracaoEmissao: Date;

  @Column({ name: 'auto_de_infracao_recebimento', type: 'date', nullable: true })
  autoDeInfracaoRecebimento: Date;

  @Column({ name: 'auto_de_infracao_considerado', type: 'date', nullable: true })
  autoDeInfracaoConsiderado: Date;

  @Column({ name: 'auto_de_infracao_valor_do_doc', type: 'decimal', precision: 10, scale: 2, nullable: true })
  autoDeInfracaoValorDoDoc: number;

  @Column({ name: 'auto_de_infracao_valor_considerado', type: 'decimal', precision: 10, scale: 2, nullable: true })
  autoDeInfracaoValorConsiderado: number;

  // Notificações
  @Column({ name: 'notificacao1', nullable: true })
  notificacao1: string;

  @Column({ name: 'notificacao1_emissao', type: 'date', nullable: true })
  notificacao1Emissao: Date;

  @Column({ name: 'notificacao1_recebimento', type: 'date', nullable: true })
  notificacao1Recebimento: Date;

  @Column({ name: 'notificacao1_considerado', type: 'date', nullable: true })
  notificacao1Considerado: Date;

  @Column({ name: 'notificacao1_valor_do_doc', type: 'decimal', precision: 10, scale: 2, nullable: true })
  notificacao1ValorDoDoc: number;

  @Column({ name: 'notificacao1_valor_considerado', type: 'decimal', precision: 10, scale: 2, nullable: true })
  notificacao1ValorConsiderado: number;

  @Column({ name: 'notificacao2', nullable: true })
  notificacao2: string;

  @Column({ name: 'notificacao2_emissao', type: 'date', nullable: true })
  notificacao2Emissao: Date;

  @Column({ name: 'notificacao2_recebimento', type: 'date', nullable: true })
  notificacao2Recebimento: Date;

  @Column({ name: 'notificacao2_considerado', type: 'date', nullable: true })
  notificacao2Considerado: Date;

  @Column({ name: 'notificacao2_valor_do_doc', type: 'decimal', precision: 10, scale: 2, nullable: true })
  notificacao2ValorDoDoc: number;

  @Column({ name: 'notificacao2_valor_considerado', type: 'decimal', precision: 10, scale: 2, nullable: true })
  notificacao2ValorConsiderado: number;

  @Column({ name: 'notificacao3', nullable: true })
  notificacao3: string;

  @Column({ name: 'notificacao3_emissao', type: 'date', nullable: true })
  notificacao3Emissao: Date;

  @Column({ name: 'notificacao3_recebimento', type: 'date', nullable: true })
  notificacao3Recebimento: Date;

  @Column({ name: 'notificacao3_considerado', type: 'date', nullable: true })
  notificacao3Considerado: Date;

  @Column({ name: 'notificacao3_valor_do_doc', type: 'decimal', precision: 10, scale: 2, nullable: true })
  notificacao3ValorDoDoc: number;

  @Column({ name: 'notificacao3_valor_considerado', type: 'decimal', precision: 10, scale: 2, nullable: true })
  notificacao3ValorConsiderado: number;

  // Campos adicionais
  @Column({ name: 'valor_atualizado', type: 'decimal', precision: 10, scale: 2, nullable: true })
  valorAtualizado: number;

  @Column({ name: 'pgto_intemp_data', type: 'date', nullable: true })
  pgtoIntempData: Date;

  @Column({ name: 'pgto_intemp_valor', type: 'decimal', precision: 10, scale: 2, nullable: true })
  pgtoIntempValor: number;

  @Column({ name: 'dep_jud_data', type: 'date', nullable: true })
  depJudData: Date;

  @Column({ name: 'dep_jud_valor', type: 'decimal', precision: 10, scale: 2, nullable: true })
  depJudValor: number;

  @Column({ name: 'dep_jud_dt_recup', type: 'date', nullable: true })
  depJudDtRecup: Date;

  @Column({ name: 'dep_jud_vlr_recup', type: 'decimal', precision: 10, scale: 2, nullable: true })
  depJudVlrRecup: number;

  @Column({ name: 'numero_processo', nullable: true })
  numeroProcesso: string;

  // Parcelas
  @Column({ name: 'parc_valor', type: 'decimal', precision: 10, scale: 2, nullable: true })
  parcValor: number;

  @Column({ name: 'parc_total_parcelas', nullable: true })
  parcTotalParcelas: number;

  @Column({ name: 'parc_valor_parcelas', type: 'decimal', precision: 10, scale: 2, nullable: true })
  parcValorParcelas: number;

  @Column({ name: 'ent_vencimento', type: 'date', nullable: true })
  entVencimento: Date;

  @Column({ name: 'ent_pagamento', type: 'date', nullable: true })
  entPagamento: Date;

  @Column({ name: 'ent_valor', type: 'decimal', precision: 10, scale: 2, nullable: true })
  entValor: number;

  @Column({ name: 'par_vencimento', type: 'date', nullable: true })
  parVencimento: Date;

  @Column({ name: 'par_pagamento', type: 'date', nullable: true })
  parPagamento: Date;

  @Column({ name: 'par_valor', type: 'decimal', precision: 10, scale: 2, nullable: true })
  parValor: number;

  @Column({ name: 'ult_par_vencimento', type: 'date', nullable: true })
  ultParVencimento: Date;

  @Column({ name: 'ult_par_pagamento', type: 'date', nullable: true })
  ultParPagamento: Date;

  @Column({ name: 'ult_par_valor', type: 'decimal', precision: 10, scale: 2, nullable: true })
  ultParValor: number;

  @Column({ name: 'total_pago', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalPago: number;

  @Column({ name: 'recuso', nullable: true })
  recuso: string;

  @Column({ name: 'anistia', nullable: true })
  anistia: string;

  // Instâncias
  @Column({ name: 'instancia_envio1', type: 'date', nullable: true })
  instanciaEnvio1: Date;

  @Column({ name: 'instancia_publicacao_do1', type: 'date', nullable: true })
  instanciaPublicacaoDo1: Date;

  @Column({ name: 'instancia_envio2', type: 'date', nullable: true })
  instanciaEnvio2: Date;

  @Column({ name: 'instancia_publicacao_do2', type: 'date', nullable: true })
  instanciaPublicacaoDo2: Date;

  @Column({ name: 'instancia_envio3', type: 'date', nullable: true })
  instanciaEnvio3: Date;

  @Column({ name: 'instancia_publicacao_do3', type: 'date', nullable: true })
  instanciaPublicacaoDo3: Date;

  @Column({ name: 'integrou_por_vencimento', nullable: true })
  integrouPorVencimento: string;

  @Column({ name: 'valor_julgado', type: 'decimal', precision: 10, scale: 2, nullable: true })
  valorJulgado: number;

  @Column({ name: 'codigo_recuperacao', nullable: true })
  codigoRecuperacao: string;

  @Column({ name: 'n_processo_notificacao', nullable: true })
  nProcessoNotificacao: string;

  @Column({ name: 'auto_de_infracao_prazo', nullable: true })
  autoDeInfracaoPrazo: string;

  @Column({ name: 'notificacao1_prazo', nullable: true })
  notificacao1Prazo: string;

  @Column({ name: 'notificacao2_prazo', nullable: true })
  notificacao2Prazo: string;

  @Column({ name: 'notificacao3_prazo', nullable: true })
  notificacao3Prazo: string;

  @Column({ name: 'pgto_intemp_venc', type: 'date', nullable: true })
  pgtoIntempVenc: Date;

  @Column({ name: 'dep_jud_venc', type: 'date', nullable: true })
  depJudVenc: Date;

  @Column({ name: 'cod_causa_principal', nullable: true })
  codCausaPrincipal: string;

  @Column({ name: 'env_penalidade', nullable: true })
  envPenalidade: string;

  @Column({ name: 'rev_penalidade', nullable: true })
  revPenalidade: string;

  @Column({ name: 'obs_notificacao', type: 'text', nullable: true })
  obsNotificacao: string;

  @Column({ name: 'recuperada', nullable: true })
  recuperada: string;

  @Column({ name: 'palavra_chave', nullable: true })
  palavraChave: string;

  @Column({ name: 'tratamento_multa', nullable: true })
  tratamentoMulta: string;

  @Column({ name: 'importacao_ok', nullable: true })
  importacaoOk: string;

  @Column({ name: 'tipo_de_trecho', nullable: true })
  tipoDeTrecho: string;

  @Column({ name: 'reembolsavel', nullable: true })
  reembolsavel: string;

  @Column({ name: 'km_local_multa', nullable: true })
  kmLocalMulta: string;

  @Column({ name: 'metros_local_multa', nullable: true })
  metrosLocalMulta: string;

  @Column({ name: 'sentido_local_multa', nullable: true })
  sentidoLocalMulta: string;

  @Column({ name: 'bairro_local_multa', nullable: true })
  bairroLocalMulta: string;

  @Column({ name: 'observacao_real_motivo', type: 'text', nullable: true })
  observacaoRealMotivo: string;

  @Column({ name: 'tipo_tratamento_multa', nullable: true })
  tipoTratamentoMulta: string;

  @Column({ name: 'executor', nullable: true })
  executor: string;

  @Column({ name: 'executor_cnpj_cpf', nullable: true })
  executorCnpjCpf: string;

  @Column({ name: 'ult_alteracao', type: 'timestamp', nullable: true })
  ultAlteracao: Date;

  @Column({ name: 'ocorrencia', nullable: true })
  ocorrencia: string;

  @Column({ name: 'codigo_ressarc', nullable: true })
  codigoRessarc: string;

  @Column({ name: 'flg_smartec', nullable: true })
  flgSmartec: string;

  @Column({ name: 'data_imp_smartec', type: 'date', nullable: true })
  dataImpSmartec: Date;

  @Column({ name: 'url_formulario', type: 'text', nullable: true })
  urlFormulario: string;

  @Column({ name: 'url_boleto', type: 'text', nullable: true })
  urlBoleto: string;

  @Column({ name: 'flg_smartec_multa', nullable: true })
  flgSmartecMulta: string;

  @Column({ name: 'reincidencia', nullable: true })
  reincidencia: string;

  @Column({ name: 'pontuacao_infracao', nullable: true })
  pontuacaoInfracao: number;

  @Column({ name: 'grupo_infracao', nullable: true })
  grupoInfracao: string;

  @Column({ name: 'cod_org_original', nullable: true })
  codOrgOriginal: string;

  @Column({ name: 'ait_original', nullable: true })
  aitOriginal: string;

  // Dados do agente
  @Column({ name: 'agente_codigo', nullable: true })
  agenteCodigo: string;

  @Column({ name: 'agente_descricao', nullable: true })
  agenteDescricao: string;

  @Column({ name: 'agente_matricula_fiscal', nullable: true })
  agenteMatriculaFiscal: string;

  // Campos de controle
  @Column({ name: 'codigo_empresa', default: 4 })
  codigoEmpresa: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'sincronizado_em', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sincronizadoEm: Date;
}