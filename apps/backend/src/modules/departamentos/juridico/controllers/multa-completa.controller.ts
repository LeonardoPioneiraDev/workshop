// apps/backend/src/modules/departamentos/juridico/controllers/multa-completa.controller.ts - TOTALMENTE CORRIGIDO

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
  Res
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { MultaCompletaService } from '../services/multa-completa.service';
import { MultaCompletaFilterDto } from '../dto/multa-completa-filter.dto';
import { 
  SyncResult,
  Analytics,
  DistribuicaoPorTipo,
  DistribuicaoPorGravidade,
  TopAgente,
  TopLocal,
  GravidadeData,
  AgenteData,
  LocalData
} from '../types/multa-completa.types';

@ApiTags('Jurídico - Multas Completas')
@Controller('juridico/multas-completas')
export class MultaCompletaController {
  private readonly logger = new Logger(MultaCompletaController.name);

  constructor(private readonly multaCompletaService: MultaCompletaService) {}

  @Get()
  @ApiOperation({ summary: 'Buscar multas completas com filtros e agrupamentos' })
  @ApiResponse({ status: 200, description: 'Lista de multas completas' })
  async buscarMultasCompletas(@Query() filters: MultaCompletaFilterDto) {
    try {
      this.logger.log(`🔍 Buscando multas completas: ${JSON.stringify(filters)}`);
      
      const startTime = Date.now();
      const resultado = await this.multaCompletaService.buscarMultasCompletas(filters);
      const executionTime = Date.now() - startTime;
      
      this.logger.log(`✅ Encontradas ${resultado.total} multas`);
      
      return {
        success: true,
        message: `Encontradas ${resultado.total} multas`,
        data: resultado.data,
        pagination: {
          total: resultado.total,
          page: resultado.page,
          limit: resultado.limit,
          totalPages: resultado.totalPages
        },
        summary: resultado.summary,
        groups: resultado.groups,
        filters: filters,
        timestamp: new Date().toISOString(),
        executionTime: `${executionTime}ms`
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar multas: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar multas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Obter analytics avançados das multas' })
  @ApiResponse({ status: 200, description: 'Analytics das multas' })
  async obterAnalytics(@Query() filters: MultaCompletaFilterDto) {
    try {
      this.logger.log(`📊 Buscando analytics: ${JSON.stringify(filters)}`);
      
      const resultado = await this.multaCompletaService.buscarMultasCompletas(filters);
      
      // ✅ Calcular analytics específicos com tipagem correta
      const analytics = this.calcularAnalytics(resultado.data);
      
      this.logger.log(`✅ Analytics processados para ${resultado.total} multas`);
      
      return {
        success: true,
        message: `Analytics processados para ${resultado.total} multas`,
        data: resultado.data,
        pagination: {
          total: resultado.total,
          page: resultado.page,
          limit: resultado.limit,
          totalPages: resultado.totalPages
        },
        summary: {
          ...resultado.summary,
          // ✅ Adicionar campos específicos de analytics
          multasTransito: analytics.multasTransito,
          multasSemob: analytics.multasSemob,
          valorMedioTransito: analytics.valorMedioTransito,
          valorMedioSemob: analytics.valorMedioSemob,
          totalAgentes: analytics.totalAgentes,
          totalVeiculos: analytics.totalVeiculos,
          pontosTotal: analytics.pontosTotal
        },
        analytics: {
          distribuicaoPorTipo: analytics.distribuicaoPorTipo,
          distribuicaoPorGravidade: analytics.distribuicaoPorGravidade,
          topAgentes: analytics.topAgentes,
          topLocais: analytics.topLocais,
          evolucaoMensal: analytics.evolucaoMensal
        },
        filters: filters,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao obter analytics: ${error.message}`);
      throw new HttpException(
        `Erro ao obter analytics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('numero/:numeroAiMulta')
  @ApiOperation({ summary: 'Buscar multa específica por número' })
  @ApiResponse({ status: 200, description: 'Dados da multa' })
  @ApiResponse({ status: 404, description: 'Multa não encontrada' })
  async buscarPorNumero(@Param('numeroAiMulta') numeroAiMulta: string) {
    try {
      this.logger.log(`�� Buscando multa: ${numeroAiMulta}`);
      
      const multa = await this.multaCompletaService.buscarPorNumero(numeroAiMulta);
      
      if (!multa) {
        throw new HttpException('Multa não encontrada', HttpStatus.NOT_FOUND);
      }
      
      return {
        success: true,
        message: 'Multa encontrada',
        data: multa,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`❌ Erro ao buscar multa: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar multa: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('sincronizar')
  @ApiOperation({ summary: 'Sincronizar dados manualmente do Oracle' })
  @ApiResponse({ status: 200, description: 'Sincronização realizada' })
  async sincronizarManual(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string
  ): Promise<{ success: boolean; message: string; data: SyncResult }> {
    try {
      this.logger.log(`🔄 Iniciando sincronização manual: ${dataInicio} a ${dataFim}`);
      
      const resultado = await this.multaCompletaService.sincronizarManual(dataInicio, dataFim);
      
      this.logger.log(`✅ Sincronização concluída: ${resultado.novos} novos, ${resultado.atualizados} atualizados`);
      
      return {
        success: true,
        message: 'Sincronização realizada com sucesso',
        data: resultado
      };
    } catch (error) {
      this.logger.error(`❌ Erro na sincronização: ${error.message}`);
      throw new HttpException(
        `Erro na sincronização: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('export')
  @ApiOperation({ summary: 'Exportar relatório de multas' })
  @ApiResponse({ status: 200, description: 'Arquivo exportado' })
  @ApiQuery({ name: 'formato', required: false, enum: ['xlsx', 'csv', 'pdf'] })
  async exportarRelatorio(
    @Query() filters: MultaCompletaFilterDto,
    @Query('formato') formato: 'xlsx' | 'csv' | 'pdf' = 'xlsx',
    @Res() res: Response
  ) {
    try {
      this.logger.log(`📤 Exportando relatório: ${formato}`);
      
      const resultado = await this.multaCompletaService.buscarMultasCompletas({
        ...filters,
        limit: 10000 // Limite maior para exportação
      });
      
      // ✅ Gerar arquivo simples baseado no formato
      const arquivo = this.gerarArquivoExportacao(resultado.data, formato);
      
      // ✅ Configurar headers para download
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `multas_completas_${timestamp}.${formato}`;
      
      res.setHeader('Content-Type', this.getContentType(formato));
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      this.logger.log(`✅ Relatório exportado: ${filename}`);
      
      return res.send(arquivo);
    } catch (error) {
      this.logger.error(`❌ Erro ao exportar: ${error.message}`);
      throw new HttpException(
        `Erro ao exportar: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('estatisticas/cache')
  @ApiOperation({ summary: 'Estatísticas do cache local' })
  @ApiResponse({ status: 200, description: 'Estatísticas do cache' })
  async estatisticasCache() {
    try {
      const stats = await this.multaCompletaService.estatisticasCache();
      
      return {
        success: true,
        message: 'Estatísticas do cache',
        data: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao obter estatísticas: ${error.message}`);
      throw new HttpException(
        `Erro ao obter estatísticas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('cache/limpar')
  @ApiOperation({ summary: 'Limpar cache antigo' })
  @ApiResponse({ status: 200, description: 'Cache limpo' })
  async limparCacheAntigo(@Query('diasAntigos') diasAntigos?: number) {
    try {
      const dias = diasAntigos ? parseInt(diasAntigos.toString()) : 90;
      const removidos = await this.multaCompletaService.limparCacheAntigo(dias);
      
      return {
        success: true,
        message: `Cache limpo: ${removidos} registros removidos`,
        data: { removidos, diasAntigos: dias },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao limpar cache: ${error.message}`);
      throw new HttpException(
        `Erro ao limpar cache: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('dashboard/resumo')
  @ApiOperation({ summary: 'Dashboard resumo das multas' })
  @ApiResponse({ status: 200, description: 'Resumo para dashboard' })
  async dashboardResumo(@Query() filters: MultaCompletaFilterDto) {
    try {
      // Remove paginação para o dashboard
      const filtersResumo = { ...filters, page: 1, limit: 1 };
      
      const resultado = await this.multaCompletaService.buscarMultasCompletas(filtersResumo);
      
      // Busca agrupamentos principais
      const [
        agrupadoPorAgente,
        agrupadoPorVeiculo,
        agrupadoPorInfracao,
        agrupadoPorMes
      ] = await Promise.all([
        this.multaCompletaService.buscarMultasCompletas({
          ...filtersResumo,
          groupBy: 'agente',
          limit: 10
        }),
        this.multaCompletaService.buscarMultasCompletas({
          ...filtersResumo,
          groupBy: 'veiculo',
          limit: 10
        }),
        this.multaCompletaService.buscarMultasCompletas({
          ...filtersResumo,
          groupBy: 'infracao',
          limit: 10
        }),
        this.multaCompletaService.buscarMultasCompletas({
          ...filtersResumo,
          groupBy: 'mes',
          limit: 12
        })
      ]);

      return {
        success: true,
        message: 'Dashboard resumo',
        data: {
          resumoGeral: resultado.summary,
          topAgentes: agrupadoPorAgente.groups,
          topVeiculos: agrupadoPorVeiculo.groups,
          topInfracoes: agrupadoPorInfracao.groups,
          evolucaoMensal: agrupadoPorMes.groups
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Erro no dashboard: ${error.message}`);
      throw new HttpException(
        `Erro no dashboard: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * ✅ MÉTODO PRIVADO: Calcular analytics específicos COM TIPAGEM TOTALMENTE CORRETA
   */
  private calcularAnalytics(multas: any[]): Analytics & {
    multasTransito: number;
    multasSemob: number;
    valorMedioTransito: number;
    valorMedioSemob: number;
    totalAgentes: number;
    totalVeiculos: number;
    pontosTotal: number;
  } {
    // Evitar divisão por zero
    if (!multas || multas.length === 0) {
      return {
        multasTransito: 0,
        multasSemob: 0,
        valorMedioTransito: 0,
        valorMedioSemob: 0,
        totalAgentes: 0,
        totalVeiculos: 0,
        pontosTotal: 0,
        distribuicaoPorTipo: [],
        distribuicaoPorGravidade: [],
        topAgentes: [],
        topLocais: [],
        evolucaoMensal: []
      };
    }

    // Separar multas por tipo
    const multasTransito = multas.filter(m => 
      (m.pontuacaoInfracao && m.pontuacaoInfracao > 0) || 
      m.gravidadeInfracao || 
      !m.agenteCodigo
    );
    
    const multasSemob = multas.filter(m => 
      m.agenteCodigo && m.agenteDescricao
    );

    // Calcular valores
    const valorTransito = multasTransito.reduce((sum, m) => sum + (Number(m.valorMulta) || 0), 0);
    const valorSemob = multasSemob.reduce((sum, m) => sum + (Number(m.valorMulta) || 0), 0);
    const pontosTotal = multasTransito.reduce((sum, m) => sum + (Number(m.pontuacaoInfracao) || 0), 0);

    // Agentes únicos
    const agentesUnicos = [...new Set(
      multas
        .filter(m => m.agenteCodigo)
        .map(m => m.agenteCodigo)
    )];

    // Veículos únicos
    const veiculosUnicos = [...new Set(
      multas
        .filter(m => m.prefixoVeic)
        .map(m => m.prefixoVeic)
    )];

    // Distribuição por tipo
    const distribuicaoPorTipo: DistribuicaoPorTipo[] = [
      {
        tipo: 'TRANSITO' as const,
        total: multasTransito.length,
        valor: valorTransito,
        percentual: multas.length > 0 ? (multasTransito.length / multas.length) * 100 : 0
      },
      {
        tipo: 'SEMOB' as const,
        total: multasSemob.length,
        valor: valorSemob,
        percentual: multas.length > 0 ? (multasSemob.length / multas.length) * 100 : 0
      }
    ];

    // ✅ TIPAGEM CORRETA para distribuição por gravidade COM TYPE ASSERTION
    const gravidadePorQuantidade: Record<string, GravidadeData> = multas.reduce((acc, multa) => {
      const gravidade = multa.gravidadeInfracao || 
                       (multa.pontuacaoInfracao ? 'TRÂNSITO' : 'SEMOB');
      if (!acc[gravidade]) {
        acc[gravidade] = { total: 0, valor: 0, pontos: 0 };
      }
      acc[gravidade].total += 1;
      acc[gravidade].valor += Number(multa.valorMulta) || 0;
      acc[gravidade].pontos += Number(multa.pontuacaoInfracao) || 0;
      return acc;
    }, {} as Record<string, GravidadeData>);

    const distribuicaoPorGravidade: DistribuicaoPorGravidade[] = Object.entries(gravidadePorQuantidade).map(([gravidade, dados]) => ({
      gravidade,
      total: dados.total,
      valor: dados.valor,
      pontos: dados.pontos,
      percentual: multas.length > 0 ? (dados.total / multas.length) * 100 : 0
    }));

    // ✅ TIPAGEM CORRETA para agentes COM TYPE ASSERTION
    const agentesPorQuantidade: Record<string, AgenteData> = multas
      .filter(m => m.agenteCodigo)
      .reduce((acc, multa) => {
        const codigo = multa.agenteCodigo;
        const nome = multa.agenteDescricao || multa.nomeAgente || codigo;
        if (!acc[codigo]) {
          acc[codigo] = { codigo, nome, total: 0, valor: 0 };
        }
        acc[codigo].total += 1;
        acc[codigo].valor += Number(multa.valorMulta) || 0;
        return acc;
      }, {} as Record<string, AgenteData>);

    const topAgentes: TopAgente[] = Object.values(agentesPorQuantidade)
      .sort((a: AgenteData, b: AgenteData) => b.total - a.total)
      .slice(0, 10)
      .map((agente: AgenteData): TopAgente => ({
        codigo: agente.codigo,
        nome: agente.nome,
        total: agente.total,
        valor: agente.valor
      }));

    // ✅ TIPAGEM CORRETA para locais COM TYPE ASSERTION
    const locaisPorQuantidade: Record<string, LocalData> = multas.reduce((acc, multa) => {
      const local = multa.localMulta || 'Local não informado';
      if (!acc[local]) {
        acc[local] = { total: 0, valor: 0 };
      }
      acc[local].total += 1;
      acc[local].valor += Number(multa.valorMulta) || 0;
      return acc;
    }, {} as Record<string, LocalData>);

    const topLocais: TopLocal[] = Object.entries(locaisPorQuantidade)
      .sort(([,a]: [string, LocalData], [,b]: [string, LocalData]) => b.total - a.total)
      .slice(0, 10)
      .map(([local, dados]: [string, LocalData]): TopLocal => ({ 
        local, 
        total: dados.total, 
        valor: dados.valor 
      }));

    // ✅ Evolução mensal baseada em dados reais COM TIPAGEM CORRETA
    const evolucaoMensal = this.calcularEvolucaoMensal(multas);

    return {
      multasTransito: multasTransito.length,
      multasSemob: multasSemob.length,
      valorMedioTransito: multasTransito.length > 0 ? valorTransito / multasTransito.length : 0,
      valorMedioSemob: multasSemob.length > 0 ? valorSemob / multasSemob.length : 0,
      totalAgentes: agentesUnicos.length,
      totalVeiculos: veiculosUnicos.length,
      pontosTotal,
      distribuicaoPorTipo,
      distribuicaoPorGravidade,
      topAgentes,
      topLocais,
      evolucaoMensal
    };
  }

  /**
   * ✅ MÉTODO PRIVADO: Calcular evolução mensal COM TIPAGEM CORRETA
   */
  private calcularEvolucaoMensal(multas: any[]): Array<{ periodo: string; total: number; valor: number }> {
    const evolucaoPorMes: Record<string, { periodo: string; total: number; valor: number }> = multas.reduce((acc, multa) => {
      if (!multa.dataEmissaoMulta) return acc;
      
      const data = new Date(multa.dataEmissaoMulta);
      const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[mesAno]) {
        acc[mesAno] = { periodo: mesAno, total: 0, valor: 0 };
      }
      
      acc[mesAno].total += 1;
      acc[mesAno].valor += Number(multa.valorMulta) || 0;
      
      return acc;
    }, {} as Record<string, { periodo: string; total: number; valor: number }>);

    return Object.values(evolucaoPorMes)
      .sort((a: { periodo: string }, b: { periodo: string }) => a.periodo.localeCompare(b.periodo))
      .slice(-12); // Últimos 12 meses
  }

  /**
   * ✅ MÉTODO PRIVADO: Gerar arquivo de exportação
   */
  private gerarArquivoExportacao(multas: any[], formato: 'xlsx' | 'csv' | 'pdf'): string {
    switch (formato) {
      case 'csv':
        return this.gerarCSV(multas);
      case 'xlsx':
        // Para Excel, você pode usar uma biblioteca como 'xlsx'
        return this.gerarCSV(multas); // Por enquanto, retorna CSV
      case 'pdf':
        // Para PDF, você pode usar uma biblioteca como 'pdfkit'
        return this.gerarCSV(multas); // Por enquanto, retorna CSV
      default:
        return this.gerarCSV(multas);
    }
  }

  /**
   * ✅ MÉTODO PRIVADO: Gerar CSV com tratamento de dados
   */
  private gerarCSV(multas: any[]): string {
    if (!multas || multas.length === 0) {
      return 'Nenhum dado encontrado';
    }

    // Headers do CSV
    const headers = [
      'Número AIT',
      'Prefixo Veículo',
      'Data Emissão',
      'Valor Multa',
      'Local Multa',
      'Descrição Infração',
      'Agente Código',
      'Agente Nome',
      'Pontuação',
      'Gravidade'
    ];

    // Dados com tratamento seguro
    const linhas = multas.map(multa => [
      this.sanitizeCSVField(multa.numeroAiMulta || ''),
      this.sanitizeCSVField(multa.prefixoVeic || ''),
      this.formatDate(multa.dataEmissaoMulta),
      Number(multa.valorMulta) || 0,
      this.sanitizeCSVField(multa.localMulta || ''),
      this.sanitizeCSVField(multa.descricaoInfra || ''),
      this.sanitizeCSVField(multa.agenteCodigo || ''),
      this.sanitizeCSVField(multa.agenteDescricao || ''),
      Number(multa.pontuacaoInfracao) || 0,
      this.sanitizeCSVField(multa.gravidadeInfracao || '')
    ]);

    // Montar CSV
    const csvContent = [
      headers.join(','),
      ...linhas.map(linha => linha.map(campo => `"${campo}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * ✅ MÉTODO PRIVADO: Sanitizar campos CSV
   */
  private sanitizeCSVField(value: any): string {
    if (value === null || value === undefined) return '';
    return String(value).replace(/"/g, '""'); // Escape aspas duplas
  }

  /**
   * ✅ MÉTODO PRIVADO: Formatar data
   */
  private formatDate(date: any): string {
    if (!date) return '';
    try {
      const d = new Date(date);
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
    } catch {
      return '';
    }
  }

  /**
   * ✅ MÉTODO PRIVADO: Obter content type
   */
  private getContentType(formato: string): string {
    switch (formato) {
      case 'csv':
        return 'text/csv';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'text/plain';
    }
  }
}