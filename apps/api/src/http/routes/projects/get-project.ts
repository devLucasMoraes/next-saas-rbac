import { projectSchema } from '@saas/auth'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middleware/auth'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function getProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/organizations/:orgSlug/projects/:projectSlug',
      {
        schema: {
          tags: ['projects'],
          summary: 'Get project details',
          security: [{ bearerAuth: [] }],
          params: z.object({
            orgSlug: z.string(),
            projectSlug: z.string().uuid(),
          }),
          response: {
            200: z.object({
              project: z.object({
                id: z.string().uuid(),
                name: z.string(),
                slug: z.string(),
                description: z.string(),
                avatarUrl: z.string().nullable(),
                ownerId: z.string().uuid(),
                organizationId: z.string().uuid(),
                owner: z.object({
                  id: z.string().uuid(),
                  name: z.string().nullable(),
                  avatarUrl: z.string().nullable(),
                }),
              }),
            }),
          },
        },
      },
      async (req, res) => {
        const { orgSlug, projectSlug } = req.params
        const userId = await req.getCurrentUserId()
        const { membership, organization } =
          await req.getUserMembership(orgSlug)

        const project = await prisma.project.findUnique({
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            avatarUrl: true,
            ownerId: true,
            organizationId: true,
            owner: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          where: {
            slug: projectSlug,
            organizationId: organization.id,
          },
        })

        if (!project) {
          throw new BadRequestError('Project not found')
        }

        const authProject = projectSchema.parse(project)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('get', authProject)) {
          throw new UnauthorizedError('You are not allowed to see this project')
        }

        return res.status(200).send({ project })
      },
    )
}
