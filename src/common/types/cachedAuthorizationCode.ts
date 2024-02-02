import { User } from './user'

export type CachedAuthorizationCode = {
  user: User
  client: string
  redirectUri: string
}
