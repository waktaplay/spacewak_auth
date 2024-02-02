import {
  Controller,
  Logger,
  Get,
  Req,
  UseGuards,
  HttpStatus,
  Res,
  HttpException,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { AuthService } from '../auth.service'
import { GoogleOAuthGuard } from '../guards/google.guards'
import { KakaoOAuthGuard } from '../guards/kakao.guards'
import { DiscordOAuthGuard } from '../guards/discord.guards'

@ApiTags('Auth - OAuth2 Social Sign-In (Private)')
@Controller('signin')
export class SignInController {
  private readonly logger = new Logger(SignInController.name)

  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({
    summary: 'Google 로그인 리다이렉션',
    description: 'Google OAuth2.0을 통한 로그인 리다이렉트 처리',
  })
  async googleAuthCallback(@Req() req, @Res() res) {
    try {
      req.session.user = this.authService.token(req.user)

      return res.redirect(
        302,
        `/oauth2/authorize?${new URLSearchParams(req.session.authorizeParams).toString()}`,
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
      req.session.user = this.authService.token(req.user)

      return res.redirect(
        302,
        `/oauth2/authorize?${new URLSearchParams(req.session.authorizeParams).toString()}`,
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
  //     req.session.user = this.authService.token(req.user)

  //     return res.redirect(
  //       302,
  //       `/oauth2/authorize?${new URLSearchParams(req.session.authorizeParams).toString()}`,
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
      req.session.user = this.authService.token(req.user)

      return res.redirect(
        302,
        `/oauth2/authorize?${new URLSearchParams(req.session.authorizeParams).toString()}`,
      )
    } catch (e) {
      throw new HttpException(
        e,
        HttpStatus[(e.code as string) || 'INTERNAL_SERVER_ERROR'],
      )
    }
  }
}
