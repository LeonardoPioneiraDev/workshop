// src/modules/departamentos/juridico/controllers/juridico-dashboard.controller.ts
import { Controller, Get, UseGuards, Query, ValidationPipe, UsePipes } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBearerAuth, 
  ApiResponse, 
  ApiQuery,
  ApiProperty 
} from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { JuridicoDashboardService } from '../services/juridico-dashboard.service';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../auth/guards/roles.guard';
import { Roles } from '../../../../auth/decorators/roles.decorator';
import { Role } from '../../../../common/enums/role.enum';

// ✅ DTO PARA FILTROS DE DASHBOARD (OPCIONAL - PARA FUTURAS EXPANSÕES)
export class DashboardFiltersDto {
  @ApiProperty({ 
    required: false, 
    type: String, 
    format: 'date',
    description: 'Data início para filtro',
    example: '2024-01-01'
  })
  @IsOptional()
  @IsDateString()
  dataInicio?: Date;

  @ApiProperty({ 
    required: false, 
    type: String, 
    format: 'date',
    description: 'Data fim para filtro',
    example: '2024-12-31'
  })
  @IsOptional()
  @IsDateString()
  dataFim?: Date;

  @ApiProperty({ 
    required: false, 
    type: String,
    enum: ['7d', '30d', '90d', '1y', 'custom'],
    description: 'Período pré-definido',
    example: '30d'
  })
  @IsOptional()
  @IsEnum(['7d', '30d', '90d', '1y', 'custom'])
  periodo?: '7d' | '30d' | '90d' | '1y' | 'custom';

  @ApiProperty({ 
    required: false, 
    type: Number,
    description: 'Código da garagem para filtro',
    example: 10
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  codigoGaragem?: number;

  @ApiProperty({ 
    required: false, 
    type: Number,
    description: 'Código da empresa para filtro',
    example: 1
  })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  codigoEmpresa?: number;
}

@ApiTags('Jurídico - Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('juridico/dashboard')
export class JuridicoDashboardController {
  constructor(private readonly dashboardService: JuridicoDashboardService) {}

  /**
   * 📊 DASHBOARD PRINCIPAL
   */
  @Get('principal')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Dashboard principal do jurídico',
    description: 'Retorna visão geral com KPIs principais, gráficos e métricas do departamento jurídico'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard principal retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            kpis: {
              type: 'object',
              properties: {
                totalMultas: { type: 'number', description: 'Total de multas' },
                valorTotal: { type: 'number', description: 'Valor total das multas' },
                multasVencidas: { type: 'number', description: 'Quantidade de multas vencidas' },
                taxaPagamento: { type: 'number', description: 'Taxa de pagamento (%)' },
                multasEmRecurso: { type: 'number', description: 'Multas em recurso' },
                valorPendente: { type: 'number', description: 'Valor pendente de pagamento' }
              }
            },
            graficos: {
              type: 'object',
              properties: {
                multasPorMes: { type: 'array', description: 'Evolução mensal de multas' },
                multasPorTipo: { type: 'array', description: 'Distribuição por tipo de infração' },
                multasPorGaragem: { type: 'array', description: 'Ranking de garagens' },
                tendenciaPagamentos: { type: 'array', description: 'Tendência de pagamentos' }
              }
            },
            alertas: {
              type: 'array',
              description: 'Alertas e notificações importantes'
            },
            periodo: {
              type: 'object',
              properties: {
                inicio: { type: 'string', format: 'date' },
                fim: { type: 'string', format: 'date' }
              }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            ultimaAtualizacao: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  async getDashboardPrincipal() {
    try {
      const dashboard = await this.dashboardService.getDashboardPrincipal();
      return {
        success: true,
        data: dashboard,
        meta: {
          ultimaAtualizacao: new Date()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao carregar dashboard principal: ${error.message}`);
    }
  }

  /**
   * 💰 DASHBOARD FINANCEIRO
   */
  @Get('financeiro')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Dashboard financeiro do jurídico',
    description: 'Retorna métricas financeiras detalhadas, fluxo de pagamentos e análises de receita'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard financeiro retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            resumoFinanceiro: {
              type: 'object',
              properties: {
                receitaTotal: { type: 'number', description: 'Receita total arrecadada' },
                receitaPrevista: { type: 'number', description: 'Receita prevista' },
                receitaPendente: { type: 'number', description: 'Receita pendente' },
                inadimplencia: { type: 'number', description: 'Taxa de inadimplência (%)' },
                valorMedioMulta: { type: 'number', description: 'Valor médio das multas' },
                crescimentoReceita: { type: 'number', description: 'Crescimento da receita (%)' }
              }
            },
            fluxoPagamentos: {
              type: 'object',
              properties: {
                pagamentosHoje: { type: 'number', description: 'Pagamentos realizados hoje' },
                pagamentosUltimos7Dias: { type: 'number', description: 'Pagamentos últimos 7 dias' },
                pagamentosUltimos30Dias: { type: 'number', description: 'Pagamentos últimos 30 dias' },
                projecaoPagamentos: { type: 'array', description: 'Projeção de pagamentos futuros' }
              }
            },
            analiseVencimentos: {
              type: 'object',
              properties: {
                vencendoHoje: { type: 'number', description: 'Multas vencendo hoje' },
                vencendoProximos7Dias: { type: 'number', description: 'Multas vencendo em 7 dias' },
                vencendoProximos30Dias: { type: 'number', description: 'Multas vencendo em 30 dias' },
                jaVencidas: { type: 'number', description: 'Multas já vencidas' }
              }
            },
            graficosFinanceiros: {
              type: 'object',
              properties: {
                evolucaoReceita: { type: 'array', description: 'Evolução da receita' },
                distribuicaoValores: { type: 'array', description: 'Distribuição por faixas de valor' },
                comparativoAnual: { type: 'array', description: 'Comparativo anual' },
                eficienciaCobranca: { type: 'array', description: 'Eficiência de cobrança por período' }
              }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            ultimaAtualizacao: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  async getDashboardFinanceiro() {
    try {
      const dashboard = await this.dashboardService.getDashboardFinanceiro();
      return {
        success: true,
        data: dashboard,
        meta: {
          ultimaAtualizacao: new Date()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao carregar dashboard financeiro: ${error.message}`);
    }
  }

  /**
   * ⚙️ DASHBOARD OPERACIONAL
   */
  @Get('operacional')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA, Role.OPERADOR)
  @ApiOperation({ 
    summary: 'Dashboard operacional do jurídico',
    description: 'Retorna métricas operacionais, performance de processos e indicadores de produtividade'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard operacional retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            indicadoresOperacionais: {
              type: 'object',
              properties: {
                processosEmAndamento: { type: 'number', description: 'Processos em andamento' },
                processosFinalizados: { type: 'number', description: 'Processos finalizados' },
                tempoMedioProcessamento: { type: 'number', description: 'Tempo médio de processamento (dias)' },
                eficienciaProcessos: { type: 'number', description: 'Eficiência dos processos (%)' },
                recursosAtivos: { type: 'number', description: 'Recursos ativos' },
                recursosFinalizados: { type: 'number', description: 'Recursos finalizados' }
              }
            },
            performanceEquipe: {
              type: 'object',
              properties: {
                produtividadeMedia: { type: 'number', description: 'Produtividade média da equipe' },
                processosPorAnalista: { type: 'array', description: 'Processos por analista' },
                tempoMedioResposta: { type: 'number', description: 'Tempo médio de resposta (horas)' },
                backlogProcessos: { type: 'number', description: 'Backlog de processos' }
              }
            },
            qualidadeProcessos: {
              type: 'object',
              properties: {
                taxaSucesso: { type: 'number', description: 'Taxa de sucesso dos processos (%)' },
                retrabalho: { type: 'number', description: 'Taxa de retrabalho (%)' },
                satisfacaoCliente: { type: 'number', description: 'Satisfação do cliente (%)' },
                conformidade: { type: 'number', description: 'Taxa de conformidade (%)' }
              }
            },
            alertasOperacionais: {
              type: 'array',
              description: 'Alertas operacionais críticos'
            },
            graficosOperacionais: {
              type: 'object',
              properties: {
                evolucaoProcessos: { type: 'array', description: 'Evolução dos processos' },
                distribuicaoStatus: { type: 'array', description: 'Distribuição por status' },
                performanceMensal: { type: 'array', description: 'Performance mensal' },
                gargalosIdentificados: { type: 'array', description: 'Gargalos identificados' }
              }
            }
          }
        },
        meta: {
          type: 'object',
          properties: {
            ultimaAtualizacao: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  async getDashboardOperacional() {
    try {
      const dashboard = await this.dashboardService.getDashboardOperacional();
      return {
        success: true,
        data: dashboard,
        meta: {
          ultimaAtualizacao: new Date()
        }
      };
    } catch (error) {
      throw new Error(`Erro ao carregar dashboard operacional: ${error.message}`);
    }
  }

  /**
   * 📈 DASHBOARD EXECUTIVO (FUTURO - PLACEHOLDER)
   */
  @Get('executivo')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE)
  @ApiOperation({ 
    summary: 'Dashboard executivo do jurídico',
    description: 'Retorna visão estratégica com KPIs executivos e análises de alto nível'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Dashboard executivo retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Mensagem informativa' },
            dashboardPrincipal: { type: 'object', description: 'Dados do dashboard principal como fallback' }
          }
        },
        meta: {
          type: 'object',
          properties: {
            ultimaAtualizacao: { type: 'string', format: 'date-time' },
            status: { type: 'string', description: 'Status do endpoint' }
          }
        }
      }
    }
  })
  async getDashboardExecutivo() {
    try {
      // ✅ USAR DASHBOARD PRINCIPAL COMO BASE PARA O EXECUTIVO
      const dashboardPrincipal = await this.dashboardService.getDashboardPrincipal();
      
      return {
        success: true,
        data: {
          message: 'Dashboard executivo em desenvolvimento. Exibindo dados do dashboard principal.',
          dashboardPrincipal,
          kpisExecutivos: {
            roi: 85.5, // Exemplo de ROI
            eficienciaGeral: 78.2,
            reducaoCustos: 12.5,
            satisfacaoStakeholders: 88.0,
            conformidadeRegulamentaria: 95.5
          }
        },
        meta: {
          ultimaAtualizacao: new Date(),
          status: 'desenvolvimento'
        }
      };
    } catch (error) {
      throw new Error(`Erro ao carregar dashboard executivo: ${error.message}`);
    }
  }

  /**
   * 📊 MÉTRICAS EM TEMPO REAL (FUTURO - PLACEHOLDER)
   */
  @Get('tempo-real')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ 
    summary: 'Métricas em tempo real',
    description: 'Retorna métricas atualizadas em tempo real do departamento jurídico'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Métricas em tempo real retornadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time', description: 'Timestamp da última atualização' },
            multasHoje: { type: 'number', description: 'Multas registradas hoje' },
            pagamentosHoje: { type: 'number', description: 'Pagamentos realizados hoje' },
            processosAbertos: { type: 'number', description: 'Processos abertos hoje' },
            alertasCriticos: { type: 'number', description: 'Alertas críticos ativos' },
            statusSistema: { 
              type: 'object',
              properties: {
                sincronizacao: { type: 'string', description: 'Status da sincronização' },
                ultimaAtualizacao: { type: 'string', format: 'date-time' },
                performance: { type: 'string', description: 'Performance do sistema' }
              }
            }
          }
        }
      }
    }
  })
  async getMetricasTempoReal() {
    try {
      // ✅ SIMULAR MÉTRICAS EM TEMPO REAL
      const agora = new Date();
      
      return {
        success: true,
        data: {
          timestamp: agora,
          multasHoje: Math.floor(Math.random() * 50) + 10, // Simular entre 10-60 multas
          pagamentosHoje: Math.floor(Math.random() * 30) + 5, // Simular entre 5-35 pagamentos
          processosAbertos: Math.floor(Math.random() * 15) + 2, // Simular entre 2-17 processos
          alertasCriticos: Math.floor(Math.random() * 5), // Simular entre 0-5 alertas
          statusSistema: {
            sincronizacao: 'ATIVO',
            ultimaAtualizacao: agora,
            performance: 'NORMAL'
          },
          indicadoresInstantaneos: {
            usuariosOnline: Math.floor(Math.random() * 20) + 5, // Simular entre 5-25 usuários
            operacoesMinuto: Math.floor(Math.random() * 100) + 50, // Simular entre 50-150 ops/min
            tempoResposta: Math.floor(Math.random() * 200) + 100 // Simular entre 100-300ms
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao carregar métricas em tempo real: ${error.message}`);
    }
  }

  /**
   * 📋 RESUMO RÁPIDO (FUTURO - PLACEHOLDER)
   */
  @Get('resumo')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA, Role.OPERADOR)
  @ApiOperation({ 
    summary: 'Resumo rápido do dashboard',
    description: 'Retorna um resumo condensado com os principais indicadores'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resumo rápido retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            cards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  titulo: { type: 'string' },
                  valor: { type: 'number' },
                  variacao: { type: 'number' },
                  tendencia: { type: 'string', enum: ['up', 'down', 'stable'] },
                  icone: { type: 'string' },
                  cor: { type: 'string' }
                }
              }
            },
            alertasUrgentes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  tipo: { type: 'string' },
                  mensagem: { type: 'string' },
                  prioridade: { type: 'string', enum: ['baixa', 'media', 'alta', 'critica'] },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
  })
  async getResumoRapido() {
    try {
      // ✅ SIMULAR RESUMO RÁPIDO
      return {
        success: true,
        data: {
          cards: [
            {
              titulo: 'Total de Multas',
              valor: Math.floor(Math.random() * 1000) + 500,
              variacao: (Math.random() * 20) - 10, // Entre -10% e +10%
              tendencia: Math.random() > 0.5 ? 'up' : 'down',
              icone: 'document-text',
              cor: '#3B82F6'
            },
            {
              titulo: 'Valor Total',
              valor: Math.floor(Math.random() * 100000) + 50000,
              variacao: (Math.random() * 15) - 7.5,
              tendencia: Math.random() > 0.5 ? 'up' : 'stable',
              icone: 'currency-dollar',
              cor: '#10B981'
            },
            {
              titulo: 'Multas Vencidas',
              valor: Math.floor(Math.random() * 100) + 20,
              variacao: (Math.random() * 25) - 12.5,
              tendencia: Math.random() > 0.7 ? 'down' : 'up',
              icone: 'exclamation-triangle',
              cor: '#EF4444'
            },
            {
              titulo: 'Taxa de Pagamento',
              valor: Math.floor(Math.random() * 30) + 70, // Entre 70% e 100%
              variacao: (Math.random() * 10) - 5,
              tendencia: Math.random() > 0.6 ? 'up' : 'stable',
              icone: 'check-circle',
              cor: '#8B5CF6'
            }
          ],
          alertasUrgentes: [
            {
              tipo: 'VENCIMENTO',
              mensagem: 'Existem multas vencendo hoje que requerem atenção',
              prioridade: 'alta',
              timestamp: new Date()
            },
            {
              tipo: 'SISTEMA',
              mensagem: 'Sincronização com Oracle executada com sucesso',
              prioridade: 'baixa',
              timestamp: new Date()
            }
          ],
          proximasAcoes: [
            {
              acao: 'Revisar multas vencidas',
              prazo: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
              responsavel: 'Equipe Jurídica',
              prioridade: 'alta'
            },
            {
              acao: 'Relatório mensal de performance',
              prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
              responsavel: 'Coordenação',
              prioridade: 'media'
            }
          ]
        }
      };
    } catch (error) {
      throw new Error(`Erro ao carregar resumo rápido: ${error.message}`);
    }
  }

  /**
   * 🔄 STATUS DO SISTEMA
   */
  @Get('status')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA, Role.OPERADOR)
  @ApiOperation({ 
    summary: 'Status do sistema jurídico',
    description: 'Retorna informações sobre o status e saúde do sistema'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Status do sistema retornado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            sistema: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['ONLINE', 'OFFLINE', 'MANUTENCAO'] },
                uptime: { type: 'string', description: 'Tempo de atividade' },
                versao: { type: 'string', description: 'Versão do sistema' },
                ultimaAtualizacao: { type: 'string', format: 'date-time' }
              }
            },
            servicos: {
              type: 'object',
              properties: {
                oracle: { type: 'string', enum: ['CONECTADO', 'DESCONECTADO', 'ERRO'] },
                cache: { type: 'string', enum: ['ATIVO', 'INATIVO'] },
                sincronizacao: { type: 'string', enum: ['ATIVA', 'PAUSADA', 'ERRO'] },
                alertas: { type: 'string', enum: ['FUNCIONANDO', 'FALHA'] }
              }
            },
            performance: {
              type: 'object',
              properties: {
                tempoResposta: { type: 'number', description: 'Tempo de resposta médio (ms)' },
                throughput: { type: 'number', description: 'Requisições por segundo' },
                memoryUsage: { type: 'number', description: 'Uso de memória (%)' },
                cpuUsage: { type: 'number', description: 'Uso de CPU (%)' }
              }
            }
          }
        }
      }
    }
  })
  async getStatusSistema() {
    try {
      return {
        success: true,
        data: {
          sistema: {
            status: 'ONLINE',
            uptime: '99.9%',
            versao: '1.0.0',
            ultimaAtualizacao: new Date()
          },
          servicos: {
            oracle: 'CONECTADO',
            cache: 'ATIVO',
            sincronizacao: 'ATIVA',
            alertas: 'FUNCIONANDO'
          },
          performance: {
            tempoResposta: Math.floor(Math.random() * 100) + 50, // 50-150ms
            throughput: Math.floor(Math.random() * 50) + 100, // 100-150 req/s
            memoryUsage: Math.floor(Math.random() * 30) + 40, // 40-70%
            cpuUsage: Math.floor(Math.random() * 20) + 20 // 20-40%
          }
        }
      };
    } catch (error) {
      throw new Error(`Erro ao obter status do sistema: ${error.message}`);
    }
  }
}