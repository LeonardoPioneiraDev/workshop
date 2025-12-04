import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DeptPessoalService } from './dept-pessoal.service';

@Injectable()
export class DeptPessoalSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DeptPessoalSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly service: DeptPessoalService) {}

  onModuleInit() {
    this.scheduleNextRun();
  }

  onModuleDestroy() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private msUntilNext10AM(): number {
    const now = new Date();
    const next = new Date(now);
    next.setHours(10, 5, 0, 0); // 10:05
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next.getTime() - now.getTime();
  }

  private scheduleNextRun() {
    const delay = this.msUntilNext10AM();
    this.logger.log(`Agendando sincronização Dept. Pessoal para ${Math.round(delay / 1000)}s`);
    this.timer = setTimeout(async () => {
      await this.runTask();
      this.scheduleNextRun();
    }, delay);
  }

  private async runTask() {
    try {
      this.logger.log('Executando sincronização Dept. Pessoal agendada (10:05) ...');
      await this.service.ensureSnapshots(true);
      this.logger.log('Sincronização Dept. Pessoal agendada concluída.');
    } catch (error: any) {
      this.logger.error(`Erro na sincronização Dept. Pessoal agendada: ${error?.message}`);
    }
  }
}

