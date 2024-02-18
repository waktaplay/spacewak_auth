import { Profile as GoogleProfile } from 'passport-google-oauth20'
import { Profile as KakaoProfile } from 'passport-kakao'

export type Profile = GoogleProfile | KakaoProfile

export type SocialUser = {
  socialAccessToken: string
  socialRefreshToken: string
  user?: {
    provider: string
    id: string
    displayName: string
    email: string
    avatar: string
  }
  profile?: Profile
}
