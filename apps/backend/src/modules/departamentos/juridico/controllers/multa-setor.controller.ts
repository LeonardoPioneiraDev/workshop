// src/modules/departamentos/juridico/controllers/multa-setor.controller.ts
import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MultaSetorMappingService } from '../services/multa-setor-mapping.service';
import { MultaCompletaFilterDto } from '../dto/multa-completa-filter.dto';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/guards/roles.guard';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { Role } from '../../../../common/enums/role.enum';

@ApiTags('Jurídico - Multas por Setor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('juridico/multas-setor')
export class MultaSetorController {
  private readonly logger = new Logger(MultaSetorController.name);

  constructor(
    private readonly multaSetorService: MultaSetorMappingService
  ) {}

  // ✅ BUSCAR MULTAS COM MAPEAMENTO DE SETOR
  @Get()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Buscar multas mapeadas por setor',
    description: 'Retorna multas com informações do setor baseado no prefixo do veículo'
  })
  @ApiResponse({ status: 200, description: 'Multas com setor mapeado' })
  async buscarMultasComSetor(@Query() filters: MultaCompletaFilterDto) {
    try {
      const resultado = await this.multaSetorService.buscarMultasComSetor(filters);
      
      return {
        success: true,
        message: `Encontradas ${resultado.total} multas, ${resultado.resumo.multasComSetor} mapeadas`,
        data: resultado.data,
        pagination: {
          total: resultado.total,
          page: resultado.page,
          limit: resultado.limit,
          totalPages: resultado.totalPages
        },
        estatisticasPorSetor: resultado.estatisticasPorSetor,
        resumo: resultado.resumo,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar multas com setor: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar multas com setor: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ ESTATÍSTICAS POR SETOR ESPECÍFICO
  @Get('setor/:codigoGaragem')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Estatísticas de um setor específico',
    description: 'Retorna estatísticas detalhadas de multas de um setor'
  })
  @ApiParam({ 
    name: 'codigoGaragem', 
    type: Number,
    description: 'Código da garagem/setor (31=PARANOÁ, 124=SANTA MARIA, 239=SÃO SEBASTIÃO, 240=GAMA)',
    example: 31
  })
  @ApiResponse({ status: 200, description: 'Estatísticas do setor' })
  async estatisticasSetor(
    @Param('codigoGaragem', ParseIntPipe) codigoGaragem: number,
    @Query() filters: MultaCompletaFilterDto
  ) {
    try {
      const resultado = await this.multaSetorService.estatisticasSetor(codigoGaragem, filters);
      
      return {
        success: true,
        message: `Estatísticas do setor ${resultado.setor.nome}`,
        data: {
          setor: resultado.setor,
          estatisticas: resultado.estatisticas,
          amostraMultas: resultado.multas.slice(0, 10) // Primeiras 10 multas como amostra
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar estatísticas do setor ${codigoGaragem}: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar estatísticas do setor: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ COMPARAÇÃO ENTRE SETORES
  @Get('comparacao')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR)
  @ApiOperation({ 
    summary: 'Comparar setores por multas',
    description: 'Compara todos os setores por quantidade e valor de multas'
  })
  @ApiResponse({ status: 200, description: 'Comparação entre setores' })
  async compararSetores(@Query() filters: MultaCompletaFilterDto) {
    try {
      const resultado = await this.multaSetorService.compararSetores(filters);
      
      return {
        success: true,
        message: 'Comparação entre setores realizada',
        data: {
          ranking: resultado.comparacao,
          resumo: resultado.resumo,
          insights: {
            diferencaLiderSegundo: resultado.comparacao.length > 1 
              ? resultado.comparacao[0].totalMultas - resultado.comparacao[1].totalMultas 
              : 0,
            mediaGeralMultas: resultado.comparacao.length > 0
              ? resultado.comparacao.reduce((sum, s) => sum + s.totalMultas, 0) / resultado.comparacao.length
              : 0,
            mediaGeralValor: resultado.comparacao.length > 0
              ? resultado.comparacao.reduce((sum, s) => sum + s.valorTotal, 0) / resultado.comparacao.length
              : 0
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao comparar setores: ${error.message}`);
      throw new HttpException(
        `Erro ao comparar setores: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ DASHBOARD POR SETORES
  @Get('dashboard')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR)
  @ApiOperation({ 
    summary: 'Dashboard de multas por setor',
    description: 'Visão consolidada das multas agrupadas por setor'
  })
  @ApiResponse({ status: 200, description: 'Dashboard por setores' })
  async dashboardSetores(@Query() filters: MultaCompletaFilterDto) {
    try {
      const [multasComSetor, comparacao] = await Promise.all([
        this.multaSetorService.buscarMultasComSetor({ ...filters, limit: 1 }),
        this.multaSetorService.compararSetores(filters)
      ]);

      return {
        success: true,
        message: 'Dashboard de setores',
        data: {
          resumoGeral: multasComSetor.resumo,
          setores: multasComSetor.estatisticasPorSetor.map(setor => ({
            ...setor,
            ranking: comparacao.comparacao.find(c => c.setor.codigo === setor.setor.codigo)?.ranking || 0
          })),
          comparacao: comparacao.comparacao,
          destaques: comparacao.resumo,
          alertas: {
            setorComMaisMultas: comparacao.resumo.setorComMaisMultas,
            setorComMaiorValor: comparacao.resumo.setorComMaiorValor,
            percentualNaoMapeado: 100 - multasComSetor.resumo.percentualMapeamento
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Erro no dashboard de setores: ${error.message}`);
      throw new HttpException(
        `Erro no dashboard de setores: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ✅ MULTAS SEM SETOR IDENTIFICADO
  @Get('sem-setor')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Multas sem setor identificado',
    description: 'Lista multas que não puderam ser mapeadas para um setor'
  })
  @ApiResponse({ status: 200, description: 'Multas sem setor' })
  async multasSemSetor(@Query() filters: MultaCompletaFilterDto) {
    try {
      const resultado = await this.multaSetorService.buscarMultasComSetor(filters);
      const multasSemSetor = resultado.data.filter(m => !m.setorEncontrado);

      // ✅ Analisar prefixos não encontrados
      const prefixosNaoEncontrados = [...new Set(multasSemSetor.map(m => m.prefixoVeic))];
      
      return {
        success: true,
        message: `Encontradas ${multasSemSetor.length} multas sem setor identificado`,
        data: {
          multas: multasSemSetor,
          analise: {
            totalMultasSemSetor: multasSemSetor.length,
            prefixosNaoEncontrados: prefixosNaoEncontrados.length,
            valorTotalSemSetor: multasSemSetor.reduce((sum, m) => sum + (Number(m.valorMulta) || 0), 0),
            prefixosProblematicos: prefixosNaoEncontrados.slice(0, 20) // Top 20 prefixos problemáticos
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar multas sem setor: ${error.message}`);
      throw new HttpException(
        `Erro ao buscar multas sem setor: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}