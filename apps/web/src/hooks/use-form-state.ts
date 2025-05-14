import { useState, useTransition } from 'react'

import { singInWithEmailAndPassword } from '@/app/auth/sign-in/actions'

interface FormState {
  success: boolean
  message: string | null
  errors: Record<string, string[]> | null
}

export function useFormState(
  action: (data: FormData) => Promise<FormState>,
  initalState?: FormState,
) {
  const [formState, setFormState] = useState<{
    success: boolean
    message: string | null
    errors: Record<string, string[]> | null
  }>(
    initalState ?? {
      success: false,
      message: null,
      errors: null,
    },
  )

  const [isPending, startTransition] = useTransition()
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const data = new FormData(form)

    startTransition(async () => {
      const state = await singInWithEmailAndPassword(data)
      setFormState(state)
    })
  }

  return [formState, handleSubmit, isPending] as const
}
