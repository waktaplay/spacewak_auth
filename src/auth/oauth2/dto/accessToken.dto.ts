export class accessTokenDto {
  /**
   * 발급된 Access Token
   * @example eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDQ1NjcwNTg1OTcyMDAzMDQwNzYiLCJlbWFpbCI6ImttczAyMTlrbXNAZ21haWwuY29tIiwicHJvdmlkZXIiOiJnb29nbGUiLCJlbmNEYXRhIjoiOWQzNzA4NmNlNDJlMjJkOTgwYjE1OGZlNWI5NzFiMmMxYzFiMjA1YmRhY2IxODEyNzZhZmEwZDY1YmMxMDU5NyIsImlhdCI6MTcwNjg5MTU3OX0.kufYCcO-kZELot9QM4kyD8imjOeGdXnJfC9mAHRqNws
   */
  access_token: string

  /**
   * 발급된 Refresh Token (Access Token 갱신 시 사용)
   * @example eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDQ1NjcwNTg1OTcyMDAzMDQwNzYiLCJlbWFpbCI6ImttczAyMTlrbXNAZ21haWwuY29tIiwicHJvdmlkZXIiOiJnb29nbGUiLCJpYXQiOjE3MDY4OTE1Nzl9.YVkyUuE7Ca-6sd9dQOW1OIgPQWtF6lDwt-wlv5p1neM
   */
  refresh_token: string

  /**
   * Access Token의 타입 (항상 "Bearer"로 고정)
   * @example Bearer
   */
  token_type: string = 'Bearer'

  /**
   * Access Token의 유효기간 (초)
   * @example 3600
   */
  expires_in: number = 3600
}

export default accessTokenDto
