import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DeptPessoalService } from './dept-pessoal.service';

@ApiTags('Departamento Pessoal')
@UseGuards(JwtAuthGuard)
@Controller('dept-pessoal')
export class DeptPessoalController {
  constructor(private readonly service: DeptPessoalService) { }

  @Get('sync')
  @ApiOperation({ summary: 'Sincronizar Departamento Pessoal (4 referências)' })
  @ApiResponse({ status: 200, description: 'Sincronização concluída' })
  async sync(@Query('force') force?: string) {
    const doForce = (force || '').toLowerCase() === 'true';
    return this.service.ensureSnapshots(doForce);
  }

  @Get()
  @ApiOperation({ summary: 'Obter dados do mês atual (sincroniza se necessário)' })
  @ApiResponse({ status: 200, description: 'Lista do mês atual' })
  async getCurrent(@Query('force') force?: string) {
    const doForce = (force || '').toLowerCase() === 'true';
    await this.service.ensureSnapshots(doForce);
    return this.service.getCurrentMonth();
  }

  @Get('resumo')
  @ApiOperation({ summary: 'Resumo por departamento/área/situação da janela (mês atual, -1, -2, -12)' })
  @ApiResponse({ status: 200, description: 'Resumo retornado com sucesso' })
  async resumo(@Query('force') force?: string) {
    const doForce = (force || '').toLowerCase() === 'true';
    await this.service.ensureSnapshots(doForce);
    return this.service.getResumoJanela();
  }

  @Get('turnover')
  @ApiOperation({ summary: 'Turnover (admitidos/desligados) para 4 referências e última sincronização' })
  @ApiResponse({ status: 200, description: 'Turnover retornado com sucesso' })
  async turnover(@Query('force') force?: string) {
    const doForce = (force || '').toLowerCase() === 'true';
    await this.service.ensureSnapshots(doForce);
    return this.service.getTurnoverWindow();
  }

  @Get('afastados')
  @ApiOperation({ summary: 'Afastados (INSS, Ap. Invalidez, Total) para 4 referências e última sincronização' })
  @ApiResponse({ status: 200, description: 'Afastados retornado com sucesso' })
  async afastados(@Query('force') force?: string) {
    const doForce = (force || '').toLowerCase() === 'true';
    await this.service.ensureSnapshots(doForce);
    await this.service.ensureAfastadosResumo(doForce);
    return this.service.getAfastadosWindow();
  }

  @Get('ativos-categoria')
  @ApiOperation({ summary: 'Funcionários ativos agregados por categoria (Tráfego, Manutenção, Administração, Jovem Aprendiz)' })
  @ApiResponse({ status: 200, description: 'Ativos por categoria retornado com sucesso' })
  async ativosPorCategoria(@Query('force') force?: string) {
    const doForce = (force || '').toLowerCase() === 'true';
    await this.service.ensureSnapshots(doForce);
    return this.service.getAtivosPorCategoria();
  }
}
