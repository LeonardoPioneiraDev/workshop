// src/modules/departamentos/juridico/controllers/dvs-infracao.controller.ts

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { DvsInfracaoService, InfracaoFilters } from '../services/dvs-infracao.service';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/guards/roles.guard';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { Role } from '../../../../common/enums/role.enum';
import { Public } from '../../../../auth/decorators/public.decorator'; // ✅ ADICIONAR

// ✅ DTO MANTÉM O MESMO
export class InfracaoFiltersDto implements InfracaoFilters {
  @IsOptional()
  @IsString()
  codigoinfra?: string;

  @IsOptional()
  @IsString()
  descricaoinfra?: string;

  @IsOptional()
  @IsString()
  grupoinfra?: string;

  @IsOptional()
  @IsString()
  tipomulta?: string;

  @IsOptional()
  @IsString()
  orgao?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  pontuacaoMinima?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  pontuacaoMaxima?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  ufirMinimo?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  ufirMaximo?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @IsOptional()
  @IsString()
  orderBy?: string;

  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  orderDirection?: 'ASC' | 'DESC';
}

@ApiTags('DVS - Infrações')
// ✅ REMOVER ApiBearerAuth PARA ENDPOINTS PÚBLICOS
// @ApiBearerAuth()
// ✅ MANTER GUARDS APENAS PARA ENDPOINTS ADMINISTRATIVOS
@Controller('juridico/infracoes')
export class DvsInfracaoController {
  constructor(private readonly infracaoService: DvsInfracaoService) {}

  // ✅ ENDPOINT PÚBLICO PARA LISTAGEM BÁSICA
  @Get()
  @Public() // ✅ TORNAR PÚBLICO
  @ApiOperation({ 
    summary: 'Listar infrações (público)',
    description: 'Retorna lista paginada de infrações - acesso público limitado'
  })
  @ApiQuery({ name: 'codigoinfra', required: false, type: String })
  @ApiQuery({ name: 'descricaoinfra', required: false, type: String })
  @ApiQuery({ name: 'grupoinfra', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite por página (máximo: 50)' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() filters: InfracaoFiltersDto) {
    try {
      // ✅ LIMITAR PARA ACESSO PÚBLICO
      const limitedFilters = {
        ...filters,
        limit: Math.min(filters.limit || 20, 50), // Máximo 50 para público
        page: filters.page || 1
      };

      const resultado = await this.infracaoService.findAll(limitedFilters);
      return {
        success: true,
        ...resultado,
        meta: {
          acessoPublico: true,
          limiteMaximo: 50
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao buscar infrações: ${error.message}`);
    }
  }

  // ✅ ENDPOINT PÚBLICO PARA BUSCA POR CÓDIGO
  @Get('codigo/:codigoinfra')
  @Public() // ✅ TORNAR PÚBLICO
  @ApiOperation({ 
    summary: 'Buscar infração por código (público)',
    description: 'Retorna detalhes de uma infração específica'
  })
  @ApiParam({ 
    name: 'codigoinfra', 
    type: String,
    description: 'Código da infração',
    example: '50610'
  })
  async findOne(@Param('codigoinfra') codigoinfra: string) {
    if (!codigoinfra || codigoinfra.trim().length === 0) {
      throw new BadRequestException('Código da infração é obrigatório');
    }

    try {
      const infracao = await this.infracaoService.findOne(codigoinfra.trim());
      return {
        success: true,
        data: infracao,
        meta: {
          acessoPublico: true
        }
      };
    } catch (error) {
      if (error.message.includes('não encontrada')) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(`Erro ao buscar infração: ${error.message}`);
    }
  }

  // ✅ ENDPOINT PÚBLICO PARA GRUPOS
  @Get('grupo/:grupoinfra')
  @Public() // ✅ TORNAR PÚBLICO
  @ApiOperation({ 
    summary: 'Buscar infrações por grupo (público)',
    description: 'Retorna infrações de um grupo específico'
  })
  @ApiParam({ 
    name: 'grupoinfra', 
    type: String,
    description: 'Grupo da infração',
    example: 'VELOCIDADE'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite (máximo: 30)' })
  async findByGrupo(
    @Param('grupoinfra') grupoinfra: string,
    @Query() filters: Partial<InfracaoFiltersDto>
  ) {
    if (!grupoinfra || grupoinfra.trim().length === 0) {
      throw new BadRequestException('Grupo da infração é obrigatório');
    }

    try {
      // ✅ LIMITAR PARA ACESSO PÚBLICO
      const limitedFilters = {
        ...filters,
        limit: Math.min(filters.limit || 20, 30) // Máximo 30 para público
      };

      const infracoes = await this.infracaoService.findByGrupo(grupoinfra.trim().toUpperCase(), limitedFilters);
      return {
        success: true,
        data: infracoes,
        meta: {
          grupo: grupoinfra.toUpperCase(),
          total: infracoes.length,
          acessoPublico: true,
          limiteMaximo: 30
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao buscar infrações do grupo: ${error.message}`);
    }
  }

  // ✅ ENDPOINT PÚBLICO PARA ÓRGÃOS
  @Get('orgao/:orgao')
  @Public() // ✅ TORNAR PÚBLICO
  @ApiOperation({ 
    summary: 'Buscar infrações por órgão (público)',
    description: 'Retorna infrações de um órgão específico'
  })
  @ApiParam({ 
    name: 'orgao', 
    type: String,
    description: 'Código do órgão',
    example: 'DETRAN'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite (máximo: 30)' })
  async findByOrgao(
    @Param('orgao') orgao: string,
    @Query() filters: Partial<InfracaoFiltersDto>
  ) {
    if (!orgao || orgao.trim().length === 0) {
      throw new BadRequestException('Código do órgão é obrigatório');
    }

    try {
      const limitedFilters = {
        ...filters,
        limit: Math.min(filters.limit || 20, 30)
      };

      const infracoes = await this.infracaoService.findByOrgao(orgao.trim().toUpperCase(), limitedFilters);
      return {
        success: true,
        data: infracoes,
        meta: {
          orgao: orgao.toUpperCase(),
          total: infracoes.length,
          acessoPublico: true
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao buscar infrações do órgão: ${error.message}`);
    }
  }

  // ✅ ESTATÍSTICAS PÚBLICAS (LIMITADAS)
  @Get('stats/geral')
  @Public() // ✅ TORNAR PÚBLICO
  @ApiOperation({ 
    summary: 'Estatísticas gerais (público)',
    description: 'Retorna estatísticas básicas das infrações'
  })
  async getStats(@Query() filters: Partial<InfracaoFiltersDto>) {
    try {
      const estatisticas = await this.infracaoService.getStats(filters);
      
      // ✅ RETORNAR APENAS DADOS BÁSICOS PARA PÚBLICO
      return {
        success: true,
        data: {
          totalInfracoes: estatisticas.totalInfracoes,
          infracoesComPontuacao: estatisticas.infracoesComPontuacao,
          distribuicaoPorGravidade: [
            { gravidade: 'LEVE', quantidade: estatisticas.infracoesLeves },
            { gravidade: 'MEDIA', quantidade: estatisticas.infracoesMedias },
            { gravidade: 'GRAVE', quantidade: estatisticas.infracoesGraves },
            { gravidade: 'GRAVISSIMA', quantidade: estatisticas.infracoesGravissimas }
          ],
          gruposDisponiveis: estatisticas.gruposInfracao.slice(0, 10), // Apenas top 10
          orgaosDisponiveis: estatisticas.orgaosAutuadores.slice(0, 10) // Apenas top 10
        },
        meta: {
          acessoPublico: true,
          dadosLimitados: true,
          geradoEm: new Date()
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao gerar estatísticas: ${error.message}`);
    }
  }

  // ✅ INFRAÇÕES MAIS FREQUENTES (PÚBLICO)
  @Get('stats/frequentes')
  @Public() // ✅ TORNAR PÚBLICO
  @ApiOperation({ 
    summary: 'Infrações mais frequentes (público)',
    description: 'Retorna as infrações que mais geram multas'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Limite de resultados (máximo: 20)',
    example: 10
  })
  async getMaisFrequentes(@Query('limit') limit?: number) {
    try {
      const limiteFinal = Math.min(limit || 10, 20); // Máximo 20 para público
      const infracoesFrequentes = await this.infracaoService.getMaisFrequentes(limiteFinal);
      
      return {
        success: true,
        data: infracoesFrequentes,
        meta: {
          total: infracoesFrequentes.length,
          criterio: 'totalMultas',
          ordem: 'DESC',
          acessoPublico: true,
          limiteMaximo: 20
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao buscar infrações mais frequentes: ${error.message}`);
    }
  }

  // ✅ BUSCA POR TEXTO (PÚBLICO)
  @Get('busca/:texto')
  @Public() // ✅ TORNAR PÚBLICO
  @ApiOperation({ 
    summary: 'Buscar infrações por texto (público)',
    description: 'Busca infrações por código, descrição, grupo ou artigo'
  })
  @ApiParam({ 
    name: 'texto', 
    type: String,
    description: 'Texto para busca',
    example: 'velocidade'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Limite de resultados (máximo: 15)',
    example: 10
  })
  async search(
    @Param('texto') texto: string,
    @Query('limit') limit?: number
  ) {
    if (!texto || texto.trim().length < 2) {
      throw new BadRequestException('Texto de busca deve ter pelo menos 2 caracteres');
    }

    try {
      const limiteFinal = Math.min(limit || 10, 15); // Máximo 15 para público
      const resultados = await this.infracaoService.search(texto.trim(), limiteFinal);
      
      return {
        success: true,
        data: resultados,
        meta: {
          termoBusca: texto.trim(),
          total: resultados.length,
          limite: limiteFinal,
          acessoPublico: true
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro na busca: ${error.message}`);
    }
  }

  // ✅ ENDPOINTS ADMINISTRATIVOS (MANTÉM AUTENTICAÇÃO)
  @Get('meta/grupos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Listar grupos de infrações (admin)',
    description: 'Retorna todos os grupos únicos de infrações'
  })
  async getGrupos() {
    try {
      const grupos = await this.infracaoService.getGrupos();
      return {
        success: true,
        data: grupos,
        meta: {
          total: grupos.length,
          tipo: 'grupos_unicos',
          acessoRestrito: true
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao buscar grupos: ${error.message}`);
    }
  }

  @Get('meta/orgaos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Listar órgãos autuadores (admin)',
    description: 'Retorna todos os órgãos únicos que emitem infrações'
  })
  async getOrgaos() {
    try {
      const orgaos = await this.infracaoService.getOrgaos();
      return {
        success: true,
        data: orgaos,
        meta: {
          total: orgaos.length,
          tipo: 'orgaos_unicos',
          acessoRestrito: true
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao buscar órgãos: ${error.message}`);
    }
  }

  // ✅ DASHBOARD ADMINISTRATIVO
  @Get('dashboard/resumo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Dashboard de infrações (admin)',
    description: 'Retorna dados consolidados para dashboard de infrações'
  })
  async getDashboardResumo() {
    try {
      const [
        estatisticasGerais,
        infracoesFrequentes,
        grupos,
        orgaos
      ] = await Promise.all([
        this.infracaoService.getStats({}),
        this.infracaoService.getMaisFrequentes(10),
        this.infracaoService.getGrupos(),
        this.infracaoService.getOrgaos()
      ]);

      const distribuicaoGravidade = [
        {
          gravidade: 'LEVE',
          quantidade: estatisticasGerais.infracoesLeves,
          percentual: estatisticasGerais.totalInfracoes > 0 
            ? (estatisticasGerais.infracoesLeves / estatisticasGerais.totalInfracoes) * 100 
            : 0
        },
        {
          gravidade: 'MEDIA',
          quantidade: estatisticasGerais.infracoesMedias,
          percentual: estatisticasGerais.totalInfracoes > 0 
            ? (estatisticasGerais.infracoesMedias / estatisticasGerais.totalInfracoes) * 100 
            : 0
        },
        {
          gravidade: 'GRAVE',
          quantidade: estatisticasGerais.infracoesGraves,
          percentual: estatisticasGerais.totalInfracoes > 0 
            ? (estatisticasGerais.infracoesGraves / estatisticasGerais.totalInfracoes) * 100 
            : 0
        },
        {
          gravidade: 'GRAVISSIMA',
          quantidade: estatisticasGerais.infracoesGravissimas,
          percentual: estatisticasGerais.totalInfracoes > 0 
            ? (estatisticasGerais.infracoesGravissimas / estatisticasGerais.totalInfracoes) * 100 
            : 0
        }
      ];

      return {
        success: true,
        data: {
          estatisticas: estatisticasGerais,
          infracoesFrequentes,
          distribuicaoGravidade,
          resumo: {
            totalInfracoes: estatisticasGerais.totalInfracoes,
            totalGrupos: grupos.length,
            totalOrgaos: orgaos.length,
            infracoesComPontuacao: estatisticasGerais.infracoesComPontuacao,
          },
          alertas: {
            gruposComMaisInfracoes: estatisticasGerais.gruposInfracao.slice(0, 3),
            orgaosMaisAtivos: estatisticasGerais.orgaosAutuadores.slice(0, 3),
            infracoesGravissimas: estatisticasGerais.infracoesGravissimas,
          },
          meta: {
            geradoEm: new Date(),
            versao: '1.0',
            acessoCompleto: true
          }
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao gerar dashboard: ${error.message}`);
    }
  }

  // ✅ OUTROS ENDPOINTS ADMINISTRATIVOS MANTÊM AUTENTICAÇÃO...
  @Get('classificacao/gravidade')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Infrações por classificação de gravidade (admin)',
    description: 'Retorna infrações agrupadas por gravidade (pontuação)'
  })
  @ApiQuery({ 
    name: 'gravidade', 
    required: false,
    enum: ['LEVE', 'MEDIA', 'GRAVE', 'GRAVISSIMA', 'SEM_PONTUACAO'],
    description: 'Filtrar por gravidade específica'
  })
  async getByGravidade(
    @Query('gravidade') gravidade?: string,
    @Query() paginacao?: Partial<InfracaoFiltersDto>
  ) {
    try {
      let filters: Partial<InfracaoFilters> = {
        page: paginacao?.page || 1,
        limit: paginacao?.limit || 50,
        orderBy: 'pontuacaoinfra',
        orderDirection: 'DESC'
      };

      switch (gravidade?.toUpperCase()) {
        case 'LEVE':
          filters.pontuacaoMinima = 1;
          filters.pontuacaoMaxima = 2;
          break;
        case 'MEDIA':
          filters.pontuacaoMinima = 3;
          filters.pontuacaoMaxima = 4;
          break;
        case 'GRAVE':
          filters.pontuacaoMinima = 5;
          filters.pontuacaoMaxima = 6;
          break;
        case 'GRAVISSIMA':
          filters.pontuacaoMinima = 7;
          break;
        case 'SEM_PONTUACAO':
          filters.pontuacaoMaxima = 0;
          break;
      }

      const resultado = await this.infracaoService.findAll(filters);

      return {
        success: true,
        ...resultado,
        meta: {
          ...resultado.pagination,
          gravidade: gravidade?.toUpperCase() || 'TODAS',
          criteriosPontuacao: {
            LEVE: '1-2 pontos',
            MEDIA: '3-4 pontos',
            GRAVE: '5-6 pontos',
            GRAVISSIMA: '7+ pontos',
            SEM_PONTUACAO: '0 pontos'
          },
          acessoRestrito: true
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao classificar por gravidade: ${error.message}`);
    }
  }

  @Get('comparativo/grupos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Comparativo entre grupos de infrações (admin)',
    description: 'Compara a quantidade de infrações entre diferentes grupos'
  })
  async getComparativoGrupos(@Query('grupos') grupos?: string) {
    try {
      let gruposParaComparar: string[] = [];
      
      if (grupos) {
        gruposParaComparar = grupos.split(',').map(g => g.trim().toUpperCase()).filter(g => g.length > 0);
        if (gruposParaComparar.length === 0) {
          throw new BadRequestException('Pelo menos um grupo deve ser informado');
        }
        if (gruposParaComparar.length > 10) {
          throw new BadRequestException('Máximo de 10 grupos por comparativo');
        }
      } else {
        const todosGrupos = await this.infracaoService.getGrupos();
        gruposParaComparar = todosGrupos.slice(0, 10);
      }

      const comparativo = await Promise.all(
        gruposParaComparar.map(async (grupo) => {
          try {
            const infracoesDoGrupo = await this.infracaoService.findByGrupo(grupo, { limit: 1000 });
            
            return {
              grupo,
              totalInfracoes: infracoesDoGrupo.length,
              infracoesComPontuacao: infracoesDoGrupo.filter(i => i.pontuacaoinfra && i.pontuacaoinfra > 0).length,
              pontuacaoMedia: infracoesDoGrupo.length > 0 
                ? infracoesDoGrupo.reduce((sum, i) => sum + (i.pontuacaoinfra || 0), 0) / infracoesDoGrupo.length 
                : 0,
              valorMedioUFIR: infracoesDoGrupo.length > 0 
                ? infracoesDoGrupo.reduce((sum, i) => sum + (i.ufirinfra || 0), 0) / infracoesDoGrupo.length 
                : 0,
              ranking: 0
            };
          } catch (error) {
            return {
              grupo,
              totalInfracoes: 0,
              infracoesComPontuacao: 0,
              pontuacaoMedia: 0,
              valorMedioUFIR: 0,
              ranking: 0,
              erro: 'Erro ao buscar dados do grupo'
            };
          }
        })
      );

      const comparativoOrdenado = comparativo
        .sort((a, b) => b.totalInfracoes - a.totalInfracoes)
        .map((item, index) => ({ ...item, ranking: index + 1 }));

      return {
        success: true,
        data: {
          grupos: comparativoOrdenado,
          resumoGeral: {
            totalGrupos: comparativo.length,
            totalInfracoes: comparativo.reduce((sum, g) => sum + g.totalInfracoes, 0),
            mediaInfracoesPorGrupo: comparativo.length > 0 
              ? comparativo.reduce((sum, g) => sum + g.totalInfracoes, 0) / comparativo.length 
              : 0,
            pontuacaoMediaGeral: comparativo.length > 0 
              ? comparativo.reduce((sum, g) => sum + g.pontuacaoMedia, 0) / comparativo.length 
              : 0,
          },
          meta: {
            criterio: 'totalInfracoes',
            geradoEm: new Date(),
            acessoRestrito: true
          }
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro ao gerar comparativo: ${error.message}`);
    }
  }

  @Get('analytics/tipos-multa')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Análise de tipos de multa (admin)',
    description: 'Retorna distribuição e análise dos tipos de multa'
  })
  async getAnalyseTiposMulta() {
    try {
      const estatisticas = await this.infracaoService.getStats({});
      
      return {
        success: true,
        data: {
          distribuicao: estatisticas.tiposMulta,
          resumo: {
            totalTipos: estatisticas.tiposMulta.length,
            tipoMaisComum: estatisticas.tiposMulta[0] || null,
            diversidade: estatisticas.tiposMulta.length / estatisticas.totalInfracoes * 100
          },
          detalhamento: {
            porcentagemMultas: estatisticas.tiposMulta.find(t => t.tipo.includes('Multa'))?.percentual || 0,
            porcentagemAdvertencias: estatisticas.tiposMulta.find(t => t.tipo.includes('Advertência'))?.percentual || 0,
            porcentagemSuspensoes: estatisticas.tiposMulta.find(t => t.tipo.includes('Suspensão'))?.percentual || 0,
          },
          meta: {
            geradoEm: new Date(),
            baseCalculo: 'totalInfracoes',
            acessoRestrito: true
          }
        }
      };
    } catch (error) {
      throw new BadRequestException(`Erro na análise de tipos de multa: ${error.message}`);
    }
  }
}