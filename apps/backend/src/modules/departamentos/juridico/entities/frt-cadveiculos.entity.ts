// src/modules/departamentos/juridico/entities/frt-cadveiculos.entity.ts
import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { DvsMultaEntity } from './dvs-multa.entity';

@Entity('frt_cadveiculos')
@Index(['codigoveic'], { unique: true })
@Index(['prefixoveic'])
@Index(['placaatualveic'])
@Index(['codigoempresa'])
@Index(['codigoga'])
@Index(['condicaoveic'])
export class FrtCadveiculosEntity {
  // ✅ CHAVE PRIMÁRIA
  @PrimaryColumn({ name: 'codigoveic', type: 'decimal', precision: 22, scale: 0 })
  codigoveic: number;

  // ✅ CAMPOS BÁSICOS (1-21)
  @Column({ name: 'codigopdrcor', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codigopdrcor: number;

  @Column({ name: 'codmunic', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codmunic: number;

  @Column({ name: 'cod_intgrupolinha', type: 'decimal', precision: 22, scale: 0, nullable: true })
  cod_intgrupolinha: number;

  @Column({ name: 'codigoespcarroc', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codigoespcarroc: number;

  @Column({ name: 'codigositveic', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codigositveic: number;

  @Column({ name: 'codigotpveic', type: 'decimal', precision: 22, scale: 0, nullable: false })
  codigotpveic: number;

  @Column({ name: 'codintlinha', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codintlinha: number;

  @Column({ name: 'codigoga', type: 'decimal', precision: 22, scale: 0, nullable: false })
  codigoga: number;

  @Column({ name: 'codigouf', type: 'varchar', length: 3, nullable: false })
  codigouf: string;

  @Column({ name: 'codigoempresa', type: 'decimal', precision: 22, scale: 0, nullable: false })
  codigoempresa: number;

  @Column({ name: 'codigofl', type: 'decimal', precision: 22, scale: 0, nullable: false })
  codigofl: number;

  @Column({ name: 'codigocategoriaveic', type: 'decimal', precision: 22, scale: 0, nullable: false })
  codigocategoriaveic: number;

  @Column({ name: 'codgrprev', type: 'decimal', precision: 22, scale: 0, nullable: false })
  codgrprev: number;

  @Column({ name: 'codigomodmotor', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codigomodmotor: number;

  @Column({ name: 'codigomodcarroc', type: 'decimal', precision: 22, scale: 0, nullable: false })
  codigomodcarroc: number;

  @Column({ name: 'codigomodchassi', type: 'decimal', precision: 22, scale: 0, nullable: false })
  codigomodchassi: number;

  @Column({ name: 'codigotpfrota', type: 'decimal', precision: 22, scale: 0, nullable: false })
  codigotpfrota: number;

  @Column({ name: 'codigoclassveic', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codigoclassveic: number;

  @Column({ name: 'prefixoveic', type: 'varchar', length: 7, nullable: false })
  prefixoveic: string;

  @Column({ name: 'prefixoantveic', type: 'varchar', length: 7, nullable: true })
  prefixoantveic: string;

  // ✅ PLACAS E IDENTIFICAÇÃO (22-24)
  @Column({ name: 'placaatualveic', type: 'varchar', length: 15, nullable: false })
  placaatualveic: string;

  @Column({ name: 'placaanteriorveic', type: 'varchar', length: 15, nullable: true })
  placaanteriorveic: string;

  @Column({ name: 'condicaoveic', type: 'varchar', length: 1, nullable: false })
  condicaoveic: string;

  // ✅ DATAS E CAPACIDADES (25-28)
  @Column({ name: 'dtinicioutilveic', type: 'timestamp', nullable: true })
  dtinicioutilveic: Date;

  @Column({ name: 'capacidadetanqueveic', type: 'decimal', precision: 22, scale: 2, nullable: true })
  capacidadetanqueveic: number;

  @Column({ name: 'capacidadetqsecveic', type: 'decimal', precision: 22, scale: 2, nullable: true })
  capacidadetqsecveic: number;

  @Column({ name: 'kminicialveic', type: 'decimal', precision: 22, scale: 2, nullable: true })
  kminicialveic: number;

  // ✅ OBSERVAÇÕES E CONFIGURAÇÕES (29-39)
  @Column({ name: 'obsveic', type: 'varchar', length: 255, nullable: true })
  obsveic: string;

  @Column({ name: 'viradaroletaveic', type: 'decimal', precision: 22, scale: 0, nullable: false })
  viradaroletaveic: number;

  @Column({ name: 'viradavelocveic', type: 'decimal', precision: 22, scale: 0, nullable: false })
  viradavelocveic: number;

  @Column({ name: 'venctogarantiakmveic', type: 'decimal', precision: 22, scale: 0, nullable: true })
  venctogarantiakmveic: number;

  @Column({ name: 'venctogarantiadataveic', type: 'timestamp', nullable: true })
  venctogarantiadataveic: Date;

  @Column({ name: 'kmlitroveic', type: 'decimal', precision: 22, scale: 3, nullable: true })
  kmlitroveic: number;

  @Column({ name: 'qtdecombulttroleo', type: 'decimal', precision: 22, scale: 2, nullable: true })
  qtdecombulttroleo: number;

  @Column({ name: 'kmlitrosecveic', type: 'decimal', precision: 22, scale: 3, nullable: true })
  kmlitrosecveic: number;

  @Column({ name: 'apresentarelatorioveic', type: 'varchar', length: 1, nullable: false })
  apresentarelatorioveic: string;

  @Column({ name: 'qtderepulttroleo', type: 'decimal', precision: 22, scale: 2, nullable: true })
  qtderepulttroleo: number;

  @Column({ name: 'sitescalaveic', type: 'varchar', length: 1, nullable: true })
  sitescalaveic: string;

  // ✅ CÓDIGOS TÉCNICOS (40-51)
  @Column({ name: 'codreltrans', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codreltrans: number;

  @Column({ name: 'codtpfreio', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codtpfreio: number;

  @Column({ name: 'codtpcb', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codtpcb: number;

  @Column({ name: 'capcarrocveic', type: 'decimal', precision: 22, scale: 0, nullable: true })
  capcarrocveic: number;

  @Column({ name: 'codigoumcapcarroc', type: 'varchar', length: 3, nullable: true })
  codigoumcapcarroc: string;

  @Column({ name: 'qtderoletasveic', type: 'decimal', precision: 22, scale: 0, nullable: true })
  qtderoletasveic: number;

  @Column({ name: 'capacempeveic', type: 'decimal', precision: 22, scale: 0, nullable: true })
  capacempeveic: number;

  @Column({ name: 'capacsentadoveic', type: 'decimal', precision: 22, scale: 0, nullable: true })
  capacsentadoveic: number;

  @Column({ name: 'codempanterior', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codempanterior: number;

  @Column({ name: 'codflanterior', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codflanterior: number;

  @Column({ name: 'codgaanterior', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codgaanterior: number;

  @Column({ name: 'mediakmdiaveic', type: 'decimal', precision: 22, scale: 2, nullable: true })
  mediakmdiaveic: number;

  // ✅ CONFIGURAÇÕES ESPECIAIS (52-62)
  @Column({ name: 'utilizahorimetroveic', type: 'varchar', length: 1, nullable: true })
  utilizahorimetroveic: string;

  @Column({ name: 'aceitamovvendaveic', type: 'varchar', length: 1, nullable: true })
  aceitamovvendaveic: string;

  @Column({ name: 'renavanveic', type: 'varchar', length: 50, nullable: true })
  renavanveic: string;

  @Column({ name: 'possuicobrador', type: 'varchar', length: 1, nullable: true })
  possuicobrador: string;

  @Column({ name: 'codclaslicenciamento', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codclaslicenciamento: number;

  @Column({ name: 'tiposervico', type: 'decimal', precision: 22, scale: 0, nullable: true })
  tiposervico: number;

  @Column({ name: 'codmunicemplacamento', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codmunicemplacamento: number;

  @Column({ name: 'numeromotor', type: 'varchar', length: 30, nullable: true })
  numeromotor: string;

  @Column({ name: 'numerorastreador', type: 'decimal', precision: 22, scale: 0, nullable: true })
  numerorastreador: number;

  @Column({ name: 'numeroinmetro', type: 'varchar', length: 10, nullable: true })
  numeroinmetro: string;

  @Column({ name: 'possivelvenda', type: 'varchar', length: 1, nullable: true })
  possivelvenda: string;

  // ✅ CUSTOS E CÓDIGOS EXTERNOS (63-66)
  @Column({ name: 'codcustofin', type: 'decimal', precision: 22, scale: 0, nullable: true })
  codcustofin: number;

  @Column({ name: 'codigoexternoveic', type: 'varchar', length: 15, nullable: true })
  codigoexternoveic: string;

  @Column({ name: 'capac_cxcambio', type: 'decimal', precision: 22, scale: 2, nullable: true })
  capac_cxcambio: number;

  @Column({ name: 'capac_cxdiferencial', type: 'decimal', precision: 22, scale: 2, nullable: true })
  capac_cxdiferencial: number;

  // ✅ GARANTIA E CONFIGURAÇÕES ESPECIAIS (67-71)
  @Column({ name: 'dt_prazogarantia', type: 'timestamp', nullable: true })
  dt_prazogarantia: Date;

  @Column({ name: 'roletadupla', type: 'varchar', length: 1, nullable: true })
  roletadupla: string;

  @Column({ name: 'tagravo', type: 'varchar', length: 19, nullable: true })
  tagravo: string;

  @Column({ name: 'tpveicgtfrota', type: 'varchar', length: 1, nullable: true })
  tpveicgtfrota: string;

  @Column({ name: 'mover_patio_fora_escala', type: 'varchar', length: 1, nullable: true })
  mover_patio_fora_escala: string;

  // ✅ IDENTIFICAÇÃO E COMUNICAÇÃO (72-74)
  @Column({ name: 'codigo_sigla', type: 'varchar', length: 12, nullable: true })
  codigo_sigla: string;

  @Column({ name: 'telefone_chip_um', type: 'varchar', length: 50, nullable: true })
  telefone_chip_um: string;

  @Column({ name: 'telefone_chip_dois', type: 'varchar', length: 50, nullable: true })
  telefone_chip_dois: string;

  // ✅ AFERIÇÕES E TACÓGRAFO (75-76)
  @Column({ name: 'afericaocronotacografoini', type: 'timestamp', nullable: true })
  afericaocronotacografoini: Date;

  @Column({ name: 'afericaocronotacografofin', type: 'timestamp', nullable: true })
  afericaocronotacografofin: Date;

  // ✅ METAS E REGISTROS (77-80)
  @Column({ name: 'metamediakml', type: 'decimal', precision: 22, scale: 2, nullable: true })
  metamediakml: number;

  @Column({ name: 'rntrc', type: 'varchar', length: 30, nullable: true })
  rntrc: string;

  @Column({ name: 'flgnaoenviarsmartec', type: 'varchar', length: 1, nullable: true })
  flgnaoenviarsmartec: string;

  @Column({ name: 'garagemmanutencao', type: 'decimal', precision: 22, scale: 0, nullable: true })
  garagemmanutencao: number;

  // ✅ CONTROLE DE SINCRONIZAÇÃO
  @Column({ name: 'data_sincronizacao', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  data_sincronizacao: Date;

  @Column({ name: 'origem_dados', type: 'varchar', length: 20, default: 'ORACLE_FRT_CADVEICULOS' })
  origem_dados: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // ✅ RELACIONAMENTOS
  @OneToMany(() => DvsMultaEntity, multa => multa.veiculo)
  multas: DvsMultaEntity[];
}