// src/modules/departamentos/juridico/entities/veiculo-frota.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('juridico_veiculos_frota')
@Index(['codigoEmpresa', 'codigoGaragem'])
@Index(['prefixoVeiculo'])
@Index(['placaVeiculo'])
@Index(['situacao'])
export class VeiculoFrotaEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'codigo_empresa', type: 'integer' })
  codigoEmpresa: number;

  @Column({ name: 'prefixo_veiculo', type: 'varchar', length: 20 })
  prefixoVeiculo: string;

  @Column({ name: 'placa_veiculo', type: 'varchar', length: 10 })
  placaVeiculo: string;

  @Column({ name: 'codigo_garagem', type: 'integer' })
  codigoGaragem: number;

  @Column({ name: 'nome_garagem', type: 'varchar', length: 50 })
  nomeGaragem: string;

  @Column({ name: 'ano_fabricacao', type: 'varchar', length: 6, nullable: true })
  anoFabricacao: string;

  @Column({ name: 'ano_modelo', type: 'varchar', length: 6, nullable: true })
  anoModelo: string;

  @Column({ name: 'marca_motor', type: 'varchar', length: 100, nullable: true })
  marcaMotor: string;

  @Column({ name: 'marca_completa', type: 'varchar', length: 200, nullable: true })
  marcaCompleta: string;

  @Column({ name: 'codigo_tipo_frota', type: 'integer', nullable: true })
  codigoTipoFrota: number;

  @Column({ name: 'tipo_frota_descricao', type: 'varchar', length: 100, nullable: true })
  tipoFrotaDescricao: string;

  @Column({ name: 'renavan_veiculo', type: 'varchar', length: 20, nullable: true })
  renavanVeiculo: string;

  @Column({ name: 'numero_cpr_veiculo', type: 'varchar', length: 20, nullable: true })
  numeroCPRVeiculo: string;

  @Column({ name: 'data_inicio_utilizacao', type: 'date', nullable: true })
  dataInicioUtilizacao: Date;

  @Column({ name: 'situacao', type: 'varchar', length: 20 })
  situacao: string;

  @Column({ name: 'data_atual', type: 'varchar', length: 12 })
  dataAtual: string;

  @Column({ name: 'idade_veiculo', type: 'integer', nullable: true })
  idadeVeiculo: number;

  @Column({ name: 'dias_em_operacao', type: 'integer', nullable: true })
  diasEmOperacao: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'sincronizado_em', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sincronizadoEm: Date;
}