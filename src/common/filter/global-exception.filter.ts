import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'

import APIError from '../dto/APIError.dto'
import APIException from '../dto/APIException.dto'

import { /*Request,*/ Response } from 'express'

// HttpException, APIException ...
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    // const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()

    const responseAt: string = new Date().toISOString()

    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
    let message: string | object | APIError = '내부 서버 오류가 발생했습니다.'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      message = exception.getResponse()
    } else if (exception instanceof APIException) {
      status = exception.status
      message = exception.APIError
    }

    this.logger.error(
      `HTTP Exception: ${status} - '${JSON.stringify(message)}' at ${responseAt}`,
    )

    // TODO: APIError 값을 따로 정의하지 말고 APIException이랑 합치기
    if (message instanceof APIError) {
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
