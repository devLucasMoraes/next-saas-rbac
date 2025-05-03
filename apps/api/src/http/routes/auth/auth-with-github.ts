import { env } from '@saas/env'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function authWithGithub(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/sessions/github',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Authenticate user with github',
        body: z.object({
          code: z.string(),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
        },
      },
    },
    async (req, res) => {
      const { code } = req.body

      const githubOAuthUrl = new URL(
        'https://github.com/login/oauth/access_token',
      )

      githubOAuthUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID)
      githubOAuthUrl.searchParams.set('client_secret', env.GITHUB_CLIENT_SECRET)
      githubOAuthUrl.searchParams.set('redirect_uri', env.GITHUB_REDIRECT_URI)
      githubOAuthUrl.searchParams.set('code', code)

      const githubResponse = await fetch(githubOAuthUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      })

      const githubData = await githubResponse.json()

      const { access_token: accessToken } = z
        .object({
          access_token: z.string(),
          token_type: z.literal('bearer'),
          scope: z.string(),
        })
        .parse(githubData)

      const githubUserResponse = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const githubUserData = await githubUserResponse.json()

      const {
        id,
        avatar_url: avatarUrl,
        name,
        email,
      } = z
        .object({
          id: z.number(),
          avatar_url: z.string().url(),
          name: z.string().nullable(),
          email: z.string().nullable(),
        })
        .parse(githubUserData)

      if (email === null) {
        throw new BadRequestError(
          'Your github account must have an email to authenticate',
        )
      }

      let user = await prisma.user.findUnique({
        where: {
          email,
        },
      })

      if (!user) {
        user = await prisma.user.create({
          data: {
            name,
            email,
            avatarUrl,
          },
        })
      }

      let account = await prisma.account.findUnique({
        where: {
          provider_userId: {
            provider: 'GITHUB',
            userId: user.id,
          },
        },
      })

      if (!account) {
        account = await prisma.account.create({
          data: {
            provider: 'GITHUB',
            userId: user.id,
            providerAccountId: String(id),
          },
        })
      }

      const token = await res.jwtSign(
        {
          sub: user.id,
        },
        {
          sign: {
            expiresIn: '7d',
          },
        },
      )

      return res.status(201).send({ token })
    },
  )
}
