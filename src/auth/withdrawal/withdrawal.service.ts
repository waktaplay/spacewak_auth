import { HttpService } from '@nestjs/axios'
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'

import md5 from 'md5'
import { createHmac, createDecipheriv } from 'node:crypto'
import { strictEqual } from 'node:assert'

import { Model } from 'mongoose'
import { IUsers } from 'src/repository/schemas/users.schema'

import { APIException } from 'src/common/dto/APIException.dto'
import { naverWithdrawalRequestDto } from './dto/naverWithdrawalRequest.dto'

@Injectable()
export class WithdrawalService {
  private readonly logger = new Logger(WithdrawalService.name)

  constructor(
    @Inject('USERS_MODEL')
    private readonly usersModel: Model<IUsers>,
  ) {}

  async kakaoWithdrawal(userId: string): Promise<void> {
    await this.usersModel.updateOne(
      {
        id: userId,
      },
      {
        withDrawed: true,
        withdrawedAt: new Date(),
      },
    )

    return
  }

  async naverWithdrawal(body: naverWithdrawalRequestDto) {
    if (body.clientId != process.env.NAVER_CLIENT_ID) {
      throw new APIException(
        HttpStatus.UNAUTHORIZED,
        '올바르지 않은 네이버 Client ID입니다.',
      )
    }

    if (
      !this.naverValidateRequest(
        body.signature,
        body.encryptUniqueId,
        body.timestamp,
      )
    ) {
      throw new APIException(
        HttpStatus.UNAUTHORIZED,
        '네이버 요청 검증에 실패했습니다.',
      )
    }

    const uniqueId = this.naverDecryptUniqueId(body.encryptUniqueId)
    await this.usersModel.updateOne(
      {
        id: uniqueId,
      },
      {
        withDrawed: true,
        withdrawedAt: new Date(),
      },
    )

    return
  }

  private naverValidateRequest(
    hmacSignature: string,
    encryptUniqueId: string,
    timestamp: string,
  ): boolean {
    const hmacKey = new TextEncoder()
      .encode(md5(process.env.NAVER_CLIENT_SECRET))
      .subarray(0, 16)

    const hmac = createHmac('sha256', hmacKey)
    hmac.update(
      `clientId=${process.env.NAVER_CLIENT_ID}&encryptUniqueId=${encryptUniqueId}&timestamp=${timestamp}`,
    )

    const hash = hmac.digest()

    try {
      strictEqual(
        hash.toString('base64url'),
        hmacSignature,
        new TypeError('Inputs are not identical'),
      )
      return true
    } catch (e) {
      if (e instanceof TypeError) {
        return false
      }

      throw e
    }
  }

  private naverDecryptUniqueId(encrypted: string): string {
    const encryptedWithIV = Buffer.from(encrypted, 'base64')
    const encryptAesKey = new TextEncoder()
      .encode(md5(process.env.NAVER_CLIENT_SECRET))
      .subarray(0, 16)

    const iv = encryptedWithIV.subarray(0, 16)
    const encryptedUniqueId = encryptedWithIV.subarray(16)

    const decipher = createDecipheriv('aes-128-cbc', encryptAesKey, iv)
    const decrypted = Buffer.concat([
      decipher.update(encryptedUniqueId),
      decipher.final(),
    ])

    return decrypted.toString('utf8')
  }
}
