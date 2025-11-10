// apps/backend/src/modules/departamentos/operacoes/entities/veiculo-operacional.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('veiculos_operacionais')
@Index(['prefixo']) // Remover qualquer índice que use 'statusOperacional'
@Index(['placa'])
@Index(['garagem'])
@Index(['status']) // Usar 'status' em vez de 'statusOperacional'
export class VeiculoOperacional {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'codigo_veiculo', nullable: true })
  codigoVeiculo: string;

  @Column({ unique: true })
  prefixo: string;

  @Column()
  placa: string;

  @Column({ nullable: true })
  modelo: string;

  @Column({ nullable: true })
  marca: string;

  @Column({ nullable: true })
  ano: number;

  // CORRIGIR: Usar 'status' em vez de 'statusOperacional'
  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'ATIVO',
    comment: 'Status do veículo: ATIVO, INATIVO, MANUTENCAO, RESERVA'
  })
  status: string;

  @Column({ nullable: true })
  garagem: string;

  @Column({ name: 'garagem_nome', nullable: true })
  garagemNome: string;

  @Column({ nullable: true })
  setor: string;

  @Column({ name: 'tipo_veiculo', nullable: true })
  tipoVeiculo: string;

  @Column({ name: 'capacidade_passageiros', nullable: true })
  capacidadePassageiros: number;

  @Column({ nullable: true })
  combustivel: string;

  @Column({ nullable: true })
  quilometragem: number;

  @Column({ name: 'motorista_atual', nullable: true })
  motoristaAtual: string;

  @Column({ name: 'rota_atual', nullable: true })
  rotaAtual: string;

  @Column({ type: 'text', nullable: true })
  observacoes: string;

  @Column({ name: 'data_ultima_atualizacao', type: 'timestamp', nullable: true })
  dataUltimaAtualizacao: Date;

  @Column({ name: 'data_sincronizacao', type: 'timestamp', nullable: true })
  dataSincronizacao: Date;

  // Campos adicionais para operações
  @Column({ name: 'data_aquisicao', type: 'date', nullable: true })
  dataAquisicao: Date;

  @Column({ name: 'valor_aquisicao', type: 'decimal', precision: 10, scale: 2, nullable: true })
  valorAquisicao: number;

  @Column({ name: 'numero_patrimonio', nullable: true })
  numeroPatrimonio: string;

  @Column({ nullable: true })
  chassi: string;

  @Column({ nullable: true })
  renavam: string;

  @Column({ nullable: true })
  cor: string;

  @Column({ name: 'numero_motor', nullable: true })
  numeroMotor: string;

  @Column({ name: 'potencia_motor', nullable: true })
  potenciaMotor: number;

  @Column({ nullable: true })
  categoria: string;

  @Column({ nullable: true })
  proprietario: string;

  @Column({ default: false })
  financiado: boolean;

  @Column({ nullable: true })
  seguradora: string;

  @Column({ name: 'numero_apolice', nullable: true })
  numeroApolice: string;

  @Column({ name: 'data_vencimento_seguro', type: 'date', nullable: true })
  dataVencimentoSeguro: Date;

  @Column({ name: 'data_proxima_revisao', type: 'date', nullable: true })
  dataProximaRevisao: Date;

  @Column({ name: 'quilometragem_proxima_revisao', nullable: true })
  quilometragemProximaRevisao: number;

  @Column({ name: 'status_documentacao', nullable: true })
  statusDocumentacao: string;

  @Column({ name: 'status_manutencao', nullable: true })
  statusManutencao: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}