import { Connection } from 'mongoose'
import { ClientsSchema } from '../schemas/clients.schema'

export const clientsProviders = [
  {
    provide: 'CLIENTS_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('Clients', ClientsSchema),
    inject: ['DATABASE_CONNECTION'],
  },
]
