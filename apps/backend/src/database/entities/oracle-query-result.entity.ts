// apps/backend/src/database/entities/oracle-query-result.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'query_cache', schema: 'oracle_cache' })
@Index(['queryHash'], { unique: true })
@Index(['createdAt'])
@Index(['expiresAt'])
export class OracleQueryResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ 
    name: 'query_hash',
    type: 'varchar', 
    length: 64, 
    unique: true 
  })
  queryHash: string;

  @Column({ 
    name: 'query_text',
    type: 'text' 
  })
  queryText: string;

  @Column({ 
    type: 'jsonb', 
    nullable: true 
  })
  parameters: Record<string, any>;

  @Column({ 
    name: 'result_data',
    type: 'jsonb' 
  })
  resultData: any;

  @CreateDateColumn({ 
    name: 'created_at',
    type: 'timestamp' 
  })
  createdAt: Date;

  @UpdateDateColumn({ 
    name: 'updated_at',
    type: 'timestamp' 
  })
  updatedAt: Date;

  @Column({ 
    name: 'expires_at',
    type: 'timestamp', 
    nullable: true 
  })
  expiresAt: Date;

  @Column({ 
    name: 'access_count',
    type: 'integer', 
    default: 1 
  })
  accessCount: number;

  @Column({ 
    name: 'last_accessed',
    type: 'timestamp', 
    default: () => 'CURRENT_TIMESTAMP' 
  })
  lastAccessed: Date;
}