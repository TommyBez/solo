'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface BatchActionBarProps {
  count: number
  onAcceptAll: () => Promise<void>
  onHide: () => void
}

export function BatchActionBar({
  count,
  onAcceptAll,
  onHide,
}: BatchActionBarProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleAcceptAll() {
    setIsLoading(true)
    try {
      await onAcceptAll()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        disabled={isLoading || count === 0}
        onClick={handleAcceptAll}
        size="sm"
      >
        {isLoading && (
          <Loader2 aria-hidden="true" className="size-3 animate-spin" />
        )}
        Accept all ({count})
      </Button>
      <Button disabled={isLoading} onClick={onHide} size="sm" variant="ghost">
        Hide
      </Button>
    </div>
  )
}
