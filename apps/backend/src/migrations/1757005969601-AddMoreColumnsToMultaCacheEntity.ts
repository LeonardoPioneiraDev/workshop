import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMoreColumnsToMultaCacheEntity1757005969601 implements MigrationInterface {
    name = 'AddMoreColumnsToMultaCacheEntity1757005969601'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" DROP COLUMN "tipo_fiscalizacao"`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" DROP COLUMN "codigo_equipamento"`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" DROP COLUMN "numero_equipamento"`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" DROP COLUMN "data_hora_fiscalizacao"`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" DROP COLUMN "renavan"`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" DROP COLUMN "chassi"`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" DROP COLUMN "latitude_local"`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" DROP COLUMN "longitude_local"`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" DROP COLUMN "numero_boletim"`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" DROP COLUMN "orgao_autuador_cod"`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" DROP COLUMN "orgao_autuador_desc"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" ADD "orgao_autuador_desc" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" ADD "orgao_autuador_cod" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" ADD "numero_boletim" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" ADD "longitude_local" numeric(10,7)`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" ADD "latitude_local" numeric(10,7)`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" ADD "chassi" character varying(25)`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" ADD "renavan" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" ADD "data_hora_fiscalizacao" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" ADD "numero_equipamento" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" ADD "codigo_equipamento" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "juridico_multas_cache" ADD "tipo_fiscalizacao" character varying(10)`);
    }

}
