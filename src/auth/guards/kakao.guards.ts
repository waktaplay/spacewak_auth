import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class KakaoOAuthGuard extends AuthGuard('kakao') {
  constructor() {
    super()
  }
}
