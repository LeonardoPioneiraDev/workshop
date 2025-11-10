import { registerAs } from '@nestjs/config';

export default registerAs('oracle', () => ({
  enabled: process.env.ORACLE_ENABLED === 'true',
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING,
  host: process.env.ORACLE_HOST,
  port: parseInt(process.env.ORACLE_PORT, 10) || 1521,
  serviceName: process.env.ORACLE_SERVICE_NAME,
  clientPath: process.env.ORACLE_CLIENT_PATH,
  
  // Pool settings
  poolMin: parseInt(process.env.ORACLE_POOL_MIN, 10) || 5,
  poolMax: parseInt(process.env.ORACLE_POOL_MAX, 10) || 50,
  poolIncrement: parseInt(process.env.ORACLE_POOL_INCREMENT, 10) || 2,
  poolTimeout: parseInt(process.env.ORACLE_POOL_TIMEOUT, 10) || 300000,
  connectTimeout: parseInt(process.env.ORACLE_CONNECT_TIMEOUT, 10) || 180000,
  
  // Query settings
  fetchArraySize: parseInt(process.env.ORACLE_FETCH_ARRAY_SIZE, 10) || 2000,
  prefetchRows: parseInt(process.env.ORACLE_PREFETCH_ROWS, 10) || 200,
  autoCommit: process.env.ORACLE_AUTO_COMMIT === 'true',
  statementCacheSize: parseInt(process.env.ORACLE_STATEMENT_CACHE_SIZE, 10) || 100,
  maxRetries: parseInt(process.env.ORACLE_MAX_RETRIES, 10) || 3,
  retryDelay: parseInt(process.env.ORACLE_RETRY_DELAY, 10) || 5000,
  queryTimeout: parseInt(process.env.ORACLE_QUERY_TIMEOUT, 10) || 18000000,
}));