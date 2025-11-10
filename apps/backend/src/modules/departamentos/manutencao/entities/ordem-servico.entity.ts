import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('manutencao_ordem_servico')
@Index(['dataAbertura']) // ✅ Índice para melhorar performance nas consultas por data
@Index(['dataSincronizacao']) // ✅ Índice para verificação de sincronização
@Index(['codigoGaragem']) // ✅ Índice para filtros por garagem
@Index(['condicaoOS']) // ✅ Índice para filtros por status
export class OrdemServico {
  @PrimaryColumn({ name: 'codigo_interno_os' })
  codigoInternoOS: number;

  @Column({ name: 'numero_os' })
  numeroOS: string;

  @Column({ name: 'codigo_veiculo' })
  codigoVeiculo: number;

  @Column({ name: 'codigo_garagem' })
  codigoGaragem: number;

  @Column({ name: 'prefixo_veiculo', nullable: true })
  prefixoVeiculo: string;

  @Column({ name: 'placa_veiculo', nullable: true })
  placaVeiculo: string;

  @Column({ name: 'condicao_veiculo', nullable: true })
  condicaoVeiculo: string;

  @Column({ name: 'data_abertura', nullable: true })
  dataAbertura: string;

  @Column({ name: 'data_fechamento', nullable: true })
  dataFechamento: string;

  @Column({ name: 'hora_abertura', nullable: true })
  horaAbertura: string;

  @Column({ name: 'tipo_os_descricao', nullable: true })
  tipoOSDescricao: string;

  @Column({ name: 'tipo_os', nullable: true })
  tipoOS: string;

  @Column({ name: 'condicao_os_descricao', nullable: true })
  condicaoOSDescricao: string;

  @Column({ name: 'condicao_os', nullable: true })
  condicaoOS: string;

  @Column({ name: 'codigo_origem_os', nullable: true })
  codigoOrigemOS: number;

  @Column({ name: 'usuario_abertura', nullable: true })
  usuarioAbertura: string;

  @Column({ name: 'descricao_origem', nullable: true })
  descricaoOrigem: string;

  @Column({ name: 'descricao_servico', type: 'text', nullable: true })
  descricaoServico: string;

  @Column({ name: 'codigo_setor', nullable: true })
  codigoSetor: number;

  @Column({ name: 'codigo_grupo_servico', nullable: true })
  codigoGrupoServico: number;

  @Column({ name: 'grupo_servico', nullable: true })
  grupoServico: string;

  @Column({ name: 'garagem', nullable: true })
  garagem: string;

  @Column({ name: 'tipo_problema', nullable: true })
  tipoProblema: string;

  @Column({ name: 'dias_em_andamento', type: 'decimal', nullable: true })
  diasEmAndamento: number;

  @Column({ name: 'km_execucao', type: 'decimal', nullable: true })
  kmExecucao: number;

  @Column({ name: 'valor_mao_obra_terceiros', type: 'decimal', nullable: true, default: 0 })
  valorMaoObraTerceiros: number;

  @Column({ name: 'valor_pecas_terceiros', type: 'decimal', nullable: true, default: 0 })
  valorPecasTerceiros: number;

  @Column({ name: 'eh_socorro', nullable: true })
  ehSocorro: string;

  @Column({ name: 'data_sincronizacao', type: 'date', nullable: true })
  dataSincronizacao: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;
}