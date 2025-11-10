// src/modules/departamentos/operacoes/entities/estatisticas-operacoes.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('operacoes_estatisticas')
@Index(['data'])
@Index(['ano', 'mes'])
@Index(['garagem'])
export class EstatisticasOperacoes {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'data', type: 'date' })
  @Index()
  data: Date;

  @Column({ name: 'ano', type: 'int' })
  @Index()
  ano: number;

  @Column({ name: 'mes', type: 'int' })
  @Index()
  mes: number;

  @Column({ name: 'garagem', length: 100, default: 'TODAS' })
  @Index()
  garagem: string;

  // Estatísticas de Frota
  @Column({ name: 'total_veiculos', type: 'int', default: 0 })
  totalVeiculos: number;

  @Column({ name: 'veiculos_ativos', type: 'int', default: 0 })
  veiculosAtivos: number;

  @Column({ name: 'veiculos_inativos', type: 'int', default: 0 })
  veiculosInativos: number;

  // Estatísticas de Acidentes
  @Column({ name: 'total_acidentes', type: 'int', default: 0 })
  totalAcidentes: number;

  @Column({ name: 'acidentes_com_vitimas', type: 'int', default: 0 })
  acidentesComVitimas: number;

  @Column({ name: 'acidentes_sem_vitimas', type: 'int', default: 0 })
  acidentesSemVitimas: number;

  @Column({ name: 'valor_total_danos', type: 'decimal', precision: 15, scale: 2, default: 0 })
  valorTotalDanos: number;

  // KPIs Calculados
  @Column({ name: 'indice_sinistralidade', type: 'decimal', precision: 5, scale: 2, default: 0 })
  indiceSinistralidade: number;

  @Column({ name: 'custo_medio_acidente', type: 'decimal', precision: 10, scale: 2, default: 0 })
  custoMedioAcidente: number;

  @Column({ name: 'eficiencia_operacional', type: 'decimal', precision: 5, scale: 2, default: 0 })
  eficienciaOperacional: number;

  @Column({ name: 'percentual_disponibilidade', type: 'decimal', precision: 5, scale: 2, default: 0 })
  percentualDisponibilidade: number;

  // Dados Completos (JSON)
  @Column({ name: 'dados_completos', type: 'jsonb', nullable: true })
  dadosCompletos: any;

  // Observações
  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Campos calculados
  @Column({ name: 'percentual_acidentes_com_vitimas', type: 'decimal', precision: 5, scale: 2, default: 0 })
  percentualAcidentesComVitimas: number;

  @Column({ name: 'acidentes_por_veiculo', type: 'decimal', precision: 5, scale: 3, default: 0 })
  acidentesPorVeiculo: number;

  @Column({ name: 'custo_por_veiculo', type: 'decimal', precision: 10, scale: 2, default: 0 })
  custoPorVeiculo: number;
}