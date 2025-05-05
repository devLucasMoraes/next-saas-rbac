import 'fastify'

import { Member, Organization } from '../src/generated/prisma'

declare module 'fastify' {
  export interface FastifyRequest {
    getCurrentUserId: () => Promise<string>
    getUserMembership: (slug: string) => Promise<{
      membership: Member
      organization: Organization
    }>
  }
}
