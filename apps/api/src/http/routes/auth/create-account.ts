import { hash } from 'bcryptjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

export async function createAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/users',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Create a new user',
        body: z.object({
          name: z.string(),
          email: z.string().email(),
          password: z.string().min(6),
        }),
      },
    },
    async (req, res) => {
      const { name, email, password } = req.body
      const userWithSameEmail = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (userWithSameEmail) {
        return res.status(400).send({
          message: 'User already exists',
        })
      }

      const [, domain] = email.split('@')

      const autoJoinOrganization = await prisma.organization.findFirst({
        where: {
          domain,
          shoudAttachUsersByDomain: true,
        },
      })

      const passwordHash = await hash(password, 6)

      await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          member_on: autoJoinOrganization
            ? {
                create: {
                  organizationId: autoJoinOrganization.id,
                },
              }
            : undefined,
        },
      })

      return res.status(201).send({
        message: 'User created successfully',
      })
    },
  )
}
