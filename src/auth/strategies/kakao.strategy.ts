import { PassportStrategy } from '@nestjs/passport'
import { HttpException, HttpStatus, Injectable } from '@nestjs/common'

import { Profile, Strategy, StrategyOption } from 'passport-kakao'

import { AuthService } from '../auth.service'

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      callbackURL: 'https://auth.spacewak.net/signin/kakao',
      scope: ['profile_nickname', 'profile_image', 'account_email'],
    } as StrategyOption)
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
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
