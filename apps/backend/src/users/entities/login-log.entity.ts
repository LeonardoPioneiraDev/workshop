// apps/backend/src/users/entities/login-log.entity.ts
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne, 
  JoinColumn,
  Index 
} from 'typeorm';
import { User } from './user.entity';

export enum LoginEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  FIRST_LOGIN = 'FIRST_LOGIN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  REGISTRATION = 'REGISTRATION'
}

@Entity('login_logs')
@Index(['userId', 'eventType'])
@Index(['eventType', 'createdAt'])
@Index(['ipAddress', 'createdAt'])
@Index(['createdAt'])
export class LoginLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'integer', nullable: true })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: LoginEventType,
    name: 'event_type'
  })
  eventType: LoginEventType;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ name: 'location', length: 255, nullable: true })
  location: string;

  @Column({ name: 'device_info', type: 'json', nullable: true })
  deviceInfo: {
    browser?: string;
    os?: string;
    device?: string;
    isMobile?: boolean;
  };

  @Column({ name: 'session_id', length: 255, nullable: true })
  sessionId: string;

  @Column({ name: 'success', type: 'boolean', default: true })
  success: boolean;

  @Column({ name: 'failure_reason', length: 500, nullable: true })
  failureReason: string;

  @Column({ name: 'additional_data', type: 'json', nullable: true })
  additionalData: {
    attemptNumber?: number;
    previousLoginAt?: Date;
    tokenExpiry?: Date;
    riskScore?: number;
    attemptedCredential?: string;
    [key: string]: any;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;
}