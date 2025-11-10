// src/modules/departamentos/juridico/services/veiculo-historico-setor.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, And,  Not, LessThan } from 'typeorm';
import { VeiculoHistoricoSetorEntity } from '../entities/veiculo-historico-setor.entity';
import { VeiculoFrotaEntity } from '../entities/veiculo-frota.entity';

export interface SetorNaData {
  prefixoVeiculo: string;
  codigoGaragem: number;
  nomeGaragem: string;
  dataInicio: Date;
  dataFim: Date | null;
  periodoAtivo: boolean;
}

export interface MudancaSetor {
  prefixoVeiculo: string;
  setorAnterior: {
    codigo: number;
    nome: string;
  };
  setorNovo: {
    codigo: number;
    nome: string;
  };
  dataMudanca: Date;
  motivo?: string;
  observacoes?: string;
  usuarioAlteracao?: string;
}

@Injectable()
export class VeiculoHistoricoSetorService {
  private readonly logger = new Logger(VeiculoHistoricoSetorService.name);

  constructor(
    @InjectRepository(VeiculoHistoricoSetorEntity)
    private readonly historicoRepository: Repository<VeiculoHistoricoSetorEntity>,

    @InjectRepository(VeiculoFrotaEntity)
    private readonly veiculoFrotaRepository: Repository<VeiculoFrotaEntity>
  ) {}

  // ✅ INICIALIZAR HISTÓRICO PARA FROTA ATUAL
  async inicializarHistoricoFrotaAtual(): Promise<{
    processados: number;
    novosRegistros: number;
    erros: number;
  }> {
    try {
      this.logger.log('🔄 Inicializando histórico de setores para frota atual...');

      const veiculosAtivos = await this.veiculoFrotaRepository.find({
        where: { situacao: 'ATIVO' }
      });

      let processados = 0;
      let novosRegistros = 0;
      let erros = 0;

      for (const veiculo of veiculosAtivos) {
        try {
          // ✅ Verificar se já existe histórico para este veículo
          const historicoExistente = await this.historicoRepository.findOne({
            where: {
              prefixoVeiculo: veiculo.prefixoVeiculo,
              dataFim: IsNull() // Período atual
            }
          });

          if (!historicoExistente) {
            // ✅ Criar registro inicial
            await this.historicoRepository.save({
              prefixoVeiculo: veiculo.prefixoVeiculo,
              codigoEmpresa: veiculo.codigoEmpresa,
              codigoGaragem: veiculo.codigoGaragem,
              nomeGaragem: veiculo.nomeGaragem,
              dataInicio: veiculo.dataInicioUtilizacao || new Date(),
              dataFim: null, // Período atual
              motivoMudanca: 'INICIALIZAÇÃO_SISTEMA',
              observacoes: 'Registro inicial criado automaticamente',
              usuarioAlteracao: 'SISTEMA'
            });

            novosRegistros++;
          }

          processados++;
        } catch (error) {
          this.logger.error(`❌ Erro ao processar veículo ${veiculo.prefixoVeiculo}: ${error.message}`);
          erros++;
        }
      }

      this.logger.log(`✅ Inicialização concluída: ${processados} processados, ${novosRegistros} novos, ${erros} erros`);

      return { processados, novosRegistros, erros };
    } catch (error) {
      this.logger.error(`❌ Erro na inicialização: ${error.message}`);
      throw error;
    }
  }

  // ✅ REGISTRAR MUDANÇA DE SETOR
  async registrarMudancaSetor(mudanca: MudancaSetor): Promise<void> {
    try {
      this.logger.log(`🔄 Registrando mudança de setor para veículo ${mudanca.prefixoVeiculo}`);

      // ✅ 1. Finalizar período atual
      await this.historicoRepository.update(
        {
          prefixoVeiculo: mudanca.prefixoVeiculo,
          dataFim: IsNull()
        },
        {
          dataFim: mudanca.dataMudanca,
          usuarioAlteracao: mudanca.usuarioAlteracao || 'SISTEMA'
        }
      );

      // ✅ 2. Criar novo período
      await this.historicoRepository.save({
        prefixoVeiculo: mudanca.prefixoVeiculo,
        codigoEmpresa: 4, // Assumindo empresa padrão
        codigoGaragem: mudanca.setorNovo.codigo,
        nomeGaragem: mudanca.setorNovo.nome,
        dataInicio: mudanca.dataMudanca,
        dataFim: null,
        motivoMudanca: mudanca.motivo || 'TRANSFERÊNCIA',
        observacoes: mudanca.observacoes || `Transferido de ${mudanca.setorAnterior.nome} para ${mudanca.setorNovo.nome}`,
        usuarioAlteracao: mudanca.usuarioAlteracao || 'SISTEMA'
      });

      this.logger.log(`✅ Mudança registrada: ${mudanca.prefixoVeiculo} de ${mudanca.setorAnterior.nome} para ${mudanca.setorNovo.nome}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao registrar mudança: ${error.message}`);
      throw error;
    }
  }

  // ✅ OBTER SETOR DO VEÍCULO EM UMA DATA ESPECÍFICA
  async obterSetorNaData(prefixoVeiculo: string, data: Date): Promise<SetorNaData | null> {
    try {
      const historico = await this.historicoRepository.findOne({
        where: [
          // Período fechado: data entre início e fim
          {
            prefixoVeiculo,
            dataInicio: LessThanOrEqual(data),
            dataFim: MoreThanOrEqual(data)
          },
          // Período atual: data após início e sem fim
          {
            prefixoVeiculo,
            dataInicio: LessThanOrEqual(data),
            dataFim: IsNull()
          }
        ],
        order: { dataInicio: 'DESC' }
      });

      if (!historico) {
        return null;
      }

      return {
        prefixoVeiculo: historico.prefixoVeiculo,
        codigoGaragem: historico.codigoGaragem,
        nomeGaragem: historico.nomeGaragem,
        dataInicio: historico.dataInicio,
        dataFim: historico.dataFim,
        periodoAtivo: historico.dataFim === null
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao obter setor na data: ${error.message}`);
      return null;
    }
  }

  // ✅ OBTER HISTÓRICO COMPLETO DE UM VEÍCULO
  async obterHistoricoCompleto(prefixoVeiculo: string): Promise<VeiculoHistoricoSetorEntity[]> {
    return await this.historicoRepository.find({
      where: { prefixoVeiculo },
      order: { dataInicio: 'ASC' }
    });
  }

  // ✅ SINCRONIZAR COM MUDANÇAS NA FROTA ATUAL
  async sincronizarComFrotaAtual(): Promise<{
    verificados: number;
    mudancasDetectadas: number;
    mudancasRegistradas: number;
  }> {
    try {
      this.logger.log('🔄 Sincronizando histórico com frota atual...');

      const veiculosAtivos = await this.veiculoFrotaRepository.find({
        where: { situacao: 'ATIVO' }
      });

      let verificados = 0;
      let mudancasDetectadas = 0;
      let mudancasRegistradas = 0;

      for (const veiculo of veiculosAtivos) {
        try {
          // ✅ Obter setor atual no histórico
          const setorAtualHistorico = await this.historicoRepository.findOne({
            where: {
              prefixoVeiculo: veiculo.prefixoVeiculo,
              dataFim: IsNull()
            }
          });

          // ✅ Verificar se houve mudança
          if (setorAtualHistorico && setorAtualHistorico.codigoGaragem !== veiculo.codigoGaragem) {
            mudancasDetectadas++;

            // ✅ Registrar mudança
            await this.registrarMudancaSetor({
              prefixoVeiculo: veiculo.prefixoVeiculo,
              setorAnterior: {
                codigo: setorAtualHistorico.codigoGaragem,
                nome: setorAtualHistorico.nomeGaragem
              },
              setorNovo: {
                codigo: veiculo.codigoGaragem,
                nome: veiculo.nomeGaragem
              },
              dataMudanca: new Date(),
              motivo: 'SINCRONIZAÇÃO_AUTOMÁTICA',
              observacoes: 'Mudança detectada durante sincronização',
              usuarioAlteracao: 'SISTEMA_SYNC'
            });

            mudancasRegistradas++;
          }

          verificados++;
        } catch (error) {
          this.logger.error(`❌ Erro ao verificar veículo ${veiculo.prefixoVeiculo}: ${error.message}`);
        }
      }

      this.logger.log(`✅ Sincronização concluída: ${verificados} verificados, ${mudancasDetectadas} mudanças detectadas, ${mudancasRegistradas} registradas`);

      return { verificados, mudancasDetectadas, mudancasRegistradas };
    } catch (error) {
      this.logger.error(`❌ Erro na sincronização: ${error.message}`);
      throw error;
    }
  }

  // src/modules/departamentos/juridico/services/veiculo-historico-setor.service.ts

// ✅ ADICIONAR ESTES MÉTODOS NO SERVICE EXISTENTE

  // ✅ OBTER TOTAL DE VEÍCULOS
  async obterTotalVeiculos(): Promise<number> {
    try {
      return await this.veiculoFrotaRepository.count();
    } catch (error) {
      this.logger.error(`❌ Erro ao obter total de veículos: ${error.message}`);
      return 0;
    }
  }

  // ✅ OBTER VEÍCULOS COM HISTÓRICO
  async obterVeiculosComHistorico(): Promise<number> {
    try {
      const result = await this.historicoRepository
        .createQueryBuilder('h')
        .select('COUNT(DISTINCT h.prefixoVeiculo)', 'total')
        .getRawOne();
      
      return parseInt(result?.total || '0');
    } catch (error) {
      this.logger.error(`❌ Erro ao obter veículos com histórico: ${error.message}`);
      return 0;
    }
  }

  // ✅ OBTER TOTAL DE MUDANÇAS
  async obterTotalMudancas(): Promise<number> {
    try {
      return await this.historicoRepository.count({
        where: {
          motivoMudanca: Not('INICIALIZAÇÃO_SISTEMA')
        }
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao obter total de mudanças: ${error.message}`);
      return 0;
    }
  }

  // ✅ LIMPAR HISTÓRICO ANTIGO
  async limparHistoricoAntigo(diasAntigos: number = 365): Promise<number> {
    try {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasAntigos);

      const result = await this.historicoRepository.delete({
        dataFim: LessThan(dataLimite),
        motivoMudanca: Not('INICIALIZAÇÃO_SISTEMA')
      });

      return result.affected || 0;
    } catch (error) {
      this.logger.error(`❌ Erro ao limpar histórico: ${error.message}`);
      throw error;
    }
  }

  // ✅ OBTER VEÍCULOS POR SETOR EM UM PERÍODO
  async obterVeiculosPorSetorNoPeriodo(
    codigoGaragem: number,
    dataInicio: Date,
    dataFim: Date
  ): Promise<string[]> {
    const historicos = await this.historicoRepository.find({
      where: [
        // Períodos que se sobrepõem ao intervalo solicitado
        {
          codigoGaragem,
          dataInicio: LessThanOrEqual(dataFim),
          dataFim: MoreThanOrEqual(dataInicio)
        },
        // Períodos atuais que começaram antes do fim do intervalo
        {
          codigoGaragem,
          dataInicio: LessThanOrEqual(dataFim),
          dataFim: IsNull()
        }
      ]
    });

    return [...new Set(historicos.map(h => h.prefixoVeiculo))];
  }
}