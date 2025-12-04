import { 
  Controller, 
  Get,
  HttpCode, 
  HttpStatus, 
  HttpException,
  Logger
} from '@nestjs/common';
import { OracleReadOnlyService } from './services/oracle-readonly.service';

@Controller('oracle')
export class OracleController {
  private readonly logger = new Logger(OracleController.name);

  constructor(
    private readonly oracleService: OracleReadOnlyService
  ) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck(): Promise<any> {
    try {
      this.logger.log('🏥 Executando health check Oracle');

      const isEnabled = this.oracleService.isEnabled();
      
      if (!isEnabled) {
        return {
          success: false,
          timestamp: new Date().toISOString(),
          message: 'Oracle está desabilitado',
          status: 'DISABLED',
          oracle: {
            enabled: false,
            connection: 'N/A'
          }
        };
      }

      const isConnected = await this.oracleService.testConnection();
      
      let connectionInfo = null;
      if (isConnected) {
        try {
          connectionInfo = await this.oracleService.getConnectionInfo();
        } catch (error) {
          this.logger.warn('⚠️ Não foi possível obter informações da conexão');
        }
      }

      const status = isConnected ? 'HEALTHY' : 'UNHEALTHY';

      return {
        success: isConnected,
        timestamp: new Date().toISOString(),
        message: `Oracle ${status}`,
        status,
        oracle: {
          enabled: isEnabled,
          connected: isConnected,
          connectionInfo,
          mode: 'READ-only'
        },
        endpoints: {
          health: '/oracle/health',
          test: '/oracle/test'
        }
      };

    } catch (error: any) {
      this.logger.error(`❌ Erro no health check Oracle: ${error.message}`);
      
      return {
        success: false,
        timestamp: new Date().toISOString(),
        message: 'Falha no health check Oracle',
        status: 'ERROR',
        error: error.message
      };
    }
  }

  @Get('test')
  @HttpCode(HttpStatus.OK)
  async testConnection(): Promise<any> {
    try {
      this.logger.log('🧪 Testando conexão Oracle');

      const isEnabled = this.oracleService.isEnabled();
      
      if (!isEnabled) {
        throw new HttpException({
          success: false,
          message: 'Oracle está desabilitado',
          timestamp: new Date().toISOString()
        }, HttpStatus.SERVICE_UNAVAILABLE);
      }

      const startTime = Date.now();
      const testResult = await this.oracleService.executeReadOnlyQuery('SELECT SYSDATE as CURRENT_DATE FROM DUAL');
      const executionTime = Date.now() - startTime;

      this.logger.log(`✅ Teste de conexão Oracle bem-sucedido em ${executionTime}ms`);

      return {
        success: true,
        timestamp: new Date().toISOString(),
        message: 'Teste de conexão Oracle bem-sucedido',
        executionTime: `${executionTime}ms`,
        testResult: testResult[0],
        oracle: {
          enabled: true,
          connected: true,
          mode: 'read-only'
        }
      };

    } catch (error: any) {
      this.logger.error(`❌ Erro no teste de conexão Oracle: ${error.message}`);
      
      throw new HttpException({
        success: false,
        message: 'Falha no teste de conexão Oracle',
        error: error.message,
        timestamp: new Date().toISOString()
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}