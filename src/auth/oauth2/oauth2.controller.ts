import {
  Controller,
  Logger,
  Get,
  Req,
  Res,
  Post,
  Query,
  Body,
  HttpStatus,
  HttpException,
} from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'

import { OAuth2Service } from './oauth2.service'
import { accessTokenRequestDto } from './dto/accessTokenRequest.dto'
import { accessTokenDto } from './dto/accessToken.dto'

import { User } from 'src/common/types/user'

import { APIException } from 'src/common/dto/APIException.dto'
import { accessTokenResponseDto } from './dto/accessTokenResponse.dto'

@ApiTags('Auth - OAuth2 Unified Sign-In')
@Controller('oauth2')
export class OAuth2Controller {
  private readonly logger = new Logger(OAuth2Controller.name)

  constructor(private readonly oauth2Service: OAuth2Service) {}

  @Get('authorize')
  @ApiOperation({
    summary: 'Authorization Code 발급 (로그인 요청)',
    description: 'OAuth2를 통한 통합 로그인 요청',
  })
  @ApiQuery({
    name: 'client_id',
    description: '서비스를 구분하기 위한 클라이언트 ID',
    example: 'spacewak',
    required: true,
  })
  @ApiQuery({
    name: 'redirect_uri',
    description: '로그인 후 리다이렉트 될 URI (사전에 등록되어 있어야 함)',
    example: 'https://spacewak.net/auth/callback',
    required: true,
  })
  @ApiQuery({
    name: 'response_type',
    description: '응답 타입 (항상 "code"여야 함)',
    example: 'code',
    required: true,
  })
  @ApiQuery({
    name: 'scope',
    description: '요청 권한 범위',
    example: 'email profile',
    required: true,
  })
  @ApiQuery({
    name: 'strategy',
    description: '로그인 전략 (discord, google, kakao, naver 중 하나)',
    example: 'google',
    enum: ['discord', 'google', 'kakao', 'naver'],
    required: true,
  })
  @ApiQuery({
    name: 'state',
    description: 'CSRF 공격 방지를 위한 랜덤 문자열',
    example: '1iEVeojUBHj8AjxsjNSkc',
    required: false,
  })
  async authorizeRequest(
    @Req() req,
    @Res() res,
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('response_type') responseType: string,
    @Query('scope') scope: string,
    @Query('strategy')
    strategy: 'discord' | 'google' | 'kakao' | 'naver',
    @Query('state') state?: string,
  ) {
    try {
      // 요청값 검증
      if (responseType !== 'code') {
        throw new APIException(
          HttpStatus.BAD_REQUEST,
          '"response_type"의 값은 "code"여야 합니다.',
        )
      }

      if (!clientId || !redirectUri || !scope) {
        throw new APIException(
          HttpStatus.BAD_REQUEST,
          '"client_id", "redirect_uri", "scope"는 필수입니다.',
        )
      }

      if (
        !strategy ||
        !['discord', 'google', 'kakao', 'naver'].includes(strategy)
      ) {
        throw new APIException(
          HttpStatus.BAD_REQUEST,
          '"strategy"의 값은 "discord", "google", "kakao", "naver" 중 하나여야 합니다.',
        )
      }

      // 클라이언트 검증
      await this.oauth2Service.requestValidate(clientId, redirectUri)

      if (
        !req.session.user ||
        (req.session.user as User).user.provider !== strategy
      ) {
        // 세션 설정
        req.session.authorizeParams = {
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: responseType,
          scope: scope,
          strategy: strategy,
          state: state,
        }

        // 소셜 로그인 창으로 Redirect
        return res.redirect(302, `/signin/${strategy}`)
      } else {
        const { authorizationCode } =
          await this.oauth2Service.getAuthorizationCode(
            req.session.user as User,
            clientId,
            redirectUri,
          )

        return res.redirect(
          302,
          `${redirectUri}?code=${authorizationCode}&state=${state}&provider=${strategy}`,
        )
      }
    } catch (e) {
      throw new HttpException(
        e,
        HttpStatus[(e.code as string) || 'INTERNAL_SERVER_ERROR'],
      )
    }
  }

  @Post('token')
  @ApiOperation({
    summary: 'Access Token 발급 (로그인 처리)',
    description: 'OAuth2를 통한 통합 로그인 Access Token 발급 요청',
  })
  @ApiOkResponse({
    description: 'Access Token 발급 성공 시',
    type: accessTokenResponseDto,
  })
  async accessTokenRequest(
    @Req() req,
    @Body() body: accessTokenRequestDto,
  ): Promise<accessTokenDto> {
    try {
      const { code, refresh_token, grant_type, redirect_uri } = body

      if (!req.headers.authorization) {
        throw new APIException(
          HttpStatus.UNAUTHORIZED,
          '"Authorization" 헤더는 필수입니다.',
        )
      }

      const [clientId, clientSecret] = Buffer.from(
        req.headers.authorization.split('Basic ')[1],
        'base64',
      )
        .toString('utf8')
        .split(':')

      // 요청값 검증
      if (!clientId || !clientSecret) {
        throw new APIException(
          HttpStatus.UNAUTHORIZED,
          '"clientId"와 "clientSecret"은 필수입니다.',
        )
      }

      if (!['authorization_code', 'refresh_token'].includes(grant_type)) {
        throw new APIException(
          HttpStatus.BAD_REQUEST,
          '"grant_type"의 값은 "authorization_code", "refresh_token" 중 하나여야 합니다.',
        )
      }

      this.logger.debug(
        `Access Token Request: ${grant_type} ${code} ${refresh_token}`,
      )

      if (grant_type === 'authorization_code') {
        if (!code || !redirect_uri) {
          throw new APIException(
            HttpStatus.BAD_REQUEST,
            '"code", "redirect_uri"는 필수입니다.',
          )
        }

        // Access Token 발급
        return await this.oauth2Service.issueAccessToken(
          code,
          clientId,
          clientSecret,
          redirect_uri,
        )
      } else {
        if (!refresh_token) {
          throw new APIException(
            HttpStatus.BAD_REQUEST,
            '"refresh_token"은 필수입니다.',
          )
        }

        // Refresh Token으로 Access Token 갱신
        return await this.oauth2Service.refreshAccessToken(
          clientId,
          clientSecret,
          refresh_token,
        )
      }
    } catch (e) {
      throw new HttpException(
        e,
        HttpStatus[(e.code as string) || 'INTERNAL_SERVER_ERROR'],
      )
    }
  }
}
