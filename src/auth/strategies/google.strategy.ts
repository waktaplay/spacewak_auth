import { PassportStrategy } from '@nestjs/passport'
import { HttpException, HttpStatus, Injectable } from '@nestjs/common'

import {
  Profile,
  Strategy,
  VerifyCallback,
  _StrategyOptionsBase,
} from 'passport-google-oauth20'

import { AuthService } from '../auth.service'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:4400/signin/google',
      scope: ['email', 'profile'],
    } as _StrategyOptionsBase)
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    try {
      await this.authService.validate(profile)

      done(null, {
        accessToken,
        refreshToken,
        profile,
      })
    } catch (e) {
      throw new HttpException(
        e,
        HttpStatus[(e.code as string) || 'INTERNAL_SERVER_ERROR'],
      )
    }
  }
}
