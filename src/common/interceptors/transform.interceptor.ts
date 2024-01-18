import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import type { Response } from 'express'

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse<Response>()

        return {
          code: response.statusCode.toString().startsWith('2')
            ? 'OPERATION_COMPLETE'
            : HttpStatus[response.statusCode],
          status: response.statusCode,

          data: data,

          responseAt: new Date().toISOString(),
        }
      }),
    )
  }
}
