import { roleSchema } from '@saas/auth'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middleware/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function createInvite(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/invites',
      {
        schema: {
          tags: ['invites'],
          summary: 'create new invite',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            email: z.string().email(),
            role: roleSchema,
          }),
          response: {
            201: z.object({
              inviteId: z.string(),
            }),
          },
        },
      },
      async (req, res) => {
        const { slug } = req.params

        const userId = await req.getCurrentUserId()
        const { organization, membership } = await req.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('create', 'Invite')) {
          throw new UnauthorizedError(
            'You do not have permission to create a invite',
          )
        }

        const { email, role } = req.body

        const [, domain] = email.split('@')

        if (
          organization.shoudAttachUsersByDomain &&
          organization.domain !== domain
        ) {
          throw new BadRequestError(
            `User wuth ${domain} domain is not allowed to be invited`,
          )
        }

        const inviteWithSameEmail = await prisma.invite.findFirst({
          where: {
            email,
            organizationId: organization.id,
          },
        })

        if (inviteWithSameEmail) {
          throw new BadRequestError(
            `User with ${email} email is already invited`,
          )
        }

        const memberWithSameEmail = await prisma.member.findFirst({
          where: {
            organizationId: organization.id,
            user: {
              email,
            },
          },
        })

        if (memberWithSameEmail) {
          throw new BadRequestError(
            `Member with ${email} email is already a member`,
          )
        }

        const invite = await prisma.invite.create({
          data: {
            email,
            organizationId: organization.id,
            role,
            userId,
          },
        })

        return res.status(201).send({ inviteId: invite.id })
      },
    )
}
