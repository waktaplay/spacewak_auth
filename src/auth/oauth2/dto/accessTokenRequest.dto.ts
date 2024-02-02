export class accessTokenRequestDto {
  /**
   * Authorization Code 발급 시 얻은 code
   * @example WGY9LShmx035CEjMyuWAz
   */
  code: string

  /**
   * 인증 방식 (항상 "authorization_code"여야 함)
   * @example authorization_code
   */
  grant_type: string

  /**
   * Authorization Code 발급 시 요청한 redirectUri
   * @example https://spacewak.net/auth/callback
   */
  redirect_uri: string
}

export default accessTokenRequestDto
