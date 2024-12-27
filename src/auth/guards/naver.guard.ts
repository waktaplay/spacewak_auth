import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class NaverOAuthGuard extends AuthGuard('naver') {
  constructor() {
    super()
  }
}
