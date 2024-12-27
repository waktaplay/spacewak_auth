import { PassportStrategy } from '@nestjs/passport'
import { HttpException, HttpStatus, Injectable } from '@nestjs/common'

import {
  NaverStrategy as Strategy,
  StrategyOptions,
} from 'passport-naver-oauth2'

import { AuthService } from '../auth.service'

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.NAVER_CLIENT_ID,
      clientSecret: process.env.NAVER_CLIENT_SECRET,
      callbackURL: 'https://auth.spacewak.net/signin/naver',
      passReqToCallback: false,
    } as StrategyOptions)
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: any,
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
