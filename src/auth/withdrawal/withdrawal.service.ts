import { HttpService } from '@nestjs/axios'
import { Inject, Injectable, Logger } from '@nestjs/common'

import { Model } from 'mongoose'

import { IUsers } from 'src/repository/schemas/users.schema'

@Injectable()
export class WithdrawalService {
  private readonly logger = new Logger(WithdrawalService.name)

  constructor(
    @Inject('USERS_MODEL')
    private readonly usersModel: Model<IUsers>,
    private readonly httpService: HttpService,
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
}
