// apps/backend/src/modules/departamentos/operacoes/entities/historico-veiculo.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('historico_mudancas_operacoes') // ✅ USAR TABELA EXISTENTE
export class HistoricoVeiculo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'prefixo', length: 20 })
  prefixo: string;

  @Column({ name: 'tipo_mudanca', length: 50 })
  tipoMudanca: string;

  @Column({ name: 'campo_alterado', length: 100 })
  campoAlterado: string;

  @Column({ name: 'valor_anterior', type: 'text', nullable: true })
  valorAnterior: string;

  @Column({ name: 'valor_novo', type: 'text', nullable: true })
  valorNovo: string;

  @Column({ name: 'data_mudanca', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  dataMudanca: Date;

  @Column({ name: 'usuario_responsavel', length: 150, nullable: true })
  usuarioResponsavel: string;

  @Column({ name: 'motivo', type: 'text', nullable: true })
  motivo: string;

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string;

  @Column({ name: 'impacto', length: 20, default: 'BAIXO' })
  impacto: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}