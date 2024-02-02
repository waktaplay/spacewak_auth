import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { RedocModule, RedocOptions } from '@jozefazz/nestjs-redoc'

import { AppModule } from './app.module'
import { version } from '../package.json'

import { GlobalExceptionFilter } from './common/filter/global-exception.filter'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'

import * as session from 'express-session'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  if (process.env.ENABLE_SWAGGER !== '0') {
    const config = new DocumentBuilder()
      .setTitle('SpaceWak Auth API')
      .setDescription('SpaceWak 서비스의 oAuth RestAPI 입니다.')
      .setVersion(version)
      .build()

    const document = SwaggerModule.createDocument(app, config)

    const redocOptions: RedocOptions = {
      title: 'SpaceWak Auth API',
    }

    await SwaggerModule.setup('docs', app, document)
    await RedocModule.setup('redoc', app, document, redocOptions)
  }

  if (process.env.GLOBAL_CORS === '1') {
    app.enableCors({
      origin: '*',
      credentials: true,
    })
  } else {
    app.enableCors({
      origin: [],
      // credentials: true,
    })
  }

  app.use(
    session({
      secret: process.env.JWT_SECRET,
      resave: false,
      saveUninitialized: false,
    }),
  )

  app.useGlobalFilters(new GlobalExceptionFilter())
  app.useGlobalInterceptors(new TransformInterceptor())

  if (process.env.NODE_ENV === 'development') {
    await app.listen(4400)
  } else {
    await app.listen(4400, '0.0.0.0')
  }
}

bootstrap()
