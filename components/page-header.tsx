import type React from 'react'

interface PageHeaderProps {
  children?: React.ReactNode
  description?: string
  title: string
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="font-bold text-2xl tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
