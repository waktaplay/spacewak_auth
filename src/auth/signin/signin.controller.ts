import { Controller, Logger, Get, Req, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { AuthService } from '../auth.service'
import { GoogleOAuthGuard } from '../guards/google.guards'
import { KakaoOAuthGuard } from '../guards/kakao.guards'
import { DiscordOAuthGuard } from '../guards/discord.guards'

@ApiTags('Auth - Sign in')
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
  googleAuthCallback(@Req() req) {
    return this.authService.token(req.user)
  }

  @Get('kakao')
  @UseGuards(KakaoOAuthGuard)
  @ApiOperation({
    summary: '카카오 로그인 리다이렉션',
    description: '카카오계정 OAuth2.0을 통한 로그인 리다이렉트 처리',
  })
  kakaoAuthCallback(@Req() req) {
    return this.authService.token(req.user)
  }

  // @Get('apple')
  // @UseGuards(AppleOAuthGuard)
  // @ApiOperation({
  //   summary: 'Apple ID 로그인 리다이렉션',
  //   description: 'Apple ID OAuth2.0을 통한 로그인 리다이렉트 처리',
  // })
  // appleAuthCallback(@Req() req) {
  //   return this.authService.token(req.user)
  // }

  @Get('discord')
  @UseGuards(DiscordOAuthGuard)
  @ApiOperation({
    summary: 'Discord 로그인 리다이렉션',
    description: 'Discord OAuth2.0을 통한 로그인 리다이렉트 처리',
  })
  discordAuthCallback(@Req() req) {
    return this.authService.token(req.user)
  }
}
