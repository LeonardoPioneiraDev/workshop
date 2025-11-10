// src/modules/departamentos/juridico/entities/agente.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { MultaCacheEntity } from './multa-cache.entity';

@Entity('juridico_agentes')
@Index(['codigo_agente'], { unique: true })  // ✅ Corrigido para snake_case
@Index(['ativo'])
@Index(['especialidade'])
@Index(['orgao_origem'])  // ✅ Agora vai funcionar
@Index(['setor'])
export class AgenteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'codigo_agente', type: 'varchar', length: 20, unique: true })
  codigo_agente: string;  // ✅ CORRIGIDO para snake_case

  @Column({ name: 'nome_agente', type: 'varchar', length: 100, nullable: true })
  nome_agente: string;  // ✅ CORRIGIDO para snake_case

  @Column({ name: 'matricula_fiscal', type: 'varchar', length: 20, nullable: true })
  matricula_fiscal: string;  // ✅ CORRIGIDO para snake_case

  @Column({ name: 'orgao_origem', type: 'varchar', length: 50, nullable: true })
  orgao_origem: string;  // ✅ CORRIGIDO para snake_case

  @Column({ name: 'setor', type: 'varchar', length: 50, nullable: true })
  setor: string;

  @Column({ name: 'ativo', type: 'boolean', default: true })
  ativo: boolean;

  @Column({ name: 'data_admissao', type: 'date', nullable: true })
  data_admissao: Date;  // ✅ CORRIGIDO para snake_case

  @Column({ name: 'especialidade', type: 'varchar', length: 50, nullable: true })
  especialidade: string; // 'TRANSITO', 'TRANSPORTE_PUBLICO', 'GERAL'

  @Column({ name: 'total_multas_aplicadas', type: 'int', default: 0 })
  total_multas_aplicadas: number;  // ✅ CORRIGIDO para snake_case

  @Column({ name: 'valor_total_multas', type: 'decimal', precision: 15, scale: 2, default: 0 })
  valor_total_multas: number;  // ✅ CORRIGIDO para snake_case

  @Column({ name: 'meta_mensal', type: 'int', nullable: true })
  meta_mensal: number;  // ✅ CORRIGIDO para snake_case

  @Column({ name: 'telefone', type: 'varchar', length: 20, nullable: true })
  telefone: string;

  @Column({ name: 'email', type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ name: 'cargo', type: 'varchar', length: 50, nullable: true })
  cargo: string;

  @Column({ name: 'nivel_acesso', type: 'varchar', length: 20, default: 'BASICO' })
  nivel_acesso: string;  // ✅ CORRIGIDO para snake_case

  @Column({ name: 'turno_trabalho', type: 'varchar', length: 20, nullable: true })
  turno_trabalho: string;  // ✅ CORRIGIDO para snake_case

  @Column({ name: 'data_ultima_atividade', type: 'timestamp', nullable: true })
  data_ultima_atividade: Date;  // ✅ CORRIGIDO para snake_case

  @Column({ name: 'status_operacional', type: 'varchar', length: 20, default: 'DISPONIVEL' })
  status_operacional: string;  // ✅ CORRIGIDO para snake_case

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string;

  // ✅ Campos de auditoria
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @Column({ name: 'created_by', type: 'varchar', length: 50, nullable: true, default: 'SYSTEM' })
  created_by: string;

  @Column({ name: 'updated_by', type: 'varchar', length: 50, nullable: true, default: 'SYSTEM' })
  updated_by: string;

  // ✅ RELACIONAMENTO COMENTADO TEMPORARIAMENTE (para evitar erros)
  /*
  @OneToMany(() => MultaCacheEntity, multa => multa.agente)
  multas: MultaCacheEntity[];
  */

  // ✅ GETTERS/SETTERS PARA COMPATIBILIDADE (manter código existente funcionando)
  get codigoAgente(): string {
    return this.codigo_agente;
  }

  set codigoAgente(value: string) {
    this.codigo_agente = value;
  }

  get nomeAgente(): string {
    return this.nome_agente;
  }

  set nomeAgente(value: string) {
    this.nome_agente = value;
  }

  get matriculaFiscal(): string {
    return this.matricula_fiscal;
  }

  set matriculaFiscal(value: string) {
    this.matricula_fiscal = value;
  }

  get orgaoOrigem(): string {
    return this.orgao_origem;
  }

  set orgaoOrigem(value: string) {
    this.orgao_origem = value;
  }

  get dataAdmissao(): Date {
    return this.data_admissao;
  }

  set dataAdmissao(value: Date) {
    this.data_admissao = value;
  }

  get totalMultasAplicadas(): number {
    return this.total_multas_aplicadas;
  }

  set totalMultasAplicadas(value: number) {
    this.total_multas_aplicadas = value;
  }

  get valorTotalMultas(): number {
    return this.valor_total_multas;
  }

  set valorTotalMultas(value: number) {
    this.valor_total_multas = value;
  }

  get metaMensal(): number {
    return this.meta_mensal;
  }

  set metaMensal(value: number) {
    this.meta_mensal = value;
  }

  get nivelAcesso(): string {
    return this.nivel_acesso;
  }

  set nivelAcesso(value: string) {
    this.nivel_acesso = value;
  }

  get turnoTrabalho(): string {
    return this.turno_trabalho;
  }

  set turnoTrabalho(value: string) {
    this.turno_trabalho = value;
  }

  get dataUltimaAtividade(): Date {
    return this.data_ultima_atividade;
  }

  set dataUltimaAtividade(value: Date) {
    this.data_ultima_atividade = value;
  }

  get statusOperacional(): string {
    return this.status_operacional;
  }

  set statusOperacional(value: string) {
    this.status_operacional = value;
  }

  // ✅ MÉTODOS AUXILIARES ATUALIZADOS
  
  /**
   * Calcula a média de multas por mês do agente
   */
  calcularMediaMultasMes(): number {
    if (!this.data_admissao) return 0;
    
    const hoje = new Date();
    const mesesTrabalhados = Math.max(1, 
      (hoje.getFullYear() - this.data_admissao.getFullYear()) * 12 + 
      (hoje.getMonth() - this.data_admissao.getMonth())
    );
    
    return Math.round(this.total_multas_aplicadas / mesesTrabalhados);
  }

  /**
   * Calcula o percentual de cumprimento da meta mensal
   */
  calcularPercentualMeta(): number {
    if (!this.meta_mensal || this.meta_mensal === 0) return 0;
    
    const mediaMensal = this.calcularMediaMultasMes();
    return Math.round((mediaMensal / this.meta_mensal) * 100);
  }

  /**
   * Verifica se o agente está ativo e disponível
   */
  isDisponivelParaAtividade(): boolean {
    return this.ativo && this.status_operacional === 'DISPONIVEL';
  }

  /**
   * Atualiza os totais de multas do agente
   */
  atualizarTotais(novasMultas: number, valorTotal: number): void {
    this.total_multas_aplicadas += novasMultas;
    this.valor_total_multas += valorTotal;
    this.data_ultima_atividade = new Date();
  }

  /**
   * Define o status operacional do agente
   */
  definirStatusOperacional(status: string): void {
    const statusValidos = ['DISPONIVEL', 'EM_ATIVIDADE', 'LICENCA', 'FERIAS', 'AFASTADO'];
    
    if (statusValidos.includes(status)) {
      this.status_operacional = status;
    }
  }

  /**
   * Retorna dados formatados para API
   */
  toApiResponse(): any {
    return {
      id: this.id,
      codigoAgente: this.codigo_agente,
      nomeAgente: this.nome_agente,
      matriculaFiscal: this.matricula_fiscal,
      orgaoOrigem: this.orgao_origem,
      setor: this.setor,
      especialidade: this.especialidade,
      cargo: this.cargo,
      ativo: this.ativo,
      statusOperacional: this.status_operacional,
      turnoTrabalho: this.turno_trabalho,
      nivelAcesso: this.nivel_acesso,
      dataAdmissao: this.data_admissao,
      dataAdmissaoFormatada: this.data_admissao ? this.data_admissao.toLocaleDateString('pt-BR') : null,
      totalMultasAplicadas: this.total_multas_aplicadas,
      valorTotalMultas: this.valor_total_multas?.toFixed(2) || '0.00',
      metaMensal: this.meta_mensal,
      mediaMultasMes: this.calcularMediaMultasMes(),
      percentualMeta: this.calcularPercentualMeta(),
      dataUltimaAtividade: this.data_ultima_atividade,
      dataUltimaAtividadeFormatada: this.data_ultima_atividade ? 
        this.data_ultima_atividade.toLocaleDateString('pt-BR') : null,
      telefone: this.telefone,
      email: this.email,
      observacoes: this.observacoes,
      createdAt: this.created_at,
      updatedAt: this.updated_at
    };
  }

  /**
   * Cria instância a partir de dados externos
   */
  static fromExternalData(data: any): Partial<AgenteEntity> {
    return {
      codigo_agente: data.codigoAgente || data.codigo_agente,
      nome_agente: data.nomeAgente || data.nome_agente,
      matricula_fiscal: data.matriculaFiscal || data.matricula_fiscal,
      orgao_origem: data.orgaoOrigem || data.orgao_origem || 'SETRANSP',
      setor: data.setor,
      especialidade: data.especialidade || 'TRANSPORTE_PUBLICO',
      cargo: data.cargo || 'FISCAL',
      telefone: data.telefone,
      email: data.email,
      data_admissao: data.dataAdmissao ? new Date(data.dataAdmissao) : null,
      ativo: data.ativo !== undefined ? data.ativo : true,
      status_operacional: data.statusOperacional || 'DISPONIVEL',
      turno_trabalho: data.turnoTrabalho || 'INTEGRAL',
      nivel_acesso: data.nivelAcesso || 'BASICO',
      meta_mensal: data.metaMensal ? Number(data.metaMensal) : null,
      observacoes: data.observacoes,
      created_by: 'SYSTEM',
      updated_by: 'SYSTEM'
    };
  }

  /**
   * Valida dados obrigatórios do agente
   */
  validarDadosObrigatorios(): { valido: boolean; erros: string[] } {
    const erros: string[] = [];

    if (!this.codigo_agente) {
      erros.push('Código do agente é obrigatório');
    }

    if (!this.nome_agente) {
      erros.push('Nome do agente é obrigatório');
    }

    if (!this.matricula_fiscal) {
      erros.push('Matrícula fiscal é obrigatória');
    }

    if (this.email && !this.email.includes('@')) {
      erros.push('Email inválido');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  }
}