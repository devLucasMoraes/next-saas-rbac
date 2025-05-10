import { roleSchema } from '@saas/auth'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function getInvite(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/invites/:inviteId',
    {
      schema: {
        tags: ['invites'],
        summary: 'get an invite',
        params: z.object({
          inviteId: z.string().uuid(),
        }),
        response: {
          201: z.object({
            invite: z.object({
              id: z.string().uuid(),
              email: z.string().email(),
              role: roleSchema,
              createdAt: z.date(),
              author: z
                .object({
                  id: z.string().uuid(),
                  name: z.string().nullable(),
                  avatarUrl: z.string().nullable(),
                })
                .nullable(),
              organization: z.object({
                name: z.string(),
              }),
            }),
          }),
        },
      },
    },
    async (req, res) => {
      const { inviteId } = req.params

      const invite = await prisma.invite.findUnique({
        select: {
          id: true,
          email: true,
          role: true,
          organization: {
            select: {
              name: true,
            },
          },
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        where: {
          id: inviteId,
        },
      })

      if (!invite) {
        throw new BadRequestError('Invite not found')
      }

      return res.status(201).send({ invite })
    },
  )
}
