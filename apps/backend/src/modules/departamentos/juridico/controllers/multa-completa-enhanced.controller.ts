// apps/backend/src/modules/departamentos/juridico/controllers/multa-completa-enhanced.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Query, 
  Param, 
  Delete,
  Logger,
  HttpStatus,
  HttpException,
  Body
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MultaCompletaEnhancedService, MultaEnhancedFilter } from '../services/multa-completa-enhanced.service';
import { Public } from '../../../../auth/decorators/public.decorator';

@ApiTags('Jurídico - Multas Enhanced')
@Controller('juridico/multas-enhanced')
export class MultaCompletaEnhancedController {
  private readonly logger = new Logger(MultaCompletaEnhancedController.name);

  constructor(private readonly multaEnhancedService: MultaCompletaEnhancedService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Buscar multas com filtros avançados e regras de negócio' })
  @ApiResponse({ status: 200, description: 'Lista de multas enhanced' })
  async buscarMultasEnhanced(@Query() filters: MultaEnhancedFilter) {
    try {
      this.logger.log(`🔍 Buscando multas enhanced: ${JSON.stringify(filters)}`);
      
      const startTime = Date.now();
      const resultado = await this.multaEnhancedService.buscarMultasEnhanced(filters);
      const executionTime = Date.now() - startTime;
      
      this.logger.log(`✅ Encontradas ${resultado.pagination.total} multas enhanced`);
      
      return {
        ...resultado,
        filters: filters,
        timestamp: new Date().toISOString(),
        executionTime: `${executionTime}ms`,
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar multas enhanced: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar multas enhanced: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('analytics')
  @Public()
  @ApiOperation({ summary: 'Analytics detalhado das multas enhanced' })
  @ApiResponse({ status: 200, description: 'Analytics das multas' })
  async obterAnalytics(@Query() filters: MultaEnhancedFilter) {
    try {
      this.logger.log(`📊 Buscando analytics enhanced: ${JSON.stringify(filters)}`);
      
      const resultado = await this.multaEnhancedService.buscarMultasEnhanced({
        ...filters,
        includeAnalytics: true,
        limit: 10000
      });
      
      this.logger.log(`✅ Analytics enhanced processados para ${resultado.pagination.total} multas`);
      
      return {
        success: true,
        message: `Analytics processados para ${resultado.pagination.total} multas`,
        data: {
          resumo: resultado.resumo,
          analytics: resultado.analytics,
          distribuicoes: {
            porTipo: resultado.analytics?.distribuicaoPorTipo || [],
            porGravidade: resultado.analytics?.distribuicaoPorGravidade || [],
            porArea: resultado.analytics?.distribuicaoPorArea || [],
            porResponsavel: resultado.analytics?.distribuicaoPorResponsavel || [],
            porHorario: resultado.analytics?.distribuicaoPorHorario || []
          },
          rankings: {
            topAgentes: resultado.analytics?.topAgentes || [],
            topLocais: resultado.analytics?.topLocais || [],
            topCausasReais: resultado.analytics?.topCausasReais || []
          },
          evolucao: {
            mensal: resultado.analytics?.evolucaoMensal || [],
            estatisticasHorario: resultado.analytics?.estatisticasHorario || {}
          }
        },
        filters: filters,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao obter analytics enhanced: ${error.message}`);
      throw new HttpException(
        `Erro ao obter analytics enhanced: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('alertas-defesa')
  @Public()
  @ApiOperation({ summary: 'Multas com alerta de prazo de defesa (1 semana)' })
  @ApiResponse({ status: 200, description: 'Alertas de defesa' })
  async obterAlertasDefesa() {
    try {
      this.logger.log('�� Obtendo alertas de defesa...');
      
      const alertas = await this.multaEnhancedService.obterAlertasDefesa();
      
      this.logger.log(`✅ Encontrados ${alertas.length} alertas de defesa`);
      
      return {
        success: true,
        message: `Encontrados ${alertas.length} alertas de defesa`,
        data: alertas,
        resumo: {
          totalAlertas: alertas.length,
          alertasUrgentes: alertas.filter(a => a.diasParaDefesa <= 3).length,
          alertasProximos: alertas.filter(a => a.diasParaDefesa > 3 && a.diasParaDefesa <= 7).length
        },
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao obter alertas de defesa: ${error.message}`);
      throw new HttpException(
        `Erro ao obter alertas de defesa: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('dashboard-executivo')
  @Public()
  @ApiOperation({ summary: 'Dashboard executivo com KPIs principais' })
  @ApiResponse({ status: 200, description: 'Dashboard executivo' })
  async obterDashboardExecutivo(@Query() filters: MultaEnhancedFilter) {
    try {
      this.logger.log(`📈 Obtendo dashboard executivo: ${JSON.stringify(filters)}`);
      
      const dashboard = await this.multaEnhancedService.obterDashboardExecutivo(filters);
      
      this.logger.log('✅ Dashboard executivo gerado com sucesso');
      
      return {
        success: true,
        message: 'Dashboard executivo gerado',
        data: dashboard,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao obter dashboard executivo: ${error.message}`);
      throw new HttpException(
        `Erro ao obter dashboard executivo: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('numero/:numeroAiMulta')
  @Public()
  @ApiOperation({ summary: 'Buscar multa específica por número com dados enriquecidos' })
  @ApiResponse({ status: 200, description: 'Dados da multa enhanced' })
  @ApiResponse({ status: 404, description: 'Multa não encontrada' })
  async buscarPorNumero(@Param('numeroAiMulta') numeroAiMulta: string) {
    try {
      this.logger.log(`�� Buscando multa enhanced: ${numeroAiMulta}`);
      
      const multa = await this.multaEnhancedService.buscarPorNumero(numeroAiMulta);
      
      if (!multa) {
        throw new HttpException('Multa não encontrada', HttpStatus.NOT_FOUND);
      }
      
      return {
        success: true,
        message: 'Multa encontrada com dados enriquecidos',
        data: multa,
        classificacoes: {
          tipoMulta: multa.tipoMulta,
          tipoResponsavel: multa.tipoResponsavel,
          gravidadeValor: multa.gravidadeValor,
          areaCompetenciaDesc: multa.areaCompetenciaDesc,
          responsavelNotificacaoDesc: multa.responsavelNotificacaoDesc,
          statusMulta: multa.statusMulta
        },
        alertas: {
          alertaDefesa: multa.alertaDefesa,
          diasParaDefesa: multa.diasParaDefesa,
          temProcessoNotificacao: multa.temProcessoNotificacao,
          temObservacaoRealMotivo: multa.temObservacaoRealMotivo,
          temCodigoLinha: multa.temCodigoLinha
        },
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`❌ Erro ao buscar multa enhanced: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar multa enhanced: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('sincronizar')
  @Public()
  @ApiOperation({ summary: 'Sincronizar dados manualmente do Oracle' })
  @ApiResponse({ status: 200, description: 'Sincronização realizada' })
  async sincronizarManual(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string
  ) {
    try {
      this.logger.log(`🔄 Iniciando sincronização manual enhanced: ${dataInicio} a ${dataFim}`);
      
      const resultado = await this.multaEnhancedService.sincronizarManual(dataInicio, dataFim);
      
      this.logger.log(`✅ Sincronização enhanced concluída: ${resultado.novos} novos, ${resultado.atualizados} atualizados`);
      
      return {
        success: true,
        message: 'Sincronização enhanced realizada com sucesso',
        data: resultado,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro na sincronização enhanced: ${error.message}`);
      throw new HttpException(
        `Erro na sincronização enhanced: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('busca-avancada')
  @Public()
  @ApiOperation({ summary: 'Busca avançada com múltiplos critérios' })
  @ApiResponse({ status: 200, description: 'Resultados da busca avançada' })
  async buscaAvancada(@Body() criterios: {
    textoLivre?: string;
    campos?: string[];
    operador?: 'AND' | 'OR';
  } & MultaEnhancedFilter) {
    try {
      this.logger.log(`🔍 Busca avançada: ${JSON.stringify(criterios)}`);
      
      const resultado = await this.multaEnhancedService.buscaAvancada(criterios);
      
      return {
        ...resultado,
        criterios,
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

  @Get('agrupamentos/:tipo')
  @Public()
  @ApiOperation({ summary: 'Obter agrupamentos específicos' })
  @ApiResponse({ status: 200, description: 'Dados agrupados' })
  async obterAgrupamentos(
    @Param('tipo') tipo: 'agente' | 'area' | 'responsavel' | 'gravidade' | 'tipo' | 'mes' | 'horario',
    @Query() filters: MultaEnhancedFilter
  ) {
    try {
      this.logger.log(`📊 Obtendo agrupamento por: ${tipo}`);
      
      const resultado = await this.multaEnhancedService.buscarMultasEnhanced({
        ...filters,
        groupBy: tipo,
        limit: 1000
      });
      
      return {
        success: true,
        message: `Agrupamento por ${tipo} realizado`,
        data: resultado.groups || [],
        resumo: resultado.resumo,
        tipo,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao obter agrupamento: ${error.message}`);
      throw new HttpException(
        `Erro ao obter agrupamento: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}