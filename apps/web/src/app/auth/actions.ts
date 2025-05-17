'use server'

import { env } from '@saas/env'
import { redirect } from 'next/navigation'

export async function signInWithGithub() {
  const githubUrl = new URL('login/oauth/authorize', 'https://github.com')

  githubUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID)
  githubUrl.searchParams.set('redirect_uri', env.GITHUB_REDIRECT_URI)
  githubUrl.searchParams.set('scope', 'read:user')

  redirect(githubUrl.toString())
}
