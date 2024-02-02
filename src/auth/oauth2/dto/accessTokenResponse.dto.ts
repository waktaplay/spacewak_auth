import { APIResponseDto } from 'src/common/dto/APIResponse.dto'
import accessTokenDto from './accessToken.dto'

export class accessTokenResponseDto extends APIResponseDto {
  data: accessTokenDto
}

export default accessTokenResponseDto
