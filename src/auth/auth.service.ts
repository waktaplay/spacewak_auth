import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { Model } from 'mongoose'

import { Profile as GoogleProfile } from 'passport-google-oauth20'
import { Profile as KakaoProfile } from 'passport-kakao'

import { IUsers } from 'src/repository/schemas/users.schema'
import { APIError } from 'src/common/dto/APIError.dto'

type Profile = GoogleProfile | KakaoProfile

type User = {
  accessToken: string
  refreshToken: string
  user?: {
    provider: string
    id: string
    displayName: string
    email: string
    avatar: string
  }
  profile?: Profile
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    @Inject('USERS_MODEL')
    private readonly usersModel: Model<IUsers>,
    private readonly jwtService: JwtService,
  ) {}

  async validate(profile: Profile): Promise<Profile> {
    const userEmail =
      profile.provider === 'google'
        ? (profile as GoogleProfile).emails[0].value
        : profile.provider === 'kakao'
          ? (profile as KakaoProfile)._json.kakao_account.email
          : (profile as any).email

    const existingUser = await this.usersModel.findOne({
      email: userEmail,
    })

    // 이미 가입되거나 탈퇴한 계정인 경우
    if (existingUser) {
      if (existingUser.id !== profile.id && !existingUser.withDrawed) {
        throw new APIError(
          HttpStatus.CONFLICT,
          '이미 다른 계정과 연동된 이메일입니다.',
        )
      }

      if (existingUser.accessBlocked) {
        throw new APIError(
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

  token(user: User) {
    this.logger.debug(user)

    if (!user) {
      throw new APIError(HttpStatus.UNAUTHORIZED, '로그인에 실패했습니다.')
    }

    if (user.profile.provider === 'google') {
      const _profile = user.profile as GoogleProfile

      user.user = {
        provider: _profile.provider,
        id: _profile.id,
        displayName: _profile.displayName,
        email: _profile.emails[0].value,
        avatar: _profile.photos[0].value,
      }
    }

    if (user.profile.provider === 'kakao') {
      const _profile = user.profile as KakaoProfile

      user.user = {
        provider: _profile.provider,
        id: _profile.id,
        displayName: _profile.username,
        email: _profile._json.kakao_account.email,
        avatar: _profile._json.kakao_account.profile.profile_image_url,
      }
    }

    if (user.profile.provider === 'discord') {
      const _profile = JSON.parse(JSON.stringify(user.profile)) // deep copy with type `any`

      user.user = {
        provider: _profile.provider,
        id: _profile.id,
        displayName: _profile.global_name,
        email: _profile.email,
        avatar: `https://cdn.discordapp.com/avatars/${_profile.id}/${_profile.avatar}.webp?size=128`,
      }
    }

    delete user.profile
    return user
  }
}
