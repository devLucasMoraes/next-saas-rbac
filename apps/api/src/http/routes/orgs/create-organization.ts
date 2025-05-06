import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middleware/auth'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/utils/create-slug'

import { BadRequestError } from '../_errors/bad-request-error'

export async function createOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations',
      {
        schema: {
          tags: ['organizations'],
          summary: 'create new organization',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            domain: z.string().nullish(),
            shoudAttachUsersByDomain: z.boolean().optional(),
          }),
          response: {
            201: z.object({
              organizationId: z.string(),
            }),
          },
        },
      },
      async (req, res) => {
        const userId = await req.getCurrentUserId()

        const { name, domain, shoudAttachUsersByDomain } = req.body

        if (domain) {
          const organizationByDomain = await prisma.organization.findFirst({
            where: {
              domain,
            },
          })

          if (organizationByDomain) {
            throw new BadRequestError(
              'Organization with this domain already exists',
            )
          }
        }

        const organization = await prisma.organization.create({
          data: {
            name,
            domain,
            slug: createSlug(name),
            shoudAttachUsersByDomain,
            ownerId: userId,
            members: {
              create: {
                userId,
                role: 'ADMIN',
              },
            },
          },
        })

        return res.status(201).send({ organizationId: organization.id })
      },
    )
}
