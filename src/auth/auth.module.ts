import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { HttpModule } from '@nestjs/axios'

import { AuthService } from './auth.service'
import { DiscordStrategy } from './strategies/discord.strategy'
import { GoogleStrategy } from './strategies/google.strategy'
import { KakaoStrategy } from './strategies/kakao.strategy'
import { NaverStrategy } from './strategies/naver.strategy'

import { OAuth2Controller } from './oauth2/oauth2.controller'
import { OAuth2Service } from './oauth2/oauth2.service'

import { SignInController } from './signin/signin.controller'

import { WithdrawalController } from './withdrawal/withdrawal.controller'
import { WithdrawalService } from './withdrawal/withdrawal.service'

import { RepositoryModule } from 'src/repository/repository.module'
import { usersProviders } from 'src/repository/models/users.providers'
import { clientsProviders } from 'src/repository/models/clients.providers'

@Module({
  imports: [
    HttpModule,
    RepositoryModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '2d' },
    }),
  ],
  controllers: [OAuth2Controller, SignInController, WithdrawalController],
  providers: [
    AuthService,
    OAuth2Service,
    WithdrawalService,
    DiscordStrategy,
    GoogleStrategy,
    KakaoStrategy,
    NaverStrategy,
    ...usersProviders,
    ...clientsProviders,
  ],
})
export class AuthModule {}
