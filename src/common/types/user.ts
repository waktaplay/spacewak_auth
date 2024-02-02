export type User = {
  accessToken: string
  refreshToken: string
  user?: {
    provider: string
    id: string
    displayName: string
    email: string
    avatar: string
  }
}
