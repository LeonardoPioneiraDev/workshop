import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CumprimentoServico } from './entities/cumprimento-servico.entity';

@Injectable()
export class CumprimentoServicoRepository extends Repository<CumprimentoServico> {
  constructor(private dataSource: DataSource) {
    super(CumprimentoServico, dataSource.createEntityManager());
  }

  async encontrarPorDataEServico(dia: string, idservico?: string) {
    const query = this.createQueryBuilder('cumprimento');
    query.where('cumprimento.dia = :dia', { dia });

    if (idservico) {
      query.andWhere('cumprimento.idservico = :idservico', { idservico });
    }

    return await query.getMany();
  }
}
