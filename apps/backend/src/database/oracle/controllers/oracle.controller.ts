// src/database/oracle/oracle.controller.ts
import { 
  Controller, 
  Post, 
  Get,
  HttpCode, 
  HttpStatus, 
  Res, 
  Body, 
  Logger,
  Query 
} from '@nestjs/common';
import { OracleService } from '../services/oracle.service';
import { Response } from 'express';

interface OSDataRequest {
  startDate?: string;
  endDate?: string;
  origens?: number[];
  garagens?: number[];
  limit?: number;
  useSimpleQuery?: boolean;
}

@Controller('oracle-extract')
export class OracleExtractController {
  private readonly logger = new Logger(OracleExtractController.name);

  constructor(private readonly oracleService: OracleService) {}

  // 🔍 Rota de diagnóstico para verificar dados
  @Get('diagnose')
  @HttpCode(HttpStatus.OK)
  async diagnose(@Res() res: Response): Promise<void> {
    try {
      this.logger.log('🔍 Iniciando diagnóstico das tabelas Oracle...');
      
      const diagnostics = {};
      
      const tests = [
        {
          name: 'Verificar MAN_OS',
          query: 'SELECT COUNT(*) as total FROM man_os WHERE ROWNUM <= 1'
        },
        {
          name: 'Verificar MAN_OSREALIZADO', 
          query: 'SELECT COUNT(*) as total FROM man_osrealizado WHERE ROWNUM <= 1'
        },
        {
          name: 'Verificar MAN_ORIGEMOS',
          query: 'SELECT COUNT(*) as total FROM man_origemos WHERE ROWNUM <= 1'
        },
        {
          name: 'Dados recentes MAN_OS',
          query: `SELECT 
                    COUNT(*) as total,
                    MIN(DATAABERTURAOS) as data_mais_antiga,
                    MAX(DATAABERTURAOS) as data_mais_recente
                  FROM man_os 
                  WHERE ROWNUM <= 1000`
        },
        {
          name: 'Códigos de origem disponíveis',
          query: `SELECT CODORIGOS, COUNT(*) as qtd 
                  FROM man_os 
                  WHERE ROWNUM <= 100
                  GROUP BY CODORIGOS 
                  ORDER BY qtd DESC`
        },
        {
          name: 'Garagens disponíveis',
          query: `SELECT CODIGOGA, COUNT(*) as qtd 
                  FROM man_os 
                  WHERE ROWNUM <= 100
                  GROUP BY CODIGOGA 
                  ORDER BY qtd DESC`
        },
        {
          name: 'Teste com schema globus',
          query: 'SELECT COUNT(*) as total FROM globus.man_os WHERE ROWNUM <= 1'
        }
      ];

      for (const test of tests) {
        try {
          const result = await this.oracleService.executeQuery(test.query);
          diagnostics[test.name] = {
            success: true,
            data: result,
            count: result.length
          };
        } catch (error: any) {
          diagnostics[test.name] = {
            success: false,
            error: error.message
          };
        }
      }

      this.logger.log('✅ Diagnóstico concluído');
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        diagnostics
      });
      return;

    } catch (error: any) {
      this.logger.error('❌ Erro no diagnóstico:', error.message);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return;
    }
  }

  // 🧪 Rota de teste simples
  @Get('test-simple')
  @HttpCode(HttpStatus.OK)
  async testSimple(@Res() res: Response): Promise<void> {
    try {
      this.logger.log('🧪 Executando teste simples...');
      
      const sqlQuery = `
        SELECT 
          CODINTOS,
          NUMEROOS,
          CODIGOVEIC,
          CODIGOGA,
          TO_CHAR(DATAABERTURAOS, 'DD/MM/YYYY') as DATA_ABERTURA,
          CODORIGOS,
          TIPOOS
        FROM man_os 
        WHERE ROWNUM <= 10
        ORDER BY DATAABERTURAOS DESC
      `;

      const data = await this.oracleService.executeQuery(sqlQuery);
      
      this.logger.log(`✅ Teste simples: ${data.length} registros encontrados`);
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Teste simples executado com sucesso',
        data,
        count: data.length
      });
      return;

    } catch (error: any) {
      this.logger.error('❌ Erro no teste simples:', error.message);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return;
    }
  }

// 📊 Rota principal para extrair dados de OS
@Post('os-data')
@HttpCode(HttpStatus.OK)
async extractOSData(@Body() body: OSDataRequest, @Res() res: Response): Promise<void> {
  try {
    this.logger.log('📊 Requisição recebida para extrair dados da OS do Oracle');
    
    // Validar se body existe e definir valores padrão
    const requestBody = body || {};
    
    const {
      startDate = '2025-05-01',
      endDate = '2025-06-03', 
      origens = [23, 24],
      garagens = [],
      limit = 100,
      useSimpleQuery = true
    } = requestBody;

    this.logger.log(`🔧 Parâmetros: startDate=${startDate}, endDate=${endDate}, origens=[${origens.join(',')}], limit=${limit}, useSimpleQuery=${useSimpleQuery}`);

    let sqlQuery: string;

    if (useSimpleQuery) {
      // Consulta simples e funcional
      sqlQuery = `
        SELECT
          T2.CODINTOS AS "codigoInternoOS",
          T2.NUMEROOS AS "numeroOS", 
          T2.CODIGOVEIC AS "codigoVeiculo",
          T2.CODIGOGA AS "codigoGaragem",
          TO_CHAR(T2.DATAABERTURAOS, 'DD/MM/YYYY') AS "dataAbertura",
          TO_CHAR(T2.DATAFECHAMENTOOS, 'DD/MM/YYYY') AS "dataFechamento",
          T2.HORAABERTURAOS AS "horaAbertura",
          T2.TIPOOS AS "tipoOS",
          T2.CONDICAOOS AS "condicaoOS",
          T2.CODORIGOS AS "codigoOrigemOS",
          T2.USUARIOABERTURAOS AS "usuarioAbertura",
          T1.DESCRCOMPLOSREA AS "descricaoServico",
          T1.CODSETOR AS "codigoSetor",
          T3.DESCORIGOS AS "descricaoOrigem",
          CASE 
            WHEN T2.CODIGOGA = 124 THEN 'SANTA MARIA'
            WHEN T2.CODIGOGA = 240 THEN 'GAMA'
            WHEN T2.CODIGOGA = 239 THEN 'SÃO SEBASTIÃO'
            WHEN T2.CODIGOGA = 31 THEN 'PARANOÁ'
            ELSE 'GARAGEM_' || T2.CODIGOGA
          END AS "nomeGaragem",
          CASE 
            WHEN T2.CODORIGOS = 23 THEN 'QUEBRA'
            WHEN T2.CODORIGOS = 24 THEN 'DEFEITO'
            ELSE 'OUTRO'
          END AS "tipoProblema"
        FROM
          man_osrealizado T1
        INNER JOIN
          man_os T2 ON T1.CODINTOS = T2.CODINTOS
        LEFT JOIN
          man_origemos T3 ON T2.CODORIGOS = T3.CODORIGOS
        WHERE
          T2.DATAABERTURAOS >= TO_DATE('${startDate}', 'YYYY-MM-DD')
          AND T2.DATAABERTURAOS <= TO_DATE('${endDate}', 'YYYY-MM-DD')
          ${origens && origens.length > 0 ? `AND T2.CODORIGOS IN (${origens.join(',')})` : ''}
          ${garagens && garagens.length > 0 ? `AND T2.CODIGOGA IN (${garagens.join(',')})` : ''}
          AND ROWNUM <= ${limit}
        ORDER BY
          T2.DATAABERTURAOS DESC
      `;
    } else {
      // Sua consulta complexa original (simplificada)
      sqlQuery = `
        SELECT 
          T2.CODINTOS AS "codigoInternoOS",
          T2.NUMEROOS AS "numeroOS",
          T2.CODIGOVEIC AS "codigoVeiculo",
          T2.CODIGOGA AS "codigoGaragem",
          TO_CHAR(T2.DATAABERTURAOS, 'DD/MM/YYYY') AS "dataAbertura",
          CASE 
            WHEN T2.CODIGOGA = 124 THEN 'SANTA MARIA'
            WHEN T2.CODIGOGA = 240 THEN 'GAMA'
            WHEN T2.CODIGOGA = 239 THEN 'SÃO SEBASTIÃO'
            WHEN T2.CODIGOGA = 31 THEN 'PARANOÁ'
            ELSE 'GARAGEM_' || T2.CODIGOGA
          END AS "nomeGaragem",
          CASE 
            WHEN T2.CODORIGOS = 23 THEN 'QUEBRA'
            WHEN T2.CODORIGOS = 24 THEN 'DEFEITO'
            ELSE 'OUTRO'
          END AS "tipoProblema",
          T1.DESCRCOMPLOSREA AS "descricaoServico",
          T3.DESCORIGOS AS "descricaoOrigem"
        FROM
          man_osrealizado T1
        INNER JOIN
          man_os T2 ON T1.CODINTOS = T2.CODINTOS
        LEFT JOIN
          man_origemos T3 ON T2.CODORIGOS = T3.CODORIGOS
        WHERE
          T2.DATAABERTURAOS >= TO_DATE('${startDate}', 'YYYY-MM-DD')
          AND T2.DATAABERTURAOS <= TO_DATE('${endDate}', 'YYYY-MM-DD')
          ${origens && origens.length > 0 ? `AND T2.CODORIGOS IN (${origens.join(',')})` : ''}
          ${garagens && garagens.length > 0 ? `AND T2.CODIGOGA IN (${garagens.join(',')})` : ''}
          AND ROWNUM <= ${limit}
        ORDER BY 
          T2.DATAABERTURAOS DESC,
          T2.NUMEROOS
      `;
    }

    this.logger.log(`🔍 Executando query ${useSimpleQuery ? 'simples' : 'complexa'}...`);
    
    const data = await this.oracleService.executeQuery(sqlQuery);
    
    this.logger.log(`✅ Extraídos ${data.length} registros da OS`);
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: `Dados extraídos com sucesso`,
      filters: { startDate, endDate, origens, garagens, limit, useSimpleQuery },
      data,
      count: data.length
    });
    return;

  } catch (error: any) {
    this.logger.error(`❌ Erro ao extrair dados da OS: ${error.message}`, error.stack);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Falha ao extrair dados da OS do Oracle',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return;
  }
}
}