import { JsonWebTokenError, JwtService } from '@nestjs/jwt'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'

import { Model } from 'mongoose'
import { Cache } from 'cache-manager'

import ms from 'ms'
import { customAlphabet } from 'nanoid'

import { User } from 'src/common/types/user'
import { CachedAuthorizationCode } from 'src/common/types/cachedAuthorizationCode'

import { accessTokenDto } from './dto/accessToken.dto'
import { APIException } from 'src/common/dto/APIException.dto'

import { IClient } from 'src/repository/schemas/clients.schema'

@Injectable()
export class OAuth2Service {
  private readonly logger = new Logger(OAuth2Service.name)

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @Inject('CLIENTS_MODEL')
    private readonly clientsModel: Model<IClient>,
    private readonly jwtService: JwtService,
  ) {}

  async getClient(clientId: string): Promise<Omit<IClient, 'secret'>> {
    const client = await this.clientsModel.findOne(
      {
        id: clientId,
      },
      {
        select: {
          id: 1,
          name: 1,
          redirectUris: 1,
        },
      },
    )

    if (!client) {
      throw new APIException(
        HttpStatus.BAD_REQUEST,
        '존재하지 않는 클라이언트입니다.',
      )
    }

    return client
  }

  async requestValidate(clientId: string, redirectUri: string) {
    const client = await this.clientsModel.findOne({
      id: clientId,
    })

    if (!client) {
      throw new APIException(
        HttpStatus.BAD_REQUEST,
        '존재하지 않는 클라이언트입니다.',
      )
    }

    if (!client.redirectUris.includes(redirectUri)) {
      throw new APIException(
        HttpStatus.BAD_REQUEST,
        '잘못된 redirect_uri 입니다.',
      )
    }

    return client
  }

  async getAuthorizationCode(
    user: User,
    clientId: string,
    redirectUri: string,
  ) {
    const authorizationCodeGenerator = customAlphabet(
      '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    )

    this.logger.debug(user)

    const authorizationCode = authorizationCodeGenerator()
    await this.cacheManager.set(
      `authorization-code:${authorizationCode}`,
      {
        user: user,
        client: clientId,
        redirectUri: redirectUri,
      } as CachedAuthorizationCode,
      ms('10m') / 1000,
    )

    this.logger.debug(`Authorization Code: ${authorizationCode}`)

    return {
      authorizationCode,
    }
  }

  async issueAccessToken(
    authorizationCode: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<accessTokenDto> {
    const cached = await this.cacheManager.get<CachedAuthorizationCode>(
      `authorization-code:${authorizationCode}`,
    )

    if (!cached) {
      throw new APIException(
        HttpStatus.BAD_REQUEST,
        '유효하지 않은 Authorization Code입니다.',
      )
    }

    if (cached.client !== clientId) {
      throw new APIException(HttpStatus.BAD_REQUEST, '잘못된 클라이언트입니다.')
    }

    if (cached.redirectUri !== redirectUri) {
      throw new APIException(
        HttpStatus.BAD_REQUEST,
        '잘못된 redirect_uri 입니다.',
      )
    }

    const client = await this.clientsModel.findOne({
      id: clientId,
      secret: clientSecret,
    })

    if (!client) {
      throw new APIException(
        HttpStatus.BAD_REQUEST,
        '잘못된 클라이언트 정보입니다.',
      )
    }

    const user = cached.user as User

    const { accessToken, refreshToken } = await this.issueToken(user)

    await this.cacheManager.set(`token:${user.user.id}`, {
      user: user,
      accessToken: accessToken,
      refreshToken: refreshToken,
    })

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: ms('1h') / 1000,
    }
  }

  async refreshAccessToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string,
  ): Promise<accessTokenDto> {
    try {
      const token = await this.jwtService.verifyAsync(refreshToken)
      const validationData = await this.cacheManager.get<{
        user: User
        accessToken: string
        refreshToken: string
      }>(`token:${token.sub}`)

      if (!token || validationData?.refreshToken !== refreshToken) {
        throw new APIException(
          HttpStatus.BAD_REQUEST,
          '유효하지 않은 Refresh Token입니다.',
        )
      }

      const client = await this.clientsModel.findOne({
        id: clientId,
        secret: clientSecret,
      })

      if (!client) {
        throw new APIException(
          HttpStatus.BAD_REQUEST,
          '잘못된 클라이언트 정보입니다.',
        )
      }

      const user = validationData.user

      const { accessToken, refreshToken: renewedRefreshToken } =
        await this.issueToken(user)

      await this.cacheManager.del(`token:${user.user.id}`)
      await this.cacheManager.set(`token:${user.user.id}`, {
        user: user,
        accessToken: accessToken,
        refreshToken: renewedRefreshToken,
      })

      return {
        access_token: accessToken,
        refresh_token: renewedRefreshToken,
        token_type: 'Bearer',
        expires_in: ms('1h') / 1000,
      }
    } catch (e) {
      if (e instanceof JsonWebTokenError) {
        throw new APIException(
          HttpStatus.BAD_REQUEST,
          `잘못된 요청입니다. (${e.message})`,
        )
      }

      throw e
    }
  }

  async issueToken(user: User) {
    const iat = Math.floor(Date.now() / 1000)
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.user.id,
        provider: user.user.provider,
        profile: user.user,
        iat: iat,
        exp: iat + ms('1h') / 1000,
      },
      {
        expiresIn: '1h',
      },
    )

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.user.id,
        iat: iat,
        exp: iat + ms('30d') / 1000,
      },
      {
        expiresIn: '30d',
      },
    )

    return { accessToken, refreshToken }
  }
}
