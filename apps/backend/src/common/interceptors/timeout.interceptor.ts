// src/common/interceptors/timeout.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Definir timeout global para todas as rotas (30 segundos)
    return next.handle().pipe(
      timeout(30000),
      catchError(err => {
        if (err.name === 'TimeoutError') {
          return throwError(() => new RequestTimeoutException(
            'A operação demorou muito tempo para ser concluída. Por favor, tente novamente.'
          ));
        }
        return throwError(() => err);
      }),
    );
  }
}