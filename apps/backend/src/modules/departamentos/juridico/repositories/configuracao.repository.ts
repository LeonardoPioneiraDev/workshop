// src/modules/departamentos/juridico/repositories/configuracao.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfiguracaoEntity } from '../entities/configuracao.entity';

@Injectable()
export class ConfiguracaoRepository {
  constructor(
    @InjectRepository(ConfiguracaoEntity)
    private readonly repository: Repository<ConfiguracaoEntity>
  ) {}

  async obterPorChave(chave: string): Promise<ConfiguracaoEntity | null> {
    return await this.repository.findOne({ where: { chave } });
  }

  async obterPorCategoria(categoria: string): Promise<ConfiguracaoEntity[]> {
    return await this.repository.find({
      where: { categoria },
      order: { chave: 'ASC' }
    });
  }

  async obterTodas(): Promise<ConfiguracaoEntity[]> {
    return await this.repository.find({
      order: { categoria: 'ASC', chave: 'ASC' }
    });
  }

  async atualizarValor(chave: string, novoValor: string): Promise<void> {
    await this.repository.update({ chave }, { valor: novoValor });
  }

  async criarOuAtualizar(configuracao: Partial<ConfiguracaoEntity>): Promise<ConfiguracaoEntity> {
    const existente = await this.obterPorChave(configuracao.chave);
    
    if (existente) {
      await this.repository.update(existente.id, configuracao);
      return await this.repository.findOne({ where: { id: existente.id } });
    } else {
      return await this.repository.save(configuracao);
    }
  }

  async inicializarConfiguracoesPadrao(): Promise<void> {
    const configuracoesPadrao = [
      {
        chave: 'cache.retention_days',
        valor: '90',
        tipoValor: 'INTEGER',
        categoria: 'CACHE',
        descricao: 'Dias para manter dados no cache',
        valorPadrao: '90',
        validacaoRegex: '^[1-9][0-9]*$'
      },
      {
        chave: 'sync.auto_interval_hours',
        valor: '6',
        tipoValor: 'INTEGER',
        categoria: 'SYNC',
        descricao: 'Intervalo automático de sincronização em horas',
        valorPadrao: '6',
        validacaoRegex: '^[1-9][0-9]*$'
      },
      {
        chave: 'alerts.vencimento_dias',
        valor: '30',
        tipoValor: 'INTEGER',
        categoria: 'ALERTS',
        descricao: 'Dias antes do vencimento para alertar',
        valorPadrao: '30'
      },
      {
        chave: 'reports.max_records',
        valor: '10000',
        tipoValor: 'INTEGER',
        categoria: 'REPORTS',
        descricao: 'Máximo de registros em relatórios',
        valorPadrao: '10000'
      },
      {
        chave: 'performance.query_timeout',
        valor: '30',
        tipoValor: 'INTEGER',
        categoria: 'PERFORMANCE',
        descricao: 'Timeout de queries em segundos',
        valorPadrao: '30'
      },
      {
        chave: 'dashboard.auto_refresh',
        valor: 'true',
        tipoValor: 'BOOLEAN',
        categoria: 'DASHBOARD',
        descricao: 'Atualização automática do dashboard',
        valorPadrao: 'true',
        valoresPermitidos: '["true", "false"]'
      },
      {
        chave: 'notifications.email_enabled',
        valor: 'true',
        tipoValor: 'BOOLEAN',
        categoria: 'NOTIFICATIONS',
        descricao: 'Habilitar notificações por email',
        valorPadrao: 'true'
      },
      {
        chave: 'kpis.meta_pagamento',
        valor: '80.0',
        tipoValor: 'DECIMAL',
        categoria: 'KPIS',
        descricao: 'Meta de taxa de pagamento (%)',
        valorPadrao: '80.0',
        validacaoRegex: '^[0-9]+\.?[0-9]*$'
      }
    ];

    for (const config of configuracoesPadrao) {
      await this.criarOuAtualizar(config);
    }
  }
}