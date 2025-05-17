import { roleSchema } from '@saas/auth'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middleware/auth'

export async function getMembership(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organization/:slug/membership',
      {
        schema: {
          tags: ['organizations'],
          summary: 'Get membership of an organization',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          response: {
            200: z.object({
              membership: z.object({
                id: z.string().uuid(),
                role: roleSchema,
                userId: z.string().uuid(),
                organizationId: z.string().uuid(),
              }),
            }),
          },
        },
      },
      async (req, res) => {
        const { slug } = req.params
        const membership = await req.getUserMembership(slug)

        return res.status(200).send({
          membership: {
            id: membership.membership.id,
            role: membership.membership.role,
            userId: membership.membership.userId,
            organizationId: membership.organization.id,
          },
        })
      },
    )
}
