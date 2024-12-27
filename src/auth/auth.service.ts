import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'

import { Model } from 'mongoose'

import { Profile as GoogleProfile } from 'passport-google-oauth20'
import { Profile as KakaoProfile } from 'passport-kakao'
import { IProfile as NaverProfile } from 'passport-naver-oauth2'

import { User } from 'src/common/types/user'
import { Profile, SocialUser } from 'src/common/types/socialUser'

import { APIException } from 'src/common/dto/APIException.dto'
import { IUsers } from 'src/repository/schemas/users.schema'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    @Inject('USERS_MODEL')
    private readonly usersModel: Model<IUsers>,
  ) {}

  async validate(profile: Profile): Promise<Profile> {
    const userEmail =
      profile.provider === 'google'
        ? (profile as GoogleProfile).emails[0].value
        : profile.provider === 'kakao'
          ? (profile as KakaoProfile)._json.kakao_account.email
          : profile.provider === 'naver'
            ? (profile as NaverProfile).emails[0].value
            : (profile as any).email

    const existingUser = await this.usersModel.findOne({
      email: userEmail,
    })

    // 이미 가입되거나 탈퇴한 계정인 경우
    if (existingUser) {
      if (existingUser.id !== profile.id && !existingUser.withDrawed) {
        throw new APIException(
          HttpStatus.CONFLICT,
          '이미 다른 계정과 연동된 이메일입니다.',
        )
      }

      if (existingUser.accessBlocked) {
        throw new APIException(
          HttpStatus.FORBIDDEN,
          `서비스 이용이 제한된 계정입니다. (사유: ${existingUser.accessBlockedReason})`,
        )
      }

      // 이미 탈퇴한 계정인 경우 탈퇴 복구
      if (existingUser.withDrawed) {
        // 이미 탈퇴한 계정이지만, 다른 계정으로 재가입을 시도한 경우
        if (existingUser.id !== profile.id) {
          await this.usersModel.updateOne(
            {
              id: existingUser.id,
            },
            {
              id: profile.id,
              withDrawed: false,
              withdrawedAt: null,
            },
          )
        } else {
          await this.usersModel.updateOne(
            {
              id: existingUser.id,
            },
            {
              withDrawed: false,
              withdrawedAt: null,
            },
          )
        }
      }

      return profile
    }

    // 신규 가입
    await this.usersModel.create({
      id: profile.id,
      email: userEmail,
      createdAt: new Date(),
      withDrawed: false,
      accessBlocked: false,
    })

    return profile
  }

  token(socialUser: SocialUser): User {
    // this.logger.debug(user)

    if (!socialUser) {
      throw new APIException(HttpStatus.UNAUTHORIZED, '로그인에 실패했습니다.')
    }

    const user: User = {
      accessToken: socialUser.socialAccessToken,
      refreshToken: socialUser.socialRefreshToken,
    }

    if (socialUser.profile.provider === 'discord') {
      const profile = JSON.parse(JSON.stringify(socialUser.profile)) // deep copy with type `any`

      user.user = {
        provider: profile.provider,
        id: profile.id,
        displayName: profile.global_name,
        email: profile.email,
        avatar: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.webp?size=128`,
      }
    }

    if (socialUser.profile.provider === 'google') {
      const profile = socialUser.profile as GoogleProfile

      user.user = {
        provider: profile.provider,
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value,
        avatar: profile.photos[0].value,
      }
    }

    if (socialUser.profile.provider === 'kakao') {
      const profile = socialUser.profile as KakaoProfile

      user.user = {
        provider: profile.provider,
        id: profile.id,
        displayName: profile.username,
        email: profile._json.kakao_account.email,
        avatar: profile._json.kakao_account.profile.profile_image_url,
      }
    }

    if (socialUser.profile.provider === 'naver') {
      const profile = socialUser.profile as NaverProfile

      user.user = {
        provider: profile.provider,
        id: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value,
        avatar: profile.photos[0].value,
      }
    }

    this.logger.debug(user)
    return user
  }
}
