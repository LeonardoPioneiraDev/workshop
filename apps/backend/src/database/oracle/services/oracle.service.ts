// src/database/oracle/oracle.service.ts
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as oracledb from 'oracledb';

@Injectable()
export class OracleService implements OnModuleDestroy {
  private readonly logger = new Logger(OracleService.name); // Adicionado Logger
  private connection: oracledb.Connection | null = null;
  private isThickModeInitialized = false;

  constructor(private configService: ConfigService) {
    this.initializeOracleClient();
  }

  private initializeOracleClient(): void {
    try {
      const clientPath = this.configService.get<string>('oracle.clientPath'); // Acessa via 'oracle.clientPath'
      
      if (clientPath && !this.isThickModeInitialized) {
        this.logger.log('Inicializando Oracle Client em modo thick...');
        this.logger.log(`Caminho do client: ${clientPath}`);
        
        oracledb.initOracleClient({ libDir: clientPath });
        this.isThickModeInitialized = true;
        
        this.logger.log('Oracle Client inicializado com sucesso em modo thick');
      } else if (!clientPath) {
        this.logger.warn('ORACLE_CLIENT_PATH não definido. Usando modo thin (pode causar erros de conexão)');
      }
    } catch (error: any) {
      if (error.code === 'NJS-077') {
        this.logger.log('Oracle Client já foi inicializado');
        this.isThickModeInitialized = true;
      } else {
        this.logger.error(`Erro ao inicializar Oracle Client: ${error.message}`, error.stack);
        throw error;
      }
    }
  }

  async connect(): Promise<void> {
    if (this.connection) {
      return; // Já conectado
    }

    try {
      this.logger.log('Tentando conectar ao Oracle...');
      const connectString = this.configService.get<string>('oracle.connectString'); // Acessa via 'oracle.connectString'
      this.logger.log(`Connection String: ${connectString}`);
      
      this.connection = await oracledb.getConnection({
        user: this.configService.get<string>('oracle.user'), // Acessa via 'oracle.user'
        password: this.configService.get<string>('oracle.password'), // Acessa via 'oracle.password'
        connectString: connectString,
      });
      
      this.logger.log('✅ Conectado ao Oracle Database com sucesso!');
      
      // Verificar informações da conexão
      const info = await this.getConnectionInfo();
      this.logger.log(`Informações da conexão: ${JSON.stringify(info)}`); // Usar JSON.stringify para log de objetos
    } catch (error: any) { // Erro deve ser 'any' ou 'unknown'
      this.logger.error(`❌ Erro ao conectar ao Oracle: ${error.message}`, error.stack);
      throw error;
    }
  }

  // ✅ MÉTODO ADICIONADO (e ajustado para seu uso genérico)
  async executeQuery<T = any>(sql: string, binds: any = {}): Promise<T[]> {
    if (!this.connection) {
      await this.connect();
    }
    
    let result: oracledb.Result<any>; // Declare result here

    try {
      result = await this.connection!.execute(
        sql,
        binds,
        {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
          fetchArraySize: 100, // Ajuste este valor conforme o volume de dados esperado
        }
      );

      return (result.rows || []) as T[];
    } catch (error: any) { // Erro deve ser 'any' ou 'unknown'
      this.logger.error(`Erro ao executar executeQuery: ${error.message}`, error.stack);
      throw error;
    } finally {
        // Se você está gerenciando uma conexão por requisição ou por transação,
        // pode precisar fechar aqui. No entanto, se o serviço usa um pool,
        // a conexão é liberada para o pool automaticamente.
        // Se você não estiver usando um pool e precisar fechar a conexão após cada query:
        // if (this.connection && !this.configService.get<boolean>('ORACLE_USE_POOL')) { // Adicione uma flag para pool no config
        //     await this.connection.close();
        //     this.connection = null;
        // }
    }
  }

  // Se você tem `query` e `execute` e `disconnect` (e outros) no seu serviço, mantenha-os como estão.
  // ... (seus métodos query, execute, disconnect, onModuleDestroy, beginTransaction, commit, rollback, transaction, isConnected, getConnectionInfo, testConnection)
  // Certifique-se de que `error` em todos os seus `catch` blocks é `any` ou `unknown` para evitar erros de TS.

    async query<T = any>(sql: string, binds: any = {}): Promise<T[]> {
        if (!this.connection) {
        await this.connect();
        }

        try {
        const result = await this.connection!.execute(
            sql,
            binds,
            {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            fetchArraySize: 100,
            }
        );

        return (result.rows || []) as T[];
        } catch (error: any) {
        this.logger.error(`Erro ao executar query: ${error.message}`, error.stack);
        throw error;
        }
    }

    async execute(sql: string, binds: any = {}, options: oracledb.ExecuteOptions = {}): Promise<oracledb.Result<any>> {
        if (!this.connection) {
        await this.connect();
        }

        try {
        const defaultOptions: oracledb.ExecuteOptions = {
            autoCommit: true,
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            ...options
        };

        return await this.connection!.execute(sql, binds, defaultOptions);
        } catch (error: any) {
        this.logger.error(`Erro ao executar comando: ${error.message}`, error.stack);
        throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.connection) {
        try {
            await this.connection.close();
            this.connection = null;
            this.logger.log('Desconectado do Oracle Database'); // Usar this.logger
        } catch (error: any) {
            this.logger.error(`Erro ao desconectar: ${error.message}`, error.stack);
            throw error;
        }
        }
    }

    async onModuleDestroy() {
        await this.disconnect();
    }

    async beginTransaction(): Promise<void> {
        if (!this.connection) {
        await this.connect();
        }
    }

    async commit(): Promise<void> {
        if (!this.connection) {
        throw new Error('Não conectado ao banco de dados');
        }
        await this.connection.commit();
    }

    async rollback(): Promise<void> {
        if (!this.connection) {
        throw new Error('Não conectado ao banco de dados');
        }
        await this.connection.rollback();
    }

    async transaction<T>(callback: (service: OracleService) => Promise<T>): Promise<T> {
        try {
        await this.beginTransaction();
        const result = await callback(this);
        await this.commit();
        return result;
        } catch (error: any) {
        await this.rollback();
        throw error;
        }
    }

    isConnected(): boolean {
        return this.connection !== null;
    }

    async getConnectionInfo(): Promise<any> {
        if (!this.connection) {
        await this.connect();
        }

        const info = await this.query(`
        SELECT 
            SYS_CONTEXT('USERENV', 'SESSION_USER') as USERNAME,
            SYS_CONTEXT('USERENV', 'DB_NAME') as DATABASE_NAME,
            SYS_CONTEXT('USERENV', 'SERVER_HOST') as SERVER_HOST,
            SYS_CONTEXT('USERENV', 'INSTANCE_NAME') as INSTANCE_NAME,
            SYS_CONTEXT('USERENV', 'SERVICE_NAME') as SERVICE_NAME
        FROM DUAL
        `);

        return info[0];
    }

    async testConnection(): Promise<boolean> {
        try {
        await this.connect();
        const result = await this.connection?.execute('SELECT 1 FROM DUAL');
        return result?.rows?.length > 0;
        } catch (error: any) {
        this.logger.error(`Erro ao testar conexão: ${error.message}`, error.stack);
        return false;
        }
    }
}