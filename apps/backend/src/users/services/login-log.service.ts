// apps/backend/src/users/services/login-log.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { LoginLog, LoginEventType } from '../entities/login-log.entity';
import { User } from '../entities/user.entity';

export interface CreateLoginLogDto {
  userId?: number;
  eventType: LoginEventType;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  deviceInfo?: any;
  sessionId?: string;
  success?: boolean;
  failureReason?: string;
  additionalData?: any;
  expiresAt?: Date;
}

export interface LoginLogFilters {
  userId?: number;
  username?: string;
  email?: string;
  eventType?: LoginEventType;
  success?: boolean;
  ipAddress?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface LoginLogStats {
  totalLogs: number;
  successfulLogins: number;
  failedLogins: number;
  uniqueUsers: number;
  uniqueIPs: number;
  mostActiveUser: {
    username: string;
    email: string;
    loginCount: number;
  };
  mostCommonIP: {
    ip: string;
    count: number;
  };
  recentActivity: {
    last24h: number;
    last7days: number;
    last30days: number;
  };
  eventTypeDistribution: Array<{
    eventType: LoginEventType;
    count: number;
    percentage: number;
  }>;
}

@Injectable()
export class LoginLogService {
  private readonly logger = new Logger(LoginLogService.name);

  constructor(
    @InjectRepository(LoginLog)
    private readonly loginLogRepository: Repository<LoginLog>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createLoginLog(data: CreateLoginLogDto): Promise<LoginLog> {
    try {
      const loginLog = this.loginLogRepository.create({
        ...data,
        createdAt: new Date(),
      });

      const savedLog = await this.loginLogRepository.save(loginLog);
      
      this.logger.log(`📝 Log criado: ${data.eventType} para usuário ${data.userId || 'unknown'}`);
      
      return savedLog;
    } catch (error) {
      this.logger.error(`❌ Erro ao criar log de login:`, error.message);
      return null;
    }
  }

  async findLogs(filters: LoginLogFilters = {}): Promise<{
    data: LoginLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const skip = (page - 1) * limit;

      const queryBuilder = this.loginLogRepository.createQueryBuilder('log')
        .leftJoinAndSelect('log.user', 'user')
        .select([
          'log.id',
          'log.userId',
          'log.eventType',
          'log.ipAddress',
          'log.userAgent',
          'log.location',
          'log.deviceInfo',
          'log.sessionId',
          'log.success',
          'log.failureReason',
          'log.additionalData',
          'log.createdAt',
          'log.expiresAt',
          'user.id',
          'user.username',
          'user.email',
          'user.fullName'
        ]);

      if (filters.userId) {
        queryBuilder.andWhere('log.userId = :userId', { userId: filters.userId });
      }

      if (filters.username) {
        queryBuilder.andWhere('user.username ILIKE :username', { username: `%${filters.username}%` });
      }

      if (filters.email) {
        queryBuilder.andWhere('user.email ILIKE :email', { email: `%${filters.email}%` });
      }

      if (filters.eventType) {
        queryBuilder.andWhere('log.eventType = :eventType', { eventType: filters.eventType });
      }

      if (filters.success !== undefined) {
        queryBuilder.andWhere('log.success = :success', { success: filters.success });
      }

      if (filters.ipAddress) {
        queryBuilder.andWhere('log.ipAddress = :ipAddress', { ipAddress: filters.ipAddress });
      }

      if (filters.dateFrom && filters.dateTo) {
        queryBuilder.andWhere('log.createdAt BETWEEN :dateFrom AND :dateTo', {
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo
        });
      } else if (filters.dateFrom) {
        queryBuilder.andWhere('log.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
      } else if (filters.dateTo) {
        queryBuilder.andWhere('log.createdAt <= :dateTo', { dateTo: filters.dateTo });
      }

      const orderBy = filters.orderBy || 'createdAt';
      const orderDirection = filters.orderDirection || 'DESC';
      queryBuilder.orderBy(`log.${orderBy}`, orderDirection);

      const [data, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao buscar logs:`, error.message);
      throw error;
    }
  }

  async getLoginStats(dateFrom?: Date, dateTo?: Date): Promise<LoginLogStats> {
    try {
      const whereClause: FindOptionsWhere<LoginLog> = {};
      
      if (dateFrom && dateTo) {
        whereClause.createdAt = Between(dateFrom, dateTo);
      }

      const [totalLogs, successfulLogins, failedLogins] = await Promise.all([
        this.loginLogRepository.count({ where: whereClause }),
        this.loginLogRepository.count({ 
          where: { ...whereClause, success: true } 
        }),
        this.loginLogRepository.count({ 
          where: { ...whereClause, success: false } 
        })
      ]);

      const uniqueUsersResult = await this.loginLogRepository
        .createQueryBuilder('log')
        .select('COUNT(DISTINCT log.userId)', 'count')
        .where(this.buildWhereClause(whereClause))
        .getRawOne();
      const uniqueUsers = parseInt(uniqueUsersResult.count) || 0;

      const uniqueIPsResult = await this.loginLogRepository
        .createQueryBuilder('log')
        .select('COUNT(DISTINCT log.ipAddress)', 'count')
        .where(this.buildWhereClause(whereClause))
        .getRawOne();
      const uniqueIPs = parseInt(uniqueIPsResult.count) || 0;

      const mostActiveUserResult = await this.loginLogRepository
        .createQueryBuilder('log')
        .leftJoin('log.user', 'user')
        .select([
          'user.username',
          'user.email',
          'COUNT(log.id) as loginCount'
        ])
        .where(this.buildWhereClause(whereClause))
        .andWhere('log.userId IS NOT NULL')
        .groupBy('user.id, user.username, user.email')
        .orderBy('loginCount', 'DESC')
        .limit(1)
        .getRawOne();

      const mostActiveUser = mostActiveUserResult ? {
        username: mostActiveUserResult.user_username,
        email: mostActiveUserResult.user_email,
        loginCount: parseInt(mostActiveUserResult.loginCount)
      } : { username: 'N/A', email: 'N/A', loginCount: 0 };

      const mostCommonIPResult = await this.loginLogRepository
        .createQueryBuilder('log')
        .select([
          'log.ipAddress as ip',
          'COUNT(log.id) as count'
        ])
        .where(this.buildWhereClause(whereClause))
        .andWhere('log.ipAddress IS NOT NULL')
        .groupBy('log.ipAddress')
        .orderBy('count', 'DESC')
        .limit(1)
        .getRawOne();

      const mostCommonIP = mostCommonIPResult ? {
        ip: mostCommonIPResult.ip,
        count: parseInt(mostCommonIPResult.count)
      } : { ip: 'N/A', count: 0 };

      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [activity24h, activity7days, activity30days] = await Promise.all([
        this.loginLogRepository.count({
          where: { createdAt: Between(last24h, now) }
        }),
        this.loginLogRepository.count({
          where: { createdAt: Between(last7days, now) }
        }),
        this.loginLogRepository.count({
          where: { createdAt: Between(last30days, now) }
        })
      ]);

      const eventDistributionResult = await this.loginLogRepository
        .createQueryBuilder('log')
        .select([
          'log.eventType',
          'COUNT(log.id) as count'
        ])
        .where(this.buildWhereClause(whereClause))
        .groupBy('log.eventType')
        .orderBy('count', 'DESC')
        .getRawMany();

      const eventTypeDistribution = eventDistributionResult.map(item => ({
        eventType: item.log_eventType as LoginEventType,
        count: parseInt(item.count),
        percentage: totalLogs > 0 ? Math.round((parseInt(item.count) / totalLogs) * 100 * 10) / 10 : 0
      }));

      return {
        totalLogs,
        successfulLogins,
        failedLogins,
        uniqueUsers,
        uniqueIPs,
        mostActiveUser,
        mostCommonIP,
        recentActivity: {
          last24h: activity24h,
          last7days: activity7days,
          last30days: activity30days
        },
        eventTypeDistribution
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao obter estatísticas:`, error.message);
      throw error;
    }
  }

  async getUserLogs(userId: number, limit: number = 20): Promise<LoginLog[]> {
    try {
      return await this.loginLogRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
        relations: ['user']
      });
    } catch (error) {
      this.logger.error(`❌ Erro ao buscar logs do usuário ${userId}:`, error.message);
      throw error;
    }
  }

  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.loginLogRepository
        .createQueryBuilder()
        .delete()
        .where('createdAt < :cutoffDate', { cutoffDate })
        .execute();

      const deletedCount = result.affected || 0;
      
      this.logger.log(`🧹 Limpeza de logs: ${deletedCount} registros removidos (mais de ${daysToKeep} dias)`);
      
      return deletedCount;
    } catch (error) {
      this.logger.error(`❌ Erro na limpeza de logs:`, error.message);
      throw error;
    }
  }

  async detectSuspiciousActivity(userId: number, ipAddress: string): Promise<{
    isSuspicious: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    try {
      const reasons: string[] = [];
      let riskScore = 0;

      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentIPs = await this.loginLogRepository
        .createQueryBuilder('log')
        .select('DISTINCT log.ipAddress')
        .where('log.userId = :userId', { userId })
        .andWhere('log.createdAt >= :last24h', { last24h })
        .andWhere('log.success = true')
        .getRawMany();

      if (recentIPs.length > 3) {
        reasons.push(`Múltiplos IPs nas últimas 24h (${recentIPs.length})`);
        riskScore += 30;
      }

      const failedAttempts = await this.loginLogRepository.count({
        where: {
          userId,
          success: false,
          eventType: LoginEventType.LOGIN_FAILED,
          createdAt: Between(last24h, new Date())
        }
      });

      if (failedAttempts > 5) {
        reasons.push(`Muitas tentativas falhadas (${failedAttempts})`);
        riskScore += 40;
      }

      const knownIPs = await this.loginLogRepository
        .createQueryBuilder('log')
        .select('DISTINCT log.ipAddress')
        .where('log.userId = :userId', { userId })
        .andWhere('log.success = true')
        .andWhere('log.createdAt >= :thirtyDaysAgo', { 
          thirtyDaysAgo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
        })
        .getRawMany();

      const isKnownIP = knownIPs.some(ip => ip.log_ipAddress === ipAddress);
      if (!isKnownIP) {
        reasons.push('Login de IP desconhecido');
        riskScore += 20;
      }

      const currentHour = new Date().getHours();
      if (currentHour < 6 || currentHour > 22) {
        reasons.push('Login fora do horário comercial');
        riskScore += 15;
      }

      return {
        isSuspicious: riskScore >= 50,
        reasons,
        riskScore
      };

    } catch (error) {
      this.logger.error(`❌ Erro ao detectar atividade suspeita:`, error.message);
      return {
        isSuspicious: false,
        reasons: ['Erro na análise'],
        riskScore: 0
      };
    }
  }

  private buildWhereClause(whereClause: FindOptionsWhere<LoginLog>): string {
    const conditions: string[] = [];
    
    if (whereClause.createdAt) {
      conditions.push('log.createdAt BETWEEN :dateFrom AND :dateTo');
    }
    
    return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
  }
}