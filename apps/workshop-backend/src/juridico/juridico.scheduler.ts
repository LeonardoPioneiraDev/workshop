import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { JuridicoService } from './juridico.service';

@Injectable()
export class JuridicoSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JuridicoSchedulerService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly juridicoService: JuridicoService) {}

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
    next.setHours(10, 0, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next.getTime() - now.getTime();
  }

  private scheduleNextRun() {
    const delay = this.msUntilNext10AM();
    this.logger.log(`Agendando sincronização SEMOB para ${Math.round(delay / 1000)}s`);
    this.timer = setTimeout(async () => {
      await this.runTask();
      this.scheduleNextRun();
    }, delay);
  }

  private async runTask() {
    try {
      this.logger.log('Executando sincronização SEMOB agendada (10:00)…');
      await this.juridicoService.syncSemobFines();
      this.logger.log('Sincronização SEMOB agendada concluída.');
    } catch (error: any) {
      this.logger.error(`Erro na sincronização SEMOB agendada: ${error?.message}`);
    }
  }
}

