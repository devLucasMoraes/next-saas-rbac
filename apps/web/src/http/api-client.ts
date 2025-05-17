import { env } from '@saas/env'
import { getCookie } from 'cookies-next'
import ky from 'ky'

const attachAuthToken = async (request: Request) => {
  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers')
    const cookiesStore = await cookies()
    const token = cookiesStore.get('token')?.value

    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
  } else {
    const token = getCookie('token')

    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`)
    }
  }
}

export const api = ky.create({
  prefixUrl: env.NEXT_PUBLIC_API_URL,
  hooks: {
    beforeRequest: [attachAuthToken],
  },
})
