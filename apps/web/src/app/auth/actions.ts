'use server'

import { redirect } from 'next/navigation'

export async function signInWithGithub() {
  const githubUrl = new URL('login/oauth/authorize', 'https://github.com')

  githubUrl.searchParams.set('client_id', 'alndandjajdbajbda')
  githubUrl.searchParams.set(
    'redirect_uri',
    'http://localhost:3000/api/auth/callback',
  )
  githubUrl.searchParams.set('scope', 'read:user')

  redirect(githubUrl.toString())
}
