import { hash } from 'bcryptjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function resetPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/password/reset',
    {
      schema: {
        tags: ['Auth'],
        summary: '',
        body: z.object({
          code: z.string(),
          password: z.string().min(6),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (req, res) => {
      const { code, password } = req.body

      const tokenFromCode = await prisma.token.findUnique({
        where: { id: code },
      })

      if (!tokenFromCode) {
        throw new UnauthorizedError('Invalid code')
      }

      const passwordHash = await hash(password, 6)

      await prisma.$transaction([
        prisma.user.update({
          where: {
            id: tokenFromCode.userId,
          },
          data: {
            passwordHash,
          },
        }),
        prisma.token.delete({
          where: {
            id: code,
          },
        }),
      ])

      return res.status(204).send()
    },
  )
}
