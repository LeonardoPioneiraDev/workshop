// apps/backend/src/common/filters/validation-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Log do erro de validação
    this.logger.warn('Erro de validação:', exceptionResponse);

    // Formatar resposta de erro mais amigável
    let message = 'Dados inválidos';
    let errors: any[] = [];

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      if ('message' in exceptionResponse) {
        if (Array.isArray(exceptionResponse.message)) {
          errors = exceptionResponse.message;
          message = 'Erro de validação nos dados enviados';
        } else {
          message = exceptionResponse.message as string;
        }
      }
      
      // Corrigir tipagem para errors
      if ('errors' in exceptionResponse) {
        const responseErrors = (exceptionResponse as any).errors;
        if (Array.isArray(responseErrors)) {
          errors = responseErrors;
        } else if (responseErrors) {
          // Se errors não for array, converter para array
          errors = [responseErrors];
        }
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }
}