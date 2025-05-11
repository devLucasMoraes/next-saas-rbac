'use server'

import { HTTPError } from 'ky'
import { z } from 'zod'

import { signInWithEmailAndPassword } from '@/http/sing-in-with-email-password'

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters long',
  }),
})

export async function singInWithEmailAndPassword(
  previousData: unknown,
  data: FormData,
) {
  const result = signInSchema.safeParse(Object.fromEntries(data))

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors

    return { success: false, message: null, errors }
  }

  const { email, password } = result.data

  try {
    const { token } = await signInWithEmailAndPassword({
      email,
      password,
    })

    console.log({ token })
  } catch (err) {
    if (err instanceof HTTPError) {
      const { message } = await err.response.json()
      return { success: false, message, errors: null }
    }

    console.error(err)
    return { success: false, message: 'Unexpected error', errors: null }
  }

  return { success: true, message: null, errors: null }
}
