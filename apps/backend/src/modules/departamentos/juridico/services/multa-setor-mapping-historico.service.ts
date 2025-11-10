// src/modules/departamentos/juridico/services/multa-setor-mapping-historico.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VeiculoHistoricoSetorService } from './veiculo-historico-setor.service';
import { MultaCompletaService } from './multa-completa.service';

export interface MultaComSetorHistorico {
  numeroAiMulta: string;
  prefixoVeic: string;
  dataEmissaoMulta: Date;
  valorMulta: number;
  localMulta: string;
  descricaoInfra: string;
  agenteCodigo?: string;
  agenteDescricao?: string;
  pontuacaoInfracao?: number;
  gravidadeInfracao?: string;
  // ✅ SETOR NA DATA DA INFRAÇÃO (HISTÓRICO)
  setorNaDataInfracao: {
    codigoGaragem: number;
    nomeGaragem: string;
    dataInicio: Date;
    dataFim: Date | null;
    periodoAtivo: boolean;
  } | null;
  // ✅ SETOR ATUAL (PARA COMPARAÇÃO)
  setorAtual: {
    codigoGaragem: number;
    nomeGaragem: string;
  } | null;
  setorMudou: boolean;
  setorEncontrado: boolean;
}

@Injectable()
export class MultaSetorMappingHistoricoService {
  private readonly logger = new Logger(MultaSetorMappingHistoricoService.name);

  constructor(
    private readonly historicoSetorService: VeiculoHistoricoSetorService,
    private readonly multaCompletaService: MultaCompletaService
  ) {}

  // ✅ BUSCAR MULTAS COM SETOR HISTÓRICO CORRETO
  async buscarMultasComSetorHistorico(filters: any = {}): Promise<{
    data: MultaComSetorHistorico[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    resumo: {
      totalMultas: number;
      multasComSetor: number;
      multasSemSetor: number;
      multasComMudancaSetor: number;
      percentualMapeamento: number;
      percentualMudancas: number;
    };
    estatisticasPorSetor: Array<{
      setor: { codigo: number; nome: string };
      totalMultas: number;
      valorTotal: number;
      multasComMudanca: number;
    }>;
  }> {
    try {
      this.logger.log('🔍 Buscando multas com mapeamento histórico de setores...');

      // ✅ 1. Buscar multas
      const resultadoMultas = await this.multaCompletaService.buscarMultasCompletas(filters);

      // ✅ 2. Mapear com histórico de setores
      const multasComSetorHistorico = await this.mapearMultasComSetorHistorico(resultadoMultas.data);

      // ✅ 3. Calcular estatísticas
      const resumo = this.calcularResumo(multasComSetorHistorico);
      const estatisticasPorSetor = this.calcularEstatisticasPorSetor(multasComSetorHistorico);

      this.logger.log(`✅ Processadas ${multasComSetorHistorico.length} multas com histórico de setores`);

      return {
        data: multasComSetorHistorico,
        total: resultadoMultas.total,
        page: resultadoMultas.page,
        limit: resultadoMultas.limit,
        totalPages: resultadoMultas.totalPages,
        resumo,
        estatisticasPorSetor
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar multas com histórico: ${error.message}`);
      throw error;
    }
  }

  // ✅ RELATÓRIO DE MUDANÇAS DE SETOR
  async relatorioMudancasSetor(filters: any = {}): Promise<{
    multasComMudanca: MultaComSetorHistorico[];
    resumoPorVeiculo: Array<{
      prefixoVeiculo: string;
      totalMultas: number;
      multasComMudanca: number;
      setoresEnvolvidos: Array<{ codigo: number; nome: string; quantidade: number }>;
    }>;
    impactoFinanceiro: {
      valorTotalMultasComMudanca: number;
      valorMedioPorMudanca: number;
      setorMaisAfetado: { codigo: number; nome: string; valor: number };
    };
  }> {
    try {
      const resultado = await this.buscarMultasComSetorHistorico(filters);
      const multasComMudanca = resultado.data.filter(m => m.setorMudou);

      // ✅ Resumo por veículo
      const resumoPorVeiculo = this.calcularResumoPorVeiculo(multasComMudanca);

      // ✅ Impacto financeiro
      const impactoFinanceiro = this.calcularImpactoFinanceiro(multasComMudanca);

      return {
        multasComMudanca,
        resumoPorVeiculo,
        impactoFinanceiro
      };

    } catch (error) {
      this.logger.error(`❌ Erro no relatório de mudanças: ${error.message}`);
      throw error;
    }
  }

  // ✅ MÉTODOS PRIVADOS

  private async mapearMultasComSetorHistorico(multas: any[]): Promise<MultaComSetorHistorico[]> {
    const multasComSetor: MultaComSetorHistorico[] = [];

    for (const multa of multas) {
      try {
        // ✅ Obter setor na data da infração
        const setorNaDataInfracao = await this.historicoSetorService.obterSetorNaData(
          multa.prefixoVeic,
          new Date(multa.dataEmissaoMulta)
        );

        // ✅ Obter setor atual (último registro)
        const historicoCompleto = await this.historicoSetorService.obterHistoricoCompleto(multa.prefixoVeic);
        const setorAtual = historicoCompleto.length > 0 
          ? historicoCompleto[historicoCompleto.length - 1] 
          : null;

        // ✅ Verificar se houve mudança
        const setorMudou = setorNaDataInfracao && setorAtual && 
          setorNaDataInfracao.codigoGaragem !== setorAtual.codigoGaragem;

        multasComSetor.push({
          ...multa,
          setorNaDataInfracao,
          setorAtual: setorAtual ? {
            codigoGaragem: setorAtual.codigoGaragem,
            nomeGaragem: setorAtual.nomeGaragem
          } : null,
          setorMudou: Boolean(setorMudou),
          setorEncontrado: Boolean(setorNaDataInfracao)
        });

      } catch (error) {
        this.logger.error(`❌ Erro ao mapear multa ${multa.numeroAiMulta}: ${error.message}`);
        
        // ✅ Adicionar multa sem mapeamento em caso de erro
        multasComSetor.push({
          ...multa,
          setorNaDataInfracao: null,
          setorAtual: null,
          setorMudou: false,
          setorEncontrado: false
        });
      }
    }

    return multasComSetor;
  }

  private calcularResumo(multas: MultaComSetorHistorico[]) {
    const multasComSetor = multas.filter(m => m.setorEncontrado).length;
    const multasSemSetor = multas.filter(m => !m.setorEncontrado).length;
    const multasComMudancaSetor = multas.filter(m => m.setorMudou).length;

    return {
      totalMultas: multas.length,
      multasComSetor,
      multasSemSetor,
      multasComMudancaSetor,
      percentualMapeamento: multas.length > 0 ? (multasComSetor / multas.length) * 100 : 0,
      percentualMudancas: multas.length > 0 ? (multasComMudancaSetor / multas.length) * 100 : 0
    };
  }

  private calcularEstatisticasPorSetor(multas: MultaComSetorHistorico[]) {
    const multasComSetor = multas.filter(m => m.setorEncontrado);
    
    const estatisticasPorSetor = multasComSetor.reduce((acc, multa) => {
      const codigo = multa.setorNaDataInfracao!.codigoGaragem;
      const nome = multa.setorNaDataInfracao!.nomeGaragem;
      const key = `${codigo}-${nome}`;

      if (!acc[key]) {
        acc[key] = {
          setor: { codigo, nome },
          totalMultas: 0,
          valorTotal: 0,
          multasComMudanca: 0
        };
      }

      acc[key].totalMultas += 1;
      acc[key].valorTotal += Number(multa.valorMulta) || 0;
      if (multa.setorMudou) {
        acc[key].multasComMudanca += 1;
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(estatisticasPorSetor)
      .sort((a: any, b: any) => b.totalMultas - a.totalMultas);
  }

  private calcularResumoPorVeiculo(multasComMudanca: MultaComSetorHistorico[]) {
    const resumoPorVeiculo = multasComMudanca.reduce((acc, multa) => {
      const prefixo = multa.prefixoVeic;
      
      if (!acc[prefixo]) {
        acc[prefixo] = {
          prefixoVeiculo: prefixo,
          totalMultas: 0,
          multasComMudanca: 0,
          setoresEnvolvidos: new Map()
        };
      }

      acc[prefixo].totalMultas += 1;
      acc[prefixo].multasComMudanca += 1;

      // ✅ Contar setores envolvidos
      if (multa.setorNaDataInfracao) {
        const codigo = multa.setorNaDataInfracao.codigoGaragem;
        const nome = multa.setorNaDataInfracao.nomeGaragem;
        const key = `${codigo}-${nome}`;
        
        if (!acc[prefixo].setoresEnvolvidos.has(key)) {
          acc[prefixo].setoresEnvolvidos.set(key, { codigo, nome, quantidade: 0 });
        }
        acc[prefixo].setoresEnvolvidos.get(key).quantidade += 1;
      }

      return acc;
    }, {} as Record<string, any>);

    return Object.values(resumoPorVeiculo).map((item: any) => ({
      ...item,
      setoresEnvolvidos: Array.from(item.setoresEnvolvidos.values())
    }));
  }

  private calcularImpactoFinanceiro(multasComMudanca: MultaComSetorHistorico[]) {
    const valorTotalMultasComMudanca = multasComMudanca.reduce(
      (sum, m) => sum + (Number(m.valorMulta) || 0), 0
    );

    const valorMedioPorMudanca = multasComMudanca.length > 0 
      ? valorTotalMultasComMudanca / multasComMudanca.length 
      : 0;

    // ✅ Setor mais afetado
    const valorPorSetor = multasComMudanca.reduce((acc, multa) => {
      if (multa.setorNaDataInfracao) {
        const codigo = multa.setorNaDataInfracao.codigoGaragem;
        const nome = multa.setorNaDataInfracao.nomeGaragem;
        const key = `${codigo}-${nome}`;
        
        if (!acc[key]) {
          acc[key] = { codigo, nome, valor: 0 };
        }
        acc[key].valor += Number(multa.valorMulta) || 0;
      }
      return acc;
    }, {} as Record<string, any>);

    const setorMaisAfetado = Object.values(valorPorSetor)
      .sort((a: any, b: any) => b.valor - a.valor)[0] || 
      { codigo: 0, nome: 'N/A', valor: 0 };

    return {
      valorTotalMultasComMudanca,
      valorMedioPorMudanca,
      setorMaisAfetado
    };
  }
}