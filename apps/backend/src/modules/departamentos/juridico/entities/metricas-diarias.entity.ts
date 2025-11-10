// src/modules/departamentos/juridico/entities/metricas-diarias.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('juridico_metricas_diarias')
@Index(['dataReferencia', 'codigoGaragem'], { unique: true })
@Index(['dataReferencia'])
@Index(['codigoGaragem'])
export class MetricasDiariasEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'data_referencia', type: 'date' })
  dataReferencia: Date;

  // ✅ CORREÇÃO: Adicionar nullable e opcional no TypeScript
  @Column({ name: 'codigo_garagem', type: 'int', nullable: true })
  codigoGaragem?: number;

  @Column({ name: 'nome_garagem', type: 'varchar', length: 50, nullable: true })
  nomeGaragem?: string;

  // ✅ CORREÇÃO: Campos com default devem ser opcionais no TypeScript
  @Column({ name: 'total_multas', type: 'int', default: 0 })
  totalMultas?: number;

  @Column({ name: 'valor_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  valorTotal?: number;

  @Column({ name: 'valor_medio', type: 'decimal', precision: 10, scale: 2, default: 0 })
  valorMedio?: number;

  @Column({ name: 'multas_pagas', type: 'int', default: 0 })
  multasPagas?: number;

  @Column({ name: 'multas_vencidas', type: 'int', default: 0 })
  multasVencidas?: number;

  @Column({ name: 'multas_pendentes', type: 'int', default: 0 })
  multasPendentes?: number;

  @Column({ name: 'valor_arrecadado', type: 'decimal', precision: 15, scale: 2, default: 0 })
  valorArrecadado?: number;

  @Column({ name: 'valor_pendente', type: 'decimal', precision: 15, scale: 2, default: 0 })
  valorPendente?: number;

  // ✅ Por gravidade - todos opcionais
  @Column({ name: 'multas_leves', type: 'int', default: 0 })
  multasLeves?: number;

  @Column({ name: 'multas_medias', type: 'int', default: 0 })
  multasMedias?: number;

  @Column({ name: 'multas_graves', type: 'int', default: 0 })
  multasGraves?: number;

  @Column({ name: 'multas_gravissimas', type: 'int', default: 0 })
  multasGravissimas?: number;

  // ✅ Por tipo - todos opcionais
  @Column({ name: 'multas_eletronicas', type: 'int', default: 0 })
  multasEletronicas?: number;

  @Column({ name: 'multas_presenciais', type: 'int', default: 0 })
  multasPresenciais?: number;

  // ✅ Eficiência - todos opcionais
  @Column({ name: 'taxa_pagamento', type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxaPagamento?: number;

  @Column({ name: 'tempo_medio_pagamento', type: 'int', nullable: true })
  tempoMedioPagamento?: number; // em dias

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ✅ ADICIONAR ESTAS PROPRIEDADES PARA CORRIGIR O ERRO
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ✅ PROPRIEDADE QUE ESTAVA FALTANDO
  @UpdateDateColumn({ name: 'ultima_atualizacao' })
  ultimaAtualizacao: Date;
}