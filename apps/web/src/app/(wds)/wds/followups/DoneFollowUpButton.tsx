'use client'

import { useTransition } from 'react'

export function DoneFollowUpButton({ followUpId }: { followUpId: string }) {
  const [isPending, startTransition] = useTransition()

  async function handleDone() {
    startTransition(async () => {
      const { doneFollowUpAction } = await import('@/modules/crm/actions')
      await doneFollowUpAction(followUpId, 'current-user-id')
    })
  }

  return (
    <button
      onClick={handleDone}
      disabled={isPending}
      className="text-xs px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 disabled:opacity-50"
    >
      {isPending ? '...' : '✓ เสร็จแล้ว'}
    </button>
  )
}
