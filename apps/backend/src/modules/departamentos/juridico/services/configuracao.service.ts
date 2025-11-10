// src/modules/departamentos/juridico/services/configuracao.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfiguracaoRepository } from '../repositories/configuracao.repository';

export interface ConfiguracaoSistema {
  limiteCache: number;
  alertaMultasVencidas: number;
  sincronizacaoAutomatica: boolean;
  intervaloPadrao: number;
  maxTentativasSync: number;
  timeoutSync: number;
  alertasEmail: boolean;
  alertasSms: boolean;
  retencaoDados: number;
  backupAutomatico: boolean;
  logLevel: string;
  manutencaoAgendada: boolean;
}

@Injectable()
export class ConfiguracaoService {
  private readonly logger = new Logger(ConfiguracaoService.name);
  private cache = new Map<string, any>();

  constructor(
    private readonly configuracaoRepository: ConfiguracaoRepository
  ) {}

  async onModuleInit(): Promise<void> {
    await this.configuracaoRepository.inicializarConfiguracoesPadrao();
    await this.carregarConfiguracoes();
  }

  /**
   * ⚙️ OBTER TODAS AS CONFIGURAÇÕES DO SISTEMA (MÉTODO REQUERIDO PELO SYNC SERVICE)
   */
  async getConfiguracoes(): Promise<ConfiguracaoSistema> {
    try {
      this.logger.log('⚙️ Obtendo configurações do sistema...');

      // ✅ BUSCAR CONFIGURAÇÕES ESPECÍFICAS NECESSÁRIAS PARA O SYNC
      const [
        limiteCache,
        alertaMultasVencidas,
        sincronizacaoAutomatica,
        intervaloPadrao,
        maxTentativasSync,
        timeoutSync,
        alertasEmail,
        alertasSms,
        retencaoDados,
        backupAutomatico,
        logLevel,
        manutencaoAgendada
      ] = await Promise.all([
        this.obterValor<number>('limiteCache', 90),
        this.obterValor<number>('alertaMultasVencidas', 100),
        this.obterValor<boolean>('sincronizacaoAutomatica', true),
        this.obterValor<number>('intervaloPadrao', 6),
        this.obterValor<number>('maxTentativasSync', 3),
        this.obterValor<number>('timeoutSync', 300000),
        this.obterValor<boolean>('alertasEmail', true),
        this.obterValor<boolean>('alertasSms', false),
        this.obterValor<number>('retencaoDados', 365),
        this.obterValor<boolean>('backupAutomatico', true),
        this.obterValor<string>('logLevel', 'INFO'),
        this.obterValor<boolean>('manutencaoAgendada', false)
      ]);

      const configuracoes: ConfiguracaoSistema = {
        limiteCache,
        alertaMultasVencidas,
        sincronizacaoAutomatica,
        intervaloPadrao,
        maxTentativasSync,
        timeoutSync,
        alertasEmail,
        alertasSms,
        retencaoDados,
        backupAutomatico,
        logLevel,
        manutencaoAgendada
      };

      this.logger.log('✅ Configurações do sistema obtidas com sucesso');
      return configuracoes;

    } catch (error) {
      this.logger.error(`❌ Erro ao obter configurações do sistema: ${error.message}`);
      
      // ✅ RETORNAR CONFIGURAÇÕES PADRÃO EM CASO DE ERRO
      return this.obterConfiguracoesPadrao();
    }
  }

  async obterValor<T = string>(chave: string, valorPadrao?: T): Promise<T> {
    try {
      if (this.cache.has(chave)) {
        return this.cache.get(chave);
      }

      const configuracao = await this.configuracaoRepository.obterPorChave(chave);
      
      if (!configuracao) {
        return valorPadrao as T;
      }

      const valor = this.converterValor(configuracao.valor, configuracao.tipoValor);
      this.cache.set(chave, valor);
      
      return valor;
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao obter valor da configuração ${chave}: ${error.message}`);
      return valorPadrao as T;
    }
  }

  async atualizarValor(chave: string, novoValor: string): Promise<void> {
    try {
      const configuracao = await this.configuracaoRepository.obterPorChave(chave);
      
      if (!configuracao) {
        throw new Error(`Configuração ${chave} não encontrada`);
      }

      if (!configuracao.editavel) {
        throw new Error(`Configuração ${chave} não é editável`);
      }

      // Validar valor
      if (configuracao.validacaoRegex) {
        const regex = new RegExp(configuracao.validacaoRegex);
        if (!regex.test(novoValor)) {
          throw new Error(`Valor inválido para ${chave}`);
        }
      }

      if (configuracao.valoresPermitidos) {
        const permitidos = JSON.parse(configuracao.valoresPermitidos);
        if (!permitidos.includes(novoValor)) {
          throw new Error(`Valor não permitido para ${chave}. Valores aceitos: ${permitidos.join(', ')}`);
        }
      }

      await this.configuracaoRepository.atualizarValor(chave, novoValor);
      
      // Atualizar cache
      const valorConvertido = this.converterValor(novoValor, configuracao.tipoValor);
      this.cache.set(chave, valorConvertido);

      this.logger.log(`✅ Configuração ${chave} atualizada para: ${novoValor}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao atualizar configuração ${chave}: ${error.message}`);
      throw error;
    }
  }

  async obterPorCategoria(categoria: string): Promise<any[]> {
    try {
      const configuracoes = await this.configuracaoRepository.obterPorCategoria(categoria);
      
      return configuracoes.map(config => ({
        chave: config.chave,
        valor: config.valor,
        tipo: config.tipoValor,
        descricao: config.descricao,
        editavel: config.editavel,
        requerReinicio: config.requerReinicio,
        valorPadrao: config.valorPadrao,
        valoresPermitidos: config.valoresPermitidos ? JSON.parse(config.valoresPermitidos) : null
      }));
    } catch (error) {
      this.logger.error(`❌ Erro ao obter configurações por categoria ${categoria}: ${error.message}`);
      return [];
    }
  }

  async obterTodasConfiguracoes(): Promise<any> {
    try {
      const configuracoes = await this.configuracaoRepository.obterTodas();
      
      const agrupadas = configuracoes.reduce((acc, config) => {
        if (!acc[config.categoria]) {
          acc[config.categoria] = [];
        }
        
        acc[config.categoria].push({
          chave: config.chave,
          valor: config.valor,
          tipo: config.tipoValor,
          descricao: config.descricao,
          editavel: config.editavel,
          requerReinicio: config.requerReinicio,
          valorPadrao: config.valorPadrao,
          valoresPermitidos: config.valoresPermitidos ? JSON.parse(config.valoresPermitidos) : null
        });
        
        return acc;
      }, {});

      return agrupadas;
    } catch (error) {
      this.logger.error(`❌ Erro ao obter todas as configurações: ${error.message}`);
      return {};
    }
  }

  /**
   * 🔄 RECARREGAR CONFIGURAÇÕES DO BANCO
   */
  async recarregarConfiguracoes(): Promise<void> {
    try {
      this.cache.clear();
      await this.carregarConfiguracoes();
      this.logger.log('🔄 Configurações recarregadas com sucesso');
    } catch (error) {
      this.logger.error(`❌ Erro ao recarregar configurações: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📊 OBTER STATUS DAS CONFIGURAÇÕES
   */
  async obterStatusConfiguracoes(): Promise<{
    totalConfiguracoes: number;
    configuracoesCarregadas: number;
    ultimaAtualizacao: Date | null;
    categorias: string[];
  }> {
    try {
      const configuracoes = await this.configuracaoRepository.obterTodas();
      const categorias = [...new Set(configuracoes.map(c => c.categoria))];

      return {
        totalConfiguracoes: configuracoes.length,
        configuracoesCarregadas: this.cache.size,
        ultimaAtualizacao: new Date(), // Pode ser melhorado para rastrear a última atualização real
        categorias
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao obter status das configurações: ${error.message}`);
      return {
        totalConfiguracoes: 0,
        configuracoesCarregadas: this.cache.size,
        ultimaAtualizacao: null,
        categorias: []
      };
    }
  }

  /**
   * 🔧 RESETAR CONFIGURAÇÃO PARA VALOR PADRÃO
   */
  async resetarConfiguracao(chave: string): Promise<void> {
    try {
      const configuracao = await this.configuracaoRepository.obterPorChave(chave);
      
      if (!configuracao) {
        throw new Error(`Configuração ${chave} não encontrada`);
      }

      if (!configuracao.editavel) {
        throw new Error(`Configuração ${chave} não é editável`);
      }

      await this.atualizarValor(chave, configuracao.valorPadrao);
      this.logger.log(`🔧 Configuração ${chave} resetada para valor padrão: ${configuracao.valorPadrao}`);
    } catch (error) {
      this.logger.error(`❌ Erro ao resetar configuração ${chave}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 💾 EXPORTAR CONFIGURAÇÕES
   */
  async exportarConfiguracoes(): Promise<any> {
    try {
      const configuracoes = await this.configuracaoRepository.obterTodas();
      
      const backup = {
        timestamp: new Date().toISOString(),
        versao: '1.0',
        total: configuracoes.length,
        configuracoes: configuracoes.map(config => ({
          chave: config.chave,
          valor: config.valor,
          categoria: config.categoria,
          descricao: config.descricao,
          tipoValor: config.tipoValor,
          valorPadrao: config.valorPadrao
        }))
      };

      this.logger.log(`💾 Configurações exportadas: ${configuracoes.length} itens`);
      return backup;
    } catch (error) {
      this.logger.error(`❌ Erro ao exportar configurações: ${error.message}`);
      throw error;
    }
  }

  // ✅ MÉTODOS PRIVADOS

  private async carregarConfiguracoes(): Promise<void> {
    try {
      const configuracoes = await this.configuracaoRepository.obterTodas();
      
      configuracoes.forEach(config => {
        const valor = this.converterValor(config.valor, config.tipoValor);
        this.cache.set(config.chave, valor);
      });

      this.logger.log(`📋 Carregadas ${configuracoes.length} configurações`);
    } catch (error) {
      this.logger.error(`❌ Erro ao carregar configurações: ${error.message}`);
      // Não relançar o erro para não quebrar a inicialização
    }
  }

  private converterValor(valor: string, tipo: string): any {
    try {
      switch (tipo) {
        case 'INTEGER':
          return parseInt(valor);
        case 'DECIMAL':
          return parseFloat(valor);
        case 'BOOLEAN':
          return valor.toLowerCase() === 'true';
        case 'JSON':
          return JSON.parse(valor);
        default:
          return valor;
      }
    } catch (error) {
      this.logger.warn(`⚠️ Erro ao converter valor ${valor} para tipo ${tipo}: ${error.message}`);
      return valor; // Retornar valor original em caso de erro
    }
  }

  /**
   * ⚙️ OBTER CONFIGURAÇÕES PADRÃO (FALLBACK)
   */
  private obterConfiguracoesPadrao(): ConfiguracaoSistema {
    return {
      limiteCache: 90,                    // dias
      alertaMultasVencidas: 100,          // quantidade
      sincronizacaoAutomatica: true,      // boolean
      intervaloPadrao: 6,                 // horas
      maxTentativasSync: 3,               // tentativas
      timeoutSync: 300000,                // ms (5 minutos)
      alertasEmail: true,                 // boolean
      alertasSms: false,                  // boolean
      retencaoDados: 365,                 // dias
      backupAutomatico: true,             // boolean
      logLevel: 'INFO',                   // string
      manutencaoAgendada: false           // boolean
    };
  }
}