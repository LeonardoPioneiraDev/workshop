// src/modules/departamentos/juridico/controllers/veiculo-historico-setor.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpException,
  HttpStatus,
  Logger,
  SetMetadata,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VeiculoHistoricoSetorService, MudancaSetor } from '../services/veiculo-historico-setor.service';
import { MultaSetorMappingHistoricoService } from '../services/multa-setor-mapping-historico.service';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/guards/roles.guard';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { Role } from '../../../../common/enums/role.enum';

// ✅ DECORATOR PARA ENDPOINTS PÚBLICOS
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

@ApiTags('Jurídico - Histórico de Setores')
@Controller('juridico/historico-setores')
export class VeiculoHistoricoSetorController {
  private readonly logger = new Logger(VeiculoHistoricoSetorController.name);

  constructor(
    private readonly historicoSetorService: VeiculoHistoricoSetorService,
    private readonly multaHistoricoService: MultaSetorMappingHistoricoService
  ) {}

  // ✅ INICIALIZAR HISTÓRICO - PÚBLICO
  @Post('inicializar')
  @Public() // ✅ ENDPOINT PÚBLICO
  @ApiOperation({ 
    summary: 'Inicializar histórico de setores',
    description: 'Cria registros históricos iniciais para toda a frota atual - ENDPOINT PÚBLICO'
  })
  @ApiResponse({ status: 200, description: 'Histórico inicializado' })
  async inicializarHistorico() {
    try {
      const resultado = await this.historicoSetorService.inicializarHistoricoFrotaAtual();
      
      return {
        success: true,
        message: 'Histórico de setores inicializado',
        data: resultado,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao inicializar histórico: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ REGISTRAR MUDANÇA DE SETOR - PÚBLICO
  @Post('mudanca')
  @Public() // ✅ ENDPOINT PÚBLICO
  @ApiOperation({ 
    summary: 'Registrar mudança de setor',
    description: 'Registra a transferência de um veículo para outro setor - ENDPOINT PÚBLICO'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prefixoVeiculo: { type: 'string', example: '0235130' },
        setorAnterior: { 
          type: 'object',
          properties: {
            codigo: { type: 'number', example: 31 },
            nome: { type: 'string', example: 'PARANOÁ' }
          }
        },
        setorNovo: {
          type: 'object', 
          properties: {
            codigo: { type: 'number', example: 240 },
            nome: { type: 'string', example: 'GAMA' }
          }
        },
        dataMudanca: { type: 'string', format: 'date', example: '2025-09-22' },
        motivo: { type: 'string', example: 'REORGANIZAÇÃO_FROTA' },
        observacoes: { type: 'string', example: 'Transferência por necessidade operacional' },
        usuarioAlteracao: { type: 'string', example: 'ADMIN_SISTEMA' }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Mudança registrada' })
  async registrarMudanca(@Body() mudanca: MudancaSetor) {
    try {
      await this.historicoSetorService.registrarMudancaSetor(mudanca);
      
      return {
        success: true,
        message: `Mudança de setor registrada para veículo ${mudanca.prefixoVeiculo}`,
        data: mudanca,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao registrar mudança: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ SINCRONIZAR COM FROTA ATUAL - PÚBLICO
  @Post('sincronizar')
  @Public() // ✅ ENDPOINT PÚBLICO
  @ApiOperation({ 
    summary: 'Sincronizar histórico com frota atual',
    description: 'Detecta e registra mudanças de setor comparando com a frota atual - ENDPOINT PÚBLICO'
  })
  @ApiResponse({ status: 200, description: 'Sincronização realizada' })
  async sincronizarComFrota() {
    try {
      const resultado = await this.historicoSetorService.sincronizarComFrotaAtual();
      
      return {
        success: true,
        message: 'Sincronização com frota atual realizada',
        data: resultado,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      throw new HttpException(
        `Erro na sincronização: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ HISTÓRICO DE UM VEÍCULO - PÚBLICO
  @Get('veiculo/:prefixo')
  @Public() // ✅ ENDPOINT PÚBLICO
  @ApiOperation({ 
    summary: 'Histórico de setores de um veículo',
    description: 'Retorna todo o histórico de mudanças de setor de um veículo - ENDPOINT PÚBLICO'
  })
  @ApiParam({ name: 'prefixo', type: String, example: '0235130' })
  @ApiResponse({ status: 200, description: 'Histórico do veículo' })
  async historicoVeiculo(@Param('prefixo') prefixo: string) {
    try {
      const historico = await this.historicoSetorService.obterHistoricoCompleto(prefixo);
      
      return {
        success: true,
        message: `Histórico do veículo ${prefixo}`,
        data: {
          prefixoVeiculo: prefixo,
          totalMudancas: historico.length,
          historico: historico.map(h => ({
            setor: {
              codigo: h.codigoGaragem,
              nome: h.nomeGaragem
            },
            periodo: {
              inicio: h.dataInicio,
              fim: h.dataFim,
              ativo: h.dataFim === null
            },
            mudanca: {
              motivo: h.motivoMudanca,
              observacoes: h.observacoes,
              usuario: h.usuarioAlteracao
            }
          }))
        },
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao obter histórico: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ MULTAS COM SETOR HISTÓRICO - PÚBLICO
  @Get('multas-historico')
  @Public() // ✅ ENDPOINT PÚBLICO
  @ApiOperation({ 
    summary: 'Multas com setor histórico correto',
    description: 'Retorna multas associadas ao setor que o veículo pertencia na data da infração - ENDPOINT PÚBLICO'
  })
  @ApiResponse({ status: 200, description: 'Multas com histórico de setores' })
  async multasComSetorHistorico(@Query() filters: any) {
    try {
      const resultado = await this.multaHistoricoService.buscarMultasComSetorHistorico(filters);
      
      return {
        success: true,
        message: `Encontradas ${resultado.total} multas com histórico de setores`,
        data: resultado.data,
        pagination: {
          total: resultado.total,
          page: resultado.page,
          limit: resultado.limit,
          totalPages: resultado.totalPages
        },
        resumo: resultado.resumo,
        estatisticasPorSetor: resultado.estatisticasPorSetor,
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao buscar multas com histórico: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ RELATÓRIO DE MUDANÇAS - PÚBLICO
  @Get('relatorio-mudancas')
  @Public() // ✅ ENDPOINT PÚBLICO
  @ApiOperation({ 
    summary: 'Relatório de impacto das mudanças de setor',
    description: 'Analisa o impacto das mudanças de setor nas multas - ENDPOINT PÚBLICO'
  })
  @ApiResponse({ status: 200, description: 'Relatório de mudanças' })
  async relatorioMudancas(@Query() filters: any) {
    try {
      const resultado = await this.multaHistoricoService.relatorioMudancasSetor(filters);
      
      return {
        success: true,
        message: 'Relatório de mudanças de setor',
        data: resultado,
        insights: {
          totalMultasAfetadas: resultado.multasComMudanca.length,
          veiculosComMudanca: resultado.resumoPorVeiculo.length,
          impactoFinanceiro: resultado.impactoFinanceiro.valorTotalMultasComMudanca,
          setorMaisAfetado: resultado.impactoFinanceiro.setorMaisAfetado
        },
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      throw new HttpException(
        `Erro no relatório de mudanças: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ ESTATÍSTICAS BÁSICAS - PÚBLICO
  @Get('estatisticas')
  @Public() // ✅ ENDPOINT PÚBLICO
  @ApiOperation({ 
    summary: 'Estatísticas básicas do histórico de setores',
    description: 'Retorna estatísticas gerais sobre mudanças de setores - ENDPOINT PÚBLICO'
  })
  @ApiResponse({ status: 200, description: 'Estatísticas básicas' })
  async estatisticasBasicas() {
    try {
      // ✅ Buscar dados básicos
      const [
        totalVeiculos,
        veiculosComHistorico,
        totalMudancas
      ] = await Promise.all([
        this.historicoSetorService.obterTotalVeiculos(),
        this.historicoSetorService.obterVeiculosComHistorico(),
        this.historicoSetorService.obterTotalMudancas()
      ]);

      return {
        success: true,
        message: 'Estatísticas básicas do histórico de setores',
        data: {
          resumo: {
            totalVeiculos,
            veiculosComHistorico,
            veiculosSemHistorico: totalVeiculos - veiculosComHistorico,
            totalMudancas,
            percentualCobertura: totalVeiculos > 0 ? (veiculosComHistorico / totalVeiculos) * 100 : 0
          },
          status: {
            sistemaInicializado: veiculosComHistorico > 0,
            cobertura: veiculosComHistorico >= totalVeiculos * 0.8 ? 'BOA' : 'PARCIAL'
          }
        },
        timestamp: new Date().toISOString(),
        endpoint: 'PÚBLICO - Sem autenticação necessária'
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao obter estatísticas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ ENDPOINTS COM AUTENTICAÇÃO (PARA OPERAÇÕES SENSÍVEIS)

  @Get('admin/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE)
  @ApiOperation({ 
    summary: 'Dashboard administrativo do histórico',
    description: 'Dashboard completo para administradores - REQUER AUTENTICAÇÃO'
  })
  @ApiResponse({ status: 200, description: 'Dashboard administrativo' })
  async dashboardAdmin() {
    try {
      const [
        estatisticasBasicas,
        relatorioMudancas,
        multasHistorico
      ] = await Promise.all([
        this.estatisticasBasicas(),
        this.relatorioMudancas({}),
        this.multasComSetorHistorico({ limit: 10 })
      ]);

      return {
        success: true,
        message: 'Dashboard administrativo do histórico de setores',
        data: {
          estatisticas: estatisticasBasicas.data,
          mudancas: relatorioMudancas.data,
          amostrasMultas: multasHistorico.data,
          alertas: {
            mudancasRecentes: relatorioMudancas.data.multasComMudanca.length,
            impactoFinanceiro: relatorioMudancas.data.impactoFinanceiro.valorTotalMultasComMudanca,
            necessidadeSincronizacao: estatisticasBasicas.data.resumo.percentualCobertura < 80
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        `Erro no dashboard administrativo: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('admin/limpar-historico')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @ApiOperation({ 
    summary: 'Limpar histórico antigo',
    description: 'Remove registros históricos antigos - REQUER AUTENTICAÇÃO DE ADMIN'
  })
  @ApiResponse({ status: 200, description: 'Histórico limpo' })
  async limparHistoricoAntigo(@Query('diasAntigos') diasAntigos?: number) {
    try {
      const dias = diasAntigos ? parseInt(diasAntigos.toString()) : 365;
      const removidos = await this.historicoSetorService.limparHistoricoAntigo(dias);
      
      return {
        success: true,
        message: `Histórico antigo limpo: ${removidos} registros removidos`,
        data: { removidos, diasAntigos: dias },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao limpar histórico: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}