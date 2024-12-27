import { Profile as GoogleProfile } from 'passport-google-oauth20'
import { Profile as KakaoProfile } from 'passport-kakao'
import { IProfile as NaverProfile } from 'passport-naver-oauth2'

export type Profile = GoogleProfile | KakaoProfile | NaverProfile

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
