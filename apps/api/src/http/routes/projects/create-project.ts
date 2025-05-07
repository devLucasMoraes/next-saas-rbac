import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middleware/auth'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/utils/create-slug'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function createProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/projects',
      {
        schema: {
          tags: ['projects'],
          summary: 'create new project',
          security: [{ bearerAuth: [] }],
          params: z.object({
            slug: z.string(),
          }),
          body: z.object({
            name: z.string(),
            description: z.string(),
          }),
          response: {
            201: z.object({
              projectId: z.string(),
            }),
          },
        },
      },
      async (req, res) => {
        const { slug } = req.params

        const userId = await req.getCurrentUserId()
        const { organization, membership } = await req.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('create', 'Project')) {
          throw new UnauthorizedError(
            'You do not have permission to create a project',
          )
        }

        const { name, description } = req.body

        const project = await prisma.project.create({
          data: {
            name,
            description,
            organizationId: organization.id,
            slug: createSlug(name),
            ownerId: userId,
          },
        })

        return res.status(201).send({ projectId: project.id })
      },
    )
}
