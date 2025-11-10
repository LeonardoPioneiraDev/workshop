// src/modules/departamentos/juridico/services/multa-setor-mapping.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VeiculoFrotaEntity } from '../entities/veiculo-frota.entity';
import { MultaCompletaService } from './multa-completa.service';

export interface MultaComSetor {
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
  // ✅ CAMPOS ADICIONADOS DO SETOR
  codigoGaragem?: number;
  nomeGaragem?: string;
  situacaoVeiculo?: string;
  idadeVeiculo?: number;
  tipoFrotaDescricao?: string;
  setorEncontrado: boolean;
}

export interface EstatisticasPorSetor {
  setor: {
    codigo: number;
    nome: string;
  };
  totalMultas: number;
  valorTotal: number;
  valorMedio: number;
  multasTransito: number;
  multasSemob: number;
  veiculosComMultas: number;
  multasPorGravidade: {
    gravissima: number;
    grave: number;
    media: number;
    leve: number;
  };
  topVeiculos: Array<{
    prefixo: string;
    totalMultas: number;
    valorTotal: number;
  }>;
  topInfracoes: Array<{
    descricao: string;
    total: number;
    valor: number;
  }>;
}

@Injectable()
export class MultaSetorMappingService {
  private readonly logger = new Logger(MultaSetorMappingService.name);
  private cacheVeiculos: Map<string, VeiculoFrotaEntity> = new Map();
  private ultimaAtualizacaoCache: Date | null = null;

  constructor(
    @InjectRepository(VeiculoFrotaEntity)
    private readonly veiculoFrotaRepository: Repository<VeiculoFrotaEntity>,
    
    private readonly multaCompletaService: MultaCompletaService
  ) {}

  // ✅ BUSCAR MULTAS COM MAPEAMENTO DE SETOR
  async buscarMultasComSetor(filters: any = {}): Promise<{
    data: MultaComSetor[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    estatisticasPorSetor: EstatisticasPorSetor[];
    resumo: {
      totalMultas: number;
      multasComSetor: number;
      multasSemSetor: number;
      percentualMapeamento: number;
    };
  }> {
    try {
      this.logger.log('🔍 Buscando multas e mapeando setores...');

      // ✅ 1. Atualizar cache de veículos se necessário
      await this.atualizarCacheVeiculos();

      // ✅ 2. Buscar multas
      const resultadoMultas = await this.multaCompletaService.buscarMultasCompletas(filters);

      // ✅ 3. Mapear multas com setores
      const multasComSetor = await this.mapearMultasComSetor(resultadoMultas.data);

      // ✅ 4. Calcular estatísticas por setor
      const estatisticasPorSetor = this.calcularEstatisticasPorSetor(multasComSetor);

      // ✅ 5. Calcular resumo
      const multasComSetorCount = multasComSetor.filter(m => m.setorEncontrado).length;
      const multasSemSetorCount = multasComSetor.filter(m => !m.setorEncontrado).length;

      const resumo = {
        totalMultas: multasComSetor.length,
        multasComSetor: multasComSetorCount,
        multasSemSetor: multasSemSetorCount,
        percentualMapeamento: multasComSetor.length > 0 
          ? (multasComSetorCount / multasComSetor.length) * 100 
          : 0
      };

      this.logger.log(`✅ Processadas ${multasComSetor.length} multas, ${multasComSetorCount} mapeadas (${resumo.percentualMapeamento.toFixed(1)}%)`);

      return {
        data: multasComSetor,
        total: resultadoMultas.total,
        page: resultadoMultas.page,
        limit: resultadoMultas.limit,
        totalPages: resultadoMultas.totalPages,
        estatisticasPorSetor,
        resumo
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar multas com setor: ${error.message}`);
      throw error;
    }
  }

  // ✅ BUSCAR ESTATÍSTICAS POR SETOR ESPECÍFICO
  async estatisticasSetor(codigoGaragem: number, filters: any = {}): Promise<{
    setor: { codigo: number; nome: string };
    estatisticas: EstatisticasPorSetor;
    multas: MultaComSetor[];
  }> {
    try {
      // ✅ Buscar todas as multas com setor
      const resultado = await this.buscarMultasComSetor(filters);
      
      // ✅ Filtrar por setor específico
      const multasDoSetor = resultado.data.filter(m => 
        m.codigoGaragem === codigoGaragem && m.setorEncontrado
      );

      // ✅ Encontrar estatísticas do setor
      const estatisticasSetor = resultado.estatisticasPorSetor.find(e => 
        e.setor.codigo === codigoGaragem
      );

      if (!estatisticasSetor) {
        throw new Error(`Setor ${codigoGaragem} não encontrado`);
      }

      return {
        setor: estatisticasSetor.setor,
        estatisticas: estatisticasSetor,
        multas: multasDoSetor
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar estatísticas do setor ${codigoGaragem}: ${error.message}`);
      throw error;
    }
  }

  // ✅ COMPARAR SETORES
  async compararSetores(filters: any = {}): Promise<{
    comparacao: Array<{
      setor: { codigo: number; nome: string };
      totalMultas: number;
      valorTotal: number;
      valorMedio: number;
      ranking: number;
    }>;
    resumo: {
      setorComMaisMultas: { codigo: number; nome: string; total: number };
      setorComMaiorValor: { codigo: number; nome: string; valor: number };
      setorComMaiorMedia: { codigo: number; nome: string; media: number };
    };
  }> {
    try {
      const resultado = await this.buscarMultasComSetor(filters);
      
      // ✅ Ordenar setores por total de multas
      const comparacao = resultado.estatisticasPorSetor
        .map((estat, index) => ({
          setor: estat.setor,
          totalMultas: estat.totalMultas,
          valorTotal: estat.valorTotal,
          valorMedio: estat.valorMedio,
          ranking: index + 1
        }))
        .sort((a, b) => b.totalMultas - a.totalMultas)
        .map((item, index) => ({ ...item, ranking: index + 1 }));

      // ✅ Calcular resumo
      const setorComMaisMultas = comparacao[0] || { setor: { codigo: 0, nome: 'N/A' }, totalMultas: 0 };
      const setorComMaiorValor = [...comparacao].sort((a, b) => b.valorTotal - a.valorTotal)[0] || { setor: { codigo: 0, nome: 'N/A' }, valorTotal: 0 };
      const setorComMaiorMedia = [...comparacao].sort((a, b) => b.valorMedio - a.valorMedio)[0] || { setor: { codigo: 0, nome: 'N/A' }, valorMedio: 0 };

      const resumo = {
        setorComMaisMultas: {
          codigo: setorComMaisMultas.setor.codigo,
          nome: setorComMaisMultas.setor.nome,
          total: setorComMaisMultas.totalMultas
        },
        setorComMaiorValor: {
          codigo: setorComMaiorValor.setor.codigo,
          nome: setorComMaiorValor.setor.nome,
          valor: setorComMaiorValor.valorTotal
        },
        setorComMaiorMedia: {
          codigo: setorComMaiorMedia.setor.codigo,
          nome: setorComMaiorMedia.setor.nome,
          media: setorComMaiorMedia.valorMedio
        }
      };

      return { comparacao, resumo };

    } catch (error) {
      this.logger.error(`❌ Erro ao comparar setores: ${error.message}`);
      throw error;
    }
  }

  // ✅ MÉTODOS PRIVADOS

  private async atualizarCacheVeiculos(): Promise<void> {
    const agora = new Date();
    const umHoraAtras = new Date(agora.getTime() - 60 * 60 * 1000);

    // ✅ Atualizar cache a cada hora ou se estiver vazio
    if (!this.ultimaAtualizacaoCache || this.ultimaAtualizacaoCache < umHoraAtras || this.cacheVeiculos.size === 0) {
      this.logger.log('🔄 Atualizando cache de veículos...');

      const veiculos = await this.veiculoFrotaRepository.find();
      
      this.cacheVeiculos.clear();
      veiculos.forEach(veiculo => {
        this.cacheVeiculos.set(veiculo.prefixoVeiculo, veiculo);
      });

      this.ultimaAtualizacaoCache = agora;
      this.logger.log(`✅ Cache atualizado: ${this.cacheVeiculos.size} veículos`);
    }
  }

  private async mapearMultasComSetor(multas: any[]): Promise<MultaComSetor[]> {
    return multas.map(multa => {
      const veiculo = this.cacheVeiculos.get(multa.prefixoVeic);
      
      if (veiculo) {
        return {
          ...multa,
          codigoGaragem: veiculo.codigoGaragem,
          nomeGaragem: veiculo.nomeGaragem,
          situacaoVeiculo: veiculo.situacao,
          idadeVeiculo: veiculo.idadeVeiculo,
          tipoFrotaDescricao: veiculo.tipoFrotaDescricao,
          setorEncontrado: true
        };
      } else {
        return {
          ...multa,
          codigoGaragem: null,
          nomeGaragem: 'SETOR NÃO IDENTIFICADO',
          situacaoVeiculo: null,
          idadeVeiculo: null,
          tipoFrotaDescricao: null,
          setorEncontrado: false
        };
      }
    });
  }

  private calcularEstatisticasPorSetor(multasComSetor: MultaComSetor[]): EstatisticasPorSetor[] {
    // ✅ Agrupar por setor
    const multasPorSetor = multasComSetor
      .filter(m => m.setorEncontrado)
      .reduce((acc, multa) => {
        const key = `${multa.codigoGaragem}-${multa.nomeGaragem}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(multa);
        return acc;
      }, {} as Record<string, MultaComSetor[]>);

    // ✅ Calcular estatísticas para cada setor
    return Object.entries(multasPorSetor).map(([key, multas]) => {
      const primeiraMulta = multas[0];
      const valorTotal = multas.reduce((sum, m) => sum + (Number(m.valorMulta) || 0), 0);
      
      // ✅ Separar por tipo
      const multasTransito = multas.filter(m => m.pontuacaoInfracao && m.pontuacaoInfracao > 0);
      const multasSemob = multas.filter(m => m.agenteCodigo);

      // ✅ Agrupar por gravidade
      const multasPorGravidade = multas.reduce((acc, m) => {
        const gravidade = m.gravidadeInfracao?.toLowerCase() || 'leve';
        acc[gravidade] = (acc[gravidade] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // ✅ Top veículos do setor
      const veiculosPorMultas = multas.reduce((acc, m) => {
        if (!acc[m.prefixoVeic]) {
          acc[m.prefixoVeic] = { total: 0, valor: 0 };
        }
        acc[m.prefixoVeic].total += 1;
        acc[m.prefixoVeic].valor += Number(m.valorMulta) || 0;
        return acc;
      }, {} as Record<string, { total: number; valor: number }>);

      const topVeiculos = Object.entries(veiculosPorMultas)
        .sort(([,a], [,b]) => b.total - a.total)
        .slice(0, 5)
        .map(([prefixo, dados]) => ({
          prefixo,
          totalMultas: dados.total,
          valorTotal: dados.valor
        }));

      // ✅ Top infrações do setor
      const infracoesPorTotal = multas.reduce((acc, m) => {
        const descricao = m.descricaoInfra || 'Não informado';
        if (!acc[descricao]) {
          acc[descricao] = { total: 0, valor: 0 };
        }
        acc[descricao].total += 1;
        acc[descricao].valor += Number(m.valorMulta) || 0;
        return acc;
      }, {} as Record<string, { total: number; valor: number }>);

      const topInfracoes = Object.entries(infracoesPorTotal)
        .sort(([,a], [,b]) => b.total - a.total)
        .slice(0, 5)
        .map(([descricao, dados]) => ({
          descricao,
          total: dados.total,
          valor: dados.valor
        }));

      return {
        setor: {
          codigo: primeiraMulta.codigoGaragem!,
          nome: primeiraMulta.nomeGaragem!
        },
        totalMultas: multas.length,
        valorTotal,
        valorMedio: multas.length > 0 ? valorTotal / multas.length : 0,
        multasTransito: multasTransito.length,
        multasSemob: multasSemob.length,
        veiculosComMultas: Object.keys(veiculosPorMultas).length,
        multasPorGravidade: {
          gravissima: multasPorGravidade.gravissima || 0,
          grave: multasPorGravidade.grave || 0,
          media: multasPorGravidade.media || 0,
          leve: multasPorGravidade.leve || 0
        },
        topVeiculos,
        topInfracoes
      };
    }).sort((a, b) => b.totalMultas - a.totalMultas);
  }
}