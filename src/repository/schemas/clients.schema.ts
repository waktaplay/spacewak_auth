import mongoose from 'mongoose'

export interface IClient {
  id: string
  name: string
  secret: string
  redirectUris: string[]
}

export const ClientsSchema = new mongoose.Schema<IClient>({
  id: {
    type: String,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  secret: {
    type: String,
    required: true,
  },
  redirectUris: {
    type: [String],
    required: true,
  },
})
