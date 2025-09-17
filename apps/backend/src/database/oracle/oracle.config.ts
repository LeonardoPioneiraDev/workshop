// src/database/oracle/oracle.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('oracle', () => ({
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: process.env.ORACLE_CONNECTION_STRING, // Usar ORACLE_CONNECTION_STRING
  poolMin: parseInt(process.env.ORACLE_POOL_MIN || '10', 10), // Usar parseInt para números
  poolMax: parseInt(process.env.ORACLE_POOL_MAX || '10', 10),
  poolIncrement: parseInt(process.env.ORACLE_POOL_INCREMENT || '0', 10),
  poolTimeout: parseInt(process.env.ORACLE_POOL_TIMEOUT || '60', 10),
  poolPingInterval: parseInt(process.env.ORACLE_POOL_PING_INTERVAL || '60', 10),
  queueTimeout: parseInt(process.env.ORACLE_QUEUE_TIMEOUT || '60000', 10),
  clientPath: process.env.ORACLE_CLIENT_PATH,
}));