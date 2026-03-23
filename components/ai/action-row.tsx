'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ActionRowProps {
  acceptLabel?: string
  isLoading?: boolean
  onAccept: () => Promise<void>
  onEdit: () => void
}

export function ActionRow({
  onAccept,
  onEdit,
  acceptLabel = 'Accept',
  isLoading = false,
}: ActionRowProps) {
  const [isAccepting, setIsAccepting] = useState(false)

  async function handleAccept() {
    setIsAccepting(true)
    try {
      await onAccept()
    } finally {
      setIsAccepting(false)
    }
  }

  const loading = isLoading || isAccepting

  return (
    <div className="flex items-center gap-2">
      <Button
        className="min-w-[5rem]"
        disabled={loading}
        onClick={handleAccept}
        size="sm"
      >
        {loading && (
          <Loader2 aria-hidden="true" className="size-3 animate-spin" />
        )}
        {acceptLabel}
      </Button>
      <Button disabled={loading} onClick={onEdit} size="sm" variant="secondary">
        Accept and edit
      </Button>
    </div>
  )
}
