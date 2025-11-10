// src/modules/departamentos/departamentos.controller.ts
import { Controller, Get, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PessoalService } from './pessoal/services/pessoal.service';
import { DashboardOperacoesService } from './operacoes/services/dashboard.service'; // ✅ NOVO

@ApiTags('Departamentos')
@Controller('departamentos')
export class DepartamentosController {
  private readonly logger = new Logger(DepartamentosController.name);

  constructor(
    private readonly pessoalService: PessoalService,
    private readonly dashboardOperacoesService: DashboardOperacoesService, // ✅ NOVO
  ) {}

  @Get('dashboard-geral')
  @ApiOperation({ 
    summary: 'Dashboard geral de todos os departamentos',
    description: 'Retorna estatísticas consolidadas de todos os departamentos'
  })
  @ApiResponse({ status: 200, description: 'Dashboard geral gerado com sucesso' })
  async dashboardGeral() {
    try {
      this.logger.log('📊 Gerando dashboard geral dos departamentos...');

      const [
        dashboardPessoal,
        dashboardPessoalCompleto,
        dashboardOperacoes, // ✅ NOVO
      ] = await Promise.all([
        this.pessoalService.gerarDashboard(),
        this.pessoalService.gerarDashboardFuncionariosCompletos(),
        this.dashboardOperacoesService.gerarDashboardCompleto(), // ✅ NOVO
      ]);

      return {
        success: true,
        message: 'Dashboard geral dos departamentos',
        data: {
          pessoal: dashboardPessoal,
          pessoalCompleto: dashboardPessoalCompleto,
          operacoes: dashboardOperacoes, // ✅ NOVO
        },
        departamentos: {
          pessoal: {
            nome: 'Departamento Pessoal',
            status: 'ATIVO',
            endpoints: {
              dashboard: '/departamentos/pessoal/dashboard',
              funcionarios: '/departamentos/pessoal/funcionarios',
              funcionariosCompletos: '/departamentos/pessoal/funcionarios-completos',
              estatisticas: '/departamentos/pessoal/estatisticas',
              sincronizar: '/departamentos/pessoal/sincronizar',
              sincronizarCompletos: '/departamentos/pessoal/funcionarios-completos/sincronizar'
            }
          },
          operacoes: { // ✅ NOVO
            nome: 'Departamento de Operações',
            status: 'ATIVO',
            endpoints: {
              dashboard: '/departamentos/operacoes/dashboard',
              frota: '/departamentos/operacoes/frota',
              acidentes: '/departamentos/operacoes/acidentes',
              sincronizar: '/departamentos/operacoes/sincronizar-tudo',
              executivo: '/departamentos/operacoes/dashboard/executivo'
            }
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Erro ao gerar dashboard geral: ${error.message}`);
      throw new HttpException(
        `Erro ao gerar dashboard geral: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}