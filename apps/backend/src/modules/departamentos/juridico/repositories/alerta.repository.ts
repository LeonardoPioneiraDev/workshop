// src/modules/departamentos/juridico/repositories/alerta.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertaEntity } from '../entities/alerta.entity';

@Injectable()
export class AlertaRepository {
  constructor(
    @InjectRepository(AlertaEntity)
    private readonly repository: Repository<AlertaEntity>
  ) {}

  async criarAlerta(dadosAlerta: Partial<AlertaEntity>): Promise<AlertaEntity> {
    return await this.repository.save(dadosAlerta);
  }

  async findAtivos(): Promise<AlertaEntity[]> {
    return await this.repository.find({
      where: { status: 'ATIVO' },
      order: { dataOcorrencia: 'DESC' }
    });
  }

  async findByTipo(tipoAlerta: string): Promise<AlertaEntity[]> {
    return await this.repository.find({
      where: { tipoAlerta },
      order: { dataOcorrencia: 'DESC' }
    });
  }

  async findBySeveridade(severidade: string): Promise<AlertaEntity[]> {
    return await this.repository.find({
      where: { severidade, status: 'ATIVO' },
      order: { dataOcorrencia: 'DESC' }
    });
  }

  async resolverAlerta(id: number, usuarioResponsavel: string, observacoes?: string): Promise<void> {
    await this.repository.update(id, {
      status: 'RESOLVIDO',
      usuarioResponsavel,
      dataResolucao: new Date(),
      observacoesResolucao: observacoes
    });
  }

  async ignorarAlerta(id: number, usuarioResponsavel: string, observacoes?: string): Promise<void> {
    await this.repository.update(id, {
      status: 'IGNORADO',
      usuarioResponsavel,
      dataResolucao: new Date(),
      observacoesResolucao: observacoes
    });
  }

  async obterEstatisticas(): Promise<any> {
    const estatisticas = await this.repository
      .createQueryBuilder('alerta')
      .select([
        'alerta.status',
        'alerta.severidade',
        'alerta.tipoAlerta',
        'COUNT(*) as quantidade'
      ])
      .groupBy('alerta.status, alerta.severidade, alerta.tipoAlerta')
      .getRawMany();

    return {
      total: await this.repository.count(),
      ativos: await this.repository.count({ where: { status: 'ATIVO' } }),
      criticos: await this.repository.count({ where: { severidade: 'CRITICAL', status: 'ATIVO' } }),
      distribuicao: estatisticas
    };
  }
}