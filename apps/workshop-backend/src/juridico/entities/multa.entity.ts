import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('multas')
export class Multa {
    @PrimaryColumn({ name: 'codigo_multa' })
    codigoMulta: string;

    @Column({ name: 'data_emissao', type: 'timestamp' })
    dataEmissao: Date;

    @Column({ name: 'data_lancamento', type: 'timestamp', nullable: true })
    dataLancamento: Date;

    @Column({ name: 'valor_multa', type: 'decimal', precision: 10, scale: 2, nullable: true })
    valorMulta: number;

    // Veículo
    @Column({ name: 'codigo_veiculo', type: 'integer', nullable: true })
    codigoVeiculo: number;

    @Column({ name: 'prefixo_veiculo', nullable: true })
    prefixoVeiculo: string;

    @Column({ name: 'placa_veiculo', nullable: true })
    placaVeiculo: string;

    // Infração
    @Column({ name: 'codigo_infracao', type: 'integer', nullable: true })
    codigoInfracao: number;

    @Column({ name: 'descricao_infracao', nullable: true })
    descricaoInfracao: string;

    @Column({ name: 'pontuacao_infracao', type: 'integer', nullable: true })
    pontuacaoInfracao: number;

    // Agente
    @Column({ name: 'codigo_agente', type: 'integer', nullable: true })
    codigoAgente: number;

    @Column({ name: 'descricao_agente', nullable: true })
    descricaoAgente: string;

    @Column({ name: 'matricula_fiscal_agente', nullable: true })
    matriculaFiscalAgente: string;

    // Outros
    @Column({ name: 'local_infracao', nullable: true })
    localInfracao: string;

    @Column({ type: 'text', nullable: true })
    observacao: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
