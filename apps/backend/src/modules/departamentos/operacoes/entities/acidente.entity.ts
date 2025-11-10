// src/modules/departamentos/operacoes/entities/acidente.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('operacoes_acidentes')
@Index(['dataAcidente'])
@Index(['prefixoVeiculo'])
@Index(['garagemVeiculoNome'])
@Index(['grauAcidente'])
@Index(['statusProcesso'])
@Index(['dataSincronizacao'])
export class Acidente {
  @PrimaryGeneratedColumn()
  id: number;

  // Dados do Acidente
  @Column({ name: 'data_acidente', type: 'date' })
  @Index()
  dataAcidente: Date;

  @Column({ name: 'hora_acidente', length: 8, nullable: true })
  horaAcidente: string;

  @Column({ name: 'condicao_tempo', length: 50, nullable: true })
  condicaoTempo: string;

  @Column({ name: 'visibilidade', length: 50, nullable: true })
  visibilidade: string;

  @Column({ name: 'grau_acidente', length: 30, nullable: true })
  @Index()
  grauAcidente: string;

  @Column({ name: 'status_processo', length: 50, nullable: true })
  @Index()
  statusProcesso: string;

  @Column({ name: 'ocorrencia', length: 100, nullable: true })
  ocorrencia: string;

  @Column({ name: 'tipo_acidente_geral', length: 50, nullable: true })
  tipoAcidenteGeral: string;

  @Column({ name: 'bairro', length: 100, nullable: true })
  bairro: string;

  @Column({ name: 'municipio', length: 100, nullable: true })
  municipio: string;

  @Column({ name: 'tipo_monta', length: 50, nullable: true })
  tipoMonta: string;

  @Column({ name: 'tipo_acidente_detalhe', length: 100, nullable: true })
  tipoAcidenteDetalhe: string;

  @Column({ name: 'valor_total_dano', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorTotalDano: number;

  @Column({ name: 'valor_acordo', type: 'decimal', precision: 15, scale: 2, nullable: true })
  valorAcordo: number;

  @Column({ name: 'turno', length: 20, nullable: true })
  turno: string;

  @Column({ name: 'punicoes_aplicadas', type: 'text', nullable: true })
  punicoesAplicadas: string;

  // Informações da Linha
  @Column({ name: 'numero_linha', length: 20, nullable: true })
  numeroLinha: string;

  @Column({ name: 'descricao_linha', length: 200, nullable: true })
  descricaoLinha: string;

  @Column({ name: 'garagem_linha_nome', length: 50, nullable: true })
  garagemLinhaNome: string;

  // Informações do Veículo
  @Column({ name: 'prefixo_veiculo', length: 20, nullable: true })
  @Index()
  prefixoVeiculo: string;

  @Column({ name: 'placa_veiculo', length: 10, nullable: true })
  placaVeiculo: string;

  @Column({ name: 'garagem_veiculo_nome', length: 50, nullable: true })
  @Index()
  garagemVeiculoNome: string;

  // Campos de controle
  @Column({ name: 'data_ultima_atualizacao', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dataUltimaAtualizacao: Date;

  @Column({ name: 'data_sincronizacao', type: 'date', default: () => 'CURRENT_DATE' })
  @Index()
  dataSincronizacao: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Campos calculados
  @Column({ name: 'mes_ano', length: 7, nullable: true })
  @Index()
  mesAno: string;

  @Column({ name: 'ano', type: 'int', nullable: true })
  @Index()
  ano: number;

  @Column({ name: 'mes', type: 'int', nullable: true })
  @Index()
  mes: number;

  @Column({ name: 'dia_semana', type: 'int', nullable: true })
  diaSemana: number;

  @Column({ name: 'periodo_dia', length: 10, nullable: true })
  periodoDia: string;

  // Campo para controle de cache
  @Column({ name: 'hash_dados', length: 255, nullable: true })
  hashDados: string;
}