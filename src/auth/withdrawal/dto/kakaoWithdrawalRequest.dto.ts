export class kakaoWithdrawalRequestDto {
  /**
   * 사용자가 연결 끊기를 요청한 앱 ID
   * @example 123456
   */
  app_id: string

  /**
   * 연결 끊기를 요청한 사용자의 회원번호
   * @example 1234567890
   */
  user_id: string

  /**
   * 연결 끊기 요청 경로
   * @example UNLINK_FROM_APPS
   */
  referrer_type: string
}

export default kakaoWithdrawalRequestDto
