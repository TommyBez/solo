'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ActionRowProps {
  onAccept: () => Promise<void>
  onEdit: () => void
  acceptLabel?: string
  isLoading?: boolean
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
        onClick={handleAccept}
        disabled={loading}
        size="sm"
        className="min-w-[5rem]"
      >
        {loading && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
        {acceptLabel}
      </Button>
      <Button
        variant="secondary"
        onClick={onEdit}
        disabled={loading}
        size="sm"
      >
        Accept and edit
      </Button>
    </div>
  )
}
