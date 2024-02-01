import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { HttpModule } from '@nestjs/axios'

import { AuthService } from './auth.service'
import { GoogleStrategy } from './strategies/google.strategy'
import { KakaoStrategy } from './strategies/kakao.strategy'
// import { AppleStrategy } from './strategies/apple.strategy'
import { DiscordStrategy } from './strategies/discord.strategy'

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
  controllers: [SignInController, WithdrawalController],
  providers: [
    AuthService,
    WithdrawalService,
    GoogleStrategy,
    KakaoStrategy,
    // AppleStrategy, // TODO: Apple 로그인 구현
    DiscordStrategy,
    ...usersProviders,
    ...clientsProviders,
  ],
})
export class AuthModule {}
