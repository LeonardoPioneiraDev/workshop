import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { addMonths } from 'date-fns';
import { DeptPessoalSnapshot } from './entities/dept-pessoal-snapshot.entity';
import { OracleReadOnlyService } from '../oracle/services/oracle-readonly.service';

@Injectable()
export class DeptPessoalService {
  private readonly logger = new Logger(DeptPessoalService.name);

  private readonly oracleSql = `
    SELECT 
      'S' AS VALEREFEICFUNC,
      NULL AS DTTRANSFFUNC,
      F.CODIGOEMPRESA AS EMPRESA,
      F.CODINTFUNC,
      F.CODFUNC AS CRACHA,
      F.CHAPAFUNC AS CHAPA,
      F.NOMEFUNC AS NOME,
      NULL AS MAE,
      (SELECT D.NRDOCTO FROM FLP_DOCUMENTOS D 
        WHERE D.CODINTFUNC = F.CODINTFUNC AND D.TIPODOCTO = 'CPF') AS CPF,
      F.DESCFUNCAO AS FUNCAO,
      CASE 
        WHEN F.CODIGOEMPRESA = 4 THEN 'OPERACAO'
        ELSE 'ADMINISTRATIVO'
      END AS DEPARTAMENTO,
      CASE 
        WHEN F.CODIGOEMPRESA = 4 THEN 'TRANSPORTE'
        ELSE 'GESTAO'
      END AS AREA,
      NULL AS DESCSECAO,
      NULL AS DESCSETOR,
      NULL AS ENDERECO,
      NULL AS CASA,
      NULL AS BAIRRO,
      COALESCE(C.DESCCID, 'BRASILIA') AS CIDADE,
      NULL AS FONEFUNC,
      NULL AS FONE2FUNC,
      F.DTADMFUNC AS ADMISSAO,
      F.SITUACAOFUNC AS SITUACAO,
      0 AS SALBASE,
      0 AS SALAUX1,
      0 AS SALAUX2,
      NULL AS DTCOMPETQUITA,
      NULL AS IDQUITA,
      A.DTAFAST AS DTDESLIGQUITA,
      CASE 
        WHEN F.DTNASCTOFUNC IS NOT NULL THEN 
          TRUNC(MONTHS_BETWEEN(CAST(:ref_date AS DATE), F.DTNASCTOFUNC) / 12)
        ELSE NULL
      END AS IDADE,
      CASE 
        WHEN F.DTADMFUNC IS NOT NULL THEN 
          TRUNC(CAST(:ref_date AS DATE) - TRUNC(F.DTADMFUNC))
        ELSE NULL
      END AS TEMPO_EMPRESA_DIAS,
      CASE 
        WHEN F.DTADMFUNC IS NOT NULL THEN 
          TRUNC(MONTHS_BETWEEN(CAST(:ref_date AS DATE), F.DTADMFUNC) / 12, 2)
        ELSE NULL
      END AS TEMPO_EMPRESA_ANOS
    FROM VW_FUNCIONARIOS F
    LEFT JOIN FLP_AFASTADOS A ON F.CODINTFUNC = A.CODINTFUNC
    LEFT JOIN FRQ_CID C ON A.CODCID = C.CODCID
    WHERE F.CODIGOEMPRESA = 4
      AND F.SITUACAOFUNC IN ('A', 'F', 'D')
    ORDER BY F.NOMEFUNC`;

  private readonly oracleAfastadosSql = `
    SELECT G.CODIGOEMPRESA,
           G.CODFUNC,
           G.CHAPAFUNC,
           G.DESCFUNCAO,
           G.NOMEFUNC,
           G.SEXOFUNC,
           G.DTNASCTOFUNC,
           G.CPF,
           G.DTADMFUNC,
           G.DTAFAST,
           G.DESCCONDI,
           G.CODCID,
           G.DESCCID
    FROM (
      SELECT A.CODIGOEMPRESA,
             A.CODFUNC,
             A.CHAPAFUNC,
             A.DESCFUNCAO,
             A.NOMEFUNC,
             A.SEXOFUNC,
             A.DTNASCTOFUNC,
             A.CPF,
             A.DTADMFUNC,
             A.DTAFAST,
             B.DESCCONDI,
             A.CODCID,
             C.DESCCID
      FROM (
        SELECT F.CODIGOEMPRESA,
               F.CODFUNC,
               F.CHAPAFUNC,
               F.DESCFUNCAO,
               F.NOMEFUNC,
               F.SEXOFUNC,
               F.DTNASCTOFUNC,
               (SELECT D.NRDOCTO FROM FLP_DOCUMENTOS D WHERE D.CODINTFUNC = F.CODINTFUNC AND D.TIPODOCTO = 'CPF') AS CPF,
               MAX(F.DTADMFUNC) AS DTADMFUNC,
               MAX(A.DTAFAST) AS DTAFAST,
               MAX(A.CODCID) AS CODCID
        FROM VW_FUNCIONARIOS F,
             FLP_AFASTADOS A
        WHERE F.CODINTFUNC = A.CODINTFUNC
          AND F.SITUACAOFUNC = 'F'
          AND F.CODIGOEMPRESA = 4
          AND A.DTAFAST IS NOT NULL
          AND A.DTAFAST <= CAST(:ref_date AS DATE)
        GROUP BY F.CODINTFUNC,
                 F.CODIGOEMPRESA,
                 F.CODFUNC,
                 F.CHAPAFUNC,
                 F.DESCFUNCAO,
                 F.NOMEFUNC,
                 F.DTNASCTOFUNC,
                 F.SEXOFUNC
      ) A,
      FRQ_CID C,
      (
        SELECT F.CODFUNC,
               A.DTAFAST,
               O.DESCCONDI
        FROM VW_FUNCIONARIOS F,
             FLP_AFASTADOS A,
             FLP_CONDICAO O
        WHERE F.CODINTFUNC = A.CODINTFUNC
          AND A.CODCONDI = O.CODCONDI
          AND F.SITUACAOFUNC = 'F'
          AND A.DTAFAST IS NOT NULL
          AND A.DTAFAST <= CAST(:ref_date AS DATE)
      ) B
      WHERE A.CODFUNC = B.CODFUNC
        AND A.DTAFAST = B.DTAFAST
        AND A.CODCID = C.CODCID (+)
    ) G
    ORDER BY G.CODIGOEMPRESA, G.NOMEFUNC`;

  constructor(
    @InjectRepository(DeptPessoalSnapshot)
    private readonly snapshotRepo: Repository<DeptPessoalSnapshot>,
    private readonly dataSource: DataSource,
    private readonly oracleService: OracleReadOnlyService,
  ) {}

  private firstDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private referenceDates(): Date[] {
    const m0 = this.firstDay(new Date());
    const m1 = this.firstDay(addMonths(m0, -1));
    const m2 = this.firstDay(addMonths(m0, -2));
    const m12 = this.firstDay(addMonths(m0, -12));
    return [m0, m1, m2, m12];
  }

  private async hasDataFor(refDate: Date): Promise<boolean> {
    const row = await this.dataSource.query(
      'SELECT 1 FROM workshop.dept_pessoal_snapshot WHERE referencia_date = $1 LIMIT 1',
      [refDate],
    );
    return Array.isArray(row) && row.length > 0;
  }

  private mapRowToParams(row: any, refDate: Date): any[] {
    return [
      row.EMPRESA ?? null,
      row.CODINTFUNC ?? null,
      refDate,
      row.CRACHA ?? null,
      row.CHAPA ?? null,
      row.NOME ?? null,
      row.CPF ?? null,
      row.FUNCAO ?? null,
      row.DEPARTAMENTO ?? null,
      row.AREA ?? null,
      row.CIDADE ?? null,
      row.ADMISSAO ?? null,
      row.SITUACAO ?? null,
      row.SALBASE ?? null,
      row.SALAUX1 ?? null,
      row.SALAUX2 ?? null,
      row.DTCOMPETQUITA ?? null,
      row.IDQUITA ?? null,
      row.DTDESLIGQUITA ?? null,
      row.IDADE ?? null,
      row.TEMPO_EMPRESA_DIAS ?? null,
      row.TEMPO_EMPRESA_ANOS ?? null,
      row.VALEREFEICFUNC ?? null,
      row.DTTRANSFFUNC ?? null,
      row.MAE ?? null,
      row.DESCSECAO ?? null,
      row.DESCSETOR ?? null,
      row.ENDERECO ?? null,
      row.CASA ?? null,
      row.BAIRRO ?? null,
      row.FONEFUNC ?? null,
      row.FONE2FUNC ?? null,
    ];
  }

  private async upsertRows(refDate: Date, rows: any[]): Promise<number> {
    let saved = 0;
    const upsertSql =
      'SELECT workshop.upsert_dept_pessoal_snapshot(' +
      [
        '$1::int',
        '$2::int',
        '$3::date',
        '$4::text',
        '$5::text',
        '$6::text',
        '$7::text',
        '$8::text',
        '$9::text',
        '$10::text',
        '$11::text',
        '$12::date',
        '$13::text',
        '$14::numeric',
        '$15::numeric',
        '$16::numeric',
        '$17::date',
        '$18::text',
        '$19::date',
        '$20::int',
        '$21::int',
        '$22::numeric',
        '$23::text',
        '$24::date',
        '$25::text',
        '$26::text',
        '$27::text',
        '$28::text',
        '$29::text',
        '$30::text',
        '$31::text',
        '$32::text',
      ].join(', ') +
      ')';
    for (const r of rows) {
      const params = this.mapRowToParams(r, refDate);
      await this.dataSource.query(upsertSql, params);
      saved++;
    }
    return saved;
  }

  private async recordSyncRun(refDate: Date, count: number, ok = true, message?: string) {
    await this.dataSource.query(
      'INSERT INTO workshop.sync_runs (dataset_key, referencia_date, row_count, ok, message) VALUES ($1,$2,$3,$4,$5)',
      ['dept_pessoal', refDate, count, ok, message ?? null],
    );
  }

  async ensureSnapshots(force = false): Promise<{ processed: number; stats: Record<string, any> }> {
    const refs = this.referenceDates();
    const stats: Record<string, any> = {};

    for (const refDate of refs) {
      const label = refDate.toISOString().slice(0, 10);
      try {
        const exists = await this.hasDataFor(refDate);
        if (exists && !force) {
          this.logger.log(`DeptPessoal ${label}: já possui dados, pulando sync.`);
          stats[label] = { status: 'skipped', saved: 0 };
          continue;
        }

        const rows = await this.oracleService.executeReadOnlyQuery<any>(this.oracleSql, { ref_date: refDate });
        const saved = await this.upsertRows(refDate, rows || []);
        await this.recordSyncRun(refDate, saved, true, 'ok');
        this.logger.log(`DeptPessoal ${label}: sincronizados ${saved} registros.`);
        stats[label] = { status: 'synced', saved };
      } catch (e: any) {
        await this.recordSyncRun(refDate, 0, false, e?.message);
        this.logger.error(`Erro ao sincronizar DeptPessoal ${label}: ${e?.message}`);
        stats[label] = { status: 'error', error: e?.message };
      }
    }

    return { processed: Object.keys(stats).length, stats };
  }

  async getCurrentMonth(): Promise<DeptPessoalSnapshot[]> {
    const [current] = this.referenceDates();
    return this.snapshotRepo.find({ where: { referenciaDate: current }, order: { nome: 'ASC' as any } });
  }

  async getResumoJanela(): Promise<any[]> {
    const [m0, m1, m2, m12] = this.referenceDates();
    const res = await this.dataSource.query(
      'SELECT referencia_date, departamento, area, situacao, total FROM workshop.vw_dept_pessoal_resumo_mes WHERE referencia_date IN ($1,$2,$3,$4) ORDER BY referencia_date DESC, departamento, area, situacao',
      [m0, m1, m2, m12],
    );
    return res;
  }

  async getTurnoverWindow(): Promise<{ rows: Array<{ referencia_date: string; admitidos: number; desligados: number }>; lastSync: string | null }> {
    const [m0, m1, m2, m12] = this.referenceDates();
    const counts: any[] = await this.dataSource.query(
      'SELECT referencia_date, situacao, SUM(total) AS total FROM workshop.vw_dept_pessoal_resumo_mes WHERE referencia_date IN ($1,$2,$3,$4) GROUP BY referencia_date, situacao',
      [m0, m1, m2, m12],
    );
    const map = new Map<string, { A: number; D: number; F: number }>();
    for (const r of counts) {
      const key = new Date(r.referencia_date).toISOString().substring(0, 10);
      if (!map.has(key)) map.set(key, { A: 0, D: 0, F: 0 });
      const entry = map.get(key)!;
      if (r.situacao === 'A') entry.A = Number(r.total) || 0;
      else if (r.situacao === 'D') entry.D = Number(r.total) || 0;
      else if (r.situacao === 'F') entry.F = Number(r.total) || 0;
    }
    const order = [m2, m1, m0, m12].map((d) => d.toISOString().substring(0, 10));
    const rows = order.map((k) => {
      const e = map.get(k) || { A: 0, D: 0, F: 0 };
      return { referencia_date: k, admitidos: e.A, desligados: e.D };
    });
    const lastSyncRow = await this.dataSource.query(
      "SELECT to_char(MAX(ran_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD"+"T"+"HH24:MI:SS') AS ts FROM workshop.sync_runs WHERE dataset_key = 'dept_pessoal'",
    );
    const lastSync = lastSyncRow?.[0]?.ts || null;
    return { rows, lastSync };
  }

  async getAfastadosWindow(): Promise<{ rows: Array<{ referencia_date: string; inss: number | null; apInvalidez: number | null; total: number }>; lastSync: string | null }> {
    const [m0, m1, m2, m12] = this.referenceDates();
    // Preferir tabela de resumo dedicada, se existir
    try {
      const res = await this.dataSource.query(
        'SELECT referencia_date, inss, ap_invalidez, total FROM workshop.dept_pessoal_afastados_resumo WHERE referencia_date IN ($1,$2,$3,$4)',
        [m0, m1, m2, m12],
      );
      const key = (d: Date) => d.toISOString().substring(0, 10);
      const order = [m12, m2, m1, m0].map(key);
      const map = new Map<string, any>();
      for (const r of res) {
        map.set(new Date(r.referencia_date).toISOString().substring(0, 10), r);
      }
      const rows = order.map((k) => {
        const e = map.get(k) || { inss: 0, ap_invalidez: 0, total: 0 };
        return { referencia_date: k, inss: Number(e.inss)||0, apInvalidez: Number(e.ap_invalidez)||0, total: Number(e.total)||0 };
      });
      const lastSyncRow = await this.dataSource.query(
        "SELECT to_char(MAX(ran_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD"+"T"+"HH24:MI:SS') AS ts FROM workshop.sync_runs WHERE dataset_key IN ('dept_pessoal','dept_pessoal_afastados')",
      );
      const lastSync = lastSyncRow?.[0]?.ts || null;
      return { rows, lastSync };
    } catch (_) {
      // Fallback para view de total (sem INSS/Ap. Invalidez)
      const counts: any[] = await this.dataSource.query(
        "SELECT referencia_date, SUM(total) AS total FROM workshop.vw_dept_pessoal_resumo_mes WHERE referencia_date IN ($1,$2,$3,$4) AND situacao = 'F' GROUP BY referencia_date",
        [m0, m1, m2, m12],
      );
      const map = new Map<string, number>();
      for (const r of counts) {
        const key = new Date(r.referencia_date).toISOString().substring(0, 10);
        map.set(key, Number(r.total) || 0);
      }
    const order = [m2, m1, m0, m12].map((d) => d.toISOString().substring(0, 10));
      const rows = order.map((k) => ({ referencia_date: k, inss: null, apInvalidez: null, total: map.get(k) || 0 }));
      const lastSyncRow = await this.dataSource.query(
        "SELECT to_char(MAX(ran_at AT TIME ZONE 'UTC') AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM-DD"+"T"+"HH24:MI:SS') AS ts FROM workshop.sync_runs WHERE dataset_key = 'dept_pessoal'",
      );
      const lastSync = lastSyncRow?.[0]?.ts || null;
      return { rows, lastSync };
    }
  }

  private classifyAfastamento(descondi: string | null | undefined): 'INSS' | 'AP_INVALIDEZ' | 'OUTROS' {
    const s = (descondi || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
    if (s.includes('INVAL')) return 'AP_INVALIDEZ';
    if (s.includes('INSS') || s.includes('AUXILIO')) return 'INSS';
    return 'OUTROS';
  }

  private async computeAfastadosResumoFor(refDate: Date): Promise<{ inss: number; apInvalidez: number; total: number }> {
    const rows = await this.oracleService.executeReadOnlyQuery<any>(this.oracleAfastadosSql, { ref_date: refDate });
    let inss = 0, ap = 0, total = 0;
    for (const r of rows || []) {
      total++;
      const kind = this.classifyAfastamento((r as any).DESCCONDI);
      if (kind === 'AP_INVALIDEZ') ap++;
      else if (kind === 'INSS') inss++;
    }
    return { inss, apInvalidez: ap, total };
  }

  private async upsertAfastadosResumo(refDate: Date, values: { inss: number; apInvalidez: number; total: number }) {
    await this.dataSource.query(
      `INSERT INTO workshop.dept_pessoal_afastados_resumo (referencia_date, inss, ap_invalidez, total, last_synced_at)
       VALUES ($1::date, $2::int, $3::int, $4::int, now())
       ON CONFLICT (referencia_date)
       DO UPDATE SET inss = EXCLUDED.inss, ap_invalidez = EXCLUDED.ap_invalidez, total = EXCLUDED.total, last_synced_at = now()`,
      [refDate, values.inss, values.apInvalidez, values.total],
    );
    await this.dataSource.query(
      `INSERT INTO workshop.sync_runs (dataset_key, referencia_date, row_count, ok, message)
       VALUES ($1, $2::date, $3::int, $4::bool, $5)`,
      ['dept_pessoal_afastados', refDate, values.total, true, 'ok'],
    );
  }

  async ensureAfastadosResumo(force = false) {
    const refs = this.referenceDates();
    for (const ref of refs) {
      const exists = await this.dataSource.query('SELECT 1 FROM workshop.dept_pessoal_afastados_resumo WHERE referencia_date = $1 LIMIT 1', [ref]);
      if (exists.length === 0 || force) {
        const stats = await this.computeAfastadosResumoFor(ref);
        await this.upsertAfastadosResumo(ref, stats);
      }
    }
  }
}
