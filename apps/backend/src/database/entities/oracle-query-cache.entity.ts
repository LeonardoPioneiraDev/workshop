// src/database/entities/oracle-query-cache.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('oracle_query_cache')
@Index(['queryHash', 'paramsHash'])
export class OracleQueryCache {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64 })
  queryHash: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  paramsHash: string;

  @Column({ type: 'text' })
  query: string;

  @Column({ type: 'json', nullable: true })
  params: any;

  @Column({ type: 'json' })
  result: any;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  hitCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt: Date;
}