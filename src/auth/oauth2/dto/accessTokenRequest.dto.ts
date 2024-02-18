export class accessTokenRequestDto {
  /**
   * Authorization Code 발급 시 얻은 code
   * @example WGY9LShmx035CEjMyuWAz
   */
  code?: string

  /**
   * Access Token 발급 시 얻은 refresh_token
   * @example 9d37086ce42e22d980b158fe5b971b2c1c1b205b
   */
  refresh_token?: string

  /**
   * 인증 방식 ("authorization_code" 혹은 "refresh_token" 여야 함)
   * @example authorization_code
   */
  grant_type: 'authorization_code' | 'refresh_token'

  /**
   * Authorization Code 발급 시 요청한 redirectUri
   * @example https://spacewak.net/auth/callback
   */
  redirect_uri?: string
}

export default accessTokenRequestDto
