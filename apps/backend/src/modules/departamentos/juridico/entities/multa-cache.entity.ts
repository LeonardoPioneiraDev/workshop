// apps/backend/src/modules/departamentos/juridico/entities/multa-cache.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('multa_cache')
@Index(['data_emissao', 'prefixo_veiculo'])
@Index(['numero_ait'], { unique: true })
@Index(['data_cache'])
@Index(['codigo_agente_autuador'])
@Index(['codigo_veiculo'])
@Index(['codigo_infracao'])
@Index(['status_multa'])
@Index(['gravidade_infracao'])
@Index(['n_processo_notificacao']) // ✅ NOVO ÍNDICE
export class MultaCacheEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'numero_ait', type: 'varchar', length: 30, nullable: false, unique: true })
  numero_ait: string;

  // ✅ NOVOS CAMPOS ADICIONADOS
  @Column({ name: 'n_processo_notificacao', type: 'varchar', length: 50, nullable: true })
  n_processo_notificacao?: string;

  @Column({ name: 'data_notificacao', type: 'timestamp', nullable: true })
  data_notificacao?: Date;

  @Column({ name: 'status_notificacao', type: 'varchar', length: 20, nullable: true })
  status_notificacao?: string;

  @Column({ name: 'orgao_autuador', type: 'varchar', length: 100, nullable: true })
  orgao_autuador?: string;

  @Column({ name: 'tipo_veiculo', type: 'varchar', length: 50, nullable: true })
  tipo_veiculo?: string;

  @Column({ name: 'categoria_cnh', type: 'varchar', length: 10, nullable: true })
  categoria_cnh?: string;

  // ✅ CAMPOS PARA ANÁLISE TEMPORAL
  @Column({ name: 'mes_emissao', type: 'varchar', length: 7, nullable: true })
  mes_emissao?: string; // YYYY-MM

  @Column({ name: 'ano_emissao', type: 'varchar', length: 4, nullable: true })
  ano_emissao?: string;

  @Column({ name: 'dia_semana', type: 'varchar', length: 15, nullable: true })
  dia_semana?: string;

  @Column({ name: 'periodo_horario', type: 'varchar', length: 15, nullable: true })
  periodo_horario?: string; // MADRUGADA, MANHA, TARDE, NOITE

  @Column({ name: 'hora_infracao', type: 'int', nullable: true })
  hora_infracao?: number; // 0-23

  // ✅ CAMPOS EXISTENTES (mantidos)
  @Column({ name: 'prefixo_veiculo', type: 'varchar', length: 20, nullable: true })
  prefixo_veiculo?: string;

  @Column({ name: 'placa_veiculo', type: 'varchar', length: 15, nullable: true })
  placa_veiculo?: string;

  @Column({ name: 'codigo_veiculo', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codigo_veiculo?: number;

  @Column({ name: 'codigo_infracao', type: 'varchar', length: 12, nullable: true })
  codigo_infracao?: string;

  @Column({ name: 'descricao_infracao', type: 'varchar', length: 255, nullable: true })
  descricao_infracao?: string;

  @Column({ name: 'gravidade_infracao', type: 'varchar', length: 20, nullable: true })
  gravidade_infracao?: string;

  @Column({ name: 'pontuacao_infracao', type: 'decimal', precision: 22, scale: 0, nullable: true })
  pontuacao_infracao?: number;

  @Column({ name: 'grupo_infracao', type: 'varchar', length: 50, nullable: true })
  grupo_infracao?: string;

  @Column({ name: 'valor_multa', type: 'decimal', precision: 22, scale: 4, nullable: true })
  valor_multa?: number;

  @Column({ name: 'valor_atualizado', type: 'decimal', precision: 22, scale: 4, nullable: true })
  valor_atualizado?: number;

  @Column({ name: 'valor_pago', type: 'decimal', precision: 22, scale: 4, nullable: true })
  valor_pago?: number;

  @Column({ name: 'status_multa', type: 'varchar', length: 20, nullable: true, default: 'PENDENTE' })
  status_multa?: string;

  @Column({ name: 'data_emissao', type: 'timestamp', nullable: true })
  data_emissao?: Date;

  @Column({ name: 'data_vencimento', type: 'timestamp', nullable: true })
  data_vencimento?: Date;

  @Column({ name: 'data_pagamento', type: 'timestamp', nullable: true })
  data_pagamento?: Date;

  @Column({ name: 'data_recurso', type: 'timestamp', nullable: true })
  data_recurso?: Date;

  @Column({ name: 'local_infracao', type: 'varchar', length: 255, nullable: true })
  local_infracao?: string;

  @Column({ name: 'numero_local_multa', type: 'varchar', length: 25, nullable: true })
  numero_local_multa?: string;

  @Column({ name: 'km_local_multa', type: 'decimal', precision: 22, scale: 3, nullable: true })
  km_local_multa?: number;

  @Column({ name: 'sentido_local_multa', type: 'varchar', length: 40, nullable: true })
  sentido_local_multa?: string;

  @Column({ name: 'bairro_local_multa', type: 'varchar', length: 30, nullable: true })
  bairro_local_multa?: string;

  @Column({ name: 'codigo_agente_autuador', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codigo_agente_autuador?: number;

  @Column({ name: 'nome_agente', type: 'varchar', length: 40, nullable: true })
  nome_agente?: string;

  @Column({ name: 'matricula_agente', type: 'varchar', length: 50, nullable: true })
  matricula_agente?: string;

  @Column({ name: 'codigo_empresa', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codigo_empresa?: number;

  @Column({ name: 'codigo_garagem', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codigo_garagem?: number;

  @Column({ name: 'nome_garagem', type: 'varchar', length: 100, nullable: true })
  nome_garagem?: string;

  @Column({ name: 'numero_recurso', type: 'varchar', length: 30, nullable: true })
  numero_recurso?: string;

  @Column({ name: 'condicao_recurso', type: 'varchar', length: 1, nullable: true })
  condicao_recurso?: string;

  @Column({ name: 'numero_processo', type: 'varchar', length: 50, nullable: true })
  numero_processo?: string;

  @Column({ name: 'auto_infracao', type: 'varchar', length: 50, nullable: true })
  auto_infracao?: string;

  @Column({ name: 'notificacao1', type: 'varchar', length: 50, nullable: true })
  notificacao1?: string;

  @Column({ name: 'notificacao2', type: 'varchar', length: 50, nullable: true })
  notificacao2?: string;

  @Column({ name: 'notificacao3', type: 'varchar', length: 50, nullable: true })
  notificacao3?: string;

  @Column({ name: 'observacao', type: 'text', nullable: true })
  observacao?: string;

  @Column({ name: 'observacao_real_motivo', type: 'text', nullable: true })
  observacao_real_motivo?: string;

  @Column({ name: 'responsavel_multa', type: 'varchar', length: 1, nullable: true })
  responsavel_multa?: string;

  @Column({ name: 'reincidencia', type: 'varchar', length: 5, nullable: true })
  reincidencia?: string;

  // ✅ CAMPOS CALCULADOS
  @Column({ name: 'dias_vencidos', type: 'integer', nullable: true, default: 0 })
  dias_vencidos?: number;

  @Column({ name: 'juros_calculados', type: 'decimal', precision: 22, scale: 4, nullable: true, default: 0 })
  juros_calculados?: number;

  @Column({ name: 'multa_vencimento', type: 'decimal', precision: 22, scale: 4, nullable: true, default: 0 })
  multa_vencimento?: number;

  @Column({ name: 'prioridade_cobranca', type: 'varchar', length: 10, nullable: true, default: 'BAIXA' })
  prioridade_cobranca?: string;

  @Column({ name: 'score_cobranca', type: 'integer', nullable: true, default: 0 })
  score_cobranca?: number;

  @Column({ name: 'tags', type: 'text', nullable: true })
  tags?: string;

  // ✅ CAMPOS DE CONTROLE
  @Column({ name: 'data_cache', type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  data_cache: Date;

  @Column({ name: 'ultima_atualizacao', type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  ultima_atualizacao: Date;

  @Column({ name: 'fonte_dados', type: 'varchar', length: 20, nullable: false, default: 'ORACLE_DVS' })
  fonte_dados: string;

  @Column({ name: 'hash_dados', type: 'varchar', length: 64, nullable: true })
  hash_dados?: string;

  @Column({ name: 'dados_completos', type: 'boolean', nullable: false, default: false })
  dados_completos: boolean;

  @Column({ name: 'dados_validados', type: 'boolean', nullable: false, default: false })
  dados_validados: boolean;

  @Column({ name: 'erros_validacao', type: 'text', nullable: true })
  erros_validacao?: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 50, nullable: true, default: 'SYSTEM' })
  created_by?: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 50, nullable: true, default: 'SYSTEM' })
  updated_by?: string;

  // ✅ MÉTODOS AUXILIARES ATUALIZADOS
  atualizarCamposCalculados(): void {
    this.dias_vencidos = this.calcularDiasVencimento();
    this.valor_atualizado = this.calcularValorAtualizado();
    this.prioridade_cobranca = this.definirPrioridadeCobranca();
    this.score_cobranca = this.calcularScoreCobranca();
    
    // ✅ CALCULAR CAMPOS TEMPORAIS
    if (this.data_emissao) {
      this.mes_emissao = this.data_emissao.toISOString().substring(0, 7);
      this.ano_emissao = this.data_emissao.getFullYear().toString();
      
      const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      this.dia_semana = dias[this.data_emissao.getDay()];
      
      this.hora_infracao = this.data_emissao.getHours();
      
      if (this.hora_infracao >= 0 && this.hora_infracao < 6) this.periodo_horario = 'MADRUGADA';
      else if (this.hora_infracao >= 6 && this.hora_infracao < 12) this.periodo_horario = 'MANHA';
      else if (this.hora_infracao >= 12 && this.hora_infracao < 18) this.periodo_horario = 'TARDE';
      else this.periodo_horario = 'NOITE';
    }
    
    if (this.dias_vencidos > 0 && this.valor_multa) {
      const taxaJurosDiaria = 0.0033;
      this.juros_calculados = this.valor_multa * taxaJurosDiaria * this.dias_vencidos;
      
      if (this.dias_vencidos > 0) {
        this.multa_vencimento = this.valor_multa * 0.20;
      }
    }
    
    if (this.dias_vencidos > 0 && this.status_multa !== 'PAGA') {
      this.status_multa = 'VENCIDA';
    } else if (this.dias_vencidos > -30 && this.dias_vencidos <= 0) {
      this.status_multa = 'VENCENDO_30_DIAS';
    }
  }

  calcularDiasVencimento(): number {
    if (!this.data_vencimento) return 0;
    
    const hoje = new Date();
    return Math.floor((hoje.getTime() - this.data_vencimento.getTime()) / (1000 * 60 * 60 * 24));
  }

  calcularValorAtualizado(): number {
    if (!this.data_vencimento || this.status_multa === 'PAGA') {
      return this.valor_multa || 0;
    }

    const hoje = new Date();
    const diasVencidos = Math.max(0, Math.floor((hoje.getTime() - this.data_vencimento.getTime()) / (1000 * 60 * 60 * 24)));
    
    if (diasVencidos === 0) {
      return this.valor_multa || 0;
    }

    const taxaJurosDiaria = 0.0033;
    const multaVencimento = 0.20;
    
    const valorOriginal = this.valor_multa || 0;
    const juros = valorOriginal * taxaJurosDiaria * diasVencidos;
    const multaValor = valorOriginal * multaVencimento;
    
    return valorOriginal + juros + multaValor;
  }

  definirPrioridadeCobranca(): string {
    const diasVencidos = this.calcularDiasVencimento();
    const valor = this.valor_multa || 0;

    if (diasVencidos > 90 && valor > 500) return 'URGENTE';
    if (diasVencidos > 60 || valor > 1000) return 'ALTA';
    if (diasVencidos > 30) return 'MEDIA';
    return 'BAIXA';
  }

  calcularScoreCobranca(): number {
    const diasVencidos = this.calcularDiasVencimento();
    const valor = this.valor_multa || 0;
    
    let score = 0;
    
    if (diasVencidos > 0) {
      score += Math.min(50, diasVencidos * 0.5);
    }
    
    if (valor > 100) {
      score += Math.min(30, (valor / 100) * 3);
    }
    
    switch (this.gravidade_infracao) {
      case 'GRAVISSIMA': score += 20; break;
      case 'GRAVE': score += 15; break;
      case 'MEDIA': score += 10; break;
      case 'LEVE': score += 5; break;
    }
    
    return Math.min(100, Math.round(score));
  }

  // ✅ MÉTODO ATUALIZADO PARA INCLUIR NOVOS CAMPOS
  static fromOracleData(oracleData: any): Partial<MultaCacheEntity> {
    return {
      numero_ait: oracleData.numero_ait || oracleData.numeroaimulta,
      prefixo_veiculo: oracleData.prefixo_veiculo || oracleData.prefixoveic,
      placa_veiculo: oracleData.placa_veiculo || oracleData.placaatualveic,
      codigo_veiculo: oracleData.codigo_veiculo ? Number(oracleData.codigo_veiculo) : null,
      codigo_infracao: oracleData.codigo_infracao || oracleData.codigoinfra,
      descricao_infracao: oracleData.descricao_infracao || oracleData.descricaoinfra,
      gravidade_infracao: oracleData.gravidade_infracao,
      pontuacao_infracao: oracleData.pontuacao_infracao ? Number(oracleData.pontuacao_infracao) : null,
      grupo_infracao: oracleData.grupo_infracao || oracleData.grupoinfracao,
      valor_multa: oracleData.valor_multa ? Number(oracleData.valor_multa) : null,
      valor_pago: oracleData.valor_pago ? Number(oracleData.valor_pago) : 0,
      status_multa: oracleData.status_multa || 'PENDENTE',
      data_emissao: oracleData.data_emissao ? new Date(oracleData.data_emissao) : null,
      data_vencimento: oracleData.data_vencimento ? new Date(oracleData.data_vencimento) : null,
      data_pagamento: oracleData.data_pagamento ? new Date(oracleData.data_pagamento) : null,
      local_infracao: oracleData.local_infracao || oracleData.localmulta,
      numero_local_multa: oracleData.numero_local_multa || oracleData.numerolocalmulta,
      km_local_multa: oracleData.km_local_multa ? Number(oracleData.km_local_multa) : null,
      sentido_local_multa: oracleData.sentido_local_multa || oracleData.sentidolocalmulta,
      bairro_local_multa: oracleData.bairro_local_multa || oracleData.bairrolocalmulta,
      codigo_agente_autuador: oracleData.codigo_agente_autuador ? Number(oracleData.codigo_agente_autuador) : null,
      nome_agente: oracleData.nome_agente || oracleData.desc_agente_autuador,
      matricula_agente: oracleData.matricula_agente || oracleData.matriculafiscal,
      codigo_empresa: oracleData.codigo_empresa ? Number(oracleData.codigo_empresa) : null,
      codigo_garagem: oracleData.codigo_garagem ? Number(oracleData.codigo_garagem) : null,
      nome_garagem: oracleData.nome_garagem,
      numero_recurso: oracleData.numero_recurso || oracleData.numerorecursomulta,
      condicao_recurso: oracleData.condicao_recurso || oracleData.condicaorecursomulta,
      numero_processo: oracleData.numero_processo || oracleData.numeroprocesso,
      auto_infracao: oracleData.auto_infracao || oracleData.autodeinfracao,
      notificacao1: oracleData.notificacao1,
      notificacao2: oracleData.notificacao2,
      notificacao3: oracleData.notificacao3,
      observacao: oracleData.observacao,
      observacao_real_motivo: oracleData.observacao_real_motivo || oracleData.observacaorealmotivo,
      responsavel_multa: oracleData.responsavel_multa || oracleData.responsavelmulta,
      reincidencia: oracleData.reincidencia,
      
      // ✅ NOVOS CAMPOS
      n_processo_notificacao: oracleData.n_processo_notificacao || oracleData.nprocessonotificacao,
      data_notificacao: oracleData.data_notificacao ? new Date(oracleData.data_notificacao) : null,
      status_notificacao: oracleData.status_notificacao,
      orgao_autuador: oracleData.orgao_autuador || oracleData.orgaoautuador,
      tipo_veiculo: oracleData.tipo_veiculo || oracleData.tipoveiculo,
      categoria_cnh: oracleData.categoria_cnh || oracleData.categoriacnh,
      
      fonte_dados: 'ORACLE_DVS',
      data_cache: new Date(),
      ultima_atualizacao: new Date(),
      dados_completos: false,
      dados_validados: false,
      created_by: 'SYSTEM',
      updated_by: 'SYSTEM'
    };
  }

  // ✅ MÉTODO ATUALIZADO PARA API RESPONSE
  toApiResponse(): any {
    return {
      id: this.id,
      codigoMulta: this.numero_ait,
      numero_ait: this.numero_ait,
      dataEmissao: this.data_emissao,
      dataEmissaoFormatada: this.data_emissao ? this.data_emissao.toLocaleDateString('pt-BR') : null,
      dataVencimento: this.data_vencimento,
      dataVencimentoFormatada: this.data_vencimento ? this.data_vencimento.toLocaleDateString('pt-BR') : null,
      valorMulta: this.valor_multa?.toFixed(2) || '0.00',
      valorPago: this.valor_pago?.toFixed(2) || '0.00',
      valorSaldo: this.valorSaldo?.toFixed(2) || '0.00',
      localInfracao: this.local_infracao,
      situacaoMulta: this.status_multa,
      statusMulta: this.status_multa,
      observacoes: this.observacao,
      observacaoRealMotivo: this.observacao_real_motivo,
      responsavel: this.responsavel_multa,
      prefixoVeiculo: this.prefixo_veiculo,
      placaVeiculo: this.placa_veiculo,
      codigoGaragem: this.codigo_garagem,
      nomeGaragem: this.nome_garagem,
      descricaoInfracao: this.descricao_infracao,
      valorInfracao: this.valor_multa?.toFixed(2) || '0.00',
      pontuacaoInfracao: this.pontuacao_infracao,
      gravidadeInfracao: this.gravidade_infracao,
      codigoAgente: this.codigo_agente_autuador,
      nomeAgente: this.nome_agente,
      matriculaAgente: this.matricula_agente,
      diasVencimento: this.diasVencimento,
      prioridadeCobranca: this.prioridade_cobranca,
      dataCache: this.data_cache,
      
      // ✅ NOVOS CAMPOS NA RESPOSTA
      nProcessoNotificacao: this.n_processo_notificacao,
      dataNotificacao: this.data_notificacao,
      statusNotificacao: this.status_notificacao,
      orgaoAutuador: this.orgao_autuador,
      tipoVeiculo: this.tipo_veiculo,
      categoriaCnh: this.categoria_cnh,
      mesEmissao: this.mes_emissao,
      anoEmissao: this.ano_emissao,
      diaSemana: this.dia_semana,
      periodoHorario: this.periodo_horario,
      horaInfracao: this.hora_infracao
    };
  }

  get valorSaldo(): number {
    return (this.valor_atualizado || this.valor_multa || 0) - (this.valor_pago || 0);
  }

  get diasVencimento(): number {
    if (!this.data_vencimento) return 0;
    
    const hoje = new Date();
    return Math.floor((hoje.getTime() - this.data_vencimento.getTime()) / (1000 * 60 * 60 * 24));
  }
}