'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BatchActionBarProps {
  count: number
  onAcceptAll: () => Promise<void>
  onHide: () => void
}

export function BatchActionBar({ count, onAcceptAll, onHide }: BatchActionBarProps) {
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
        onClick={handleAcceptAll}
        disabled={isLoading || count === 0}
        size="sm"
      >
        {isLoading && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
        Accept all ({count})
      </Button>
      <Button variant="ghost" onClick={onHide} disabled={isLoading} size="sm">
        Hide
      </Button>
    </div>
  )
}
