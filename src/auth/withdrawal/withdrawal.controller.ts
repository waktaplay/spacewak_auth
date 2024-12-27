import {
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Headers,
  Post,
  Body,
  Response,
} from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'

import { WithdrawalService } from './withdrawal.service'
import { kakaoWithdrawalRequestDto } from './dto/kakaoWithdrawalRequest.dto'
import { naverWithdrawalRequestDto } from './dto/naverWithdrawalRequest.dto'

import { APIResponseDto } from 'src/common/dto/APIResponse.dto'

@ApiTags('Auth - OAuth2 Withdrawal Management')
@Controller('withdrawal')
export class WithdrawalController {
  private readonly logger = new Logger(WithdrawalController.name)

  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Post('kakao')
  @ApiOperation({
    summary: '카카오계정 연동 해제(탈퇴) 콜백',
    description: '카카오계정 측을 통한 연동 해제(탈퇴) 요청',
  })
  @ApiOkResponse({
    description: '처리 결과',
    type: APIResponseDto,
  })
  async kakaoWithdrawal(
    @Headers('authorization') authorization,
    @Body() body: kakaoWithdrawalRequestDto,
  ): Promise<void> {
    if (authorization !== `KakaoAK ${process.env.KAKAO_ADMIN_KEY}`) {
      throw new HttpException(
        "Invalid 'Authorization' Header",
        HttpStatus['UNAUTHORIZED'],
      )
    }

    try {
      await this.withdrawalService.kakaoWithdrawal(body.user_id)

      return
    } catch (e) {
      throw new HttpException(
        e,
        HttpStatus[(e.code as string) || 'INTERNAL_SERVER_ERROR'],
      )
    }
  }

  @Post('naver')
  @ApiOperation({
    summary: '네이버 로그인 연동 해제(탈퇴) 콜백',
    description: '네이버 로그인 측을 통한 연동 해제(탈퇴) 요청',
  })
  @ApiOkResponse({
    description: '처리 결과',
    type: APIResponseDto,
  })
  async naverWithdrawal(
    @Response() res,
    @Body() body: naverWithdrawalRequestDto,
  ): Promise<void> {
    try {
      await this.withdrawalService.naverWithdrawal(body)

      return res.status(204).end()
    } catch (e) {
      throw new HttpException(
        e,
        HttpStatus[(e.code as string) || 'INTERNAL_SERVER_ERROR'],
      )
    }
  }
}
