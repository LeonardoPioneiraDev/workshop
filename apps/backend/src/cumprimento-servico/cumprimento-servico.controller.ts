// src/cumprimento-servico/cumprimento-servico.controller.ts
import { 
  Controller, 
  Get, 
  Query, 
  UseInterceptors,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { CumprimentoServicoService } from './cumprimento-servico.service';
import { ImportarCumprimentosDto } from './dto/importar-cumprimentos.dto';
import { FiltrosDTO } from './dto/filtrosdto/filters.dto';
import { ThrottlerGuard } from '@nestjs/throttler';

// Interface para tipar o resultado
interface ResultadoImportacao {
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

interface ResultadoListagem {
  total: number;
  tempoExecucao: string;
  page?: number;
  limit?: number;
  totalPages?: number;
  dados: any[];
}

@Controller('cumprimentos')
@UseGuards(ThrottlerGuard)
export class CumprimentoServicoController {
  private readonly logger = new Logger(CumprimentoServicoController.name);

  constructor(private readonly servico: CumprimentoServicoService) {}

  // Rota para importar cumprimentos
  @Get('importar')
  async importar(@Query() query: ImportarCumprimentosDto): Promise<ResultadoImportacao> {
    try {
      //this.logger.log(`Recebida requisição para importar: ${JSON.stringify(query)}`);
      
      if (!query.dia) {
        throw new HttpException(
          'O parâmetro "dia" é obrigatório para importação',
          HttpStatus.BAD_REQUEST
        );
      }
      
      const resultado = await this.servico.importarCumprimentos(query);
      
      //this.logger.log(`Importação concluída com sucesso: ${resultado.total} registros`);
      
      // Garantir que a resposta tenha a estrutura esperada
      return {
        mensagem: resultado.mensagem,
        total: resultado.total,
        totais: resultado.totais,
        tempoExecucao: resultado.tempoExecucao,
        dados: resultado.dados || [],
      };
    } catch (error) {
      //this.logger.error(`Erro ao processar importação: ${error.message}`);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Erro ao processar importação: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Rota para listar cumprimentos com cache
@Get()
@UseInterceptors(CacheInterceptor)
@CacheTTL(60)
async listar(@Query() filtros: FiltrosDTO): Promise<ResultadoListagem> {
  try {
   // this.logger.log(`Recebida requisição para listar com filtros: ${JSON.stringify(filtros)}`);
    
    const resultado = await this.servico.listarCumprimentos(filtros);
    
    //this.logger.log(`Listagem concluída com sucesso: ${resultado.total} registros encontrados`);
    
    // Garantir que a resposta tenha a estrutura esperada
    return {
      total: resultado.total,
      tempoExecucao: resultado.tempoExecucao,
      page: resultado.page || 1,
      limit: resultado.limit || 50,
      totalPages: resultado.totalPages || 1,
      dados: resultado.dados || [],
    };
  } catch (error) {
     // this.logger.error(`Erro ao processar listagem: ${error.message}`);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Erro ao processar listagem: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  // Endpoint de saúde
  @Get('health')
  async health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }
}