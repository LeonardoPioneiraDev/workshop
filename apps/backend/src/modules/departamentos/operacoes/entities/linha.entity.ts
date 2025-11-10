// src/modules/departamentos/operacoes/entities/linha.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('operacoes_linhas')
@Index(['numero'])
@Index(['garagem'])
@Index(['status'])
export class Linha {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'codigo_interno', nullable: true })
  codigoInterno: string;

  @Column({ name: 'numero', length: 20 })
  @Index()
  numero: string;

  @Column({ name: 'descricao', length: 200, nullable: true })
  descricao: string;

  @Column({ name: 'garagem', length: 50, nullable: true })
  @Index()
  garagem: string;

  @Column({ name: 'garagem_nome', length: 100, nullable: true })
  garagemNome: string;

  @Column({ name: 'tipo_linha', length: 50, nullable: true })
  tipoLinha: string; // URBANA, INTERMUNICIPAL, ESPECIAL

  @Column({ name: 'status', length: 20, default: 'ATIVA' })
  @Index()
  status: string; // ATIVA, INATIVA, SUSPENSA

  @Column({ name: 'origem', length: 100, nullable: true })
  origem: string;

  @Column({ name: 'destino', length: 100, nullable: true })
  destino: string;

  @Column({ name: 'extensao_km', type: 'decimal', precision: 8, scale: 2, nullable: true })
  extensaoKm: number;

  @Column({ name: 'tempo_viagem_minutos', type: 'int', nullable: true })
  tempoViagemMinutos: number;

  @Column({ name: 'tarifa', type: 'decimal', precision: 6, scale: 2, nullable: true })
  tarifa: number;

  @Column({ name: 'frequencia_pico', type: 'int', nullable: true })
  frequenciaPico: number; // minutos

  @Column({ name: 'frequencia_normal', type: 'int', nullable: true })
  frequenciaNormal: number; // minutos

  @Column({ name: 'horario_inicio', type: 'time', nullable: true })
  horarioInicio: string;

  @Column({ name: 'horario_fim', type: 'time', nullable: true })
  horarioFim: string;

  @Column({ name: 'dias_operacao', length: 50, nullable: true })
  diasOperacao: string; // SEG-DOM, SEG-SAB, etc.

  @Column({ name: 'veiculos_necessarios', type: 'int', nullable: true })
  veiculosNecessarios: number;

  @Column({ name: 'passageiros_dia', type: 'int', nullable: true })
  passageirosDia: number;

  @Column({ name: 'receita_estimada_dia', type: 'decimal', precision: 10, scale: 2, nullable: true })
  receitaEstimadaDia: number;

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string;

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
  @Column({ name: 'produtividade', type: 'decimal', precision: 8, scale: 2, nullable: true })
  produtividade: number; // passageiros por km

  @Column({ name: 'eficiencia_financeira', type: 'decimal', precision: 8, scale: 2, nullable: true })
  eficienciaFinanceira: number; // receita por km

  @Column({ name: 'indice_ocupacao', type: 'decimal', precision: 5, scale: 2, nullable: true })
  indiceOcupacao: number; // % de ocupação média

  // Campo para controle de cache
  @Column({ name: 'hash_dados', length: 255, nullable: true })
  hashDados: string;
}