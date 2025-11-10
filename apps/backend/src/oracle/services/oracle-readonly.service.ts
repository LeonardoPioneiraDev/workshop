// src/oracle/services/oracle-readonly.service.ts
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as oracledb from 'oracledb';

@Injectable()
export class OracleReadOnlyService implements OnModuleDestroy {
  private readonly logger = new Logger(OracleReadOnlyService.name);
  private connection: oracledb.Connection | null = null;
  private isThickModeInitialized = false;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 3;

  constructor(private configService: ConfigService) {
    this.logger.log('🔶 Oracle ReadOnly Service inicializado');
    this.initializeOracleClient();
  }

  private initializeOracleClient(): void {
    try {
      const oracleEnabled = this.configService.get<boolean>('oracle.enabled', false);
      
      if (!oracleEnabled) {
        this.logger.warn('🔧 Oracle module está DESABILITADO');
        this.logger.warn('💡 Para habilitar, defina ORACLE_ENABLED=true no .env');
        return;
      }

      this.logger.log('✅ Oracle module HABILITADO');

      const clientPath = this.configService.get<string>('oracle.clientPath');
      
      if (clientPath && !this.isThickModeInitialized) {
        this.logger.log(`📦 Inicializando Oracle Client: ${clientPath}`);
        
        const fs = require('fs');
        if (!fs.existsSync(clientPath)) {
          this.logger.warn(`⚠️ Caminho do Oracle Client não existe: ${clientPath}`);
          this.logger.log('💡 Continuando com modo thin');
        } else {
          try {
            oracledb.initOracleClient({ libDir: clientPath });
            this.isThickModeInitialized = true;
            this.logger.log('✅ Oracle Client inicializado (Thick Mode)');
          } catch (error: any) {
            this.logger.warn(`⚠️ Erro ao inicializar Thick Mode: ${error.message}`);
            this.logger.log('💡 Continuando com modo thin');
          }
        }
      } else if (!clientPath) {
        this.logger.warn('⚠️ ORACLE_CLIENT_PATH não definido. Usando modo thin');
        this.logger.log('🔧 Modo thin é adequado para consultas básicas');
      }
      
      this.isThickModeInitialized = true;
    } catch (error: any) {
      if (error.code === 'NJS-077') {
        this.logger.log('ℹ️ Oracle Client já foi inicializado');
        this.isThickModeInitialized = true;
      } else {
        this.logger.error(`❌ Erro ao inicializar Oracle Client: ${error.message}`);
        this.logger.log('💡 Continuando com modo thin para consultas');
        this.isThickModeInitialized = true;
      }
    }
  }

  async connect(): Promise<void> {
    const oracleEnabled = this.configService.get<boolean>('oracle.enabled', false);

    if (!oracleEnabled) {
      this.logger.warn('⚠️ Oracle está desabilitado, não conectando');
      return;
    }

    if (this.connection) {
      try {
        await this.connection.execute('SELECT 1 FROM DUAL');
        return;
      } catch (error) {
        this.logger.warn('⚠️ Conexão Oracle inválida, reconectando...');
        this.connection = null;
      }
    }

    try {
      this.connectionAttempts++;
      this.logger.log(`🔗 Conectando ao Oracle (tentativa ${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
      
      const connectString = this.configService.get<string>('oracle.connectString');
      const user = this.configService.get<string>('oracle.user');
      const password = this.configService.get<string>('oracle.password');

      if (!connectString) {
        throw new Error('❌ ORACLE_CONNECTION_STRING não definido');
      }
      if (!user) {
        throw new Error('❌ ORACLE_USER não definido');
      }
      if (!password) {
        throw new Error('❌ ORACLE_PASSWORD não definido');
      }

      this.logger.log(`📋 Configuração Oracle (CONSULTA):`);
      this.logger.log(`   🔗 Connection: ${this.maskConnectionString(connectString)}`);
      this.logger.log(`   👤 User: ${user}`);
      this.logger.log(`   🔒 Password: ${'*'.repeat(password.length)}`);
      this.logger.log(`   📖 Modo: SOMENTE LEITURA`);
      
      const connectionConfig: oracledb.ConnectionAttributes = {
        user,
        password,
        connectString,
      };

      this.connection = await oracledb.getConnection(connectionConfig);
      
      this.connectionAttempts = 0;
      this.logger.log('✅ Conectado ao Oracle Database com sucesso!');
      
      await this.optimizeSession();
      
      const info = await this.getConnectionInfo();
      this.logger.log(`�� Informações da conexão Oracle:`);
      this.logger.log(`   🏢 Database: ${info.DATABASE_NAME}`);
      this.logger.log(`   🖥️ Server: ${info.SERVER_HOST}`);
      this.logger.log(`   🔧 Instance: ${info.INSTANCE_NAME}`);
      this.logger.log(`   🌐 Service: ${info.SERVICE_NAME}`);
      this.logger.log(`   👤 User: ${info.USERNAME}`);
      this.logger.log(`   📖 Modo: CONSULTA APENAS`);
      
    } catch (error: any) {
      this.logger.error(`❌ Erro ao conectar Oracle (tentativa ${this.connectionAttempts}): ${error.message}`);
      
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        this.logger.log(`⏳ Aguardando 3s antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        return this.connect();
      } else {
        this.logger.error(`🚨 Esgotadas ${this.maxConnectionAttempts} tentativas de conexão Oracle`);
        throw new Error(`Falha na conexão Oracle: ${error.message}`);
      }
    }
  }

  private async optimizeSession(): Promise<void> {
    try {
      if (!this.connection) return;

      const optimizations = [
        "ALTER SESSION SET OPTIMIZER_MODE = ALL_ROWS",
        "ALTER SESSION SET QUERY_REWRITE_ENABLED = TRUE",
        "ALTER SESSION SET STAR_TRANSFORMATION_ENABLED = TRUE",
        "ALTER SESSION SET PARALLEL_DEGREE_POLICY = AUTO",
        "ALTER SESSION SET PARALLEL_MIN_TIME_THRESHOLD = 10",
        "ALTER SESSION SET DB_FILE_MULTIBLOCK_READ_COUNT = 128",
        "ALTER SESSION SET WORKAREA_SIZE_POLICY = AUTO",
        "ALTER SESSION SET PGA_AGGREGATE_TARGET = 0",
      ];

      for (const sql of optimizations) {
        try {
          await this.connection.execute(sql);
          this.logger.debug(`✅ Otimização aplicada: ${sql.split('=')[0].trim()}`);
        } catch (error: any) {
          this.logger.debug(`⚠️ Otimização ignorada: ${sql.split('=')[0].trim()}`);
        }
      }

      this.logger.log('🚀 Sessão Oracle otimizada para performance');
    } catch (error: any) {
      this.logger.warn(`⚠️ Erro ao otimizar sessão: ${error.message}`);
    }
  }

  private maskConnectionString(connectionString: string): string {
    return connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  }

  // ✅ MÉTODO EXECUTEQUERY ADICIONADO
  async executeQuery<T = any>(query: string, params?: any[]): Promise<T> {
    const oracleEnabled = this.configService.get<boolean>('oracle.enabled', false);

    if (!oracleEnabled) {
      this.logger.warn('⚠️ Oracle desabilitado, retornando array vazio');
      return [] as T;
    }

    const trimmedSql = query.trim().toUpperCase();
    if (!trimmedSql.startsWith('SELECT') && !trimmedSql.startsWith('WITH')) {
      throw new Error('❌ Oracle Service: APENAS consultas SELECT são permitidas');
    }

    if (!this.connection) {
      await this.connect();
    }
    
    try {
      this.logger.debug(`🔍 Executando query Oracle: ${query.substring(0, 100)}...`);
      
      const startTime = Date.now();
      
      const result = await this.connection!.execute(
        query,
        params || [],
        {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
          fetchArraySize: this.configService.get<number>('oracle.fetchArraySize', 2000),
          maxRows: 0,
          autoCommit: false,
          prefetchRows: this.configService.get<number>('oracle.prefetchRows', 200),
          resultSet: false,
        }
      );
      
      const executionTime = Date.now() - startTime;
      const rowCount = (result.rows || []).length;
      
      this.logger.log(`✅ Query Oracle executada em ${executionTime}ms, ${rowCount} registros`);

      if (executionTime > 10000) {
        this.logger.warn(`⚠️ Query lenta detectada: ${executionTime}ms`);
        this.logger.warn(`📝 SQL: ${query.substring(0, 200)}...`);
      }

      return (result.rows || []) as T;
    } catch (error: any) {
      this.logger.error(`❌ Erro na query Oracle: ${error.message}`);
      this.logger.error(`📝 SQL: ${query.substring(0, 200)}...`);
      
      if (this.isConnectionError(error)) {
        this.logger.warn('🔄 Reconectando Oracle...');
        this.connection = null;
        await this.connect();
        return this.executeQuery<T>(query, params);
      }
      
      throw error;
    }
  }

  async executeReadOnlyQuery<T = any>(sql: string, binds: any = {}): Promise<T[]> {
    const oracleEnabled = this.configService.get<boolean>('oracle.enabled', false);

    if (!oracleEnabled) {
      this.logger.warn('⚠️ Oracle desabilitado, retornando array vazio');
      return [];
    }

    const trimmedSql = sql.trim().toUpperCase();
    if (!trimmedSql.startsWith('SELECT') && !trimmedSql.startsWith('WITH')) {
      throw new Error('❌ Oracle Service: APENAS consultas SELECT são permitidas');
    }

    if (!this.connection) {
      await this.connect();
    }
    
    try {
      this.logger.debug(`🔍 Executando consulta Oracle: ${sql.substring(0, 100)}...`);
      
      const startTime = Date.now();
      
      const result = await this.connection!.execute(
        sql,
        binds,
        {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
          fetchArraySize: this.configService.get<number>('oracle.fetchArraySize', 2000),
          maxRows: 0,
          autoCommit: false,
          prefetchRows: this.configService.get<number>('oracle.prefetchRows', 200),
          resultSet: false,
        }
      );
      
      const executionTime = Date.now() - startTime;
      const rowCount = (result.rows || []).length;
      
      this.logger.log(`✅ Consulta Oracle executada em ${executionTime}ms, ${rowCount} registros`);

      if (executionTime > 10000) {
        this.logger.warn(`⚠️ Query lenta detectada: ${executionTime}ms`);
        this.logger.warn(`📝 SQL: ${sql.substring(0, 200)}...`);
      }

      return (result.rows || []) as T[];
    } catch (error: any) {
      this.logger.error(`❌ Erro na consulta Oracle: ${error.message}`);
      this.logger.error(`📝 SQL: ${sql.substring(0, 200)}...`);
      
      if (this.isConnectionError(error)) {
        this.logger.warn('🔄 Reconectando Oracle...');
        this.connection = null;
        await this.connect();
        return this.executeReadOnlyQuery<T>(sql, binds);
      }
      
      throw error;
    }
  }

  private isConnectionError(error: any): boolean {
    const connectionErrorCodes = ['ORA-03113', 'ORA-03114', 'ORA-01012', 'NJS-003', 'NJS-024'];
    return connectionErrorCodes.some(code => error.message.includes(code));
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      try {
        await this.connection.close();
        this.connection = null;
        this.connectionAttempts = 0;
        this.logger.log('🔌 Desconectado do Oracle Database');
      } catch (error: any) {
        this.logger.error(`❌ Erro ao desconectar Oracle: ${error.message}`);
        this.connection = null;
      }
    }
  }

  async onModuleDestroy() {
    this.logger.log('🔶 Oracle ReadOnly Service sendo finalizado...');
    await this.disconnect();
  }

  isConnected(): boolean {
    return this.connection !== null;
  }

  async getConnectionInfo(): Promise<any> {
    if (!this.connection) {
      await this.connect();
    }

    try {
      const info = await this.executeReadOnlyQuery(`
        SELECT 
          SYS_CONTEXT('USERENV', 'SESSION_USER') as USERNAME,
          SYS_CONTEXT('USERENV', 'DB_NAME') as DATABASE_NAME,
          SYS_CONTEXT('USERENV', 'SERVER_HOST') as SERVER_HOST,
          SYS_CONTEXT('USERENV', 'INSTANCE_NAME') as INSTANCE_NAME,
          SYS_CONTEXT('USERENV', 'SERVICE_NAME') as SERVICE_NAME
        FROM DUAL
      `);

      return info[0];
    } catch (error: any) {
      this.logger.error(`❌ Erro ao obter info da conexão Oracle: ${error.message}`);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const oracleEnabled = this.configService.get<boolean>('oracle.enabled', false);

      if (!oracleEnabled) {
        this.logger.warn('⚠️ Oracle desabilitado');
        return false;
      }

      await this.connect();
      const result = await this.connection?.execute('SELECT 1 FROM DUAL');
      const isValid = result?.rows?.length > 0;
      
      if (isValid) {
        this.logger.log('✅ Teste de conexão Oracle bem-sucedido');
      } else {
        this.logger.error('❌ Teste de conexão Oracle falhou');
      }
      
      return isValid;
    } catch (error: any) {
      this.logger.error(`❌ Erro ao testar conexão Oracle: ${error.message}`);
      return false;
    }
  }

  isEnabled(): boolean {
    return this.configService.get<boolean>('oracle.enabled', false);
  }
}