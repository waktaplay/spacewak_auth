import mongoose from 'mongoose'

export interface IUsers {
  id: string
  email: string
  createdAt: Date
  withDrawed: boolean
  withdrawedAt?: Date
  accessBlocked: boolean
  accessBlockedAt?: Date
  accessBlockedReason?: string
}

export const UsersSchema = new mongoose.Schema<IUsers>({
  id: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  withDrawed: {
    type: Boolean,
    required: true,
    default: false,
  },
  withdrawedAt: Date,
  accessBlocked: {
    type: Boolean,
    required: true,
    default: false,
  },
  accessBlockedAt: Date,
  accessBlockedReason: String,
})
