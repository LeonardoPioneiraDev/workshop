// apps/backend/src/modules/departamentos/pessoal/controllers/pessoal.controller.ts
import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  Logger,
  SetMetadata,
  ParseBoolPipe,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { 
  PessoalService, 
  FuncionarioFilters, 
  FuncionarioCompletoFilters,
  DashboardComparativo, 
  DashboardAcumuladoComparativo 
} from '../services/pessoal.service';

// ✅ DECORATOR PARA ENDPOINTS PÚBLICOS
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('Departamento Pessoal')
@Controller('departamentos/pessoal')
export class PessoalController {
  private readonly logger = new Logger(PessoalController.name);

  constructor(private readonly pessoalService: PessoalService) {}

  // ✅ =====================================================
  // ✅ ENDPOINTS EXISTENTES (FUNCIONÁRIOS BÁSICOS)
  // ✅ =====================================================

  // ✅ NOVA ROTA: STATUS DO CACHE
  @Get('status-cache')
  @Public()
  @ApiOperation({ 
    summary: 'Status do cache dos dados',
    description: 'Verifica o status do cache para os principais meses - ENDPOINT PÚBLICO'
  })
  @ApiResponse({ status: 200, description: 'Status do cache retornado com sucesso' })
  async statusCache() {
    try {
      this.logger.log(`📊 Verificando status do cache...`);
      
      const status = await this.pessoalService.obterStatusMultiplosMeses();
      
      const resumo = {
        totalMeses: status.length,
        comDados: status.filter(s => s.existeNoCache).length,
        semDados: status.filter(s => !s.existeNoCache).length,
        precisamAtualizacao: status.filter(s => s.precisaAtualizar).length
      };

      return {
        success: true,
        message: `Status do cache: ${resumo.comDados}/${resumo.totalMeses} meses com dados`,
        data: {
          resumo,
          detalhes: status
        },
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao verificar status do cache: ${error.message}`);
      throw new HttpException(
        `Erro ao verificar status do cache: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ SINCRONIZAR FUNCIONÁRIOS OTIMIZADO
  @Post('sincronizar')
  @Public()
  @ApiOperation({ 
    summary: 'Sincronizar funcionários (com cache inteligente)',
    description: 'Busca funcionários do Oracle e salva no PostgreSQL - Usa cache quando possível - ENDPOINT PÚBLICO'
  })
  @ApiQuery({ 
    name: 'mesReferencia', 
    required: false, 
    type: String,
    description: 'Mês de referência (YYYY-MM). Padrão: mês atual',
    example: '2025-09'
  })
  @ApiQuery({ 
    name: 'forcar', 
    required: false, 
    type: Boolean,
    description: 'Forçar sincronização mesmo com cache válido. Padrão: false',
    example: false
  })
  @ApiResponse({ status: 200, description: 'Sincronização realizada com sucesso' })
  @ApiResponse({ status: 500, description: 'Erro na sincronização' })
  async sincronizarFuncionarios(
    @Query('mesReferencia') mesReferencia?: string,
    @Query('forcar', new ParseBoolPipe({ optional: true })) forcar?: boolean
  ) {
    try {
      const mes = mesReferencia || new Date().toISOString().slice(0, 7);
      const forcarSincronizacao = forcar || false;
      
      this.logger.log(`🔄 Iniciando sincronização para ${mes} (forçar: ${forcarSincronizacao})...`);
      
      // ✅ VERIFICAR STATUS DO CACHE PRIMEIRO
      const statusCache = await this.pessoalService.verificarStatusCache(mes);
      
      let resultado;
      let usouCache = false;

      if (!forcarSincronizacao && statusCache.existeNoCache && !statusCache.precisaAtualizar) {
        // ✅ USAR DADOS DO CACHE
        usouCache = true;
        resultado = {
          totalProcessados: statusCache.totalRegistros,
          novos: 0,
          atualizados: 0,
          erros: 0,
          mesReferencia: mes,
          tempoExecucao: '0ms',
          fonte: 'cache' as const
        };
        this.logger.log(`💾 Usando dados do cache para ${mes} (${statusCache.totalRegistros} registros)`);
      } else {
        // ✅ SINCRONIZAR DO ORACLE
        resultado = await this.pessoalService.sincronizarFuncionarios(mes);
      }
      
      return {
        success: true,
        message: usouCache 
          ? `Dados obtidos do cache para ${mes}` 
          : `Sincronização de funcionários realizada com sucesso para ${mes}`,
        data: resultado,
        cache: {
          usouCache,
          statusAnterior: statusCache,
          economia: usouCache ? 'Evitou consulta ao Oracle' : 'Dados atualizados do Oracle'
        },
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro na sincronização: ${error.message}`);
      throw new HttpException(
        `Erro na sincronização: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ DASHBOARD OTIMIZADO
  @Get('dashboard')
  @Public()
  @ApiOperation({ 
    summary: 'Dashboard do departamento pessoal (com cache inteligente)',
    description: 'Retorna estatísticas completas - Prioriza cache local - ENDPOINT PÚBLICO'
  })
  @ApiQuery({ 
    name: 'mesReferencia', 
    required: false, 
    type: String,
    description: 'Mês de referência (YYYY-MM). Padrão: mês atual',
    example: '2025-09'
  })
  @ApiQuery({ 
    name: 'forcar', 
    required: false, 
    type: Boolean,
    description: 'Forçar sincronização mesmo com cache válido. Padrão: false',
    example: false
  })
  @ApiResponse({ status: 200, description: 'Dashboard gerado com sucesso' })
  async dashboard(
    @Query('mesReferencia') mesReferencia?: string,
    @Query('forcar', new ParseBoolPipe({ optional: true })) forcar?: boolean
  ) {
    try {
      const mes = mesReferencia || new Date().toISOString().slice(0, 7);
      const forcarSincronizacao = forcar || false;
      
      this.logger.log(`📊 Gerando dashboard para ${mes} (forçar: ${forcarSincronizacao})...`);
      
      const dashboard = await this.pessoalService.gerarDashboard(mes, forcarSincronizacao);
      
      return {
        success: true,
        message: 'Dashboard do departamento pessoal',
        data: dashboard,
        mesReferencia: mes,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar dashboard: ${error.message}`);
      throw new HttpException(
        `Erro ao gerar dashboard: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ DASHBOARD COMPARATIVO OTIMIZADO
  @Get('dashboard-comparativo')
  @Public()
  @ApiOperation({ 
    summary: 'Dashboard comparativo (com cache inteligente)',
    description: 'Compara 4 meses - Prioriza cache para meses anteriores - ENDPOINT PÚBLICO'
  })
  @ApiQuery({ 
    name: 'dataReferencia', 
    required: false, 
    type: String,
    description: 'Data de referência (YYYY-MM-DD). Padrão: data atual',
    example: '2025-09-26'
  })
  @ApiQuery({ 
    name: 'forcar', 
    required: false, 
    type: Boolean,
    description: 'Forçar sincronização do mês atual. Padrão: false',
    example: false
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard comparativo gerado com sucesso'
  })
  @ApiResponse({ status: 500, description: 'Erro ao gerar dashboard comparativo' })
  async dashboardComparativo(
    @Query('dataReferencia') dataReferencia?: string,
    @Query('forcar', new ParseBoolPipe({ optional: true })) forcar?: boolean
  ) {
    try {
      // ✅ PROCESSAR DATA DE REFERÊNCIA
      let dataRef = new Date();
      if (dataReferencia) {
        const dataParseada = new Date(dataReferencia);
        if (!isNaN(dataParseada.getTime())) {
          dataRef = dataParseada;
        } else {
          this.logger.warn(`⚠️ Data de referência inválida: ${dataReferencia}, usando data atual`);
        }
      }

      const forcarSincronizacao = forcar || false;

      this.logger.log(`📊 Gerando dashboard comparativo otimizado para ${dataRef.toISOString().slice(0, 10)} (forçar: ${forcarSincronizacao})...`);
      
      const dashboardComparativo = await this.pessoalService.gerarDashboardComparativo(dataRef, forcarSincronizacao);
      
      return {
        success: true,
        message: 'Dashboard comparativo de 4 meses gerado com sucesso',
        data: dashboardComparativo,
        metadados: {
          dataReferencia: dataRef.toISOString().slice(0, 10),
          totalMeses: 4,
          tipoComparacao: 'Últimos 3 meses + mesmo mês ano anterior',
          mesesCalculados: dashboardComparativo.meses,
          performance: dashboardComparativo.metadados
        },
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar dashboard comparativo: ${error.message}`);
      throw new HttpException(
        `Erro ao gerar dashboard comparativo: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ DASHBOARD ACUMULADO OTIMIZADO
  @Get('dashboard-acumulado')
  @Public()
  @ApiOperation({ 
    summary: 'Dashboard acumulado (Janeiro até mês especificado) - Otimizado',
    description: 'Retorna dashboard com dados acumulados - Usa cache inteligente - ENDPOINT PÚBLICO'
  })
  @ApiQuery({ 
    name: 'mesReferencia', 
    required: false, 
    type: String,
    description: 'Mês de referência (YYYY-MM). Padrão: mês atual',
    example: '2025-09'
  })
  @ApiQuery({ 
    name: 'forcar', 
    required: false, 
    type: Boolean,
    description: 'Forçar sincronização mesmo com cache válido. Padrão: false',
    example: false
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard acumulado gerado com sucesso'
  })
  @ApiResponse({ status: 500, description: 'Erro ao gerar dashboard acumulado' })
  async dashboardAcumulado(
    @Query('mesReferencia') mesReferencia?: string,
    @Query('forcar', new ParseBoolPipe({ optional: true })) forcar?: boolean
  ) {
    try {
      const mes = mesReferencia || new Date().toISOString().slice(0, 7);
      const forcarSincronizacao = forcar || false;
      
      this.logger.log(`📊 Gerando dashboard acumulado otimizado para Janeiro até ${mes} (forçar: ${forcarSincronizacao})...`);
      
      // ✅ MÉTODO CORRETO
      const dashboardAcumulado = await this.pessoalService.obterDashboardAcumulado(mes);
      
      return {
        success: true,
        message: `Dashboard acumulado gerado com sucesso: ${dashboardAcumulado.nomeCompleto}`,
        data: dashboardAcumulado,
        metadados: {
          tipoRelatorio: 'Acumulado',
          periodoInicio: dashboardAcumulado.periodoInicio,
          periodoFim: dashboardAcumulado.periodoFim,
          totalMesesIncluidos: dashboardAcumulado.detalhamentoMensal.length,
          fonte: dashboardAcumulado.fonte
        },
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar dashboard acumulado: ${error.message}`);
      throw new HttpException(
        `Erro ao gerar dashboard acumulado: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ DASHBOARD ACUMULADO COMPARATIVO OTIMIZADO
  @Get('dashboard-acumulado-comparativo')
  @Public()
  @ApiOperation({ 
    summary: 'Dashboard acumulado comparativo (4 períodos) - Otimizado',
    description: 'Compara períodos acumulados - Usa cache inteligente - ENDPOINT PÚBLICO'
  })
  @ApiQuery({ 
    name: 'dataReferencia', 
    required: false, 
    type: String,
    description: 'Data de referência (YYYY-MM-DD). Padrão: data atual',
    example: '2025-09-26'
  })
  @ApiQuery({ 
    name: 'forcar', 
    required: false, 
    type: Boolean,
    description: 'Forçar sincronização do período atual. Padrão: false',
    example: false
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard acumulado comparativo gerado com sucesso'
  })
  @ApiResponse({ status: 500, description: 'Erro ao gerar dashboard acumulado comparativo' })
  async dashboardAcumuladoComparativo(
    @Query('dataReferencia') dataReferencia?: string,
    @Query('forcar', new ParseBoolPipe({ optional: true })) forcar?: boolean
  ) {
    try {
      // ✅ PROCESSAR DATA DE REFERÊNCIA
      let dataRef = new Date();
      if (dataReferencia) {
        const dataParseada = new Date(dataReferencia);
        if (!isNaN(dataParseada.getTime())) {
          dataRef = dataParseada;
        } else {
          this.logger.warn(`⚠️ Data de referência inválida: ${dataReferencia}, usando data atual`);
        }
      }

      const forcarSincronizacao = forcar || false;

      this.logger.log(`📊 Gerando dashboard acumulado comparativo otimizado para ${dataRef.toISOString().slice(0, 10)} (forçar: ${forcarSincronizacao})...`);
      
      const dashboardComparativo = await this.pessoalService.gerarDashboardAcumuladoComparativo(dataRef, forcarSincronizacao);
      
      return {
        success: true,
        message: 'Dashboard acumulado comparativo de 4 períodos gerado com sucesso',
        data: dashboardComparativo,
        metadados: {
          dataReferencia: dataRef.toISOString().slice(0, 10),
          totalPeriodos: 4,
          tipoComparacao: 'Períodos acumulados desde Janeiro',
          periodos: [
            dashboardComparativo.mesesInfo.mesAnterior2.nome,
            dashboardComparativo.mesesInfo.mesAnterior1.nome,
            dashboardComparativo.mesesInfo.mesAtual.nome,
            dashboardComparativo.mesesInfo.mesAnoAnterior.nome
          ],
          performance: dashboardComparativo.metadados
        },
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar dashboard acumulado comparativo: ${error.message}`);
      throw new HttpException(
        `Erro ao gerar dashboard acumulado comparativo: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ SINCRONIZAR PERÍODO ACUMULADO OTIMIZADO
  @Post('sincronizar-acumulado')
  @Public()
  @ApiOperation({ 
    summary: 'Sincronizar dados acumulados (Janeiro até mês especificado) - Otimizado',
    description: 'Sincroniza dados acumulados - Usa cache inteligente - ENDPOINT PÚBLICO'
  })
  @ApiQuery({ 
    name: 'mesReferencia', 
    required: false, 
    type: String,
    description: 'Mês de referência (YYYY-MM). Padrão: mês atual',
    example: '2025-09'
  })
  @ApiQuery({ 
    name: 'forcar', 
    required: false, 
    type: Boolean,
    description: 'Forçar sincronização mesmo com cache válido. Padrão: false',
    example: false
  })
  @ApiResponse({ status: 200, description: 'Sincronização acumulada realizada com sucesso' })
  @ApiResponse({ status: 500, description: 'Erro na sincronização acumulada' })
  async sincronizarAcumulado(
    @Query('mesReferencia') mesReferencia?: string,
    @Query('forcar', new ParseBoolPipe({ optional: true })) forcar?: boolean
  ) {
    try {
      const mes = mesReferencia || new Date().toISOString().slice(0, 7);
      const forcarSincronizacao = forcar || false;
      const chaveAcumulada = `${mes}-ACUM`;
      
      this.logger.log(`🔄 Iniciando sincronização acumulada para Janeiro até ${mes} (forçar: ${forcarSincronizacao})...`);
      
      // ✅ VERIFICAR STATUS DO CACHE PRIMEIRO
      const statusCache = await this.pessoalService.verificarStatusCache(chaveAcumulada);
      
      let resultado;
      let usouCache = false;

      if (!forcarSincronizacao && statusCache.existeNoCache && !statusCache.precisaAtualizar) {
        // ✅ USAR DADOS DO CACHE
        usouCache = true;
        resultado = {
          totalProcessados: statusCache.totalRegistros,
          novos: 0,
          atualizados: 0,
          erros: 0,
          mesReferencia: chaveAcumulada,
          tempoExecucao: '0ms',
          fonte: 'cache' as const
        };
        this.logger.log(`💾 Usando dados acumulados do cache para ${mes} (${statusCache.totalRegistros} registros)`);
      } else {
        // ✅ SINCRONIZAR DO ORACLE
        resultado = await this.pessoalService.sincronizarFuncionariosAcumulado(mes);
      }
      
      return {
        success: true,
        message: usouCache 
          ? `Dados acumulados obtidos do cache para Janeiro até ${mes}` 
          : `Sincronização acumulada realizada com sucesso para Janeiro até ${mes}`,
        data: resultado,
        cache: {
          usouCache,
          statusAnterior: statusCache,
          economia: usouCache ? 'Evitou consulta ao Oracle' : 'Dados atualizados do Oracle'
        },
        metadados: {
          tipoSincronizacao: 'Acumulada',
          periodoInicio: `${mes.split('-')[0]}-01`,
          periodoFim: mes
        },
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro na sincronização acumulada: ${error.message}`);
      throw new HttpException(
        `Erro na sincronização acumulada: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ NOVA ROTA: SINCRONIZAR MÚLTIPLOS MESES OTIMIZADO
  @Post('sincronizar-multiplos')
  @Public()
  @ApiOperation({ 
    summary: 'Sincronizar múltiplos meses de uma vez (com cache inteligente)',
    description: 'Sincroniza os últimos 3 meses + mesmo mês ano anterior - Usa cache quando possível - ENDPOINT PÚBLICO'
  })
  @ApiQuery({ 
    name: 'dataReferencia', 
    required: false, 
    type: String,
    description: 'Data de referência (YYYY-MM-DD). Padrão: data atual',
    example: '2025-09-26'
  })
  @ApiQuery({ 
    name: 'forcar', 
    required: false, 
    type: Boolean,
    description: 'Forçar sincronização de todos os meses. Padrão: false',
    example: false
  })
  @ApiResponse({ status: 200, description: 'Sincronização múltipla realizada com sucesso' })
  async sincronizarMultiplosMeses(
    @Query('dataReferencia') dataReferencia?: string,
    @Query('forcar', new ParseBoolPipe({ optional: true })) forcar?: boolean
  ) {
    try {
      // ✅ PROCESSAR DATA DE REFERÊNCIA
      let dataRef = new Date();
      if (dataReferencia) {
        const dataParseada = new Date(dataReferencia);
        if (!isNaN(dataParseada.getTime())) {
          dataRef = dataParseada;
        }
      }

      const forcarSincronizacao = forcar || false;

      this.logger.log(`🔄 Iniciando sincronização múltipla otimizada para ${dataRef.toISOString().slice(0, 10)} (forçar: ${forcarSincronizacao})...`);
      
      // ✅ CALCULAR MESES
      const baseDate = new Date(dataRef.getFullYear(), dataRef.getMonth(), 1);
      const meses = [
        `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`, // Atual
        `${baseDate.getFullYear()}-${String(baseDate.getMonth()).padStart(2, '0')}`, // M-1
        `${baseDate.getFullYear()}-${String(baseDate.getMonth() - 1).padStart(2, '0')}`, // M-2
        `${baseDate.getFullYear() - 1}-${String(baseDate.getMonth() + 1).padStart(2, '0')}` // Ano anterior
      ].map(mes => {
        // ✅ CORRIGIR MESES NEGATIVOS
        const [ano, mesNum] = mes.split('-');
        let anoFinal = parseInt(ano);
        let mesFinal = parseInt(mesNum);
        
        if (mesFinal <= 0) {
          anoFinal--;
          mesFinal += 12;
        }
        
        return `${anoFinal}-${String(mesFinal).padStart(2, '0')}`;
      });

      this.logger.log(`📅 Meses a sincronizar: ${meses.join(', ')}`);

      // ✅ VERIFICAR STATUS DE CADA MÊS PRIMEIRO
      const statusPromises = meses.map(mes => this.pessoalService.verificarStatusCache(mes));
      const statusArray = await Promise.all(statusPromises);

      // ✅ DECIDIR QUAIS MESES PRECISAM SER SINCRONIZADOS
      const mesesParaSincronizar = meses.filter((mes, index) => {
        const status = statusArray[index];
        const precisaSincronizar = forcarSincronizacao || !status.existeNoCache || status.precisaAtualizar;
        
        if (!precisaSincronizar) {
          this.logger.log(`💾 Usando cache para ${mes} (${status.totalRegistros} registros, ${status.idadeCache})`);
        }
        
        return precisaSincronizar;
      });

      this.logger.log(`🔄 Sincronizando ${mesesParaSincronizar.length}/${meses.length} meses do Oracle...`);

      // ✅ SINCRONIZAR APENAS OS MESES NECESSÁRIOS
      const resultados = await Promise.allSettled(
        meses.map(async (mes, index) => {
          const status = statusArray[index];
          const precisaSincronizar = mesesParaSincronizar.includes(mes);
          
          if (precisaSincronizar) {
            try {
              const resultado = await this.pessoalService.sincronizarFuncionarios(mes);
              return { mes, resultado, status: 'success', fonte: 'oracle' };
            } catch (error) {
              this.logger.error(`❌ Erro ao sincronizar ${mes}: ${error.message}`);
              return { mes, error: error.message, status: 'error', fonte: 'oracle' };
            }
          } else {
            // ✅ USAR DADOS DO CACHE
            return { 
              mes, 
              resultado: {
                totalProcessados: status.totalRegistros,
                novos: 0,
                atualizados: 0,
                erros: 0,
                mesReferencia: mes,
                tempoExecucao: '0ms',
                fonte: 'cache' as const
              }, 
              status: 'success', 
              fonte: 'cache' 
            };
          }
        })
      );

      const sucessos = resultados.filter(r => r.status === 'fulfilled' && r.value.status === 'success').length;
      const erros = resultados.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'error')).length;
      const usouCache = resultados.filter(r => r.status === 'fulfilled' && r.value.fonte === 'cache').length;
      const consultouOracle = resultados.filter(r => r.status === 'fulfilled' && r.value.fonte === 'oracle').length;

      return {
        success: sucessos > 0,
        message: `Sincronização múltipla concluída: ${sucessos} sucessos, ${erros} erros`,
        data: {
          totalMeses: meses.length,
          sucessos,
          erros,
          performance: {
            usouCache,
            consultouOracle,
            economiaOracle: `${usouCache}/${meses.length} consultas evitadas`
          },
          resultados: resultados.map(r => r.status === 'fulfilled' ? r.value : { status: 'error', error: r.reason })
        },
        mesesSincronizados: meses,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro na sincronização múltipla: ${error.message}`);
      throw new HttpException(
        `Erro na sincronização múltipla: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ ADICIONAR NO CONTROLLER - Endpoint para testar sincronização

@Post('funcionarios-completos/teste-sincronizacao')
@Public()
@ApiOperation({ 
  summary: 'Testar sincronização de funcionários completos',
  description: 'Endpoint para testar a sincronização - ENDPOINT PÚBLICO'
})
async testeSincronizacaoFuncionariosCompletos() {
  try {
    this.logger.log(`🧪 Iniciando teste de sincronização...`);
    
    const resultado = await this.pessoalService.sincronizarFuncionariosCompletos();
    
    return {
      success: true,
      message: 'Teste de sincronização concluído',
      data: resultado,
      timestamp: new Date().toISOString(),
      endpoint: 'PÚBLICO - Teste de sincronização'
    };
  } catch (error) {
    this.logger.error(`❌ Erro no teste de sincronização: ${error.message}`);
    throw new HttpException(
      `Erro no teste de sincronização: ${error.message}`,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

  // ✅ ESTATÍSTICAS COMPARATIVAS OTIMIZADAS
  @Get('estatisticas-comparativas')
  @Public()
  @ApiOperation({ 
    summary: 'Estatísticas comparativas resumidas (4 meses) - Otimizado',
    description: 'Retorna números principais - Usa cache inteligente - ENDPOINT PÚBLICO'
  })
  @ApiResponse({ status: 200, description: 'Estatísticas comparativas retornadas com sucesso' })
  async estatisticasComparativas() {
    try {
      this.logger.log(`📊 Gerando estatísticas comparativas otimizadas...`);
      
      const estatisticas = await this.pessoalService.obterEstatisticasComparativas();
      
      return {
        success: true,
        message: 'Estatísticas comparativas geradas com sucesso',
        data: estatisticas,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar estatísticas comparativas: ${error.message}`);
      throw new HttpException(
        `Erro ao gerar estatísticas comparativas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ LISTAR FUNCIONÁRIOS OTIMIZADO
  @Get('funcionarios')
  @Public()
  @ApiOperation({ 
    summary: 'Listar funcionários (com cache inteligente)',
    description: 'Retorna lista paginada - Prioriza cache local - ENDPOINT PÚBLICO'
  })
  @ApiQuery({ name: 'codigoEmpresa', required: false, type: Number, description: 'Código da empresa' })
  @ApiQuery({ name: 'codfunc', required: false, type: Number, description: 'Código do funcionário' })
  @ApiQuery({ name: 'chapafunc', required: false, type: String, description: 'Chapa do funcionário' })
  @ApiQuery({ name: 'nomefunc', required: false, type: String, description: 'Nome do funcionário' })
  @ApiQuery({ name: 'cpf', required: false, type: String, description: 'CPF do funcionário' })
  @ApiQuery({ name: 'situacao', required: false, enum: ['ATIVO', 'AFASTADO', 'DEMITIDO'], description: 'Situação do funcionário' })
  @ApiQuery({ name: 'mesReferencia', required: false, type: String, description: 'Mês de referência (YYYY-MM)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página (padrão: 50)' })
  @ApiQuery({ name: 'orderBy', required: false, type: String, description: 'Campo para ordenação' })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['ASC', 'DESC'], description: 'Direção da ordenação' })
  @ApiResponse({ status: 200, description: 'Lista de funcionários retornada com sucesso' })
  async listarFuncionarios(@Query() filters: FuncionarioFilters) {
    try {
      this.logger.log(`🔍 Buscando funcionários com filtros otimizados: ${JSON.stringify(filters)}`);
      
      const resultado = await this.pessoalService.buscarFuncionarios(filters);
      
      return {
        success: true,
        message: `Encontrados ${resultado.total} funcionários`,
        data: resultado.data,
        pagination: {
          total: resultado.total,
          page: resultado.page,
          limit: resultado.limit,
          totalPages: resultado.totalPages
        },
        filters,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar funcionários: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar funcionários: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ BUSCAR FUNCIONÁRIO POR CÓDIGO OTIMIZADO
  @Get('funcionarios/codigo/:codfunc')
  @Public()
  @ApiOperation({ 
    summary: 'Buscar funcionário por código (com cache inteligente)',
    description: 'Retorna dados de um funcionário específico - Prioriza cache local - ENDPOINT PÚBLICO'
  })
  @ApiParam({ 
    name: 'codfunc', 
    type: Number,
    description: 'Código do funcionário',
    example: 12345
  })
  @ApiQuery({ 
    name: 'mesReferencia', 
    required: false, 
    type: String,
    description: 'Mês de referência (YYYY-MM)',
    example: '2025-09'
  })
  @ApiResponse({ status: 200, description: 'Funcionário encontrado' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  async buscarPorCodigo(
    @Param('codfunc', ParseIntPipe) codfunc: number,
    @Query('mesReferencia') mesReferencia?: string
  ) {
    try {
      this.logger.log(`🔍 Buscando funcionário código: ${codfunc}`);
      
      const funcionario = await this.pessoalService.buscarPorCodigo(codfunc, mesReferencia);
      
      if (!funcionario) {
        throw new HttpException('Funcionário não encontrado', HttpStatus.NOT_FOUND);
      }
      
      return {
        success: true,
        message: `Funcionário ${funcionario.nomefunc} encontrado`,
        data: funcionario,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`❌ Erro ao buscar funcionário: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar funcionário: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ BUSCAR FUNCIONÁRIO POR CPF OTIMIZADO
  @Get('funcionarios/cpf/:cpf')
  @Public()
  @ApiOperation({ 
    summary: 'Buscar funcionário por CPF (com cache inteligente)',
    description: 'Retorna dados de um funcionário específico - Prioriza cache local - ENDPOINT PÚBLICO'
  })
  @ApiParam({ 
    name: 'cpf', 
    type: String,
    description: 'CPF do funcionário (com ou sem formatação)',
    example: '12345678901'
  })
  @ApiQuery({ 
    name: 'mesReferencia', 
    required: false, 
    type: String,
    description: 'Mês de referência (YYYY-MM)',
    example: '2025-09'
  })
  @ApiResponse({ status: 200, description: 'Funcionário encontrado' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  async buscarPorCpf(
    @Param('cpf') cpf: string,
    @Query('mesReferencia') mesReferencia?: string
  ) {
    try {
      this.logger.log(`🔍 Buscando funcionário CPF: ${cpf}`);
      
      const funcionario = await this.pessoalService.buscarPorCpf(cpf, mesReferencia);
      
      if (!funcionario) {
        throw new HttpException('Funcionário não encontrado', HttpStatus.NOT_FOUND);
      }
      
      return {
        success: true,
        message: `Funcionário ${funcionario.nomefunc} encontrado`,
        data: funcionario,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`❌ Erro ao buscar funcionário: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar funcionário: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ ESTATÍSTICAS BÁSICAS OTIMIZADAS
  @Get('estatisticas')
  @Public()
  @ApiOperation({ 
    summary: 'Estatísticas básicas do departamento pessoal (com cache inteligente)',
    description: 'Retorna estatísticas resumidas - Prioriza cache local - ENDPOINT PÚBLICO'
  })
  @ApiQuery({ 
    name: 'mesReferencia', 
    required: false, 
    type: String,
    description: 'Mês de referência (YYYY-MM)',
    example: '2025-09'
  })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso' })
  async estatisticas(@Query('mesReferencia') mesReferencia?: string) {
    try {
      this.logger.log(`📊 Gerando estatísticas otimizadas para ${mesReferencia || 'mês atual'}...`);
      
      const estatisticas = await this.pessoalService.obterEstatisticas(mesReferencia);
      
      return {
        success: true,
        message: 'Estatísticas do departamento pessoal',
        data: estatisticas,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar estatísticas: ${error.message}`);
      throw new HttpException(
        `Erro ao gerar estatísticas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ FUNCIONÁRIOS POR SITUAÇÃO OTIMIZADO
  @Get('funcionarios/situacao/:situacao')
  @Public()
  @ApiOperation({ 
    summary: 'Listar funcionários por situação (com cache inteligente)',
    description: 'Retorna funcionários filtrados - Prioriza cache local - ENDPOINT PÚBLICO'
  })
  @ApiParam({ 
    name: 'situacao', 
    enum: ['ATIVO', 'AFASTADO', 'DEMITIDO'],
    description: 'Situação do funcionário',
    example: 'ATIVO'
  })
  @ApiQuery({ name: 'mesReferencia', required: false, type: String, description: 'Mês de referência (YYYY-MM)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página' })
  @ApiResponse({ status: 200, description: 'Funcionários por situação retornados com sucesso' })
  async funcionariosPorSituacao(
    @Param('situacao') situacao: string,
    @Query() filters: Partial<FuncionarioFilters>
  ) {
    try {
      const filtrosComSituacao = { ...filters, situacao };
      const resultado = await this.pessoalService.buscarFuncionarios(filtrosComSituacao);
      
      return {
        success: true,
        message: `Encontrados ${resultado.total} funcionários com situação ${situacao}`,
        data: resultado.data,
        pagination: {
          total: resultado.total,
          page: resultado.page,
          limit: resultado.limit,
          totalPages: resultado.totalPages
        },
        filtros: filtrosComSituacao,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar funcionários por situação: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar funcionários por situação: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ BUSCA POR NOME OTIMIZADA
  @Get('funcionarios/busca/:nome')
  @Public()
  @ApiOperation({ 
    summary: 'Buscar funcionários por nome (com cache inteligente)',
    description: 'Busca funcionários pelo nome - Prioriza cache local - ENDPOINT PÚBLICO'
  })
  @ApiParam({ 
    name: 'nome', 
    type: String,
    description: 'Nome ou parte do nome do funcionário',
    example: 'João'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Limite de resultados (padrão: 20)',
    example: 20
  })
  @ApiQuery({ 
    name: 'mesReferencia', 
    required: false, 
    type: String,
    description: 'Mês de referência (YYYY-MM)',
    example: '2025-09'
  })
  @ApiResponse({ status: 200, description: 'Busca realizada com sucesso' })
  async buscarPorNome(
    @Param('nome') nome: string,
    @Query('limit') limit?: number,
    @Query('mesReferencia') mesReferencia?: string
  ) {
    try {
      this.logger.log(`🔍 Buscando funcionários por nome: ${nome}`);
      
      const resultado = await this.pessoalService.buscarFuncionarios({
        nomefunc: nome,
        limit: limit || 20,
        mesReferencia
      });
      
      return {
        success: true,
        message: `Encontrados ${resultado.total} funcionários com nome "${nome}"`,
        data: resultado.data,
        pagination: {
          total: resultado.total,
          page: resultado.page,
          limit: resultado.limit,
          totalPages: resultado.totalPages
        },
        busca: nome,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar funcionários por nome: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar funcionários por nome: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ STATUS DE SINCRONIZAÇÃO OTIMIZADO
  @Get('status-sincronizacao')
  @Public()
  @ApiOperation({ 
    summary: 'Status de sincronização dos meses (com informações de cache)',
    description: 'Verifica status do cache e necessidade de sincronização - ENDPOINT PÚBLICO'
  })
  @ApiResponse({ status: 200, description: 'Status de sincronização retornado com sucesso' })
  async statusSincronizacao() {
    try {
      this.logger.log(`📊 Verificando status de sincronização otimizado...`);
      
      const status = await this.pessoalService.obterStatusMultiplosMeses();

      const totalSincronizados = status.filter(s => s.existeNoCache).length;
      const totalMeses = status.length;
      const precisamAtualizacao = status.filter(s => s.precisaAtualizar).length;

      return {
        success: true,
        message: `Status de sincronização: ${totalSincronizados}/${totalMeses} meses com dados, ${precisamAtualizacao} precisam atualização`,
        data: {
          resumo: {
            totalMeses,
            sincronizados: totalSincronizados,
            pendentes: totalMeses - totalSincronizados,
            precisamAtualizacao,
            percentualSincronizado: Math.round((totalSincronizados / totalMeses) * 100),
            cacheValido: totalSincronizados - precisamAtualizacao
          },
          detalhes: status
        },
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao verificar status de sincronização: ${error.message}`);
      throw new HttpException(
        `Erro ao verificar status de sincronização: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ =====================================================
  // ✅ NOVOS ENDPOINTS PARA FUNCIONÁRIOS COMPLETOS
  // ✅ =====================================================

  // ✅ LISTAR FUNCIONÁRIOS COMPLETOS (CORRIGIDO)
  @Get('funcionarios-completos')
  @Public()
  @ApiOperation({ 
    summary: 'Listar funcionários completos (com cache inteligente)',
    description: 'Retorna lista completa com todos os dados - Prioriza cache local - ENDPOINT PÚBLICO'
  })
  @ApiQuery({ name: 'empresa', required: false, type: Number, description: 'Código da empresa' })
  @ApiQuery({ name: 'cracha', required: false, type: Number, description: 'Número do crachá' })
  @ApiQuery({ name: 'chapa', required: false, type: String, description: 'Chapa do funcionário' })
  @ApiQuery({ name: 'nome', required: false, type: String, description: 'Nome do funcionário' })
  @ApiQuery({ name: 'cpf', required: false, type: String, description: 'CPF do funcionário' })
  @ApiQuery({ name: 'mae', required: false, type: String, description: 'Nome da mãe' })
  @ApiQuery({ name: 'funcao', required: false, type: String, description: 'Função do funcionário' })
  @ApiQuery({ name: 'departamento', required: false, type: String, description: 'Departamento' })
  @ApiQuery({ name: 'area', required: false, type: String, description: 'Área' })
  @ApiQuery({ name: 'setor', required: false, type: String, description: 'Setor' })
  @ApiQuery({ name: 'cidade', required: false, type: String, description: 'Cidade' })
  @ApiQuery({ name: 'bairro', required: false, type: String, description: 'Bairro' })
  @ApiQuery({ name: 'situacao', required: false, enum: ['A', 'F', 'D'], description: 'Situação (A=Ativo, F=Funcionário, D=Demitido)' })
  @ApiQuery({ name: 'valeRefeicao', required: false, enum: ['S', 'N'], description: 'Vale refeição (S/N)' })
  @ApiQuery({ name: 'temQuitacao', required: false, type: Boolean, description: 'Tem quitação' })
  @ApiQuery({ name: 'ativo', required: false, type: Boolean, description: 'Funcionário ativo' })
  @ApiQuery({ name: 'dataAdmissaoInicio', required: false, type: String, description: 'Data admissão início (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataAdmissaoFim', required: false, type: String, description: 'Data admissão fim (YYYY-MM-DD)' })
  @ApiQuery({ name: 'salarioMinimo', required: false, type: Number, description: 'Salário mínimo' })
  @ApiQuery({ name: 'salarioMaximo', required: false, type: Number, description: 'Salário máximo' })
  @ApiQuery({ name: 'dataDesligamentoInicio', required: false, type: String, description: 'Data desligamento início (YYYY-MM-DD)' })
  @ApiQuery({ name: 'dataDesligamentoFim', required: false, type: String, description: 'Data desligamento fim (YYYY-MM-DD)' })
  @ApiQuery({ name: 'mesReferencia', required: false, type: String, description: 'Mês de referência (YYYY-MM)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página (padrão: 50)' })
  @ApiQuery({ name: 'orderBy', required: false, type: String, description: 'Campo para ordenação' })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['ASC', 'DESC'], description: 'Direção da ordenação' })
  @ApiResponse({ status: 200, description: 'Lista de funcionários completos retornada com sucesso' })
  async listarFuncionariosCompletos(@Query() filters: FuncionarioCompletoFilters) {
    try {
      this.logger.log(`🔍 Buscando funcionários completos com filtros: ${JSON.stringify(filters)}`);
      
      const resultado = await this.pessoalService.buscarFuncionariosCompletos(filters);
      
      return {
        success: true,
        message: `Encontrados ${resultado.total} funcionários completos`,
        data: resultado.data,
        pagination: {
          total: resultado.total,
          page: resultado.page,
          limit: resultado.limit,
          totalPages: resultado.totalPages
        },
        // ✅ REMOVER filtrosAplicados daqui - este método não tem essa propriedade
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar funcionários completos: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar funcionários completos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ BUSCAR FUNCIONÁRIO COMPLETO POR CRACHÁ
  @Get('funcionarios-completos/cracha/:cracha')
  @Public()
  @ApiOperation({ 
    summary: 'Buscar funcionário completo por crachá',
    description: 'Retorna dados completos de um funcionário específico - ENDPOINT PÚBLICO'
  })
  @ApiParam({ 
    name: 'cracha', 
    type: Number,
    description: 'Número do crachá',
    example: 12345
  })
  @ApiQuery({ 
    name: 'mesReferencia', 
    required: false, 
    type: String,
    description: 'Mês de referência (YYYY-MM)',
    example: '2025-09'
  })
  @ApiResponse({ status: 200, description: 'Funcionário encontrado' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  async buscarPorCracha(
    @Param('cracha', ParseIntPipe) cracha: number,
    @Query('mesReferencia') mesReferencia?: string
  ) {
    try {
      this.logger.log(`🔍 Buscando funcionário completo por crachá: ${cracha}`);
      
      const funcionario = await this.pessoalService.buscarPorCracha(cracha, mesReferencia);
      
      if (!funcionario) {
        throw new HttpException('Funcionário não encontrado', HttpStatus.NOT_FOUND);
      }
      
      return {
        success: true,
        message: `Funcionário ${funcionario.nome} encontrado`,
        data: funcionario,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`❌ Erro ao buscar funcionário por crachá: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar funcionário por crachá: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ BUSCAR FUNCIONÁRIO COMPLETO POR CPF
  @Get('funcionarios-completos/cpf/:cpf')
  @Public()
  @ApiOperation({ 
    summary: 'Buscar funcionário completo por CPF',
    description: 'Retorna dados completos de um funcionário específico - ENDPOINT PÚBLICO'
  })
  @ApiParam({ 
    name: 'cpf', 
    type: String,
    description: 'CPF do funcionário (com ou sem formatação)',
    example: '12345678901'
  })
  @ApiQuery({ 
    name: 'mesReferencia', 
    required: false, 
    type: String,
    description: 'Mês de referência (YYYY-MM)',
    example: '2025-09'
  })
  @ApiResponse({ status: 200, description: 'Funcionário encontrado' })
  @ApiResponse({ status: 404, description: 'Funcionário não encontrado' })
  async buscarPorCpfCompleto(
    @Param('cpf') cpf: string,
    @Query('mesReferencia') mesReferencia?: string
  ) {
    try {
      this.logger.log(`🔍 Buscando funcionário completo por CPF: ${cpf}`);
      
      const funcionario = await this.pessoalService.buscarPorCpfCompleto(cpf, mesReferencia);
      
      if (!funcionario) {
        throw new HttpException('Funcionário não encontrado', HttpStatus.NOT_FOUND);
      }
      
      return {
        success: true,
        message: `Funcionário ${funcionario.nome} encontrado`,
        data: funcionario,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`❌ Erro ao buscar funcionário completo por CPF: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar funcionário completo por CPF: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ BUSCAR FUNCIONÁRIOS POR DEPARTAMENTO
  @Get('funcionarios-completos/departamento/:departamento')
  @Public()
  @ApiOperation({ 
    summary: 'Buscar funcionários por departamento',
    description: 'Retorna funcionários de um departamento específico - ENDPOINT PÚBLICO'
  })
  @ApiParam({ 
    name: 'departamento', 
    type: String,
    description: 'Nome do departamento',
    example: 'OPERACAO'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página' })
  @ApiQuery({ name: 'mesReferencia', required: false, type: String, description: 'Mês de referência (YYYY-MM)' })
  @ApiResponse({ status: 200, description: 'Funcionários do departamento retornados com sucesso' })
  async buscarPorDepartamento(
    @Param('departamento') departamento: string,
    @Query() filters: Partial<FuncionarioCompletoFilters>
  ) {
    try {
      this.logger.log(`🔍 Buscando funcionários do departamento: ${departamento}`);
      
      const resultado = await this.pessoalService.buscarPorDepartamento(departamento, filters);
      
      return {
        success: true,
        message: `Encontrados ${resultado.total} funcionários no departamento ${departamento}`,
        data: resultado.data,
        pagination: {
          total: resultado.total,
          page: resultado.page,
          limit: resultado.limit,
          totalPages: resultado.totalPages
        },
        departamento,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar funcionários por departamento: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar funcionários por departamento: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ BUSCAR FUNCIONÁRIOS POR SITUAÇÃO (COMPLETOS)
  @Get('funcionarios-completos/situacao/:situacao')
  @Public()
  @ApiOperation({ 
    summary: 'Buscar funcionários completos por situação',
    description: 'Retorna funcionários filtrados por situação - ENDPOINT PÚBLICO'
  })
  @ApiParam({ 
    name: 'situacao', 
    enum: ['A', 'F', 'D'],
    description: 'Situação do funcionário (A=Ativo, F=Funcionário, D=Demitido)',
    example: 'A'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página' })
  @ApiQuery({ name: 'mesReferencia', required: false, type: String, description: 'Mês de referência (YYYY-MM)' })
  @ApiResponse({ status: 200, description: 'Funcionários por situação retornados com sucesso' })
  async buscarPorSituacaoCompleto(
    @Param('situacao') situacao: 'A' | 'F' | 'D',
    @Query() filters: Partial<FuncionarioCompletoFilters>
  ) {
    try {
      this.logger.log(`🔍 Buscando funcionários completos por situação: ${situacao}`);
      
      const resultado = await this.pessoalService.buscarPorSituacaoCompleto(situacao, filters);
      
      const situacaoDescricao = situacao === 'A' ? 'ATIVO' : situacao === 'F' ? 'FUNCIONÁRIO' : 'DEMITIDO';
      
      return {
        success: true,
        message: `Encontrados ${resultado.total} funcionários com situação ${situacaoDescricao}`,
        data: resultado.data,
        pagination: {
          total: resultado.total,
          page: resultado.page,
          limit: resultado.limit,
          totalPages: resultado.totalPages
        },
        situacao: situacaoDescricao,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar funcionários por situação: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar funcionários por situação: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ DASHBOARD FUNCIONÁRIOS COMPLETOS
  @Get('funcionarios-completos/dashboard')
  @Public()
  @ApiOperation({ 
    summary: 'Dashboard de funcionários completos',
    description: 'Retorna dashboard específico com dados completos - ENDPOINT PÚBLICO'
  })
  @ApiQuery({ 
    name: 'mesReferencia', 
    required: false, 
    type: String,
    description: 'Mês de referência (YYYY-MM). Padrão: mês atual',
    example: '2025-09'
  })
  @ApiResponse({ status: 200, description: 'Dashboard de funcionários completos gerado com sucesso' })
  async dashboardFuncionariosCompletos(
    @Query('mesReferencia') mesReferencia?: string
  ) {
    try {
      const mes = mesReferencia || new Date().toISOString().slice(0, 7);
      
      this.logger.log(`📊 Gerando dashboard de funcionários completos para ${mes}...`);
      
      const dashboard = await this.pessoalService.gerarDashboardFuncionariosCompletos(mes);
      
      return {
        success: true,
        message: 'Dashboard de funcionários completos gerado com sucesso',
        data: dashboard,
        mesReferencia: mes,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar dashboard de funcionários completos: ${error.message}`);
      throw new HttpException(
        `Erro ao gerar dashboard de funcionários completos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ SINCRONIZAR FUNCIONÁRIOS COMPLETOS
  @Post('funcionarios-completos/sincronizar')
  @Public()
  @ApiOperation({ 
    summary: 'Sincronizar funcionários completos',
    description: 'Busca dados completos do Oracle e salva no PostgreSQL - ENDPOINT PÚBLICO'
  })
  @ApiQuery({ 
    name: 'mesReferencia', 
    required: false, 
    type: String,
    description: 'Mês de referência (YYYY-MM). Padrão: mês atual',
    example: '2025-09'
  })
  @ApiResponse({ status: 200, description: 'Sincronização de funcionários completos realizada com sucesso' })
  @ApiResponse({ status: 500, description: 'Erro na sincronização' })
  async sincronizarFuncionariosCompletos(
    @Query('mesReferencia') mesReferencia?: string
  ) {
    try {
      const mes = mesReferencia || new Date().toISOString().slice(0, 7);
      
      this.logger.log(`🔄 Iniciando sincronização de funcionários completos para ${mes}...`);
      
      const resultado = await this.pessoalService.sincronizarFuncionariosCompletos(mes);
      
      return {
        success: true,
        message: `Sincronização de funcionários completos realizada com sucesso para ${mes}`,
        data: resultado,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro na sincronização de funcionários completos: ${error.message}`);
      throw new HttpException(
        `Erro na sincronização de funcionários completos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ BUSCA AVANÇADA FUNCIONÁRIOS COMPLETOS (CORRIGIDO)
  @Post('funcionarios-completos/busca-avancada')
@Public()
@ApiOperation({ 
  summary: 'Busca avançada de funcionários completos',
  description: 'Busca com múltiplos filtros e resumo estatístico - ENDPOINT PÚBLICO'
})
@ApiBody({
  description: 'Filtros para busca avançada',
  schema: {
    type: 'object',
    properties: {
      empresa: { type: 'number', example: 4 },
      nome: { type: 'string', example: 'João' },
      departamento: { type: 'string', example: 'OPERACAO' },
      situacao: { type: 'string', enum: ['A', 'F', 'D'], example: 'A' },
      salarioMinimo: { type: 'number', example: 1000 },
      salarioMaximo: { type: 'number', example: 5000 },
      cidade: { type: 'string', example: 'BRASILIA' },
      temQuitacao: { type: 'boolean', example: false },
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 50 }
    }
  }
})
@ApiResponse({ status: 200, description: 'Busca avançada realizada com sucesso' })
async buscaAvancadaFuncionariosCompletos(
  @Body() filtros: FuncionarioCompletoFilters
) {
  try {
    this.logger.log(`🔍 Realizando busca avançada de funcionários completos...`);
    
    const resultado = await this.pessoalService.buscaAvancadaFuncionariosCompletos(filtros);
    
    // ✅ VERIFICAR SE O RESULTADO TEM AS PROPRIEDADES NECESSÁRIAS
    const page = resultado.page || filtros.page || 1;
    const limit = resultado.limit || filtros.limit || 50;
    const totalPages = resultado.totalPages || Math.ceil(resultado.total / limit);
    
    return {
      success: true,
      message: `Busca avançada concluída: ${resultado.total} funcionários encontrados`,
      data: resultado.data,
      pagination: {
        total: resultado.total,
        page: page,
        limit: limit,
        totalPages: totalPages
      },
      filtrosAplicados: resultado.filtrosAplicados || [],
      resumo: resultado.resumo || {
        totalEncontrados: resultado.total,
        salarioMedio: 0,
        idadeMedia: 0
      },
      timestamp: new Date().toISOString(),
      endpoint: 'PÚBLICO - Sem autenticação necessária'
    };
  } catch (error) {
    this.logger.error(`❌ Erro na busca avançada: ${error.message}`);
    throw new HttpException(
      `Erro na busca avançada: ${error.message}`,
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

  // ✅ AGRUPAMENTOS POR TIPO
  @Get('funcionarios-completos/agrupamentos/:tipo')
  @Public()
  @ApiOperation({ 
    summary: 'Agrupamentos de funcionários por tipo',
    description: 'Retorna dados agrupados por departamento, área, cidade, etc. - ENDPOINT PÚBLICO'
  })
  @ApiParam({ 
    name: 'tipo', 
    enum: ['departamento', 'area', 'cidade', 'situacao', 'faixaSalarial'],
    description: 'Tipo de agrupamento',
    example: 'departamento'
  })
  @ApiQuery({ 
    name: 'mesReferencia', 
    required: false, 
    type: String,
    description: 'Mês de referência (YYYY-MM)',
    example: '2025-09'
  })
  @ApiResponse({ status: 200, description: 'Agrupamentos retornados com sucesso' })
  async agrupamentosPorTipo(
    @Param('tipo') tipo: string,
    @Query('mesReferencia') mesReferencia?: string
  ) {
    try {
      const mes = mesReferencia || new Date().toISOString().slice(0, 7);
      
      this.logger.log(`📊 Gerando agrupamentos por ${tipo} para ${mes}...`);
      
      // ✅ BUSCAR DADOS PARA AGRUPAMENTO
      const funcionarios = await this.pessoalService.buscarFuncionariosCompletos({
        mesReferencia: mes,
        limit: 10000 // Buscar todos para agrupamento
      });

      let agrupamentos = [];
      
      switch (tipo) {
        case 'departamento':
          agrupamentos = this.agruparPorDepartamento(funcionarios.data);
          break;
        case 'area':
          agrupamentos = this.agruparPorArea(funcionarios.data);
          break;
        case 'cidade':
          agrupamentos = this.agruparPorCidade(funcionarios.data);
          break;
        case 'situacao':
          agrupamentos = this.agruparPorSituacao(funcionarios.data);
          break;
        case 'faixaSalarial':
          agrupamentos = this.agruparPorFaixaSalarial(funcionarios.data);
          break;
        default:
          throw new HttpException('Tipo de agrupamento inválido', HttpStatus.BAD_REQUEST);
      }
      
      return {
        success: true,
        message: `Agrupamento por ${tipo} gerado com sucesso`,
        data: agrupamentos,
        tipo,
        mesReferencia: mes,
        totalFuncionarios: funcionarios.total,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar agrupamentos: ${error.message}`);
      throw new HttpException(
        `Erro ao gerar agrupamentos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ MÉTODOS AUXILIARES PRIVADOS

  private formatarNomeMes(mesAno: string): string {
    try {
      const [ano, mes] = mesAno.split('-');
      const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      return `${meses[parseInt(mes) - 1]} de ${ano}`;
    } catch (error) {
      return mesAno;
    }
  }

  private async obterUltimaAtualizacao(mesReferencia: string): Promise<string | null> {
    try {
      const funcionario = await this.pessoalService['funcionarioRepository'].findOne({
        where: { mesReferencia },
        order: { sincronizadoEm: 'DESC' }
      });
      
      return funcionario ? funcionario.sincronizadoEm.toISOString() : null;
    } catch (error) {
      return null;
    }
  }

  // ✅ MÉTODOS DE AGRUPAMENTO

  private agruparPorDepartamento(funcionarios: any[]) {
    const grupos = funcionarios.reduce((acc, f) => {
      const dept = f.departamento || 'NÃO INFORMADO';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(f);
      return acc;
    }, {});

    const total = funcionarios.length;
    return Object.entries(grupos).map(([departamento, funcionarios]: [string, any[]]) => ({
      departamento,
      total: funcionarios.length,
      percentual: total > 0 ? Math.round((funcionarios.length / total) * 100 * 10) / 10 : 0
    })).sort((a, b) => b.total - a.total);
  }

  private agruparPorArea(funcionarios: any[]) {
    const grupos = funcionarios.reduce((acc, f) => {
      const area = f.area || 'NÃO INFORMADO';
      if (!acc[area]) acc[area] = [];
      acc[area].push(f);
      return acc;
    }, {});

    const total = funcionarios.length;
    return Object.entries(grupos).map(([area, funcionarios]: [string, any[]]) => ({
      area,
      total: funcionarios.length,
      percentual: total > 0 ? Math.round((funcionarios.length / total) * 100 * 10) / 10 : 0
    })).sort((a, b) => b.total - a.total);
  }

  private agruparPorCidade(funcionarios: any[]) {
    const grupos = funcionarios.reduce((acc, f) => {
      const cidade = f.cidade || 'NÃO INFORMADO';
      if (!acc[cidade]) acc[cidade] = [];
      acc[cidade].push(f);
      return acc;
    }, {});

    const total = funcionarios.length;
    return Object.entries(grupos).map(([cidade, funcionarios]: [string, any[]]) => ({
      cidade,
      total: funcionarios.length,
      percentual: total > 0 ? Math.round((funcionarios.length / total) * 100 * 10) / 10 : 0
    })).sort((a, b) => b.total - a.total);
  }

  private agruparPorSituacao(funcionarios: any[]) {
    const grupos = funcionarios.reduce((acc, f) => {
      const situacao = f.situacaoDescricao || 'NÃO INFORMADO';
      if (!acc[situacao]) acc[situacao] = [];
      acc[situacao].push(f);
      return acc;
    }, {});

    const total = funcionarios.length;
    return Object.entries(grupos).map(([situacao, funcionarios]: [string, any[]]) => ({
      situacao,
      total: funcionarios.length,
      percentual: total > 0 ? Math.round((funcionarios.length / total) * 100 * 10) / 10 : 0
    })).sort((a, b) => b.total - a.total);
  }

  private agruparPorFaixaSalarial(funcionarios: any[]) {
    const faixas = {
      'Até R$ 1.000': [],
      'R$ 1.001 - R$ 2.000': [],
      'R$ 2.001 - R$ 3.000': [],
      'R$ 3.001 - R$ 5.000': [],
      'R$ 5.001 - R$ 10.000': [],
      'Acima de R$ 10.000': [],
      'NÃO INFORMADO': []
    };

    funcionarios.forEach(f => {
      if (!f.salarioTotal || f.salarioTotal <= 0) {
        faixas['NÃO INFORMADO'].push(f);
      } else if (f.salarioTotal <= 1000) {
        faixas['Até R$ 1.000'].push(f);
      } else if (f.salarioTotal <= 2000) {
        faixas['R$ 1.001 - R$ 2.000'].push(f);
      } else if (f.salarioTotal <= 3000) {
        faixas['R$ 2.001 - R$ 3.000'].push(f);
      } else if (f.salarioTotal <= 5000) {
        faixas['R$ 3.001 - R$ 5.000'].push(f);
      } else if (f.salarioTotal <= 10000) {
        faixas['R$ 5.001 - R$ 10.000'].push(f);
      } else {
        faixas['Acima de R$ 10.000'].push(f);
      }
    });

    const total = funcionarios.length;
    return Object.entries(faixas).map(([faixa, funcionarios]: [string, any[]]) => ({
      faixa,
      total: funcionarios.length,
      percentual: total > 0 ? Math.round((funcionarios.length / total) * 100 * 10) / 10 : 0
    }));
  }
}