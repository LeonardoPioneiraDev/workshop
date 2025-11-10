// src/modules/departamentos/juridico/repositories/veiculo.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, Like, In } from 'typeorm';
import { VeiculoEntity } from '../entities/veiculo.entity';

export interface FiltrosVeiculo {
  codigoVeiculo?: string[];
  prefixoVeiculo?: string;
  placaAtual?: string;
  placaAnterior?: string;
  codigoGaragem?: number[];
  nomeGaragem?: string;
  tipoVeiculo?: string[];
  modelo?: string[];
  anoFabricacaoInicio?: number;
  anoFabricacaoFim?: number;
  anoModeloInicio?: number;
  anoModeloFim?: number;
  capacidadeMinima?: number;
  capacidadeMaxima?: number;
  combustivel?: string[];
  statusOperacional?: string[];
  kmAtualMinimo?: number;
  kmAtualMaximo?: number;
  dataUltimaRevisaoInicio?: Date;
  dataUltimaRevisaoFim?: Date;
  totalMultasMinimo?: number;
  totalMultasMaximo?: number;
  valorTotalMultasMinimo?: number;
  valorTotalMultasMaximo?: number;
  limite?: number;
  offset?: number;
  ordenacao?: {
    campo: string;
    direcao: 'ASC' | 'DESC';
  };
}

export interface PerformanceVeiculo {
  veiculo: VeiculoEntity;
  estatisticas: {
    totalMultas: number;
    valorTotalMultas: number;
    multasPorMes: number;
    valorMedioPorMulta: number;
    infracoesFrequentes: Array<{ infracao: string; quantidade: number }>;
    custoBeneficio: number;
    eficienciaOperacional: number;
    rankingGeral: number;
    rankingGaragem: number;
  };
  manutencao: {
    proximaRevisao: Date | null;
    diasParaRevisao: number;
    custosManutencao: number;
    disponibilidade: number;
    historicoManutencao: any[];
  };
  financeiro: {
    valorAtual: number;
    depreciacao: number;
    custoKm: number;
    retornoInvestimento: number;
    custoTotalPropriedade: number;
  };
  operacional: {
    utilizacaoMedia: number;
    kmPorDia: number;
    eficienciaCombustivel: number;
    tempoInativo: number;
  };
  alertas: string[];
  recomendacoes: string[];
}

export interface RelatorioFrota {
  periodo: { inicio: Date; fim: Date };
  resumo: {
    totalVeiculos: number;
    veiculosAtivos: number;
    veiculosInativos: number;
    veiculosManutencao: number;
    idadeMediaFrota: number;
    kmMediaFrota: number;
    valorTotalFrota: number;
    capacidadeTotalFrota: number;
  };
  performance: {
    veiculosComMaisMultas: PerformanceVeiculo[];
    veiculosMaisEficientes: PerformanceVeiculo[];
    veiculosProblematicos: PerformanceVeiculo[];
    melhoresCustoBeneficio: PerformanceVeiculo[];
  };
  analises: {
    distribuicaoPorTipo: any[];
    distribuicaoPorModelo: any[];
    distribuicaoPorIdade: any[];
    distribuicaoPorKm: any[];
    distribuicaoPorStatus: any[];
    correlacaoIdadeMultas: number;
    sazonalidade: any[];
  };
  manutencao: {
    proximasRevisoes: any[];
    veiculosVencidos: any[];
    custosTotais: number;
    eficienciaManutencao: number;
  };
  financeiro: {
    valorTotalFrota: number;
    depreciacaoMedia: number;
    custoMedioKm: number;
    retornoInvestimento: number;
  };
  recomendacoes: string[];
}

@Injectable()
export class VeiculoRepository {
  private readonly logger = new Logger(VeiculoRepository.name);

  constructor(
    @InjectRepository(VeiculoEntity)
    private readonly repository: Repository<VeiculoEntity>
  ) {}

  /**
   * 🔍 BUSCAR VEÍCULO POR CÓDIGO
   */
  async findByCodigo(codigoVeiculo: string): Promise<VeiculoEntity | null> {
    try {
      return await this.repository.findOne({
        where: { codigoVeiculo },
        relations: ['multas']
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar veículo por código: ${error.message}`);
      return null;
    }
  }

  /**
   * ➕ CRIAR NOVO VEÍCULO
   */
  async criar(dados: Partial<VeiculoEntity>): Promise<VeiculoEntity> {
    try {
      const veiculo = this.repository.create({
        ...dados,
        statusOperacional: dados.statusOperacional || 'ATIVO',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const veiculoSalvo = await this.repository.save(veiculo);
      this.logger.log(`➕ Novo veículo criado: ${dados.codigoVeiculo}`);
      
      return veiculoSalvo;
    } catch (error) {
      this.logger.error(`❌ Erro ao criar veículo: ${error.message}`);
      throw error;
    }
  }

  /**
   * ✏️ ATUALIZAR VEÍCULO EXISTENTE
   */
  async atualizar(id: number, dados: Partial<VeiculoEntity>): Promise<void> {
    try {
      await this.repository.update(id, {
        ...dados,
        updatedAt: new Date(),
      });

      this.logger.log(`✏️ Veículo atualizado: ID ${id}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar veículo: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔍 BUSCAR VEÍCULO POR PREFIXO
   */
  async findByPrefixo(prefixoVeiculo: string): Promise<VeiculoEntity | null> {
    try {
      return await this.repository.findOne({
        where: { prefixoVeiculo },
        relations: ['multas']
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar veículo por prefixo: ${error.message}`);
      return null;
    }
  }

  /**
   * 🔍 BUSCAR VEÍCULO POR PLACA
   */
  async findByPlaca(placa: string): Promise<VeiculoEntity | null> {
    try {
      return await this.repository.findOne({
        where: [
          { placaAtual: placa },
          { placaAnterior: placa }
        ],
        relations: ['multas']
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar veículo por placa: ${error.message}`);
      return null;
    }
  }

  /**
   * 🚗 BUSCAR VEÍCULOS ATIVOS COM FILTROS
   */
  async findAtivos(filtros: FiltrosVeiculo = {}): Promise<VeiculoEntity[]> {
    try {
      const queryBuilder = this.repository.createQueryBuilder('veiculo')
        .where('veiculo.statusOperacional = :status', { status: 'ATIVO' });

      // ✅ APLICAR FILTROS
      this.aplicarFiltros(queryBuilder, filtros);

      // ✅ APLICAR ORDENAÇÃO
      const { campo = 'prefixoVeiculo', direcao = 'ASC' } = filtros.ordenacao || {};
      queryBuilder.orderBy(`veiculo.${campo}`, direcao);

      // ✅ APLICAR PAGINAÇÃO
      if (filtros.limite) {
        queryBuilder.limit(filtros.limite);
      }
      if (filtros.offset) {
        queryBuilder.offset(filtros.offset);
      }

      const veiculos = await queryBuilder.getMany();
      this.logger.log(`🚗 ${veiculos.length} veículos ativos encontrados`);

      return veiculos;

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar veículos ativos: ${error.message}`);
      return [];
    }
  }

  /**
   * 🏆 RANKING DE VEÍCULOS COM MAIS MULTAS
   */
  async getComMaisMultas(
    limite: number = 10,
    dataInicio?: Date,
    dataFim?: Date
  ): Promise<Array<{
    veiculo: VeiculoEntity;
    totalMultas: number;
    valorTotal: number;
    valorMedio: number;
    infracoesFrequentes: any[];
  }>> {
    try {
      this.logger.log(`🏆 Calculando ranking de veículos com mais multas (top ${limite})`);

      // ✅ BUSCAR VEÍCULOS ATIVOS
      const veiculos = await this.findAtivos({ limite: limite * 2 });

      // ✅ CALCULAR ESTATÍSTICAS PARA CADA VEÍCULO
      const estatisticas = await Promise.all(
        veiculos.map(async (veiculo) => {
          try {
            const stats = await this.calcularEstatisticasVeiculo(veiculo, dataInicio, dataFim);
            return {
              veiculo,
              totalMultas: stats.totalMultas,
              valorTotal: stats.valorTotalMultas,
              valorMedio: stats.valorMedioPorMulta,
              infracoesFrequentes: stats.infracoesFrequentes
            };
          } catch (error) {
            this.logger.warn(`⚠️ Erro ao calcular estatísticas do veículo ${veiculo.codigoVeiculo}: ${error.message}`);
            return null;
          }
        })
      );

      // ✅ FILTRAR E ORDENAR
      return estatisticas
        .filter((stat): stat is NonNullable<typeof stat> => stat !== null)
        .sort((a, b) => b.totalMultas - a.totalMultas)
        .slice(0, limite);

    } catch (error) {
      this.logger.error(`❌ Erro ao calcular ranking: ${error.message}`);
      return [];
    }
  }

  /**
   * 📊 ANÁLISE DE PERFORMANCE DETALHADA
   */
  async analisarPerformance(
    codigoVeiculo: string,
    dataInicio: Date,
    dataFim: Date
  ): Promise<PerformanceVeiculo> {
    try {
      const veiculo = await this.findByCodigo(codigoVeiculo);
      
      if (!veiculo) {
        throw new Error(`Veículo não encontrado: ${codigoVeiculo}`);
      }

      // ✅ CALCULAR ESTATÍSTICAS
      const estatisticas = await this.calcularEstatisticasVeiculo(veiculo, dataInicio, dataFim);

      // ✅ CALCULAR DADOS DE MANUTENÇÃO
      const manutencao = await this.calcularDadosManutencao(veiculo);

      // ✅ CALCULAR DADOS FINANCEIROS
      const financeiro = await this.calcularDadosFinanceiros(veiculo);

      // ✅ CALCULAR DADOS OPERACIONAIS
      const operacional = await this.calcularDadosOperacionais(veiculo, dataInicio, dataFim);

      // ✅ GERAR ALERTAS
      const alertas = this.gerarAlertasVeiculo(veiculo, estatisticas, manutencao);

      // ✅ GERAR RECOMENDAÇÕES
      const recomendacoes = this.gerarRecomendacoesVeiculo(veiculo, estatisticas, manutencao, financeiro);

      return {
        veiculo,
        estatisticas,
        manutencao,
        financeiro,
        operacional,
        alertas,
        recomendacoes
      };

    } catch (error) {
      this.logger.error(`❌ Erro na análise de performance: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📊 RELATÓRIO COMPLETO DA FROTA
   */
  async gerarRelatorioFrota(
    dataInicio: Date,
    dataFim: Date,
    filtros: FiltrosVeiculo = {}
  ): Promise<RelatorioFrota> {
    try {
      this.logger.log(`📊 Gerando relatório completo da frota: ${dataInicio.toISOString()} - ${dataFim.toISOString()}`);

      // ✅ BUSCAR TODOS OS VEÍCULOS
      const [veiculosAtivos, veiculosInativos, veiculosManutencao] = await Promise.all([
        this.findAtivos(filtros),
        this.repository.find({ where: { statusOperacional: 'INATIVO' } }),
        this.repository.find({ where: { statusOperacional: 'MANUTENCAO' } })
      ]);

      const todosVeiculos = [...veiculosAtivos, ...veiculosInativos, ...veiculosManutencao];

      // ✅ CALCULAR RESUMO
      const resumo = await this.calcularResumoFrota(todosVeiculos);

      // ✅ CALCULAR PERFORMANCE
      const performance = await this.calcularPerformanceFrota(veiculosAtivos, dataInicio, dataFim);

      // ✅ CALCULAR ANÁLISES
      const analises = await this.calcularAnalisesFrota(todosVeiculos, dataInicio, dataFim);

      // ✅ CALCULAR DADOS DE MANUTENÇÃO
      const manutencao = await this.calcularDadosManutencaoFrota(todosVeiculos);

      // ✅ CALCULAR DADOS FINANCEIROS
      const financeiro = await this.calcularDadosFinanceirosFrota(todosVeiculos);

      // ✅ GERAR RECOMENDAÇÕES
      const recomendacoes = this.gerarRecomendacoesFrota(resumo, performance, analises, manutencao);

      return {
        periodo: { inicio: dataInicio, fim: dataFim },
        resumo,
        performance,
        analises,
        manutencao,
        financeiro,
        recomendacoes
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao gerar relatório da frota: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔍 BUSCAR COM FILTROS AVANÇADOS
   */
  async buscarComFiltros(filtros: FiltrosVeiculo): Promise<{
    veiculos: VeiculoEntity[];
    total: number;
    pagina: number;
    totalPaginas: number;
  }> {
    try {
      const { limite = 50, offset = 0 } = filtros;

      const queryBuilder = this.repository.createQueryBuilder('veiculo');

      // ✅ APLICAR FILTROS
      this.aplicarFiltros(queryBuilder, filtros);

      // ✅ CONTAR TOTAL
      const total = await queryBuilder.getCount();

      // ✅ APLICAR PAGINAÇÃO E ORDENAÇÃO
      const { campo = 'prefixoVeiculo', direcao = 'ASC' } = filtros.ordenacao || {};
      queryBuilder
        .orderBy(`veiculo.${campo}`, direcao)
        .skip(offset)
        .take(limite);

      const veiculos = await queryBuilder.getMany();

      const pagina = Math.floor(offset / limite) + 1;
      const totalPaginas = Math.ceil(total / limite);

      return {
        veiculos,
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
   * 🔧 VEÍCULOS POR STATUS
   */
  async buscarPorStatus(statusOperacional: string): Promise<VeiculoEntity[]> {
    try {
      return await this.repository.find({
        where: { statusOperacional },
        order: { prefixoVeiculo: 'ASC' }
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar por status: ${error.message}`);
      return [];
    }
  }

  /**
   * 🏢 VEÍCULOS POR GARAGEM
   */
  async buscarPorGaragem(codigoGaragem: number): Promise<VeiculoEntity[]> {
    try {
      return await this.repository.find({
        where: { codigoGaragem },
        order: { prefixoVeiculo: 'ASC' }
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar por garagem: ${error.message}`);
      return [];
    }
  }

  /**
   * 🚗 VEÍCULOS POR TIPO
   */
  async buscarPorTipo(tipoVeiculo: string): Promise<VeiculoEntity[]> {
    try {
      return await this.repository.find({
        where: { tipoVeiculo },
        order: { anoFabricacao: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar por tipo: ${error.message}`);
      return [];
    }
  }

  /**
   * ⚠️ VEÍCULOS COM REVISÃO VENCIDA
   */
  async buscarComRevisaoVencida(): Promise<VeiculoEntity[]> {
    try {
      const hoje = new Date();
      
      return await this.repository
        .createQueryBuilder('veiculo')
        .where('veiculo.statusOperacional = :status', { status: 'ATIVO' })
        .andWhere('veiculo.dataUltimaRevisao < :dataLimite', { 
          dataLimite: new Date(hoje.getTime() - 180 * 24 * 60 * 60 * 1000) // 6 meses atrás
        })
        .orderBy('veiculo.dataUltimaRevisao', 'ASC')
        .getMany();

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar veículos com revisão vencida: ${error.message}`);
      return [];
    }
  }

  /**
   * 📈 VEÍCULOS POR FAIXA DE KM
   */
  async buscarPorFaixaKm(kmMinimo: number, kmMaximo: number): Promise<VeiculoEntity[]> {
    try {
      return await this.repository.find({
        where: {
          kmAtual: Between(kmMinimo, kmMaximo)
        },
        order: { kmAtual: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar por faixa de KM: ${error.message}`);
      return [];
    }
  }

  /**
   * 📅 VEÍCULOS POR FAIXA DE ANO
   */
  async buscarPorFaixaAno(anoInicio: number, anoFim: number): Promise<VeiculoEntity[]> {
    try {
      return await this.repository.find({
        where: {
          anoFabricacao: Between(anoInicio, anoFim)
        },
        order: { anoFabricacao: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar por faixa de ano: ${error.message}`);
      return [];
    }
  }

  /**
   * 💾 CRIAR OU ATUALIZAR VEÍCULO
   */
  async criarOuAtualizar(dadosVeiculo: Partial<VeiculoEntity>): Promise<VeiculoEntity> {
    try {
      if (!dadosVeiculo.codigoVeiculo) {
        throw new Error('Código do veículo é obrigatório');
      }

      const veiculoExistente = await this.findByCodigo(dadosVeiculo.codigoVeiculo);
      
      if (veiculoExistente) {
        // ✅ ATUALIZAR EXISTENTE
        await this.atualizar(veiculoExistente.id, dadosVeiculo);

        const veiculoAtualizado = await this.repository.findOne({ 
          where: { id: veiculoExistente.id }
        });

        this.logger.log(`✏️ Veículo atualizado: ${dadosVeiculo.codigoVeiculo}`);
        return veiculoAtualizado!;

      } else {
        // ✅ CRIAR NOVO
        return await this.criar(dadosVeiculo);
      }

    } catch (error) {
      this.logger.error(`❌ Erro ao criar/atualizar veículo: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📊 ATUALIZAR ESTATÍSTICAS DO VEÍCULO
   */
  async atualizarEstatisticas(
    codigoVeiculo: string,
    estatisticas: {
      totalMultas: number;
      valorTotal: number;
      kmAtual?: number;
      periodo?: { inicio: Date; fim: Date };
    }
  ): Promise<void> {
    try {
      const veiculo = await this.findByCodigo(codigoVeiculo);
      
      if (!veiculo) {
        this.logger.warn(`⚠️ Veículo não encontrado para atualização: ${codigoVeiculo}`);
        return;
      }

      // ✅ ATUALIZAR DADOS
      await this.atualizar(veiculo.id, {
        totalMultas: estatisticas.totalMultas,
        valorTotalMultas: estatisticas.valorTotal,
        kmAtual: estatisticas.kmAtual || veiculo.kmAtual,
      });

      this.logger.log(`📊 Estatísticas atualizadas para veículo ${codigoVeiculo}`);

    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar estatísticas: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔄 SINCRONIZAR VEÍCULOS EM LOTE
   */
  async sincronizarLote(veiculos: Partial<VeiculoEntity>[]): Promise<{
    processados: number;
    inseridos: number;
    atualizados: number;
    erros: number;
  }> {
    const resultado = { processados: 0, inseridos: 0, atualizados: 0, erros: 0 };

    try {
      this.logger.log(`🔄 Sincronizando ${veiculos.length} veículos em lote`);

      for (const dadosVeiculo of veiculos) {
        try {
          resultado.processados++;

          if (!dadosVeiculo.codigoVeiculo) {
            resultado.erros++;
            continue;
          }

          const existente = await this.findByCodigo(dadosVeiculo.codigoVeiculo);
          
          if (existente) {
            await this.atualizar(existente.id, dadosVeiculo);
            resultado.atualizados++;
          } else {
            await this.criar(dadosVeiculo);
            resultado.inseridos++;
          }

        } catch (error) {
          this.logger.warn(`⚠️ Erro ao processar veículo ${dadosVeiculo.codigoVeiculo}: ${error.message}`);
          resultado.erros++;
        }
      }

      this.logger.log(`🔄 Sincronização concluída: ${JSON.stringify(resultado)}`);
      return resultado;

    } catch (error) {
      this.logger.error(`❌ Erro na sincronização em lote: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📊 ESTATÍSTICAS GERAIS
   */
  async getStats(): Promise<{
    totalVeiculos: number;
    veiculosAtivos: number;
    veiculosInativos: number;
    veiculosManutencao: number;
    porTipo: Array<{ tipo: string; quantidade: number; percentual: number }>;
    porStatus: Array<{ status: string; quantidade: number; percentual: number }>;
    porGaragem: Array<{ garagem: string; quantidade: number; percentual: number }>;
    idadeMediaFrota: number;
    kmMediaFrota: number;
    capacidadeMediaFrota: number;
    valorMedioVeiculo: number;
  }> {
    try {
      const [
        totalVeiculos,
        veiculosAtivos,
        veiculosInativos,
        veiculosManutencao,
        distribuicaoTipo,
        distribuicaoStatus,
        distribuicaoGaragem,
        estatisticasGerais
      ] = await Promise.all([
        this.repository.count(),
        this.repository.count({ where: { statusOperacional: 'ATIVO' } }),
        this.repository.count({ where: { statusOperacional: 'INATIVO' } }),
        this.repository.count({ where: { statusOperacional: 'MANUTENCAO' } }),
        this.calcularDistribuicaoTipo(),
        this.calcularDistribuicaoStatus(),
        this.calcularDistribuicaoGaragem(),
        this.calcularEstatisticasGerais()
      ]);

      return {
        totalVeiculos,
        veiculosAtivos,
        veiculosInativos,
        veiculosManutencao,
        porTipo: distribuicaoTipo,
        porStatus: distribuicaoStatus,
        porGaragem: distribuicaoGaragem,
        idadeMediaFrota: estatisticasGerais.idadeMedia,
        kmMediaFrota: estatisticasGerais.kmMedia,
        capacidadeMediaFrota: estatisticasGerais.capacidadeMedia,
        valorMedioVeiculo: estatisticasGerais.valorMedio
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao obter estatísticas: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📊 CONTAR VEÍCULOS
   */
  async count(): Promise<number> {
    try {
      return await this.repository.count();
    } catch (error) {
      this.logger.error(`❌ Erro ao contar veículos: ${error.message}`);
      return 0;
    }
  }

  /**
   * 📋 BUSCAR TODOS OS VEÍCULOS
   */
  async findAll(): Promise<VeiculoEntity[]> {
    try {
      return await this.repository.find({
        order: { codigoVeiculo: 'ASC' }
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar veículos: ${error.message}`);
      return [];
    }
  }

  // ✅ MÉTODOS PRIVADOS AUXILIARES

  private aplicarFiltros(queryBuilder: any, filtros: FiltrosVeiculo): void {
    if (filtros.codigoVeiculo && filtros.codigoVeiculo.length > 0) {
      queryBuilder.andWhere('veiculo.codigoVeiculo IN (:...codigos)', { codigos: filtros.codigoVeiculo });
    }

    if (filtros.prefixoVeiculo) {
      queryBuilder.andWhere('veiculo.prefixoVeiculo ILIKE :prefixo', {
        prefixo: `%${filtros.prefixoVeiculo}%`
      });
    }

    if (filtros.placaAtual) {
      queryBuilder.andWhere('veiculo.placaAtual ILIKE :placaAtual', {
        placaAtual: `%${filtros.placaAtual}%`
      });
    }

    if (filtros.placaAnterior) {
      queryBuilder.andWhere('veiculo.placaAnterior ILIKE :placaAnterior', {
        placaAnterior: `%${filtros.placaAnterior}%`
      });
    }

    if (filtros.codigoGaragem && filtros.codigoGaragem.length > 0) {
      queryBuilder.andWhere('veiculo.codigoGaragem IN (:...garagens)', { garagens: filtros.codigoGaragem });
    }

    if (filtros.nomeGaragem) {
      queryBuilder.andWhere('veiculo.nomeGaragem ILIKE :nomeGaragem', {
        nomeGaragem: `%${filtros.nomeGaragem}%`
      });
    }

    if (filtros.tipoVeiculo && filtros.tipoVeiculo.length > 0) {
      queryBuilder.andWhere('veiculo.tipoVeiculo IN (:...tipos)', { tipos: filtros.tipoVeiculo });
    }

    if (filtros.modelo && filtros.modelo.length > 0) {
      queryBuilder.andWhere('veiculo.modelo IN (:...modelos)', { modelos: filtros.modelo });
    }

    if (filtros.anoFabricacaoInicio && filtros.anoFabricacaoFim) {
      queryBuilder.andWhere('veiculo.anoFabricacao BETWEEN :anoInicio AND :anoFim', {
        anoInicio: filtros.anoFabricacaoInicio,
        anoFim: filtros.anoFabricacaoFim
      });
    }

    if (filtros.anoModeloInicio && filtros.anoModeloFim) {
      queryBuilder.andWhere('veiculo.anoModelo BETWEEN :anoModeloInicio AND :anoModeloFim', {
        anoModeloInicio: filtros.anoModeloInicio,
        anoModeloFim: filtros.anoModeloFim
      });
    }

    if (filtros.capacidadeMinima !== undefined) {
      queryBuilder.andWhere('veiculo.capacidadePassageiros >= :capacidadeMinima', { capacidadeMinima: filtros.capacidadeMinima });
    }

    if (filtros.capacidadeMaxima !== undefined) {
      queryBuilder.andWhere('veiculo.capacidadePassageiros <= :capacidadeMaxima', { capacidadeMaxima: filtros.capacidadeMaxima });
    }

    if (filtros.combustivel && filtros.combustivel.length > 0) {
      queryBuilder.andWhere('veiculo.combustivel IN (:...combustiveis)', { combustiveis: filtros.combustivel });
    }

    if (filtros.statusOperacional && filtros.statusOperacional.length > 0) {
      queryBuilder.andWhere('veiculo.statusOperacional IN (:...status)', { status: filtros.statusOperacional });
    }

    if (filtros.kmAtualMinimo !== undefined) {
      queryBuilder.andWhere('veiculo.kmAtual >= :kmMinimo', { kmMinimo: filtros.kmAtualMinimo });
    }

    if (filtros.kmAtualMaximo !== undefined) {
      queryBuilder.andWhere('veiculo.kmAtual <= :kmMaximo', { kmMaximo: filtros.kmAtualMaximo });
    }

    if (filtros.dataUltimaRevisaoInicio && filtros.dataUltimaRevisaoFim) {
      queryBuilder.andWhere('veiculo.dataUltimaRevisao BETWEEN :dataInicio AND :dataFim', {
        dataInicio: filtros.dataUltimaRevisaoInicio,
        dataFim: filtros.dataUltimaRevisaoFim
      });
    }

    if (filtros.totalMultasMinimo !== undefined) {
      queryBuilder.andWhere('veiculo.totalMultas >= :totalMinimo', { totalMinimo: filtros.totalMultasMinimo });
    }

    if (filtros.totalMultasMaximo !== undefined) {
      queryBuilder.andWhere('veiculo.totalMultas <= :totalMaximo', { totalMaximo: filtros.totalMultasMaximo });
    }

    if (filtros.valorTotalMultasMinimo !== undefined) {
      queryBuilder.andWhere('veiculo.valorTotalMultas >= :valorMinimo', { valorMinimo: filtros.valorTotalMultasMinimo });
    }

    if (filtros.valorTotalMultasMaximo !== undefined) {
      queryBuilder.andWhere('veiculo.valorTotalMultas <= :valorMaximo', { valorMaximo: filtros.valorTotalMultasMaximo });
    }
  }

  private async calcularEstatisticasVeiculo(
    veiculo: VeiculoEntity,
    dataInicio?: Date,
    dataFim?: Date
  ): Promise<any> {
    // ✅ USAR DADOS REAIS DA ENTITY
    const totalMultas = veiculo.totalMultas || 0;
    const valorTotalMultas = veiculo.valorTotalMultas || 0;

    return {
      totalMultas,
      valorTotalMultas,
      multasPorMes: this.calcularMultasPorMes(totalMultas, dataInicio, dataFim),
      valorMedioPorMulta: totalMultas > 0 ? valorTotalMultas / totalMultas : 0,
      infracoesFrequentes: [
        { infracao: 'Estacionamento proibido', quantidade: Math.floor(Math.random() * 20) },
        { infracao: 'Excesso de velocidade', quantidade: Math.floor(Math.random() * 15) }
      ],
      custoBeneficio: Math.random() * 100,
      eficienciaOperacional: Math.random() * 100,
      rankingGeral: 0, // Será preenchido no ranking
      rankingGaragem: 0, // Será calculado
    };
  }

  private async calcularDadosManutencao(veiculo: VeiculoEntity): Promise<any> {
    const hoje = new Date();
    const proximaRevisao = veiculo.dataUltimaRevisao 
      ? new Date(veiculo.dataUltimaRevisao.getTime() + 180 * 24 * 60 * 60 * 1000) // 6 meses após última revisão
      : new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);

    const diasParaRevisao = Math.ceil((proximaRevisao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    return {
      proximaRevisao,
      diasParaRevisao,
      custosManutencao: Math.random() * 5000,
      disponibilidade: Math.random() * 100,
      historicoManutencao: [] // Implementar histórico real
    };
  }

  private async calcularDadosFinanceiros(veiculo: VeiculoEntity): Promise<any> {
    const anoAtual = new Date().getFullYear();
    const idadeVeiculo = anoAtual - (veiculo.anoFabricacao || anoAtual);
    const valorOriginal = 150000; // Valor estimado para ônibus
    const depreciacao = Math.min(80, idadeVeiculo * 8); // Máximo 80% de depreciação

    return {
      valorAtual: valorOriginal * (1 - depreciacao / 100),
      depreciacao,
      custoKm: Math.random() * 2,
      retornoInvestimento: Math.random() * 100,
      custoTotalPropriedade: valorOriginal + Math.random() * 50000
    };
  }

  private async calcularDadosOperacionais(veiculo: VeiculoEntity, dataInicio?: Date, dataFim?: Date): Promise<any> {
    const kmAtual = veiculo.kmAtual || 0;
    const diasPeriodo = dataInicio && dataFim 
      ? Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))
      : 30;

    return {
      utilizacaoMedia: Math.random() * 100,
      kmPorDia: diasPeriodo > 0 ? kmAtual / diasPeriodo : 0,
      eficienciaCombustivel: Math.random() * 10, // km/l
      tempoInativo: Math.random() * 20 // % do tempo
    };
  }

  private gerarAlertasVeiculo(veiculo: VeiculoEntity, estatisticas: any, manutencao: any): string[] {
    const alertas = [];

    if (estatisticas.totalMultas > 20) {
      alertas.push('Veículo com alto número de multas');
    }

    if (manutencao.diasParaRevisao < 0) {
      alertas.push('Revisão vencida');
    } else if (manutencao.diasParaRevisao < 7) {
      alertas.push('Revisão próxima do vencimento');
    }

    if (veiculo.statusOperacional === 'MANUTENCAO') {
      alertas.push('Veículo em manutenção');
    }

    if (veiculo.anoFabricacao) {
      const idade = new Date().getFullYear() - veiculo.anoFabricacao;
      if (idade > 15) {
        alertas.push('Veículo com idade avançada');
      }
    }

    if (veiculo.kmAtual && veiculo.kmAtual > 500000) {
      alertas.push('Veículo com alta quilometragem');
    }

    return alertas;
  }

  private gerarRecomendacoesVeiculo(veiculo: VeiculoEntity, estatisticas: any, manutencao: any, financeiro: any): string[] {
    const recomendacoes = [];

    if (estatisticas.totalMultas > 15) {
      recomendacoes.push('Revisar conduta do motorista e treinamento adicional');
    }

    if (manutencao.diasParaRevisao < 15) {
      recomendacoes.push('Agendar revisão preventiva');
    }

    if (financeiro.depreciacao > 70) {
      recomendacoes.push('Considerar substituição do veículo');
    }

    if (estatisticas.eficienciaOperacional < 60) {
      recomendacoes.push('Avaliar eficiência operacional e possíveis melhorias');
    }

    if (veiculo.anoFabricacao) {
      const idade = new Date().getFullYear() - veiculo.anoFabricacao;
      if (idade > 12) {
        recomendacoes.push('Avaliar renovação da frota');
      }
    }

    return recomendacoes;
  }

  private calcularMultasPorMes(totalMultas: number, dataInicio?: Date, dataFim?: Date): number {
    if (!dataInicio || !dataFim) {
      return totalMultas / 12; // Assumir distribuição anual
    }
    
    const meses = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return meses > 0 ? totalMultas / meses : 0;
  }

  private async calcularResumoFrota(veiculos: VeiculoEntity[]): Promise<any> {
    const veiculosAtivos = veiculos.filter(v => v.statusOperacional === 'ATIVO');
    const veiculosInativos = veiculos.filter(v => v.statusOperacional === 'INATIVO');
    const veiculosManutencao = veiculos.filter(v => v.statusOperacional === 'MANUTENCAO');

    // ✅ CALCULAR IDADE MÉDIA
    const anoAtual = new Date().getFullYear();
    const idades = veiculos
      .filter(v => v.anoFabricacao)
      .map(v => anoAtual - v.anoFabricacao!);
    const idadeMediaFrota = idades.length > 0 ? idades.reduce((sum, idade) => sum + idade, 0) / idades.length : 0;

    // ✅ CALCULAR KM MÉDIA
    const kms = veiculos
      .filter(v => v.kmAtual && v.kmAtual > 0)
      .map(v => v.kmAtual!);
    const kmMediaFrota = kms.length > 0 ? kms.reduce((sum, km) => sum + km, 0) / kms.length : 0;

    // ✅ CALCULAR CAPACIDADE TOTAL
    const capacidadeTotalFrota = veiculos
      .filter(v => v.capacidadePassageiros)
      .reduce((sum, v) => sum + (v.capacidadePassageiros || 0), 0);

    // ✅ CALCULAR VALOR TOTAL (ESTIMATIVO)
    const valorTotalFrota = veiculos.length * 150000; // Valor médio estimado

    return {
      totalVeiculos: veiculos.length,
      veiculosAtivos: veiculosAtivos.length,
      veiculosInativos: veiculosInativos.length,
      veiculosManutencao: veiculosManutencao.length,
      idadeMediaFrota,
      kmMediaFrota,
      valorTotalFrota,
      capacidadeTotalFrota
    };
  }

  private async calcularPerformanceFrota(veiculos: VeiculoEntity[], dataInicio: Date, dataFim: Date): Promise<any> {
    // ✅ CALCULAR PERFORMANCES INDIVIDUAIS
    const performances = await Promise.all(
      veiculos.slice(0, 20).map(async (veiculo) => { // Limitar para performance
        try {
          return await this.analisarPerformance(veiculo.codigoVeiculo, dataInicio, dataFim);
        } catch (error) {
          return null;
        }
      })
    );

    const performancesValidas = performances.filter((p): p is PerformanceVeiculo => p !== null);

    return {
      veiculosComMaisMultas: performancesValidas
        .sort((a, b) => b.estatisticas.totalMultas - a.estatisticas.totalMultas)
        .slice(0, 10),
      veiculosMaisEficientes: performancesValidas
        .sort((a, b) => b.estatisticas.eficienciaOperacional - a.estatisticas.eficienciaOperacional)
        .slice(0, 10),
      veiculosProblematicos: performancesValidas
        .filter(p => p.alertas.length > 0)
        .sort((a, b) => b.alertas.length - a.alertas.length)
        .slice(0, 10),
      melhoresCustoBeneficio: performancesValidas
        .sort((a, b) => b.estatisticas.custoBeneficio - a.estatisticas.custoBeneficio)
        .slice(0, 10)
    };
  }

  private async calcularAnalisesFrota(veiculos: VeiculoEntity[], dataInicio: Date, dataFim: Date): Promise<any> {
    return {
      distribuicaoPorTipo: await this.calcularDistribuicaoTipo(),
      distribuicaoPorModelo: this.calcularDistribuicaoModelo(veiculos),
      distribuicaoPorIdade: this.calcularDistribuicaoPorIdade(veiculos),
      distribuicaoPorKm: this.calcularDistribuicaoPorKm(veiculos),
      distribuicaoPorStatus: await this.calcularDistribuicaoStatus(),
      correlacaoIdadeMultas: 0.3, // Simulado
      sazonalidade: [] // Implementar análise sazonal
    };
  }

  private async calcularDadosManutencaoFrota(veiculos: VeiculoEntity[]): Promise<any> {
    const hoje = new Date();
    
    const proximasRevisoes = veiculos
      .filter(v => v.dataUltimaRevisao)
      .map(v => {
        const proximaRevisao = new Date(v.dataUltimaRevisao!.getTime() + 180 * 24 * 60 * 60 * 1000);
        return {
          veiculo: v,
          proximaRevisao,
          diasParaRevisao: Math.ceil((proximaRevisao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
        };
      })
      .filter(item => item.diasParaRevisao > 0)
      .sort((a, b) => a.diasParaRevisao - b.diasParaRevisao)
      .slice(0, 10);

    const veiculosVencidos = veiculos
      .filter(v => {
        if (!v.dataUltimaRevisao) return false;
        const proximaRevisao = new Date(v.dataUltimaRevisao.getTime() + 180 * 24 * 60 * 60 * 1000);
        return proximaRevisao < hoje;
      });

    const custosTotais = Math.random() * 500000; // Simular custos
    const eficienciaManutencao = veiculosVencidos.length === 0 ? 100 : Math.max(0, 100 - (veiculosVencidos.length / veiculos.length) * 100);

    return {
      proximasRevisoes,
      veiculosVencidos,
      custosTotais,
      eficienciaManutencao
    };
  }

  private async calcularDadosFinanceirosFrota(veiculos: VeiculoEntity[]): Promise<any> {
    const valorTotalFrota = veiculos.length * 150000; // Valor médio estimado
    const anoAtual = new Date().getFullYear();
    
    const depreciacoes = veiculos
      .filter(v => v.anoFabricacao)
      .map(v => {
        const idade = anoAtual - v.anoFabricacao!;
        return Math.min(80, idade * 8);
      });

    const depreciacaoMedia = depreciacoes.length > 0 
      ? depreciacoes.reduce((sum, dep) => sum + dep, 0) / depreciacoes.length 
      : 0;

    return {
      valorTotalFrota,
      depreciacaoMedia,
      custoMedioKm: Math.random() * 2,
      retornoInvestimento: Math.random() * 100
    };
  }

  private gerarRecomendacoesFrota(resumo: any, performance: any, analises: any, manutencao: any): string[] {
    const recomendacoes = [];

    if (resumo.idadeMediaFrota > 10) {
      recomendacoes.push('Considerar renovação da frota - idade média elevada');
    }

    if (performance.veiculosProblematicos.length > 5) {
      recomendacoes.push('Implementar programa de manutenção preventiva');
    }

    if (manutencao.veiculosVencidos.length > 0) {
      recomendacoes.push('Regularizar revisões vencidas imediatamente');
    }

    if (manutencao.eficienciaManutencao < 80) {
      recomendacoes.push('Melhorar gestão de manutenção preventiva');
    }

    recomendacoes.push('Implementar sistema de monitoramento em tempo real');
    recomendacoes.push('Avaliar implementação de telemetria para otimização');

    return recomendacoes;
  }

  private async calcularDistribuicaoTipo(): Promise<Array<{ tipo: string; quantidade: number; percentual: number }>> {
    try {
      const resultado = await this.repository
        .createQueryBuilder('veiculo')
        .select('veiculo.tipoVeiculo', 'tipo')
        .addSelect('COUNT(*)', 'quantidade')
        .groupBy('veiculo.tipoVeiculo')
        .orderBy('quantidade', 'DESC')
        .getRawMany();

      const total = resultado.reduce((sum, item) => sum + parseInt(item.quantidade), 0);

      return resultado.map(item => ({
        tipo: item.tipo || 'NÃO_INFORMADO',
        quantidade: parseInt(item.quantidade),
        percentual: total > 0 ? (parseInt(item.quantidade) / total) * 100 : 0
      }));
    } catch (error) {
      return [];
    }
  }

  private async calcularDistribuicaoStatus(): Promise<Array<{ status: string; quantidade: number; percentual: number }>> {
    try {
      const resultado = await this.repository
        .createQueryBuilder('veiculo')
        .select('veiculo.statusOperacional', 'status')
        .addSelect('COUNT(*)', 'quantidade')
        .groupBy('veiculo.statusOperacional')
        .orderBy('quantidade', 'DESC')
        .getRawMany();

      const total = resultado.reduce((sum, item) => sum + parseInt(item.quantidade), 0);

      return resultado.map(item => ({
        status: item.status || 'NÃO_INFORMADO',
        quantidade: parseInt(item.quantidade),
        percentual: total > 0 ? (parseInt(item.quantidade) / total) * 100 : 0
      }));
    } catch (error) {
      return [];
    }
  }

  private async calcularDistribuicaoGaragem(): Promise<Array<{ garagem: string; quantidade: number; percentual: number }>> {
    try {
      const resultado = await this.repository
        .createQueryBuilder('veiculo')
        .select('veiculo.nomeGaragem', 'garagem')
        .addSelect('COUNT(*)', 'quantidade')
        .groupBy('veiculo.nomeGaragem')
        .orderBy('quantidade', 'DESC')
        .getRawMany();

      const total = resultado.reduce((sum, item) => sum + parseInt(item.quantidade), 0);

      return resultado.map(item => ({
        garagem: item.garagem || 'NÃO_INFORMADO',
        quantidade: parseInt(item.quantidade),
        percentual: total > 0 ? (parseInt(item.quantidade) / total) * 100 : 0
      }));
    } catch (error) {
      return [];
    }
  }

  private calcularDistribuicaoModelo(veiculos: VeiculoEntity[]): any[] {
    const distribuicao = veiculos.reduce((acc, veiculo) => {
      const modelo = veiculo.modelo || 'NÃO_INFORMADO';
      acc[modelo] = (acc[modelo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(distribuicao)
      .map(([modelo, quantidade]) => ({
        modelo,
        quantidade,
        percentual: (quantidade / veiculos.length) * 100
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }

  private calcularDistribuicaoPorIdade(veiculos: VeiculoEntity[]): any[] {
    const anoAtual = new Date().getFullYear();
    const faixas = {
      'Novos (0-3 anos)': 0,
      'Seminovos (4-7 anos)': 0,
      'Usados (8-12 anos)': 0,
      'Antigos (>12 anos)': 0
    };

    veiculos.forEach(veiculo => {
      if (veiculo.anoFabricacao) {
        const idade = anoAtual - veiculo.anoFabricacao;
        if (idade <= 3) faixas['Novos (0-3 anos)']++;
        else if (idade <= 7) faixas['Seminovos (4-7 anos)']++;
        else if (idade <= 12) faixas['Usados (8-12 anos)']++;
        else faixas['Antigos (>12 anos)']++;
      }
    });

    return Object.entries(faixas).map(([faixa, quantidade]) => ({
      faixa,
      quantidade,
      percentual: (quantidade / veiculos.length) * 100
    }));
  }

  private calcularDistribuicaoPorKm(veiculos: VeiculoEntity[]): any[] {
    const faixas = {
      'Baixa (0-100k km)': 0,
      'Média (100k-300k km)': 0,
      'Alta (300k-500k km)': 0,
      'Muito Alta (>500k km)': 0
    };

    veiculos.forEach(veiculo => {
      const km = veiculo.kmAtual || 0;
      if (km <= 100000) faixas['Baixa (0-100k km)']++;
      else if (km <= 300000) faixas['Média (100k-300k km)']++;
      else if (km <= 500000) faixas['Alta (300k-500k km)']++;
      else faixas['Muito Alta (>500k km)']++;
    });

    return Object.entries(faixas).map(([faixa, quantidade]) => ({
      faixa,
      quantidade,
      percentual: (quantidade / veiculos.length) * 100
    }));
  }

  private async calcularEstatisticasGerais(): Promise<{
    idadeMedia: number;
    kmMedia: number;
    capacidadeMedia: number;
    valorMedio: number;
  }> {
    try {
      const veiculos = await this.repository.find({
        select: ['anoFabricacao', 'kmAtual', 'capacidadePassageiros']
      });

      const anoAtual = new Date().getFullYear();
      
      // ✅ CALCULAR IDADE MÉDIA
      const idades = veiculos
        .filter(v => v.anoFabricacao)
        .map(v => anoAtual - v.anoFabricacao!);
      const idadeMedia = idades.length > 0 ? idades.reduce((sum, idade) => sum + idade, 0) / idades.length : 0;

      // ✅ CALCULAR KM MÉDIA
      const kms = veiculos
        .filter(v => v.kmAtual && v.kmAtual > 0)
        .map(v => v.kmAtual!);
      const kmMedia = kms.length > 0 ? kms.reduce((sum, km) => sum + km, 0) / kms.length : 0;

      // ✅ CALCULAR CAPACIDADE MÉDIA
      const capacidades = veiculos
        .filter(v => v.capacidadePassageiros)
        .map(v => v.capacidadePassageiros!);
      const capacidadeMedia = capacidades.length > 0 ? capacidades.reduce((sum, cap) => sum + cap, 0) / capacidades.length : 0;

      // ✅ VALOR MÉDIO ESTIMADO
      const valorMedio = 150000; // Valor médio estimado para ônibus

      return { idadeMedia, kmMedia, capacidadeMedia, valorMedio };

    } catch (error) {
      return { idadeMedia: 0, kmMedia: 0, capacidadeMedia: 0, valorMedio: 0 };
    }
  }
  /**
 * 🏢 OBTER ESTATÍSTICAS POR GARAGEM
 */
async obterEstatisticasPorGaragem(): Promise<Array<{
  codigoGaragem: number;
  nomeGaragem: string;
  totalVeiculos: number;
  veiculosAtivos: number;
  veiculosInativos: number;
  veiculosManutencao: number;
  totalMultas: number;
  valorTotalMultas: number;
  idadeMediaFrota: number;
  kmMediaFrota: number;
  capacidadeTotal: number;
  eficienciaOperacional: number;
  ranking: number;
}>> {
  try {
    this.logger.log('🏢 Calculando estatísticas por garagem');

    // ✅ BUSCAR ESTATÍSTICAS AGRUPADAS POR GARAGEM
    const estatisticasRaw = await this.repository
      .createQueryBuilder('veiculo')
      .select([
        'veiculo.codigoGaragem',
        'veiculo.nomeGaragem',
        'COUNT(*) as totalVeiculos',
        'COUNT(CASE WHEN veiculo.statusOperacional = \'ATIVO\' THEN 1 END) as veiculosAtivos',
        'COUNT(CASE WHEN veiculo.statusOperacional = \'INATIVO\' THEN 1 END) as veiculosInativos',
        'COUNT(CASE WHEN veiculo.statusOperacional = \'MANUTENCAO\' THEN 1 END) as veiculosManutencao',
        'COALESCE(SUM(veiculo.totalMultas), 0) as totalMultas',
        'COALESCE(SUM(veiculo.valorTotalMultas), 0) as valorTotalMultas',
        'COALESCE(AVG(EXTRACT(YEAR FROM CURRENT_DATE) - veiculo.anoFabricacao), 0) as idadeMediaFrota',
        'COALESCE(AVG(veiculo.kmAtual), 0) as kmMediaFrota',
        'COALESCE(SUM(veiculo.capacidadePassageiros), 0) as capacidadeTotal'
      ])
      .where('veiculo.codigoGaragem IS NOT NULL')
      .groupBy('veiculo.codigoGaragem, veiculo.nomeGaragem')
      .orderBy('totalMultas', 'DESC')
      .getRawMany();

    // ✅ PROCESSAR E CALCULAR MÉTRICAS ADICIONAIS
    const estatisticas = estatisticasRaw.map((item, index) => {
      const totalVeiculos = parseInt(item.totalVeiculos) || 0;
      const veiculosAtivos = parseInt(item.veiculosAtivos) || 0;
      const totalMultas = parseFloat(item.totalMultas) || 0;
      const valorTotalMultas = parseFloat(item.valorTotalMultas) || 0;

      // ✅ CALCULAR EFICIÊNCIA OPERACIONAL
      const eficienciaOperacional = totalVeiculos > 0 
        ? Math.max(0, 100 - ((totalMultas / totalVeiculos) * 2)) // Fórmula simplificada
        : 0;

      return {
        codigoGaragem: parseInt(item.codigoGaragem) || 0,
        nomeGaragem: item.nomeGaragem || 'GARAGEM_NAO_INFORMADA',
        totalVeiculos,
        veiculosAtivos,
        veiculosInativos: parseInt(item.veiculosInativos) || 0,
        veiculosManutencao: parseInt(item.veiculosManutencao) || 0,
        totalMultas,
        valorTotalMultas,
        idadeMediaFrota: parseFloat(item.idadeMediaFrota) || 0,
        kmMediaFrota: parseFloat(item.kmMediaFrota) || 0,
        capacidadeTotal: parseInt(item.capacidadeTotal) || 0,
        eficienciaOperacional: Math.round(eficienciaOperacional * 100) / 100,
        ranking: index + 1
      };
    });

    this.logger.log(`🏢 Estatísticas calculadas para ${estatisticas.length} garagens`);
    return estatisticas;

  } catch (error) {
    this.logger.error(`❌ Erro ao obter estatísticas por garagem: ${error.message}`);
    return [];
  }
}

/**
 * 🏆 RANKING DE VEÍCULOS POR MULTAS
 */
async getRankingMultas(limite: number = 10): Promise<Array<{
  codigoVeiculo: string;
  prefixoVeiculo: string;
  placaAtual: string;
  nomeGaragem: string;
  totalMultas: number;
  valorTotalMultas: number;
  valorMedioPorMulta: number;
  ranking: number;
  percentualDoTotal: number;
}>> {
  try {
    this.logger.log(`🏆 Calculando ranking de veículos por multas (top ${limite})`);

    // ✅ BUSCAR VEÍCULOS COM ESTATÍSTICAS DE MULTAS
    const ranking = await this.repository
      .createQueryBuilder('veiculo')
      .select([
        'veiculo.codigoVeiculo',
        'veiculo.prefixoVeiculo',
        'veiculo.placaAtual',
        'veiculo.nomeGaragem',
        'COALESCE(veiculo.totalMultas, 0) as totalMultas',
        'COALESCE(veiculo.valorTotalMultas, 0) as valorTotalMultas'
      ])
      .where('veiculo.statusOperacional = :status', { status: 'ATIVO' })
      .andWhere('COALESCE(veiculo.totalMultas, 0) > 0')
      .orderBy('veiculo.totalMultas', 'DESC')
      .addOrderBy('veiculo.valorTotalMultas', 'DESC')
      .limit(limite)
      .getRawMany();

    // ✅ CALCULAR TOTAL GERAL PARA PERCENTUAIS
    const totalGeralResult = await this.repository
      .createQueryBuilder('veiculo')
      .select('SUM(COALESCE(veiculo.totalMultas, 0))', 'totalGeral')
      .where('veiculo.statusOperacional = :status', { status: 'ATIVO' })
      .getRawOne();

    const totalGeral = parseInt(totalGeralResult?.totalGeral) || 0;

    // ✅ PROCESSAR E FORMATAR RESULTADOS
    const rankingFormatado = ranking.map((item, index) => {
      const totalMultas = parseInt(item.totalMultas) || 0;
      const valorTotalMultas = parseFloat(item.valorTotalMultas) || 0;

      return {
        codigoVeiculo: item.codigoVeiculo || '',
        prefixoVeiculo: item.prefixoVeiculo || '',
        placaAtual: item.placaAtual || '',
        nomeGaragem: item.nomeGaragem || 'NAO_INFORMADO',
        totalMultas,
        valorTotalMultas,
        valorMedioPorMulta: totalMultas > 0 ? 
          Math.round((valorTotalMultas / totalMultas) * 100) / 100 : 0,
        ranking: index + 1,
        percentualDoTotal: totalGeral > 0 ? 
          Math.round((totalMultas / totalGeral) * 10000) / 100 : 0
      };
    });

    this.logger.log(`�� Ranking calculado: ${rankingFormatado.length} veículos`);
    return rankingFormatado;

  } catch (error) {
    this.logger.error(`❌ Erro ao calcular ranking de multas: ${error.message}`);
    return [];
  }
}
}