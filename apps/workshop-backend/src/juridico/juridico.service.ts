import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { OracleReadOnlyService } from '../oracle/services/oracle-readonly.service';
import { Multa } from './entities/multa.entity';
import { MultaCompleta } from './entities/multa-completa.entity';
import { SyncMultasDto } from './dto/sync-multas.dto';
import { startOfMonth, endOfMonth, subMonths, subYears, format, startOfToday, endOfToday } from 'date-fns';

@Injectable()
export class JuridicoService {
    private readonly logger = new Logger(JuridicoService.name);
    private static lastSyncDate: Date | null = null;

    constructor(
        @InjectRepository(Multa)
        private multasRepository: Repository<Multa>,
        @InjectRepository(MultaCompleta)
        private multasCompletasRepository: Repository<MultaCompleta>,
        private oracleService: OracleReadOnlyService,
    ) { }

    private isCacheValid(): boolean {
        if (!JuridicoService.lastSyncDate) return false;
        const today = new Date();
        return JuridicoService.lastSyncDate.toDateString() === today.toDateString();
    }

    private async getSemobSyncWindow(): Promise<{ startDate: Date; endDate: Date }> {
        try {
            const boundsStart = new Date('2024-01-01T00:00:00');
            const boundsEnd = new Date('2025-12-31T23:59:59');

            const result: any = await this.multasRepository.createQueryBuilder('m')
                .select('MAX(m.dataEmissao)', 'max')
                .where('m.pontuacaoInfracao = :p', { p: 0 })
                .getRawOne();

            const maxDate: Date | null = result?.max ? new Date(result.max) : null;
            const overlapMs = 24 * 60 * 60 * 1000; // 1 dia de overlap
            let startDate = maxDate ? new Date(maxDate.getTime() - overlapMs) : boundsStart;
            if (startDate < boundsStart) startDate = boundsStart;

            let endDate = new Date();
            if (endDate > boundsEnd) endDate = boundsEnd;

            this.logger.log(`Janela de sincronização SEMOB: ${startDate.toISOString()} -> ${endDate.toISOString()}`);
            return { startDate, endDate };
        } catch (e: any) {
            this.logger.warn(`Falha ao obter janela incremental. Usando limites padrão 2024-2025. Motivo: ${e?.message}`);
            return {
                startDate: new Date('2024-01-01T00:00:00'),
                endDate: new Date('2025-12-31T23:59:59')
            };
        }
    }

    async getOrSyncSemobFines(): Promise<Multa[]> {
        this.logger.log('Verificando a necessidade de sincronização de multas SEMOB...');

        if (!this.isCacheValid()) {
            this.logger.log('Cache inválido ou sincronização não realizada hoje. Iniciando nova sincronização.');
            await this.syncSemobFines();
            JuridicoService.lastSyncDate = new Date();
        } else {
            this.logger.log('Utilizando dados de multas SEMOB em cache de hoje.');
        }

        return this.findAllSemob();
    }

    async forceSyncSemobFinesAndFetch(): Promise<Multa[]> {
        this.logger.log('Forcando sincronizacao SEMOB via endpoint dedicado.');
        await this.syncSemobFines();
        JuridicoService.lastSyncDate = new Date();
        return this.findAllSemob();
    }

    async findAllSemob(): Promise<Multa[]> {
        this.logger.log('Buscando multas SEMOB do banco de dados PostgreSQL...');
        const startFilter = new Date('2024-01-01T00:00:00');
        const endFilter = new Date('2025-12-31T23:59:59');
        return this.multasRepository.find({
            where: {
                pontuacaoInfracao: 0,
                codigoAgente: MoreThan(0),
                dataEmissao: Between(startFilter, endFilter)
            },
            order: { dataEmissao: 'DESC' }
        });
    }

    async findSemobWithFilters(params: {
        prefixoVeiculo?: string;
        agenteCodigo?: string;
        cidade?: string; // não suportado; reservado para futuro
        localMulta?: string;
        descricaoInfra?: string;
        codigoInfracao?: string;
        codigoLinha?: string;
        setorPrincipalLinha?: string;
        ano?: string;
        mes?: string;
        classificacao?: string;
        dataInicio?: string;
        dataFim?: string;
        page?: number;
        limit?: number;
        orderBy?: string;
        orderDirection?: 'ASC' | 'DESC';
    }) {
        const {
            prefixoVeiculo,
            agenteCodigo,
            localMulta,
            descricaoInfra,
            codigoInfracao,
            codigoLinha,
            setorPrincipalLinha,
            ano,
            mes,
            classificacao,
            dataInicio,
            dataFim,
            page = 1,
            limit = 1000,
            orderBy,
            orderDirection = 'DESC',
        } = params || ({} as any);

        // Consulta baseada na tabela completa (multas_completas)
        const qb = this.multasCompletasRepository.createQueryBuilder('m');

        // Critério SUFISA (SEMOB): tem agente e não tem pontuação/grupo
        qb.where("COALESCE(m.agenteCodigo, '') <> ''")
          .andWhere('COALESCE(m.pontuacaoInfracao, 0) = 0');

        if (classificacao && classificacao.trim() !== '') {
            qb.andWhere('m.grupoInfracao ILIKE :class', { class: `%${classificacao}%` });
        } else {
            qb.andWhere("(m.grupoInfracao IS NULL OR m.grupoInfracao = '')");
        }

        // Datas: preferir dataHoraMulta; se não houver, usar dataEmissaoMulta
        if (false && dataInicio) {
            const di = new Date(dataInicio);
            if (!isNaN(di.valueOf())) {
                qb.andWhere('(m.dataHoraMulta IS NOT NULL AND m.dataHoraMulta >= :di) OR (m.dataHoraMulta IS NULL AND m.dataEmissaoMulta >= :di)', { di });
            }
        }
        if (false && dataFim) {
            const df = new Date(dataFim);
            if (!isNaN(df.valueOf())) {
                qb.andWhere('(m.dataHoraMulta IS NOT NULL AND m.dataHoraMulta <= :df) OR (m.dataHoraMulta IS NULL AND m.dataEmissaoMulta <= :df)', { df });
            }
        }

        // Novo filtro de data com COALESCE e ano/mês
        let di: Date | undefined;
        let df: Date | undefined;
        const anoNum = ano ? parseInt(ano, 10) : undefined;
        const mesNum = mes ? parseInt(mes, 10) : undefined;
        if (anoNum && !isNaN(anoNum)) {
            if (mesNum && !isNaN(mesNum) && mesNum >= 1 && mesNum <= 12) {
                const base = new Date(anoNum, mesNum - 1, 1);
                di = startOfMonth(base);
                df = endOfMonth(base);
            } else {
                const jan = new Date(anoNum, 0, 1);
                const dec = new Date(anoNum, 11, 1);
                di = startOfMonth(jan);
                df = endOfMonth(dec);
            }
        }
        if (dataInicio) {
            const d = new Date(dataInicio);
            if (!isNaN(d.valueOf())) di = d;
        }
        if (dataFim) {
            const d = new Date(dataFim);
            if (!isNaN(d.valueOf())) df = d;
        }
        if (di) {
            qb.andWhere('m.dataEmissaoMulta >= :di', { di });
        }
        if (df) {
            qb.andWhere('m.dataEmissaoMulta <= :df', { df });
        }

        if (prefixoVeiculo) {
            qb.andWhere('m.prefixoVeic ILIKE :pref', { pref: `%${prefixoVeiculo}%` });
        }
        if (agenteCodigo) {
            qb.andWhere('CAST(m.agenteCodigo AS TEXT) ILIKE :ag', { ag: `%${agenteCodigo}%` });
        }
        if (localMulta) {
            qb.andWhere('m.localMulta ILIKE :loc', { loc: `%${localMulta}%` });
        }
        if (descricaoInfra) {
            qb.andWhere('m.descricaoInfra ILIKE :desc', { desc: `%${descricaoInfra}%` });
        }
        if (codigoInfracao) {
            qb.andWhere('m.codigoInfracao ILIKE :ci', { ci: `%${codigoInfracao}%` });
        }
        if (codigoLinha) {
            qb.andWhere('m.codigoLinha ILIKE :lin', { lin: `%${codigoLinha}%` });
        }
        if (setorPrincipalLinha) {
            qb.andWhere('m.setorPrincipalLinha ILIKE :set', { set: `%${setorPrincipalLinha}%` });
        }

        // Ordenação segura
        const allowedOrder: Record<string, string> = {
            dataHoraMulta: 'm.dataHoraMulta',
            dataEmissaoMulta: 'm.dataEmissaoMulta',
            valorMulta: 'm.valorMulta',
            prefixoVeic: 'm.prefixoVeic',
        };
        const orderColumn = (orderBy && allowedOrder[orderBy]) ? allowedOrder[orderBy] : 'm.dataHoraMulta';
        const dir = ((orderDirection || 'DESC') as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        qb.orderBy(orderColumn, dir as 'ASC' | 'DESC');

        // Paginação
        const take = Math.min(Math.max(limit || 1000, 1), 5000);
        const skip = Math.max(((page || 1) - 1) * take, 0);
        qb.take(take).skip(skip);

        const [data, total] = await qb.getManyAndCount();
        return { success: true, data, total };
    }

    async syncSemobFines() {
        this.logger.log('🔄 Iniciando sincronização de multas SEMOB do Globus...');

        const { startDate, endDate } = await this.getSemobSyncWindow(); // Busca os últimos 2 meses para garantir a cobertura
        

        const query = `
            SELECT 
                M.CODIGOMULTA,
                M.DATAEMISSAOMULTA,
                M.DATALANCAMENTO,
                M.VALORMULTA,
                M.CODIGOVEIC,
                V.PREFIXOVEIC,
                M.PLACAVEIC,
                M.CODIGOINFRA,
                D.DESCRICAOINFRA,
                D.PONTUACAO AS PONTUACAO_INFRACAO, -- Adicionando a pontuação
                M.OBSERVACAO,
                A.COD_AGENTE_AUTUADOR AS AGENTE_CODIGO,
                A.DESC_AGENTE_AUTUADOR AS AGENTE_DESCRICAO,
                A.MATRICULAFISCAL AS AGENTE_MATRICULA_FISCAL
            FROM 
                DVS_MULTA M
            LEFT JOIN 
                FRT_CADVEICULOS V ON M.CODIGOVEIC = V.CODIGOVEIC AND V.CODIGOEMPRESA = 4
            INNER JOIN 
                DVS_INFRACAO D ON M.CODIGOINFRA = D.CODIGOINFRA
            LEFT JOIN 
                GLOBUS.DVS_AGENTE_AUTUADOR A ON M.COD_AGENTE_AUTUADOR = A.COD_AGENTE_AUTUADOR
            WHERE 
                D.PONTUACAO = 0
                AND M.DATAEMISSAOMULTA BETWEEN :startDate AND :endDate
                AND (A.DESC_AGENTE_AUTUADOR LIKE '%SEMOB%' OR M.CODIGOINFRA LIKE '7%') -- Filtro para SEMOB
            ORDER BY 
                M.DATAEMISSAOMULTA DESC
        `;

        try {
            const querySemob = `
            SELECT 
                D.DESCRICAOINFRA,
                V.PREFIXOVEIC,
                V.CODINTLINHA,
                L.CODIGOLINHA,
                L.NOMELINHA,
                M.*,
                A.COD_AGENTE_AUTUADOR AS AGENTE_CODIGO,
                A.DESC_AGENTE_AUTUADOR AS AGENTE_DESCRICAO,
                A.MATRICULAFISCAL AS AGENTE_MATRICULA_FISCAL
            FROM DVS_MULTA M,
                 DVS_INFRACAO D,
                 FRT_CADVEICULOS V,
                 BGM_CADLINHAS L,
                 GLOBUS.DVS_AGENTE_AUTUADOR A
            WHERE M.CODIGOVEIC = V.CODIGOVEIC (+)
              AND V.CODINTLINHA = L.CODINTLINHA (+)
              AND M.CODIGOINFRA = D.CODIGOINFRA
              AND M.COD_AGENTE_AUTUADOR = A.COD_AGENTE_AUTUADOR (+)
              AND V.CODIGOEMPRESA = 4
              AND M.DATAEMISSAOMULTA BETWEEN :startDate AND :endDate
            ORDER BY M.DATAEMISSAOMULTA DESC, V.PREFIXOVEIC`;

            let multasGlobus = await this.oracleService.executeReadOnlyQuery(querySemob, {
                startDate: startDate,
                endDate: endDate
            });
            // Fallback: remove referência a D.PONTUACAO caso o schema não possua essa coluna
            if (!Array.isArray(multasGlobus)) {
                multasGlobus = [] as any[];
            }

            this.logger.log(`📦 Encontradas ${multasGlobus.length} multas SEMOB (sem pontos) no Globus.`);
            if (multasGlobus.length === 0) {
                this.logger.log('Nenhuma nova multa para sincronizar.');
                return { success: true, message: 'Nenhuma nova multa encontrada.', stats: { found: 0, saved: 0, errors: 0 } };
            }

            let savedCount = 0;
            let errorCount = 0;

            for (const item of multasGlobus) {
                try {
                    const multa = new Multa();
                    let codigo: any =
                        (item as any).CODIGOMULTA ??
                        (item as any).NUMERO_AI_MULTA ??
                        (item as any).NUMEROAIMULTA ??
                        (item as any).NUM_AI ??
                        (item as any).AUTODEINFRACAO ??
                        (item as any).AIT;
                    if (!codigo) {
                        const veic = (item as any).CODIGOVEIC ?? (item as any).PREFIXOVEIC ?? 'VEIC';
                        const infra = (item as any).CODIGOINFRA ?? 'INFRA';
                        const rawDt = (item as any).DATAEMISSAOMULTA;
                        const dt = rawDt instanceof Date ? rawDt : new Date(rawDt);
                        const dtStr = isNaN(dt.getTime()) ? `${Date.now()}` : dt.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
                        codigo = `${veic}-${infra}-${dtStr}`;
                    }
                    multa.codigoMulta = String(codigo);
                    multa.dataEmissao = item.DATAEMISSAOMULTA;
                    multa.dataLancamento = item.DATALANCAMENTO;
                    multa.valorMulta = item.VALORMULTA;
                    multa.codigoVeiculo = item.CODIGOVEIC;
                    multa.prefixoVeiculo = item.PREFIXOVEIC;
                    multa.placaVeiculo = item.PLACAVEIC;
                    multa.codigoInfracao = item.CODIGOINFRA;
                    multa.descricaoInfracao = item.DESCRICAOINFRA;
                    // SEMOB: tratar pontuação como 0
                    multa.pontuacaoInfracao = 0;
                    // Local pode variar no schema Oracle; tenta variações conhecidas e permite null
                    multa.localInfracao = (item.LOCALINFRACAO ?? item.LOCALMULTA ?? (item as any).LOCAL_MULTA ?? null) as any;
                    multa.observacao = item.OBSERVACAO;
                    multa.codigoAgente = item.AGENTE_CODIGO;
                    multa.descricaoAgente = item.AGENTE_DESCRICAO;
                    multa.matriculaFiscalAgente = item.AGENTE_MATRICULA_FISCAL;
                    // Garantir 0 pontos quando coluna de pontuação não existir no Oracle
                    multa.pontuacaoInfracao = Number((multa as any).pontuacaoInfracao ?? 0) || 0;

                    // Usando 'save' que funciona como 'upsert' se a chave primária já existir
                    await this.multasRepository.save(multa);
                    savedCount++;
                } catch (error) {
                    this.logger.error(`Erro ao salvar multa ${item.CODIGOMULTA}: ${error.message}`);
                    errorCount++;
                }
            }

            this.logger.log(`✅ Sincronização SEMOB concluída. Salvos/Atualizados: ${savedCount}, Erros: ${errorCount}`);

            return {
                success: true,
                message: 'Sincronização SEMOB concluída com sucesso.',
                stats: {
                    found: multasGlobus.length,
                    saved: savedCount,
                    errors: errorCount
                }
            };

        } catch (error) {
            this.logger.error(`❌ Erro fatal na sincronização SEMOB: ${error.message}`, error.stack);
            throw new Error('Falha ao sincronizar multas do Globus.');
        }
    }
    
    // Manter o syncMultas original pode ser útil para outras finalidades
    async syncMultas(dto: SyncMultasDto) {
        this.logger.log('🔄 Iniciando sincronização de multas genéricas...');

        const startDate = dto.dataInicio ? new Date(dto.dataInicio) : subMonths(new Date(), 1);
        const endDate = dto.dataFim ? new Date(dto.dataFim) : new Date();

        const query = `
      SELECT 
        D.DESCRICAOINFRA,
        V.PREFIXOVEIC,
        M.CODIGOMULTA,
        M.DATAEMISSAOMULTA,
        M.DATALANCAMENTO,
        M.VALORMULTA,
        M.CODIGOVEIC,
        M.PLACAVEIC,
        M.CODIGOINFRA,
        M.LOCALMULTA,
        M.OBSERVACAO,
        A.COD_AGENTE_AUTUADOR AS "AGENTE_CODIGO",
        A.DESC_AGENTE_AUTUADOR AS "AGENTE_DESCRICAO",
        A.MATRICULAFISCAL AS "AGENTE_MATRICULA_FISCAL"
      FROM DVS_MULTA M,
           DVS_INFRACAO D,
           FRT_CADVEICULOS V,
           GLOBUS.DVS_AGENTE_AUTUADOR A
      WHERE M.CODIGOVEIC = V.CODIGOVEIC (+)
        AND M.CODIGOINFRA = D.CODIGOINFRA
        AND M.COD_AGENTE_AUTUADOR = A.COD_AGENTE_AUTUADOR (+)
        AND V.CODIGOEMPRESA = 4
        AND M.DATAEMISSAOMULTA BETWEEN :startDate AND :endDate
      ORDER BY M.DATAEMISSAOMULTA DESC, V.PREFIXOVEIC
    `;

        try {
            const multasGlobus = await this.oracleService.executeReadOnlyQuery(query, {
                startDate: startDate,
                endDate: endDate
            });

            this.logger.log(`📦 Encontradas ${multasGlobus.length} multas no Globus.`);
            let savedCount = 0;
            let errorCount = 0;
            for (const item of multasGlobus) {
                try {
                    const multa = new Multa();
                    multa.codigoMulta = item.CODIGOMULTA;
                    multa.dataEmissao = item.DATAEMISSAOMULTA;
                    multa.dataLancamento = item.DATALANCAMENTO;
                    multa.valorMulta = item.VALORMULTA;
                    multa.codigoVeiculo = item.CODIGOVEIC;
                    multa.prefixoVeiculo = item.PREFIXOVEIC;
                    multa.placaVeiculo = item.PLACAVEIC;
                    multa.codigoInfracao = item.CODIGOINFRA;
                    multa.descricaoInfracao = item.DESCRICAOINFRA;
                    multa.codigoAgente = item.AGENTE_CODIGO;
                    multa.descricaoAgente = item.AGENTE_DESCRICAO;
                    multa.matriculaFiscalAgente = item.AGENTE_MATRICULA_FISCAL;
                    multa.localInfracao = (item.LOCALINFRACAO ?? item.LOCALMULTA ?? (item as any).LOCAL_MULTA ?? null) as any;
                    multa.observacao = item.OBSERVACAO;
                    await this.multasRepository.save(multa);
                    savedCount++;
                } catch (error) {
                    this.logger.error(`Erro ao salvar multa ${item.CODIGOMULTA}: ${error.message}`);
                    errorCount++;
                }
            }
            this.logger.log(`✅ Sincronização concluída. Salvos: ${savedCount}, Erros: ${errorCount}`);
            return {
                success: true,
                message: 'Sincronização concluída',
                stats: { found: multasGlobus.length, saved: savedCount, errors: errorCount }
            };
        } catch (error) {
            this.logger.error(`❌ Erro fatal na sincronização: ${error.message}`);
            throw error;
        }
    }

    async getDashboardData() {
        const today = new Date();
        const currentMonthStart = startOfMonth(today);
        const currentMonthEnd = endOfMonth(today);
        const twoMonthsAgoStart = startOfMonth(subMonths(today, 2));
        const twoMonthsAgoEnd = endOfMonth(subMonths(today, 1));
        const lastYearStart = startOfMonth(subYears(today, 1));
        const lastYearEnd = endOfMonth(subYears(today, 1));

        const [currentMonthData, twoMonthsData, lastYearData] = await Promise.all([
            this.multasRepository.find({
                where: { dataEmissao: Between(currentMonthStart, currentMonthEnd) },
                order: { dataEmissao: 'DESC' }
            }),
            this.multasRepository.find({
                where: { dataEmissao: Between(twoMonthsAgoStart, twoMonthsAgoEnd) },
                order: { dataEmissao: 'DESC' }
            }),
            this.multasRepository.find({
                where: { dataEmissao: Between(lastYearStart, lastYearEnd) },
                order: { dataEmissao: 'DESC' }
            })
        ]);

        return {
            currentMonth: {
                period: `${format(currentMonthStart, 'MM/yyyy')}`,
                count: currentMonthData.length,
                totalValue: this.sumValues(currentMonthData),
                data: currentMonthData
            },
            lastTwoMonths: {
                period: `${format(twoMonthsAgoStart, 'MM/yyyy')} - ${format(twoMonthsAgoEnd, 'MM/yyyy')}`,
                count: twoMonthsData.length,
                totalValue: this.sumValues(twoMonthsData),
                data: twoMonthsData
            },
            lastYearSameMonth: {
                period: `${format(lastYearStart, 'MM/yyyy')}`,
                count: lastYearData.length,
                totalValue: this.sumValues(lastYearData),
                data: lastYearData
            }
        };
    }

    private sumValues(multas: Multa[]): number {
        return multas.reduce((acc, curr) => acc + (Number(curr.valorMulta) || 0), 0);
    }
}

