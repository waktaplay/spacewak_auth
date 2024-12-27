export class naverWithdrawalRequestDto {
  /**
   * 애플리케이션 등록 시 발급받은 Client ID 값
   */
  clientId: string

  /**
   * 암호화처리된 이용자 고유 식별자.
   * @see https://developers.naver.com/docs/login/devguide/devguide.md#5-4-2-%EC%9D%B4%EC%9A%A9%EC%9E%90-%EA%B3%A0%EC%9C%A0-%EC%8B%9D%EB%B3%84%EC%A0%95%EB%B3%B4-%EC%95%94%ED%98%B8%ED%99%94-%EC%A0%84%EC%86%A1
   */
  encryptUniqueId: string

  /**
   * 요청 시점의 unix epoch time (second)
   * @example 1615920559
   */
  timestamp: string

  /**
   * 요청 검증을 위한 서명값
   * @see https://developers.naver.com/docs/login/devguide/devguide.md#5-4-3-%EB%84%A4%EC%9D%B4%EB%B2%84-%EB%A1%9C%EA%B7%B8%EC%9D%B8-%EC%97%B0%EA%B2%B0-%EB%81%8A%EA%B8%B0-%EC%95%8C%EB%A6%BC-api-%EC%9C%84%EB%B3%80%EC%A1%B0-%EB%B0%A9%EC%A7%80%EB%A5%BC-%EC%9C%84%ED%95%9C-hmac-%EC%B2%98%EB%A6%AC
   */
  signature: string
}

export default naverWithdrawalRequestDto
