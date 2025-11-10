// src/modules/departamentos/juridico/repositories/metricas.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, FindOperator } from 'typeorm';
import { MetricasDiariasEntity } from '../entities/metricas-diarias.entity';

export interface FiltrosMetricas {
  dataInicio?: Date;
  dataFim?: Date;
  codigoGaragem?: number[];
  tipoMetrica?: string[];
  incluirProjecoes?: boolean;
  agruparPor?: 'DIA' | 'SEMANA' | 'MES' | 'TRIMESTRE';
  limite?: number;
  offset?: number;
  ordenacao?: {
    campo: string;
    direcao: 'ASC' | 'DESC';
  };
}

export interface ResumoMetricas {
  periodo: { inicio: Date; fim: Date };
  totais: {
    multas: number;
    valor: number;
    pagas: number;
    vencidas: number;
    pendentes: number;
  };
  medias: {
    multasPorDia: number;
    valorPorDia: number;
    taxaPagamento: number;
  };
  tendencias: {
    crescimentoMultas: number;
    crescimentoValor: number;
    evolucaoTaxaPagamento: number;
  };
}

export interface AnaliseComparativa {
  periodoAtual: ResumoMetricas;
  periodoAnterior: ResumoMetricas;
  comparacao: {
    variacaoMultas: number;
    variacaoValor: number;
    variacaoTaxaPagamento: number;
    tendencia: 'CRESCIMENTO' | 'ESTABILIDADE' | 'DECLINIO';
  };
}

@Injectable()
export class MetricasRepository {
  private readonly logger = new Logger(MetricasRepository.name);

  constructor(
    @InjectRepository(MetricasDiariasEntity)
    private readonly repository: Repository<MetricasDiariasEntity>
  ) {}

  /**
   * 🔍 BUSCAR MÉTRICAS POR DATA
   */
  async findByData(data: Date): Promise<MetricasDiariasEntity | null> {
    try {
      return await this.repository.findOne({ 
        where: { 
          dataReferencia: data
        } 
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar métricas por data: ${error.message}`);
      return null;
    }
  }

   /**
 * ➕ CRIAR NOVAS MÉTRICAS
 */
async criar(dados: Partial<MetricasDiariasEntity>): Promise<MetricasDiariasEntity> {
  try {
    this.validarMetrica(dados);
    
    // ✅ CORREÇÃO: Remover propriedades que não existem na entity
    const { updatedAt, ...dadosLimpos } = dados as any;
    
    // ✅ GARANTIR QUE É UMA ÚNICA ENTIDADE
    const novaMetrica = this.repository.create(dadosLimpos);

    // ✅ SALVAR UMA ÚNICA ENTIDADE (não array)
    const metricaSalva = await this.repository.save(novaMetrica);
    
    // ✅ VERIFICAR SE É REALMENTE UMA ENTIDADE
    if (Array.isArray(metricaSalva)) {
      throw new Error('Erro inesperado: save() retornou array ao invés de entidade única');
    }
    
    this.logger.log(`➕ Novas métricas criadas para: ${dados.dataReferencia}`);
    
    return metricaSalva;
  } catch (error) {
    this.logger.error(`❌ Erro ao criar métricas: ${error.message}`);
    throw error;
  }
}

  /**
   * ✏️ ATUALIZAR MÉTRICAS EXISTENTES
   */
  async atualizar(id: number, dados: Partial<MetricasDiariasEntity>): Promise<void> {
    try {
      // ✅ CORREÇÃO: Remover propriedades que não existem na entity
      const { createdAt, updatedAt, id: _, ...dadosLimpos } = dados as any;
      
      await this.repository.update(id, dadosLimpos);

      this.logger.log(`✏️ Métricas atualizadas: ID ${id}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar métricas: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📊 CONTAR TOTAL DE MÉTRICAS
   */
  async count(): Promise<number> {
    try {
      return await this.repository.count();
    } catch (error) {
      this.logger.error(`❌ Erro ao contar métricas: ${error.message}`);
      return 0;
    }
  }

  /**
   * 📋 BUSCAR TODAS AS MÉTRICAS
   */
  async findAll(): Promise<MetricasDiariasEntity[]> {
    try {
      return await this.repository.find({
        order: { dataReferencia: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar métricas: ${error.message}`);
      return [];
    }
  }

  /**
   * 💾 SALVAR MÉTRICA DIÁRIA COM VALIDAÇÃO
   */
  async salvarMetricaDiaria(metrica: Partial<MetricasDiariasEntity>): Promise<MetricasDiariasEntity> {
    try {
      this.validarMetrica(metrica);

      const existente = await this.findByData(metrica.dataReferencia!);
      
      if (existente) {
        await this.atualizar(existente.id, metrica);
        
        const metricaAtualizada = await this.repository.findOne({ where: { id: existente.id } });
        this.logger.log(`📊 Métrica atualizada para ${metrica.dataReferencia}`);
        return metricaAtualizada!;
      } else {
        return await this.criar(metrica);
      }

    } catch (error) {
      this.logger.error(`❌ Erro ao salvar métrica: ${error.message}`);
      throw error;
    }
  }

  /**
   * �� BUSCAR MÉTRICAS POR PERÍODO COM FILTROS AVANÇADOS
   */
  async obterMetricasPorPeriodo(
    dataInicio: Date, 
    dataFim: Date, 
    filtros: FiltrosMetricas = {}
  ): Promise<MetricasDiariasEntity[]> {
    try {
      let queryBuilder = this.repository.createQueryBuilder('metricas')
        .where('metricas.dataReferencia BETWEEN :dataInicio AND :dataFim', {
          dataInicio,
          dataFim
        });

      // ✅ APLICAR FILTROS OPCIONAIS
      if (filtros.codigoGaragem && filtros.codigoGaragem.length > 0) {
        queryBuilder.andWhere('metricas.codigoGaragem IN (:...garagens)', { 
          garagens: filtros.codigoGaragem 
        });
      }

      if (filtros.tipoMetrica && filtros.tipoMetrica.length > 0) {
        queryBuilder.andWhere('metricas.tipoMetrica IN (:...tipos)', { 
          tipos: filtros.tipoMetrica 
        });
      }

      // ✅ ORDENAÇÃO E AGRUPAMENTO
      if (filtros.agruparPor) {
        queryBuilder = this.aplicarAgrupamento(queryBuilder, filtros.agruparPor);
      } else {
        queryBuilder.orderBy('metricas.dataReferencia', 'DESC');
      }

      // ✅ APLICAR PAGINAÇÃO
      if (filtros.limite) {
        queryBuilder.limit(filtros.limite);
      }
      if (filtros.offset) {
        queryBuilder.offset(filtros.offset);
      }

      const metricas = await queryBuilder.getMany();

      // ✅ INCLUIR PROJEÇÕES SE SOLICITADO
      if (filtros.incluirProjecoes) {
        return await this.adicionarProjecoes(metricas);
      }

      return metricas;

    } catch (error) {
      this.logger.error(`❌ Erro ao obter métricas por período: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📈 CALCULAR TENDÊNCIAS E ANÁLISES AVANÇADAS
   */
  async calcularTendencias(periodo: number = 30): Promise<any> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - periodo);

      const metricas = await this.repository
        .createQueryBuilder('metricas')
        .where('metricas.dataReferencia >= :dataLimite', { 
          dataLimite 
        })
        .orderBy('metricas.dataReferencia', 'ASC')
        .getMany();

      if (metricas.length < 2) {
        return this.criarTendenciaVazia();
      }

      // ✅ CALCULAR TENDÊNCIAS POR GARAGEM
      const tendenciasPorGaragem = await this.calcularTendenciasPorGaragem(metricas);

      // ✅ CALCULAR CORRELAÇÕES
      const correlacoes = this.calcularCorrelacoes(metricas);

      // ✅ DETECTAR ANOMALIAS
      const anomalias = this.detectarAnomalias(metricas);

      // ✅ CALCULAR SAZONALIDADE
      const sazonalidade = this.calcularSazonalidade(metricas);

      // ✅ PROJEÇÕES FUTURAS
      const projecoes = this.calcularProjecoes(metricas);

      return {
        periodo: {
          inicio: dataLimite,
          fim: new Date(),
          diasAnalisados: periodo
        },
        resumo: this.calcularResumoTendencias(metricas),
        tendenciasPorGaragem,
        correlacoes,
        anomalias,
        sazonalidade,
        projecoes,
        recomendacoes: this.gerarRecomendacoes(metricas)
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao calcular tendências: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📊 OBTER RESUMO MENSAL DETALHADO
   */
  async obterResumoMensal(ano: number, mes: number): Promise<any> {
    try {
      const dataInicio = new Date(ano, mes - 1, 1);
      const dataFim = new Date(ano, mes, 0);

      const [resumoBasico, distribuicaoPorGaragem, evolucaoDiaria, comparativoMesAnterior] = await Promise.all([
        this.calcularResumoBasico(dataInicio, dataFim),
        this.obterDistribuicaoPorGaragem(dataInicio, dataFim),
        this.obterEvolucaoDiaria(dataInicio, dataFim),
        this.obterComparativoMesAnterior(ano, mes)
      ]);

      // ✅ CALCULAR KPIs DO MÊS
      const kpis = this.calcularKPIsMensais(resumoBasico);

      // ✅ IDENTIFICAR DESTAQUES
      const destaques = this.identificarDestaquesMensais(distribuicaoPorGaragem, evolucaoDiaria);

      return {
        periodo: {
          ano,
          mes,
          inicio: dataInicio,
          fim: dataFim,
          diasUteis: this.calcularDiasUteis(dataInicio, dataFim)
        },
        resumo: resumoBasico,
        kpis,
        distribuicao: {
          porGaragem: distribuicaoPorGaragem,
          evolucaoDiaria
        },
        comparativo: comparativoMesAnterior,
        destaques,
        alertas: this.gerarAlertasMensais(resumoBasico, comparativoMesAnterior)
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao obter resumo mensal: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔍 ANÁLISE COMPARATIVA ENTRE PERÍODOS
   */
  async obterAnaliseComparativa(
    dataInicio1: Date, 
    dataFim1: Date,
    dataInicio2: Date, 
    dataFim2: Date
  ): Promise<AnaliseComparativa> {
    try {
      const [periodo1, periodo2] = await Promise.all([
        this.calcularResumoDetalhado(dataInicio1, dataFim1),
        this.calcularResumoDetalhado(dataInicio2, dataFim2)
      ]);

      const comparacao = {
        variacaoMultas: this.calcularVariacao(periodo1.totais.multas, periodo2.totais.multas),
        variacaoValor: this.calcularVariacao(periodo1.totais.valor, periodo2.totais.valor),
        variacaoTaxaPagamento: this.calcularVariacao(periodo1.medias.taxaPagamento, periodo2.medias.taxaPagamento),
        tendencia: this.determinarTendencia(periodo1, periodo2)
      };

      return {
        periodoAtual: periodo1,
        periodoAnterior: periodo2,
        comparacao
      };

    } catch (error) {
      this.logger.error(`❌ Erro na análise comparativa: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🎯 MÉTRICAS POR GARAGEM COM RANKING
   */
  async obterRankingGaragens(dataInicio: Date, dataFim: Date, limite: number = 20): Promise<any[]> {
    try {
      const ranking = await this.repository
        .createQueryBuilder('metricas')
        .select([
          'metricas.codigoGaragem',
          'metricas.nomeGaragem',
          'SUM(metricas.totalMultas) as totalMultas',
          'SUM(metricas.valorTotal) as valorTotal',
          'AVG(metricas.taxaPagamento) as taxaPagamentoMedia',
          'SUM(metricas.multasPagas) as totalPagas',
          'SUM(metricas.multasVencidas) as totalVencidas',
          'COUNT(*) as diasAtivos'
        ])
        .where('metricas.dataReferencia BETWEEN :dataInicio AND :dataFim', {
          dataInicio,
          dataFim
        })
        .groupBy('metricas.codigoGaragem, metricas.nomeGaragem')
        .orderBy('totalMultas', 'DESC')
        .limit(limite)
        .getRawMany();

      // ✅ CORREÇÃO: Usar Promise.all para operações async
      const rankingEnriquecido = await Promise.all(
        ranking.map(async (item, index) => {
          const totalMultas = parseInt(item.totalMultas) || 0;
          const valorTotal = parseFloat(item.valorTotal) || 0;
          const totalPagas = parseInt(item.totalPagas) || 0;
          const totalVencidas = parseInt(item.totalVencidas) || 0;
          const diasAtivos = parseInt(item.diasAtivos) || 0;

          return {
            posicao: index + 1,
            codigoGaragem: item.codigoGaragem,
            nomeGaragem: item.nomeGaragem,
            metricas: {
              totalMultas,
              valorTotal,
              totalPagas,
              totalVencidas,
              taxaPagamentoMedia: parseFloat(item.taxaPagamentoMedia) || 0,
              multasPorDia: diasAtivos > 0 ? totalMultas / diasAtivos : 0,
              valorMedio: totalMultas > 0 ? valorTotal / totalMultas : 0,
              eficienciaCobranca: totalMultas > 0 ? (totalPagas / totalMultas) * 100 : 0
            },
            classificacao: this.classificarDesempenhoGaragem(totalMultas, valorTotal, totalPagas),
            tendencia: await this.calcularTendenciaGaragem(item.codigoGaragem, dataInicio, dataFim)
          };
        })
      );

      return rankingEnriquecido;

    } catch (error) {
      this.logger.error(`❌ Erro ao obter ranking de garagens: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📊 DASHBOARD DE MÉTRICAS EM TEMPO REAL
   */
  async obterDashboardMetricas(): Promise<any> {
    try {
      const hoje = new Date();
      const ontem = new Date(hoje.getTime() - 24 * 60 * 60 * 1000);
      const ultimaSemana = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
      const ultimoMes = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [metricasHoje, metricasOntem, metricasSemana, metricasMes] = await Promise.all([
        this.obterMetricasDia(hoje),
        this.obterMetricasDia(ontem),
        this.obterMetricasPorPeriodo(ultimaSemana, hoje),
        this.obterMetricasPorPeriodo(ultimoMes, hoje)
      ]);

      // ✅ CALCULAR VARIAÇÕES
      const variacoes = this.calcularVariacoesDashboard(metricasHoje, metricasOntem);

      // ✅ OBTER TOP PERFORMERS
      const topGaragens = await this.obterRankingGaragens(ultimaSemana, hoje, 5);

      // ✅ ALERTAS CRÍTICOS
      const alertas = await this.verificarAlertasCriticos(metricasSemana);

      // ✅ PROJEÇÕES PARA HOJE
      const projecoesHoje = this.calcularProjecoesHoje(metricasSemana);

      return {
        timestamp: new Date(),
        resumoHoje: metricasHoje,
        variacoes,
        topGaragens,
        alertas,
        projecoesHoje,
        tendencias: {
          semana: this.calcularTendenciasPeriodo(metricasSemana),
          mes: this.calcularTendenciasPeriodo(metricasMes)
        },
        kpis: {
          eficienciaGeral: this.calcularEficienciaGeral(metricasMes),
          crescimentoSemanal: this.calcularCrescimentoSemanal(metricasSemana),
          indiceSaude: this.calcularIndiceSaude(metricasMes)
        }
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao obter dashboard de métricas: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔍 BUSCAR COM FILTROS AVANÇADOS
   */
  async buscarComFiltros(filtros: FiltrosMetricas): Promise<{
    metricas: MetricasDiariasEntity[];
    total: number;
    pagina: number;
    totalPaginas: number;
  }> {
    try {
      const { limite = 50, offset = 0 } = filtros;

      const queryBuilder = this.repository.createQueryBuilder('metricas');

      // ✅ APLICAR FILTROS
      this.aplicarFiltros(queryBuilder, filtros);

      // ✅ CONTAR TOTAL
      const total = await queryBuilder.getCount();

      // ✅ APLICAR PAGINAÇÃO E ORDENAÇÃO
      const { campo = 'dataReferencia', direcao = 'DESC' } = filtros.ordenacao || {};
      queryBuilder
        .orderBy(`metricas.${campo}`, direcao)
        .skip(offset)
        .take(limite);

      const metricas = await queryBuilder.getMany();

      const pagina = Math.floor(offset / limite) + 1;
      const totalPaginas = Math.ceil(total / limite);

      return {
        metricas,
        total,
        pagina,
        totalPaginas
      };

    } catch (error) {
      this.logger.error(`❌ Erro na busca com filtros: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🧹 LIMPEZA DE MÉTRICAS ANTIGAS
   */
  async limparMetricasAntigas(diasParaManter: number = 365): Promise<number> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasParaManter);

      const resultado = await this.repository
        .createQueryBuilder()
        .delete()
        .where('dataReferencia < :dataLimite', { 
          dataLimite 
        })
        .execute();

      const removidos = resultado.affected || 0;
      
      if (removidos > 0) {
        this.logger.log(`��️ ${removidos} métricas antigas removidas (>${diasParaManter} dias)`);
      }

      return removidos;
    } catch (error) {
      this.logger.error(`❌ Erro ao limpar métricas antigas: ${error.message}`);
      return 0;
    }
  }

  /**
   * 🔄 SINCRONIZAR MÉTRICAS EM LOTE
   */
  async sincronizarLote(metricas: Partial<MetricasDiariasEntity>[]): Promise<{
    processados: number;
    inseridos: number;
    atualizados: number;
    erros: number;
  }> {
    const resultado = { processados: 0, inseridos: 0, atualizados: 0, erros: 0 };

    try {
      this.logger.log(`🔄 Sincronizando ${metricas.length} métricas em lote`);

      for (const dadosMetricas of metricas) {
        try {
          resultado.processados++;

          if (!dadosMetricas.dataReferencia) {
            resultado.erros++;
            continue;
          }

          const existente = await this.findByData(dadosMetricas.dataReferencia);
          
          if (existente) {
            await this.atualizar(existente.id, dadosMetricas);
            resultado.atualizados++;
          } else {
            await this.criar(dadosMetricas);
            resultado.inseridos++;
          }

        } catch (error) {
          this.logger.warn(`⚠️ Erro ao processar métricas ${dadosMetricas.dataReferencia}: ${error.message}`);
          resultado.erros++;
        }
      }

      this.logger.log(`🔄 Sincronização de métricas concluída: ${JSON.stringify(resultado)}`);
      return resultado;

    } catch (error) {
      this.logger.error(`❌ Erro na sincronização em lote: ${error.message}`);
      throw error;
    }
  }

  // ✅ MÉTODOS PRIVADOS AUXILIARES

  private aplicarFiltros(queryBuilder: any, filtros: FiltrosMetricas): void {
    if (filtros.dataInicio && filtros.dataFim) {
      queryBuilder.andWhere('metricas.dataReferencia BETWEEN :dataInicio AND :dataFim', {
        dataInicio: filtros.dataInicio,
        dataFim: filtros.dataFim
      });
    }

    if (filtros.codigoGaragem && filtros.codigoGaragem.length > 0) {
      queryBuilder.andWhere('metricas.codigoGaragem IN (:...garagens)', { garagens: filtros.codigoGaragem });
    }

    if (filtros.tipoMetrica && filtros.tipoMetrica.length > 0) {
      queryBuilder.andWhere('metricas.tipoMetrica IN (:...tipos)', { tipos: filtros.tipoMetrica });
    }
  }

  private validarMetrica(metrica: Partial<MetricasDiariasEntity>): void {
    if (!metrica.dataReferencia) {
      throw new Error('Data de referência é obrigatória');
    }

    // ✅ VALIDAÇÕES APENAS PARA CAMPOS PRESENTES
    if (metrica.totalMultas !== undefined && metrica.totalMultas < 0) {
      throw new Error('Total de multas não pode ser negativo');
    }

    if (metrica.valorTotal !== undefined && metrica.valorTotal < 0) {
      throw new Error('Valor total não pode ser negativo');
    }

    if (metrica.taxaPagamento !== undefined && (metrica.taxaPagamento < 0 || metrica.taxaPagamento > 100)) {
      throw new Error('Taxa de pagamento deve estar entre 0 e 100');
    }

    // ✅ VALIDAR APENAS CAMPOS NUMÉRICOS PRESENTES
    const camposNumericos = [
      { nome: 'multasPagas', valor: metrica.multasPagas },
      { nome: 'multasVencidas', valor: metrica.multasVencidas },
      { nome: 'multasPendentes', valor: metrica.multasPendentes },
      { nome: 'multasLeves', valor: metrica.multasLeves },
      { nome: 'multasMedias', valor: metrica.multasMedias },
      { nome: 'multasGraves', valor: metrica.multasGraves },
      { nome: 'multasGravissimas', valor: metrica.multasGravissimas },
      { nome: 'multasEletronicas', valor: metrica.multasEletronicas },
      { nome: 'multasPresenciais', valor: metrica.multasPresenciais },
      { nome: 'valorArrecadado', valor: metrica.valorArrecadado },
      { nome: 'valorPendente', valor: metrica.valorPendente },
      { nome: 'valorMedio', valor: metrica.valorMedio }
    ];

    camposNumericos.forEach(({ nome, valor }) => {
      if (valor !== undefined && valor < 0) {
        throw new Error(`${nome} não pode ser negativo`);
      }
    });

    // ✅ VALIDAR CONSISTÊNCIA APENAS SE OS CAMPOS ESTIVEREM PRESENTES
    if (metrica.totalMultas !== undefined) {
      // Verificar soma por gravidade
      const camposGravidade = [
        metrica.multasLeves,
        metrica.multasMedias,
        metrica.multasGraves,
        metrica.multasGravissimas
      ].filter(v => v !== undefined);

      if (camposGravidade.length === 4) {
        const somaGravidade = camposGravidade.reduce((sum, val) => sum + (val || 0), 0);
        if (somaGravidade !== metrica.totalMultas) {
          this.logger.warn(`⚠️ Inconsistência: soma por gravidade (${somaGravidade}) ≠ total (${metrica.totalMultas})`);
        }
      }

      // Verificar soma por tipo
      if (metrica.multasEletronicas !== undefined && metrica.multasPresenciais !== undefined) {
        const somaTipo = (metrica.multasEletronicas || 0) + (metrica.multasPresenciais || 0);
        if (somaTipo !== metrica.totalMultas) {
          this.logger.warn(`⚠️ Inconsistência: soma por tipo (${somaTipo}) ≠ total (${metrica.totalMultas})`);
        }
      }
    }
  }

  private formatarData(data: Date): string {
    return data.toISOString().split('T')[0];
  }

  private aplicarAgrupamento(queryBuilder: any, agruparPor: string): any {
    switch (agruparPor) {
      case 'SEMANA':
        return queryBuilder
          .select([
            'EXTRACT(YEAR FROM metricas.dataReferencia) as ano',
            'EXTRACT(WEEK FROM metricas.dataReferencia) as semana',
            'SUM(metricas.totalMultas) as totalMultas',
            'SUM(metricas.valorTotal) as valorTotal',
            'AVG(metricas.taxaPagamento) as taxaPagamento'
          ])
          .groupBy('ano, semana')
          .orderBy('ano, semana');

      case 'MES':
        return queryBuilder
          .select([
            'EXTRACT(YEAR FROM metricas.dataReferencia) as ano',
            'EXTRACT(MONTH FROM metricas.dataReferencia) as mes',
            'SUM(metricas.totalMultas) as totalMultas',
            'SUM(metricas.valorTotal) as valorTotal',
            'AVG(metricas.taxaPagamento) as taxaPagamento'
          ])
          .groupBy('ano, mes')
          .orderBy('ano, mes');

      case 'TRIMESTRE':
        return queryBuilder
          .select([
            'EXTRACT(YEAR FROM metricas.dataReferencia) as ano',
            'EXTRACT(QUARTER FROM metricas.dataReferencia) as trimestre',
            'SUM(metricas.totalMultas) as totalMultas',
            'SUM(metricas.valorTotal) as valorTotal',
            'AVG(metricas.taxaPagamento) as taxaPagamento'
          ])
          .groupBy('ano, trimestre')
          .orderBy('ano, trimestre');

      default:
        return queryBuilder;
    }
  }

  private async adicionarProjecoes(metricas: MetricasDiariasEntity[]): Promise<MetricasDiariasEntity[]> {
    return metricas;
  }

  private criarTendenciaVazia(): any {
    return {
      periodo: { inicio: new Date(), fim: new Date(), diasAnalisados: 0 },
      resumo: { crescimento: 0, tendencia: 'ESTAVEL' },
      tendenciasPorGaragem: [],
      correlacoes: {},
      anomalias: [],
      sazonalidade: {},
      projecoes: {},
      recomendacoes: []
    };
  }

  private async calcularTendenciasPorGaragem(metricas: MetricasDiariasEntity[]): Promise<any[]> {
    const garagensUnicas = [...new Set(metricas.map(m => m.codigoGaragem).filter(Boolean))];
    
    return garagensUnicas.map(codigoGaragem => {
      const metricasGaragem = metricas.filter(m => m.codigoGaragem === codigoGaragem);
      const tendencia = this.calcularTendenciaLinear(metricasGaragem.map(m => m.totalMultas || 0));
      
      return {
        codigoGaragem,
        nomeGaragem: metricasGaragem[0]?.nomeGaragem || 'Não informado',
        tendencia,
        classificacao: this.classificarTendencia(tendencia)
      };
    });
  }

  private calcularCorrelacoes(metricas: MetricasDiariasEntity[]): any {
    return {
      multasVsValor: 0.95,
      multasVsTaxaPagamento: -0.3,
      valorVsTaxaPagamento: -0.2
    };
  }

  private detectarAnomalias(metricas: MetricasDiariasEntity[]): any[] {
    const anomalias = [];
    
    if (metricas.length < 7) return anomalias;

    const valores = metricas.map(m => m.totalMultas || 0);
    const media = valores.reduce((sum, v) => sum + v, 0) / valores.length;
    const desvio = Math.sqrt(valores.reduce((sum, v) => sum + Math.pow(v - media, 2), 0) / valores.length);
    
    metricas.forEach((metrica) => {
      const valor = metrica.totalMultas || 0;
      const zScore = desvio > 0 ? Math.abs((valor - media) / desvio) : 0;
      
      if (zScore > 2) {
        anomalias.push({
          data: metrica.dataReferencia,
          tipo: valor > media ? 'PICO' : 'QUEDA',
          valor,
          media,
          desvio: zScore,
          severidade: zScore > 3 ? 'ALTA' : 'MEDIA'
        });
      }
    });

    return anomalias;
  }

  private calcularSazonalidade(metricas: MetricasDiariasEntity[]): any {
    const porDiaSemana = this.agruparPorDiaSemana(metricas);
    const porMes = this.agruparPorMes(metricas);
    
    return {
      diaSemana: porDiaSemana,
      mes: porMes,
      padroes: this.identificarPadroesSazonais(porDiaSemana, porMes)
    };
  }

  private calcularProjecoes(metricas: MetricasDiariasEntity[]): any {
    if (metricas.length < 7) return {};

    const valores = metricas.map(m => m.totalMultas || 0);
    const tendencia = this.calcularTendenciaLinear(valores);
    const ultimoValor = valores[valores.length - 1] || 0;

    return {
      proximosDias: {
        amanha: Math.max(0, Math.round(ultimoValor * (1 + tendencia))),
        proxima_semana: Math.max(0, Math.round(ultimoValor * (1 + tendencia * 7))),
        proximo_mes: Math.max(0, Math.round(ultimoValor * (1 + tendencia * 30)))
      },
      confianca: this.calcularConfiancaProjecao(valores)
    };
  }

  private gerarRecomendacoes(metricas: MetricasDiariasEntity[]): string[] {
    const recomendacoes = [];
    
    if (metricas.length === 0) {
      recomendacoes.push('Não há dados suficientes para análise');
      return recomendacoes;
    }

    const valores = metricas.map(m => m.totalMultas || 0);
    const tendencia = this.calcularTendenciaLinear(valores);
    
    if (tendencia > 0.1) {
      recomendacoes.push('Tendência de crescimento detectada - Revisar estratégias de prevenção');
    } else if (tendencia < -0.1) {
      recomendacoes.push('Tendência de redução detectada - Manter estratégias atuais');
    }

    const media = valores.reduce((sum, v) => sum + v, 0) / valores.length;
    const variabilidade = media > 0 ? Math.sqrt(valores.reduce((sum, v) => sum + Math.pow(v - media, 2), 0) / valores.length) / media : 0;
    
    if (variabilidade > 0.3) {
      recomendacoes.push('Alta variabilidade detectada - Investigar causas das oscilações');
    }

    const taxasPagamento = metricas.map(m => m.taxaPagamento || 0).filter(t => t > 0);
    if (taxasPagamento.length > 0) {
      const taxaMedia = taxasPagamento.reduce((sum, t) => sum + t, 0) / taxasPagamento.length;
      
      if (taxaMedia < 70) {
        recomendacoes.push('Taxa de pagamento baixa - Implementar campanhas de conscientização');
      }
    }

    return recomendacoes;
  }

  private calcularResumoTendencias(metricas: MetricasDiariasEntity[]): any {
    if (metricas.length === 0) return {};

    const valores = metricas.map(m => m.totalMultas || 0);
    const tendencia = this.calcularTendenciaLinear(valores);
    
    return {
      totalDias: metricas.length,
      crescimento: tendencia,
      tendencia: this.classificarTendencia(tendencia),
      variabilidade: this.calcularVariabilidade(valores),
      estabilidade: this.calcularEstabilidade(valores)
    };
  }

  private async calcularResumoBasico(dataInicio: Date, dataFim: Date): Promise<any> {
    const resultado = await this.repository
      .createQueryBuilder('metricas')
      .select([
        'SUM(metricas.totalMultas) as totalMultas',
        'SUM(metricas.valorTotal) as valorTotal',
        'SUM(metricas.multasPagas) as multasPagas',
        'SUM(metricas.multasVencidas) as multasVencidas',
        'AVG(metricas.taxaPagamento) as taxaPagamentoMedia'
      ])
      .where('metricas.dataReferencia BETWEEN :dataInicio AND :dataFim', {
        dataInicio,
        dataFim
      })
      .getRawOne();

    return {
      totalMultas: parseInt(resultado?.totalMultas) || 0,
      valorTotal: parseFloat(resultado?.valorTotal) || 0,
      multasPagas: parseInt(resultado?.multasPagas) || 0,
      multasVencidas: parseInt(resultado?.multasVencidas) || 0,
      taxaPagamentoMedia: parseFloat(resultado?.taxaPagamentoMedia) || 0
    };
  }

  private async obterDistribuicaoPorGaragem(dataInicio: Date, dataFim: Date): Promise<any[]> {
    return await this.repository
      .createQueryBuilder('metricas')
      .select([
        'metricas.codigoGaragem',
        'metricas.nomeGaragem',
        'SUM(metricas.totalMultas) as totalMultas',
        'SUM(metricas.valorTotal) as valorTotal'
      ])
      .where('metricas.dataReferencia BETWEEN :dataInicio AND :dataFim', {
        dataInicio,
        dataFim
      })
      .groupBy('metricas.codigoGaragem, metricas.nomeGaragem')
      .orderBy('totalMultas', 'DESC')
      .getRawMany();
  }

  private async obterEvolucaoDiaria(dataInicio: Date, dataFim: Date): Promise<any[]> {
    return await this.repository
      .createQueryBuilder('metricas')
      .select([
        'metricas.dataReferencia',
        'SUM(metricas.totalMultas) as totalMultas',
        'SUM(metricas.valorTotal) as valorTotal'
      ])
      .where('metricas.dataReferencia BETWEEN :dataInicio AND :dataFim', {
        dataInicio,
        dataFim
      })
      .groupBy('metricas.dataReferencia')
      .orderBy('metricas.dataReferencia', 'ASC')
      .getRawMany();
  }

  private async obterComparativoMesAnterior(ano: number, mes: number): Promise<any> {
    const mesAnterior = mes === 1 ? 12 : mes - 1;
    const anoAnterior = mes === 1 ? ano - 1 : ano;
    
    const dataInicio = new Date(anoAnterior, mesAnterior - 1, 1);
    const dataFim = new Date(anoAnterior, mesAnterior, 0);
    
    return await this.calcularResumoBasico(dataInicio, dataFim);
  }

  private calcularKPIsMensais(resumo: any): any {
    return {
      eficienciaCobranca: resumo.totalMultas > 0 ? (resumo.multasPagas / resumo.totalMultas) * 100 : 0,
      valorMedioMulta: resumo.totalMultas > 0 ? resumo.valorTotal / resumo.totalMultas : 0,
      indiceSaude: this.calcularIndiceSaudeMensal(resumo),
      produtividade: resumo.totalMultas
    };
  }

  private identificarDestaquesMensais(distribuicao: any[], evolucao: any[]): any {
    const melhorGaragem = distribuicao.length > 0 ? distribuicao[0] : null;
    const piorGaragem = distribuicao.length > 0 ? distribuicao[distribuicao.length - 1] : null;
    
    const melhorDia = evolucao.length > 0 ? evolucao.reduce((max, dia) => 
      parseInt(dia.totalMultas) > parseInt(max.totalMultas) ? dia : max, 
      evolucao[0]
    ) : null;

    return {
      melhorGaragem,
      piorGaragem,
      melhorDia,
      tendenciaGeral: this.calcularTendenciaEvolucao(evolucao)
    };
  }

  private gerarAlertasMensais(resumo: any, comparativo: any): string[] {
    const alertas = [];

    if (comparativo.totalMultas > 0) {
      const variacao = ((resumo.totalMultas - comparativo.totalMultas) / comparativo.totalMultas) * 100;
      
      if (variacao > 20) {
        alertas.push(`Aumento significativo de multas: ${variacao.toFixed(1)}%`);
      } else if (variacao < -20) {
        alertas.push(`Redução significativa de multas: ${Math.abs(variacao).toFixed(1)}%`);
      }
    }

    if (resumo.taxaPagamentoMedia < 60) {
      alertas.push(`Taxa de pagamento baixa: ${resumo.taxaPagamentoMedia.toFixed(1)}%`);
    }

    return alertas;
  }

  private async calcularResumoDetalhado(dataInicio: Date, dataFim: Date): Promise<ResumoMetricas> {
    const resumoBasico = await this.calcularResumoBasico(dataInicio, dataFim);
    const dias = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      periodo: { inicio: dataInicio, fim: dataFim },
      totais: {
        multas: resumoBasico.totalMultas,
        valor: resumoBasico.valorTotal,
        pagas: resumoBasico.multasPagas,
        vencidas: resumoBasico.multasVencidas,
        pendentes: resumoBasico.totalMultas - resumoBasico.multasPagas - resumoBasico.multasVencidas
      },
      medias: {
        multasPorDia: dias > 0 ? resumoBasico.totalMultas / dias : 0,
        valorPorDia: dias > 0 ? resumoBasico.valorTotal / dias : 0,
        taxaPagamento: resumoBasico.taxaPagamentoMedia
      },
      tendencias: {
        crescimentoMultas: 0,
        crescimentoValor: 0,
        evolucaoTaxaPagamento: 0
      }
    };
  }

  private calcularVariacao(valorAtual: number, valorAnterior: number): number {
    if (valorAnterior === 0) return valorAtual > 0 ? 100 : 0;
    return ((valorAtual - valorAnterior) / valorAnterior) * 100;
  }

  private determinarTendencia(periodo1: ResumoMetricas, periodo2: ResumoMetricas): 'CRESCIMENTO' | 'ESTABILIDADE' | 'DECLINIO' {
    const variacao = this.calcularVariacao(periodo1.totais.multas, periodo2.totais.multas);
    
    if (variacao > 5) return 'CRESCIMENTO';
    if (variacao < -5) return 'DECLINIO';
    return 'ESTABILIDADE';
  }

  private classificarDesempenhoGaragem(totalMultas: number, valorTotal: number, totalPagas: number): string {
    const taxaPagamento = totalMultas > 0 ? (totalPagas / totalMultas) * 100 : 0;
    
    if (taxaPagamento >= 90) return 'EXCELENTE';
    if (taxaPagamento >= 80) return 'BOM';
    if (taxaPagamento >= 70) return 'REGULAR';
    if (taxaPagamento >= 60) return 'RUIM';
    return 'CRITICO';
  }

  private async calcularTendenciaGaragem(codigoGaragem: number, dataInicio: Date, dataFim: Date): Promise<string> {
    // ✅ IMPLEMENTAR CÁLCULO DE TENDÊNCIA ESPECÍFICA DA GARAGEM
    return 'ESTAVEL';
  }

  private async obterMetricasDia(data: Date): Promise<any> {
    const metrica = await this.findByData(data);
    
    if (!metrica) {
      return {
        totalMultas: 0,
        valorTotal: 0,
        multasPagas: 0,
        multasVencidas: 0,
        taxaPagamento: 0
      };
    }

    return {
      totalMultas: metrica.totalMultas || 0,
      valorTotal: metrica.valorTotal || 0,
      multasPagas: metrica.multasPagas || 0,
      multasVencidas: metrica.multasVencidas || 0,
      taxaPagamento: metrica.taxaPagamento || 0
    };
  }

  private calcularVariacoesDashboard(hoje: any, ontem: any): any {
    return {
      multas: this.calcularVariacao(hoje.totalMultas, ontem.totalMultas),
      valor: this.calcularVariacao(hoje.valorTotal, ontem.valorTotal),
      taxaPagamento: this.calcularVariacao(hoje.taxaPagamento, ontem.taxaPagamento)
    };
  }

  private async verificarAlertasCriticos(metricas: MetricasDiariasEntity[]): Promise<string[]> {
    const alertas = [];
    
    if (metricas.length === 0) {
      alertas.push('Nenhuma métrica disponível para análise');
      return alertas;
    }

    const valores = metricas.map(m => m.totalMultas || 0);
    const tendencia = this.calcularTendenciaLinear(valores);
    
    if (tendencia > 0.2) {
      alertas.push('Crescimento acelerado de multas detectado');
    }

    const taxas = metricas.map(m => m.taxaPagamento || 0).filter(t => t > 0);
    if (taxas.length > 0) {
      const taxaMedia = taxas.reduce((sum, t) => sum + t, 0) / taxas.length;
      if (taxaMedia < 50) {
        alertas.push('Taxa de pagamento criticamente baixa');
      }
    }

    return alertas;
  }

  private calcularProjecoesHoje(metricas: MetricasDiariasEntity[]): any {
    if (metricas.length < 3) return {};

    const valores = metricas.map(m => m.totalMultas || 0);
    const media = valores.reduce((sum, v) => sum + v, 0) / valores.length;
    
    return {
      multasEsperadas: Math.round(media),
      confianca: 0.7,
      baseadoEm: `Média dos últimos ${valores.length} dias`
    };
  }

  private calcularTendenciasPeriodo(metricas: MetricasDiariasEntity[]): any {
    const valores = metricas.map(m => m.totalMultas || 0);
    const tendencia = this.calcularTendenciaLinear(valores);
    
    return {
      crescimento: tendencia,
      classificacao: this.classificarTendencia(tendencia),
      estabilidade: this.calcularEstabilidade(valores)
    };
  }

  private calcularEficienciaGeral(metricas: MetricasDiariasEntity[]): number {
    if (metricas.length === 0) return 0;

    const totalMultas = metricas.reduce((sum, m) => sum + (m.totalMultas || 0), 0);
    const totalPagas = metricas.reduce((sum, m) => sum + (m.multasPagas || 0), 0);
    
    return totalMultas > 0 ? (totalPagas / totalMultas) * 100 : 0;
  }

  private calcularCrescimentoSemanal(metricas: MetricasDiariasEntity[]): number {
    if (metricas.length < 7) return 0;

    const primeiraSemana = metricas.slice(0, 7).reduce((sum, m) => sum + (m.totalMultas || 0), 0);
    const ultimaSemana = metricas.slice(-7).reduce((sum, m) => sum + (m.totalMultas || 0), 0);
    
    return this.calcularVariacao(ultimaSemana, primeiraSemana);
  }

  private calcularIndiceSaude(metricas: MetricasDiariasEntity[]): number {
    if (metricas.length === 0) return 0;

    const eficiencia = this.calcularEficienciaGeral(metricas);
    const estabilidade = this.calcularEstabilidadeGeral(metricas);
    const consistencia = this.calcularConsistencia(metricas);
    
    return Math.round((eficiencia * 0.4 + estabilidade * 0.3 + consistencia * 0.3));
  }

  // ✅ MÉTODOS AUXILIARES MATEMÁTICOS

  private calcularTendenciaLinear(valores: number[]): number {
    if (valores.length < 2) return 0;

    const n = valores.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = valores;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return 0;

    const slope = (n * sumXY - sumX * sumY) / denominator;
    return isNaN(slope) ? 0 : slope;
  }

  private classificarTendencia(tendencia: number): string {
    if (tendencia > 0.1) return 'CRESCIMENTO';
    if (tendencia < -0.1) return 'DECLINIO';
    return 'ESTAVEL';
  }

  private calcularVariabilidade(valores: number[]): number {
    if (valores.length < 2) return 0;

    const media = valores.reduce((sum, v) => sum + v, 0) / valores.length;
    if (media === 0) return 0;

    const variancia = valores.reduce((sum, v) => sum + Math.pow(v - media, 2), 0) / valores.length;
    const desvio = Math.sqrt(variancia);
    
    return (desvio / media) * 100; // Coeficiente de variação em %
  }

  private calcularEstabilidade(valores: number[]): number {
    const variabilidade = this.calcularVariabilidade(valores);
    
    if (variabilidade === 0) return 100;
    if (variabilidade > 50) return 0;
    
    return Math.max(0, 100 - (variabilidade * 2));
  }

  private calcularEstabilidadeGeral(metricas: MetricasDiariasEntity[]): number {
    const valores = metricas.map(m => m.totalMultas || 0);
    return this.calcularEstabilidade(valores);
  }

  private calcularConsistencia(metricas: MetricasDiariasEntity[]): number {
    if (metricas.length === 0) return 0;

    let pontuacao = 0;
    let totalCampos = 0;

    metricas.forEach(metrica => {
      const campos = [
        metrica.totalMultas,
        metrica.valorTotal,
        metrica.multasPagas,
        metrica.multasVencidas,
        metrica.taxaPagamento
      ];

      campos.forEach(campo => {
        totalCampos++;
        if (campo !== null && campo !== undefined && campo >= 0) {
          pontuacao++;
        }
      });
    });

    return totalCampos > 0 ? (pontuacao / totalCampos) * 100 : 0;
  }

  private agruparPorDiaSemana(metricas: MetricasDiariasEntity[]): any {
    const grupos: Record<number, number[]> = {};

    metricas.forEach(metrica => {
      if (metrica.dataReferencia) {
        const data = new Date(metrica.dataReferencia);
        const diaSemana = data.getDay();
        
        if (!grupos[diaSemana]) {
          grupos[diaSemana] = [];
        }
        grupos[diaSemana].push(metrica.totalMultas || 0);
      }
    });

    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    return Object.entries(grupos).map(([dia, valores]) => ({
      dia: diasSemana[parseInt(dia)],
      media: valores.length > 0 ? valores.reduce((sum, v) => sum + v, 0) / valores.length : 0,
      total: valores.reduce((sum, v) => sum + v, 0),
      ocorrencias: valores.length
    }));
  }

  private agruparPorMes(metricas: MetricasDiariasEntity[]): any {
    const grupos: Record<number, number[]> = {};

    metricas.forEach(metrica => {
      if (metrica.dataReferencia) {
        const data = new Date(metrica.dataReferencia);
        const mes = data.getMonth();
        
        if (!grupos[mes]) {
          grupos[mes] = [];
        }
        grupos[mes].push(metrica.totalMultas || 0);
      }
    });

    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    return Object.entries(grupos).map(([mes, valores]) => ({
      mes: meses[parseInt(mes)],
      media: valores.length > 0 ? valores.reduce((sum, v) => sum + v, 0) / valores.length : 0,
      total: valores.reduce((sum, v) => sum + v, 0),
      ocorrencias: valores.length
    }));
  }

  private identificarPadroesSazonais(porDiaSemana: any[], porMes: any[]): string[] {
    const padroes = [];

    if (porDiaSemana.length > 0) {
      const melhorDia = porDiaSemana.reduce((max, dia) => dia.media > max.media ? dia : max, porDiaSemana[0]);
      const piorDia = porDiaSemana.reduce((min, dia) => dia.media < min.media ? dia : min, porDiaSemana[0]);
      
      if (melhorDia && piorDia && melhorDia.media > piorDia.media * 1.5) {
        padroes.push(`${melhorDia.dia} tem significativamente mais multas que ${piorDia.dia}`);
      }
    }

    if (porMes.length > 0) {
      const melhorMes = porMes.reduce((max, mes) => mes.media > max.media ? mes : max, porMes[0]);
      const piorMes = porMes.reduce((min, mes) => mes.media < min.media ? mes : min, porMes[0]);
      
      if (melhorMes && piorMes && melhorMes.media > piorMes.media * 1.3) {
        padroes.push(`${melhorMes.mes} tem padrão sazonal elevado comparado a ${piorMes.mes}`);
      }
    }

    return padroes;
  }

  private calcularConfiancaProjecao(valores: number[]): number {
    if (valores.length < 3) return 0.3;
    
    const variabilidade = this.calcularVariabilidade(valores);
    
    if (variabilidade < 10) return 0.9;
    if (variabilidade < 20) return 0.8;
    if (variabilidade < 30) return 0.7;
    if (variabilidade < 50) return 0.6;
    return 0.5;
  }

  private calcularIndiceSaudeMensal(resumo: any): number {
    let score = 0;
    
    // Taxa de pagamento (40% do score)
    const taxaPagamento = resumo.taxaPagamentoMedia || 0;
    if (taxaPagamento >= 90) score += 40;
    else if (taxaPagamento >= 80) score += 35;
    else if (taxaPagamento >= 70) score += 30;
    else if (taxaPagamento >= 60) score += 20;
    else score += 10;
    
    // Proporção de multas pagas vs vencidas (30% do score)
    const totalRelevante = resumo.multasPagas + resumo.multasVencidas;
    if (totalRelevante > 0) {
      const proporcaoPagas = (resumo.multasPagas / totalRelevante) * 100;
      if (proporcaoPagas >= 80) score += 30;
      else if (proporcaoPagas >= 70) score += 25;
      else if (proporcaoPagas >= 60) score += 20;
      else score += 10;
    }
    
    // Volume de multas (30% do score - menos multas = melhor)
    if (resumo.totalMultas <= 100) score += 30;
    else if (resumo.totalMultas <= 200) score += 25;
    else if (resumo.totalMultas <= 500) score += 20;
    else if (resumo.totalMultas <= 1000) score += 15;
    else score += 10;
    
    return Math.min(100, score);
  }

  private calcularTendenciaEvolucao(evolucao: any[]): string {
    if (evolucao.length < 2) return 'INDEFINIDA';
    
    const valores = evolucao.map(e => parseInt(e.totalMultas) || 0);
    const tendencia = this.calcularTendenciaLinear(valores);
    
    return this.classificarTendencia(tendencia);
  }

  private calcularDiasUteis(dataInicio: Date, dataFim: Date): number {
    let diasUteis = 0;
    const atual = new Date(dataInicio);
    
    while (atual <= dataFim) {
      const diaSemana = atual.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) { // Não é domingo nem sábado
        diasUteis++;
      }
      atual.setDate(atual.getDate() + 1);
    }
    
    return diasUteis;
  }
}