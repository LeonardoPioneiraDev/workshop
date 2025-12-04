import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'multas_completas' })
export class MultaCompleta {
  @PrimaryColumn({ name: 'numero_ai_multa', type: 'varchar' })
  numeroAiMulta: string;

  @Column({ name: 'descricao_infra', type: 'text', nullable: true })
  descricaoInfra?: string;

  @Column({ name: 'prefixo_veic', type: 'varchar', length: 20, nullable: true })
  prefixoVeic?: string;

  @Column({ name: 'codigo_infra', type: 'varchar', length: 20, nullable: true })
  codigoInfracao?: string;

  @Column({ name: 'data_hora_multa', type: 'timestamp', nullable: true })
  dataHoraMulta?: Date;

  @Column({ name: 'data_emissao_multa', type: 'timestamp', nullable: true })
  dataEmissaoMulta?: Date;

  @Column({ name: 'local_multa', type: 'text', nullable: true })
  localMulta?: string;

  @Column({ name: 'valor_multa', type: 'numeric', precision: 10, scale: 4, nullable: true })
  valorMulta?: string;

  @Column({ name: 'agente_codigo', type: 'varchar', length: 20, nullable: true })
  agenteCodigo?: string;

  @Column({ name: 'agente_descricao', type: 'varchar', length: 200, nullable: true })
  agenteDescricao?: string;

  @Column({ name: 'pontuacao_infracao', type: 'int', nullable: true })
  pontuacaoInfracao?: number;

  @Column({ name: 'grupo_infracao', type: 'varchar', length: 50, nullable: true })
  grupoInfracao?: string;

  @Column({ name: 'setor_principal_linha', type: 'varchar', length: 50, nullable: true })
  setorPrincipalLinha?: string;

  @Column({ name: 'codigolinha', type: 'varchar', length: 20, nullable: true })
  codigoLinha?: string;

  @Column({ name: 'nomelinha', type: 'varchar', length: 200, nullable: true })
  nomeLinha?: string;
}

