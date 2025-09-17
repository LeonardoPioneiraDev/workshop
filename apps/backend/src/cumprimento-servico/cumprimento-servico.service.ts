// src/cumprimento-servico/cumprimento-servico.service.ts
import { Injectable, InternalServerErrorException, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, catchError, timeout, retry, of } from 'rxjs';
import { ImportarCumprimentosDto } from './dto/importar-cumprimentos.dto';
import { OperationRulesService } from '../operations/operation-rules.service';
import { FiltrosDTO } from './dto/filtrosdto/filters.dto';
import { remove as removeAccents } from 'diacritics';
import { AxiosError } from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

// Interfaces para tipar os resultados
export interface ResultadoImportacao {
  mensagem: string;
  total: number;
  totais: {
    atrasos: number;
    adiantados: number;
    furos: number;
    linhasErradas: number;
  };
  tempoExecucao: string;
  dados: any[];
}

export interface ResultadoListagem {
  total: number;
  tempoExecucao: string;
  page?: number;
  limit?: number;
  totalPages?: number;
  dados: any[];
}

@Injectable()
export class CumprimentoServicoService {
  private dados: any[] = [];
  private readonly logger = new Logger(CumprimentoServicoService.name);
  // Remover readonly para permitir atribuição
  private cacheTime = 0; 
  private readonly cacheDuration: number;

  constructor(
    private readonly http: HttpService,
    private readonly regras: OperationRulesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    this.cacheDuration = this.configService.get<number>('CACHE_DURATION', 5 * 60 * 1000); // 5 minutos em milissegundos
  }

  // Importa e aplica regras com otimizações
  async importarCumprimentos(query: ImportarCumprimentosDto): Promise<ResultadoImportacao> {
    try {
      const cacheKey = `importar:${JSON.stringify(query)}`;
      
      // Verificar se os dados estão em cache
      const cachedData = await this.cacheManager.get<ResultadoImportacao>(cacheKey);
      if (cachedData) {
        this.logger.log(`Retornando dados do cache para query: ${JSON.stringify(query)}`);
        return cachedData;
      }
      
      this.logger.log(`Iniciando importação de cumprimentos: ${JSON.stringify(query)}`);
      const startTime = Date.now();
      
      const baseUrl = 'https://its00078.itstransdata.com/ITS-InfoExport_CA06FCF3-D34E-4567-B069-153EA5085D80/api/Data/cumprimentoservico';
      const url = new URL(baseUrl);

      // Parâmetros de consulta
      const params = ['dia', 'idservico', 'idempresa', 'numerolinha', 'prefixorealizado', 'prefixoprevisto', 'statusini', 'statusfim'];

      for (const key of params) {
        if (query[key]) {
          url.searchParams.append(key, query[key]);
        }
      }

      // Fazer a requisição com retry simplificado
      const response = await lastValueFrom(
        this.http.get(url.toString()).pipe(
          timeout(30000), // 30 segundos de timeout
          retry(3), // Usar a forma simples do retry
          catchError((error: AxiosError) => {
          //  this.logger.error(`Erro na requisição HTTP: ${error.message}`, error.stack);
            
            if (error.code === 'ECONNABORTED') {
              throw new HttpException(
                'Tempo limite excedido ao conectar com o serviço externo. Tente novamente mais tarde.',
                HttpStatus.GATEWAY_TIMEOUT
              );
            }
            
            throw new HttpException(
              `Erro ao importar dados: ${error.message}`,
              HttpStatus.BAD_GATEWAY
            );
          }),
        )
      );

      const dadosOriginais = response.data;
      //this.logger.log(`Recebidos ${dadosOriginais.length} registros. Aplicando regras...`);

      // Processar dados em lotes para evitar bloqueio do event loop
      const batchSize = 100;
      const resultados: any[] = []; // Definir tipo explícito
      
      for (let i = 0; i < dadosOriginais.length; i += batchSize) {
        const lote = dadosOriginais.slice(i, i + batchSize);
        
        // Processar lote de forma assíncrona
        const processedBatch = await Promise.all(
          lote.map(item => {
            const viagemComCampos = {
              ...item,
              InicioPrevisto: item.InicioPrevisto,
              InicioRealizado: item.InicioRealizado,
              IdLinhaEsperada: item.IdLinhaEsperada ?? item.IdLinha,
              IdLinha: item.IdLinha,
            };
            return this.regras.aplicarRegras(viagemComCampos);
          })
        );
        
        // Usar forEach em vez de spread para evitar erro de tipo
        processedBatch.forEach(item => resultados.push(item));
        
        // Log de progresso
       // this.logger.log(`Processados ${Math.min(i + batchSize, dadosOriginais.length)} de ${dadosOriginais.length} registros`);
        
        // Pequena pausa para liberar o event loop
        if (i + batchSize < dadosOriginais.length) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      // Atualizar dados em cache
      this.dados = resultados;
      this.cacheTime = Date.now(); // Agora funciona porque removemos readonly

      // Calcular estatísticas
      const totais = {
        atrasos: 0,
        adiantados: 0,
        furos: 0,
        linhasErradas: 0,
      };

      this.dados.forEach((item) => {
        if (item.regras?.atraso) totais.atrasos++;
        if (item.regras?.adiantado) totais.adiantados++;
        if (item.regras?.furoHorario) totais.furos++;
        if (item.regras?.linhaErrada) totais.linhasErradas++;
      });

      const tempoExecucao = Date.now() - startTime;
    //  this.logger.log(`Importação concluída em ${tempoExecucao}ms. Total: ${this.dados.length} registros.`);

      const resultado: ResultadoImportacao = {
        mensagem: 'Importado com regras',
        total: this.dados.length,
        totais,
        tempoExecucao: `${tempoExecucao}ms`,
        dados: this.dados,
      };
      
      // Armazenar no cache
      await this.cacheManager.set(cacheKey, resultado, this.cacheDuration);
      
      return resultado;
    } catch (error) {
   //   this.logger.error(`Erro ao importar dados: ${error.message}`, error.stack);
      
      // Tratamento de erro mais específico
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new InternalServerErrorException(
        `Erro ao importar dados: ${error.message || 'Erro desconhecido'}`
      );
    }
  }

  // Listar cumprimentos com otimizações de performance
  async listarCumprimentos(filtros: FiltrosDTO): Promise<ResultadoListagem> {
    try {
      const cacheKey = `listar:${JSON.stringify(filtros)}`;
      
      // Verificar se os dados estão em cache
      const cachedData = await this.cacheManager.get<ResultadoListagem>(cacheKey);
      if (cachedData) {
     //   this.logger.log(`Retornando dados do cache para filtros: ${JSON.stringify(filtros)}`);
        return cachedData;
      }
      
      this.logger.log(`Listando cumprimentos com filtros: ${JSON.stringify(filtros)}`);
      const startTime = Date.now();
      
      // Verificar se o cache expirou
      const agora = Date.now();
      if (this.dados.length === 0 || agora - this.cacheTime > this.cacheDuration) {
      //  this.logger.log('Cache expirado ou vazio. Considere importar novos dados.');
      }
      
      // Aplicar paginação
      const page = filtros.page || 1;
      const limit = filtros.limit || 50;
      const skip = (page - 1) * limit;
      
      // Se não houver filtros, retornar todos os dados (com paginação)
      if (!filtros || Object.keys(filtros).filter(k => k !== 'page' && k !== 'limit').length === 0) {
        const dadosPaginados = this.dados.slice(skip, skip + limit);
        
        const tempoExecucao = Date.now() - startTime;
    //    this.logger.log(`Listagem concluída em ${tempoExecucao}ms. Retornando ${dadosPaginados.length} de ${this.dados.length} registros (página ${page}).`);
        
        const resultado: ResultadoListagem = {
          total: this.dados.length,
          tempoExecucao: `${tempoExecucao}ms`,
          page,
          limit,
          totalPages: Math.ceil(this.dados.length / limit),
          dados: dadosPaginados,
        };
        
        // Armazenar no cache
        await this.cacheManager.set(cacheKey, resultado, this.cacheDuration);
        
        return resultado;
      }

      // Função para normalizar strings (remover acentos e converter para minúsculas)
      const normaliza = (str: string) => str ? removeAccents(str).toLowerCase() : '';

      // Aplicar filtros de forma otimizada
      const dadosFiltrados = this.dados.filter((item) => {
        // Verificar cada filtro apenas se estiver definido
        if (filtros.motorista && !normaliza(item.NomeMotorista || '').includes(normaliza(filtros.motorista))) {
          return false;
        }
        
        if (filtros.linha && !(item.IdLinha?.toString() || '').includes(filtros.linha)) {
          return false;
        }
        
        if (filtros.sentido && !normaliza(item.SentidoText || '').includes(normaliza(filtros.sentido))) {
          return false;
        }
        
        if (filtros.setor && !normaliza(item.Trajeto || '').includes(normaliza(filtros.setor))) {
          return false;
        }
        
        if (filtros.pontoInicial && !normaliza(item.NomePI || '').includes(normaliza(filtros.pontoInicial))) {
          return false;
        }
        
        if (filtros.pontoFinal && !normaliza(item.NomePF || '').includes(normaliza(filtros.pontoFinal))) {
          return false;
        }
        
        if (filtros.prefixoprevisto && !normaliza(item.PrefixoPrevisto || '').includes(normaliza(filtros.prefixoprevisto))) {
          return false;
        }
        
        if (filtros.prefixorealizado && !normaliza(item.PrefixoRealizado || '').includes(normaliza(filtros.prefixorealizado))) {
          return false;
        }
        
        return true;
      });
      
      // Aplicar paginação aos resultados filtrados
      const dadosPaginados = dadosFiltrados.slice(skip, skip + limit);

      const tempoExecucao = Date.now() - startTime;
    //  this.logger.log(`Listagem com filtros concluída em ${tempoExecucao}ms. Encontrados ${dadosFiltrados.length} de ${this.dados.length} registros.`);
      
      const resultado: ResultadoListagem = {
        total: dadosFiltrados.length,
        tempoExecucao: `${tempoExecucao}ms`,
        page,
        limit,
        totalPages: Math.ceil(dadosFiltrados.length / limit),
        dados: dadosPaginados,
      };
      
      // Armazenar no cache
      await this.cacheManager.set(cacheKey, resultado, this.cacheDuration);
      
      return resultado;
    } catch (error) {
    //  this.logger.error(`Erro ao listar cumprimentos: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Erro ao listar dados: ${error.message || 'Erro desconhecido'}`);
    }
  }
}