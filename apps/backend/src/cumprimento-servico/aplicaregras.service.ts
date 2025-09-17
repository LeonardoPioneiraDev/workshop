import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ImportarCumprimentosDto } from './dto/importar-cumprimentos.dto';
import { OperationRulesService } from '../operations/operation-rules.service';

@Injectable()
export class CumprimentoServicoService {
  private dados: any[] = [];  // Armazena os dados já com regras aplicadas

  constructor(
    private readonly http: HttpService,
    private readonly regras: OperationRulesService, // 👈 injeta o serviço de regras
  ) {}

  // Importa e aplica regras
  async importarCumprimentos(query: ImportarCumprimentosDto) {
    try {
      const baseUrl = 'https://its00078.itstransdata.com/ITS-InfoExport_CA06FCF3-D34E-4567-B069-153EA5085D80/api/Data/cumprimentoservico';
      const url = new URL(baseUrl);

      // Definindo os parâmetros que a API externa pode aceitar
      const params = ['dia', 'idservico', 'idempresa', 'numerolinha', 'prefixoprevisto', 'statusini', 'statusfim'];

      // Adicionando os parâmetros na URL de consulta
      for (const key of params) {
        if (query[key]) url.searchParams.append(key, query[key]);
      }

      const response = await lastValueFrom(this.http.get(url.toString()));

      const dadosOriginais = response.data;

      // Verifica se os campos necessários existem
      this.dados = dadosOriginais.map((item) => {
        // Previne ausência de campos obrigatórios
        const viagemComCampos = {
          ...item,
          IdLinhaEsperada: item.IdLinhaEsperada ?? item.IdLinha, // fallback se não vier da API
        };

        return this.regras.aplicarRegras(viagemComCampos);
      });

      // Armazena os dados com as regras aplicadas
      this.dados = response.data.map((item) => this.regras.aplicarRegras(item));

        // Conta quantos de cada regra
    const totais = {
      atrasos: 0,
      furos: 0,
      linhasErradas: 0,
    };

    this.dados.forEach((item) => {
      if (item.regras.atraso) totais.atrasos++;
      if (item.regras.furoHorario) totais.furos++;
      if (item.regras.linhaErrada) totais.linhasErradas++;
    });

      return { 
        mensagem: 'Importado com regras', 
        total: this.dados.length, 
        totais, // ← Retorna total por regra
        dados: this.dados 
      };
    } catch (error) {
      console.error('Erro ao importar:', error);
      throw new InternalServerErrorException('Erro ao importar dados.');
    }
  }

  listarCumprimentos() {
    return this.dados;
  }
}
