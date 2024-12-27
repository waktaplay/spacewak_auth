import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'

import { APIException } from '../dto/APIException.dto'

import { /*Request,*/ Response } from 'express'

// HttpException, APIException ...
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: any, host: ArgumentsHost) {
    this.logger.error(exception);

    const ctx = host.switchToHttp()
    // const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()

    const responseAt: string = new Date().toISOString()

    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
    let message: string | object | APIException =
      '내부 서버 오류가 발생했습니다.'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      message = exception.getResponse()
    }

    if (message instanceof APIException) {
      response.status(message.status).send({
        code: HttpStatus[message.status],
        status: message.status,

        data: message.data,
        message: message.message,
        responseAt: responseAt,
      })
      return
    }

    response.status(status).send({
      code: HttpStatus[status],
      status: status,

      message: message['message'] || message['error'] || message,
      responseAt: responseAt,
    })
  }
}
