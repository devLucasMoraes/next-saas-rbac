'use server'

import { HTTPError } from 'ky'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { acceptInvite } from '@/http/accept-invite'
import { signInWithEmailAndPassword } from '@/http/sing-in-with-email-password'

const signInSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters long',
  }),
})

export async function singInWithEmailAndPassword(data: FormData) {
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

    ;(await cookies()).set('token', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    const inviteId = (await cookies()).get('inviteId')?.value

    if (inviteId) {
      try {
        await acceptInvite(inviteId)
        ;(await cookies()).delete('inviteId')
      } catch (e) {
        console.log(e)
      }
    }
  } catch (err) {
    if (err instanceof HTTPError) {
      const { message } = await err.response.json()
      return { success: false, message, errors: null }
    }

    console.error(err)
    return { success: false, message: 'Unexpected error', errors: null }
  }

  redirect('/')
}
