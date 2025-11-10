// src/database/migrations/*InitialSchema.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1757356900000 implements MigrationInterface {
    name = 'InitialSchema1757356900000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Criar extensão UUID
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // Criar tabela multa_cache básica
        await queryRunner.query(`
            CREATE TABLE "multa_cache" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "numero_ait" varchar(30) NOT NULL,
                "prefixo_veiculo" varchar(20),
                "placa_veiculo" varchar(15),
                "codigo_veiculo" decimal(22,0),
                "codigo_infracao" varchar(12),
                "descricao_infracao" varchar(255),
                "gravidade_infracao" varchar(20),
                "valor_multa" decimal(22,4),
                "status_multa" varchar(20) DEFAULT 'PENDENTE',
                "data_emissao" timestamp,
                "data_vencimento" timestamp,
                "data_cache" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "PK_multa_cache" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_multa_cache_numero_ait" UNIQUE ("numero_ait")
            )
        `);

       
        await queryRunner.query(`CREATE INDEX "IDX_multa_cache_numero_ait" ON "multa_cache" ("numero_ait")`);
        await queryRunner.query(`CREATE INDEX "IDX_multa_cache_data_cache" ON "multa_cache" ("data_cache")`);
        await queryRunner.query(`CREATE INDEX "IDX_multa_cache_status" ON "multa_cache" ("status_multa")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "multa_cache"`);
    }
}