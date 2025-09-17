// apps/backend/src/database/entities/query-log.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity({ name: 'query_log', schema: 'oracle_cache' })
export class QueryLog {
  @PrimaryGeneratedColumn()
  id: number;

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
    name: 'execution_time_ms',
    type: 'integer', 
    nullable: true 
  })
  executionTimeMs: number;

  @Column({ 
    name: 'rows_returned',
    type: 'integer', 
    nullable: true 
  })
  rowsReturned: number;

  @Column({ 
    type: 'boolean', 
    default: true 
  })
  success: boolean;

  @Column({ 
    name: 'error_message',
    type: 'text', 
    nullable: true 
  })
  errorMessage: string;

  @CreateDateColumn({ 
    name: 'created_at',
    type: 'timestamp' 
  })
  createdAt: Date;
}