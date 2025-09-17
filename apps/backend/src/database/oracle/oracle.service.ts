import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as oracledb from 'oracledb';

@Injectable()
export class OracleService implements OnModuleDestroy {
  private connection: oracledb.Connection | null = null;
  private isThickModeInitialized = false;

  constructor(private configService: ConfigService) {
    this.initializeOracleClient();
  }

  private initializeOracleClient(): void {
    try {
      const clientPath = this.configService.get<string>('ORACLE_CLIENT_PATH');
      
      if (clientPath && !this.isThickModeInitialized) {
        console.log('Inicializando Oracle Client em modo thick...');
        console.log('Caminho do client:', clientPath);
        
        oracledb.initOracleClient({ libDir: clientPath });
        this.isThickModeInitialized = true;
        
        console.log('Oracle Client inicializado com sucesso em modo thick');
      } else if (!clientPath) {
        console.warn('ORACLE_CLIENT_PATH não definido. Usando modo thin (pode causar erros de conexão)');
      }
    } catch (error: any) {
      if (error.code === 'NJS-077') {
        console.log('Oracle Client já foi inicializado');
        this.isThickModeInitialized = true;
      } else {
        console.error('Erro ao inicializar Oracle Client:', error);
        throw error;
      }
    }
  }

  async connect(): Promise<void> {
    if (this.connection) {
      return; // Já conectado
    }

    try {
      console.log('Tentando conectar ao Oracle...');
      console.log('Connection String:', this.configService.get<string>('ORACLE_CONNECTION_STRING'));
      
      this.connection = await oracledb.getConnection({
        user: this.configService.get<string>('ORACLE_USER'),
        password: this.configService.get<string>('ORACLE_PASSWORD'),
        connectString: this.configService.get<string>('ORACLE_CONNECTION_STRING'),
      });
      
      console.log('✅ Conectado ao Oracle Database com sucesso!');
      
      // Verificar informações da conexão
      const info = await this.getConnectionInfo();
      console.log('Informações da conexão:', info);
    } catch (error) {
      console.error('❌ Erro ao conectar ao Oracle:', error);
      throw error;
    }
  }

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
    } catch (error) {
      console.error('Erro ao executar query:', error);
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
    } catch (error) {
      console.error('Erro ao executar comando:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.close();
        this.connection = null;
        console.log('Desconectado do Oracle Database');
      } catch (error) {
        console.error('Erro ao desconectar:', error);
        throw error;
      }
    }
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  // Métodos auxiliares úteis

  async beginTransaction(): Promise<void> {
    if (!this.connection) {
      await this.connect();
    }
    // Oracle inicia transações automaticamente
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

  // Método para executar múltiplas queries em uma transação
  async transaction<T>(callback: (service: OracleService) => Promise<T>): Promise<T> {
    try {
      await this.beginTransaction();
      const result = await callback(this);
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  // Método para verificar se está conectado
  isConnected(): boolean {
    return this.connection !== null;
  }

  // Método para obter informações da conexão
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
}