import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { fastify } from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { errorHandler } from './error-handler'
import { authWithGithub } from './routes/auth/auth-with-github'
import { authWithPassword } from './routes/auth/auth-with-password'
import { createAccount } from './routes/auth/create-account'
import { getProfile } from './routes/auth/get-profile'
import { reqPasswordRecover } from './routes/auth/req-password-recover'
import { resetPassword } from './routes/auth/reset-password'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.setErrorHandler(errorHandler)

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Next.js SaaS',
      description: 'Full stack Next.js SaaS app with multi-tenancy & RBAC',
      version: '1.0.0',
    },
    servers: [],
  },
  transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUi, {
  routePrefix: '/docs',
})

app.register(fastifyJwt, {
  secret: 'secret',
})

app.register(fastifyCors)

app.register(createAccount)
app.register(authWithPassword)
app.register(getProfile)
app.register(reqPasswordRecover)
app.register(resetPassword)
app.register(authWithGithub)

app
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log('HTTP server running!')
  })
