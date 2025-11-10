// src/modules/departamentos/juridico/entities/veiculo.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { MultaCacheEntity } from './multa-cache.entity';

@Entity('juridico_veiculos')
@Index(['codigoVeiculo'], { unique: true })
@Index(['prefixoVeiculo'])
@Index(['codigoGaragem'])
@Index(['statusOperacional'])
export class VeiculoEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'codigo_veiculo', type: 'varchar', length: 20, unique: true })
  codigoVeiculo: string;

  @Column({ name: 'prefixo_veiculo', type: 'varchar', length: 20, nullable: true })
  prefixoVeiculo: string;

  @Column({ name: 'placa_atual', type: 'varchar', length: 10, nullable: true })
  placaAtual: string;

  @Column({ name: 'placa_anterior', type: 'varchar', length: 10, nullable: true })
  placaAnterior: string;

  @Column({ name: 'codigo_garagem', type: 'int', nullable: true })
  codigoGaragem: number;

  @Column({ name: 'nome_garagem', type: 'varchar', length: 50, nullable: true })
  nomeGaragem: string;

  @Column({ name: 'tipo_veiculo', type: 'varchar', length: 30, nullable: true })
  tipoVeiculo: string;

  @Column({ name: 'modelo', type: 'varchar', length: 50, nullable: true })
  modelo: string;

  @Column({ name: 'ano_fabricacao', type: 'int', nullable: true })
  anoFabricacao: number;

  @Column({ name: 'ano_modelo', type: 'int', nullable: true })
  anoModelo: number;

  @Column({ name: 'capacidade_passageiros', type: 'int', nullable: true })
  capacidadePassageiros: number;

  @Column({ name: 'combustivel', type: 'varchar', length: 20, nullable: true })
  combustivel: string;

  @Column({ name: 'status_operacional', type: 'varchar', length: 20, default: 'ATIVO' })
  statusOperacional: string;

  @Column({ name: 'km_atual', type: 'decimal', precision: 10, scale: 2, nullable: true })
  kmAtual: number;

  @Column({ name: 'data_ultima_revisao', type: 'date', nullable: true })
  dataUltimaRevisao: Date;

  @Column({ name: 'total_multas', type: 'int', default: 0 })
  totalMultas: number;

  @Column({ name: 'valor_total_multas', type: 'decimal', precision: 12, scale: 2, default: 0 })
  valorTotalMultas: number;

  @Column({ name: 'observacoes', type: 'text', nullable: true })
  observacoes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ✅ RELACIONAMENTO COMENTADO TEMPORARIAMENTE
  /*
  @OneToMany(() => MultaCacheEntity, multa => multa.veiculo)
  multas: MultaCacheEntity[];
  */
}