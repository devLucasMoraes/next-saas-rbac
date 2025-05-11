'use server'

import { signInWithEmailAndPassword } from '@/http/sing-in-with-email-password'

export async function singInWithEmailAndPassword(data: FormData) {
  const { email, password } = Object.fromEntries(data)

  const result = await signInWithEmailAndPassword({
    email: String(email),
    password: String(password),
  })

  console.log(result)
}
