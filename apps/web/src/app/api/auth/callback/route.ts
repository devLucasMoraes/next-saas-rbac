import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { signInWithGithub } from '@/http/sing-in-with-github'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json(
      { message: 'Github code not found' },
      { status: 400 },
    )
  }

  const { token } = await signInWithGithub({ code })

  ;(await cookies()).set('token', token, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  const redirectUrl = request.nextUrl.clone()

  redirectUrl.pathname = '/'

  redirectUrl.searchParams.delete('code')

  return NextResponse.redirect(redirectUrl)
}
