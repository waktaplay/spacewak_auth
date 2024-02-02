import { JwtService } from '@nestjs/jwt'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'

import { Model } from 'mongoose'
import { Cache } from 'cache-manager'

import { randomBytes } from 'crypto'
import { customAlphabet } from 'nanoid'

import { accessTokenDto } from './dto/accessToken.dto'

import { User } from 'src/common/types/user'
import { CachedAuthorizationCode } from 'src/common/types/cachedAuthorizationCode'

import { APIError } from 'src/common/dto/APIError.dto'

import { IUsers } from 'src/repository/schemas/users.schema'
import { IClient } from 'src/repository/schemas/clients.schema'

@Injectable()
export class OAuth2Service {
  private readonly logger = new Logger(OAuth2Service.name)

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    @Inject('USERS_MODEL')
    private readonly usersModel: Model<IUsers>,
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
      throw new APIError(
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
      throw new APIError(
        HttpStatus.BAD_REQUEST,
        '존재하지 않는 클라이언트입니다.',
      )
    }

    if (!client.redirectUris.includes(redirectUri)) {
      throw new APIError(HttpStatus.BAD_REQUEST, '잘못된 redirect_uri 입니다.')
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
      10 * 60 * 1000,
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
      throw new APIError(
        HttpStatus.BAD_REQUEST,
        '유효하지 않은 Authorization Code입니다',
      )
    }

    if (cached.client !== clientId) {
      throw new APIError(HttpStatus.BAD_REQUEST, '잘못된 클라이언트입니다.')
    }

    if (cached.redirectUri !== redirectUri) {
      throw new APIError(HttpStatus.BAD_REQUEST, '잘못된 redirect_uri 입니다.')
    }

    const client = await this.clientsModel.findOne({
      id: clientId,
      secret: clientSecret,
    })

    if (!client) {
      throw new APIError(
        HttpStatus.BAD_REQUEST,
        '잘못된 클라이언트 정보입니다.',
      )
    }

    const user = cached.user as User

    const accessToken = this.jwtService.sign(
      {
        sub: user.user.id,
        email: user.user.email,
        provider: user.user.provider,
        encData: randomBytes(32).toString('hex'),
        iat: Math.floor(Date.now() / 1000),
      },
      {
        expiresIn: '1h',
      },
    )

    const refreshToken = this.jwtService.sign(
      {
        sub: user.user.id,
        email: user.user.email,
        provider: user.user.provider,
        iat: Math.floor(Date.now() / 1000),
      },
      {
        expiresIn: '30d',
      },
    )

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600,
    }
  }
}
