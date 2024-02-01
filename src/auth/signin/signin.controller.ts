import {
  Controller,
  Logger,
  Get,
  Req,
  UseGuards,
  Query,
  HttpStatus,
  Res,
  HttpException,
} from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'

import { AuthService } from '../auth.service'
import { GoogleOAuthGuard } from '../guards/google.guards'
import { KakaoOAuthGuard } from '../guards/kakao.guards'
import { DiscordOAuthGuard } from '../guards/discord.guards'

import APIException from 'src/common/dto/APIException.dto'

@ApiTags('Auth - Sign in')
@Controller('signin')
export class SignInController {
  private readonly logger = new Logger(SignInController.name)

  constructor(private readonly authService: AuthService) {}

  @Get('')
  @ApiOperation({
    summary: '로그인 요청',
    description: 'Oauth2.0을 통한 로그인 요청',
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
    description: '로그인 전략 (google, kakao, discord, apple 중 하나)',
    example: 'google',
    enum: ['google', 'kakao', 'discord', 'apple'],
    required: true,
  })
  @ApiQuery({
    name: 'state',
    description: 'CSRF 공격 방지를 위한 랜덤 문자열',
    example: '1iEVeojUBHj8AjxsjNSkc',
    required: false,
  })
  async signInRequest(
    @Req() req,
    @Res() res,
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('response_type') responseType: string,
    @Query('scope') scope: string,
    @Query('strategy') strategy: 'google' | 'kakao' | 'discord' | 'apple',
    @Query('state') state?: string,
  ) {
    try {
      if (responseType !== 'code') {
        throw new APIException(
          HttpStatus.BAD_REQUEST,
          'response_type의 값은 "code"여야 합니다.',
        )
      }

      if (!clientId || !redirectUri || !scope) {
        throw new APIException(
          HttpStatus.BAD_REQUEST,
          'client_id, redirect_uri, scope는 필수입니다.',
        )
      }

      if (
        !strategy ||
        !['google', 'kakao', 'discord', 'apple'].includes(strategy)
      ) {
        throw new APIException(
          HttpStatus.BAD_REQUEST,
          'strategy의 값은 "google", "kakao", "discord", "apple" 중 하나여야 합니다.',
        )
      }

      if (strategy === 'apple') {
        throw new APIException(
          HttpStatus.BAD_REQUEST,
          'Apple 로그인은 아직 지원하지 않습니다.',
        )
      }

      await this.authService.requestValidate(clientId, redirectUri)

      req.session.clientId = clientId
      req.session.redirectUri = redirectUri
      req.session.scope = scope
      req.session.state = state

      return res.redirect(302, `/signin/${strategy}`)
    } catch (e) {
      throw new HttpException(
        e,
        HttpStatus[(e.code as string) || 'INTERNAL_SERVER_ERROR'],
      )
    }
  }

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({
    summary: 'Google 로그인 리다이렉션',
    description: 'Google OAuth2.0을 통한 로그인 리다이렉트 처리',
  })
  async googleAuthCallback(@Req() req, @Res() res) {
    try {
      const { authorizationCode } = await this.authService.getAuthorizationCode(
        req.user,
      )

      await this.authService.requestValidate(
        req.session.clientId,
        req.session.redirectUri,
      )

      return res.redirect(
        302,
        `${req.session.redirectUri}?code=${authorizationCode}&state=${req.session.state}`,
      )
    } catch (e) {
      throw new HttpException(
        e,
        HttpStatus[(e.code as string) || 'INTERNAL_SERVER_ERROR'],
      )
    }
  }

  @Get('kakao')
  @UseGuards(KakaoOAuthGuard)
  @ApiOperation({
    summary: '카카오 로그인 리다이렉션',
    description: '카카오계정 OAuth2.0을 통한 로그인 리다이렉트 처리',
  })
  async kakaoAuthCallback(@Req() req, @Res() res) {
    try {
      const { authorizationCode } = await this.authService.getAuthorizationCode(
        req.user,
      )

      await this.authService.requestValidate(
        req.session.clientId,
        req.session.redirectUri,
      )

      return res.redirect(
        302,
        `${req.session.redirectUri}?code=${authorizationCode}&state=${req.session.state}`,
      )
    } catch (e) {
      throw new HttpException(
        e,
        HttpStatus[(e.code as string) || 'INTERNAL_SERVER_ERROR'],
      )
    }
  }

  // @Get('apple')
  // @UseGuards(AppleOAuthGuard)
  // @ApiOperation({
  //   summary: 'Apple ID 로그인 리다이렉션',
  //   description: 'Apple ID OAuth2.0을 통한 로그인 리다이렉트 처리',
  // })
  // async appleAuthCallback(@Req() req, @Res() res) {
  //   try {
  //     const { authorizationCode } = await this.authService.getAuthorizationCode(
  //       req.user,
  //     )

  //     await this.authService.requestValidate(
  //       req.session.clientId,
  //       req.session.redirectUri,
  //     )

  //     return res.redirect(
  //       302,
  //       `${req.session.redirectUri}?code=${authorizationCode}&state=${req.session.state}`,
  //     )
  //   } catch (e) {
  //     throw new HttpException(
  //       e,
  //       HttpStatus[(e.code as string) || 'INTERNAL_SERVER_ERROR'],
  //     )
  //   }
  // }

  @Get('discord')
  @UseGuards(DiscordOAuthGuard)
  @ApiOperation({
    summary: 'Discord 로그인 리다이렉션',
    description: 'Discord OAuth2.0을 통한 로그인 리다이렉트 처리',
  })
  async discordAuthCallback(@Req() req, @Res() res) {
    try {
      const { authorizationCode } = await this.authService.getAuthorizationCode(
        req.user,
      )

      await this.authService.requestValidate(
        req.session.clientId,
        req.session.redirectUri,
      )

      return res.redirect(
        302,
        `${req.session.redirectUri}?code=${authorizationCode}&state=${req.session.state}`,
      )
    } catch (e) {
      throw new HttpException(
        e,
        HttpStatus[(e.code as string) || 'INTERNAL_SERVER_ERROR'],
      )
    }
  }
}
