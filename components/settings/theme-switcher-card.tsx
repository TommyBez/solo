'use client'

import { Monitor, Moon, Palette, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export function ThemeSwitcherCard() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const value =
    theme === 'light' || theme === 'dark' || theme === 'system'
      ? theme
      : 'system'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="size-5" />
          Appearance
        </CardTitle>
        <CardDescription>
          Choose light, dark, or match your system setting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label className="sr-only" htmlFor="theme-toggle">
          Theme
        </Label>
        {mounted ? (
          <ToggleGroup
            className="w-full max-w-xs justify-stretch"
            id="theme-toggle"
            onValueChange={(next) => {
              if (next === 'light' || next === 'dark' || next === 'system') {
                setTheme(next)
              }
            }}
            spacing={1}
            type="single"
            value={value}
            variant="outline"
          >
            <ToggleGroupItem
              aria-label="Light theme"
              className="flex-1 gap-2"
              value="light"
            >
              <Sun className="size-4" />
              Light
            </ToggleGroupItem>
            <ToggleGroupItem
              aria-label="Dark theme"
              className="flex-1 gap-2"
              value="dark"
            >
              <Moon className="size-4" />
              Dark
            </ToggleGroupItem>
            <ToggleGroupItem
              aria-label="System theme"
              className="flex-1 gap-2"
              value="system"
            >
              <Monitor className="size-4" />
              System
            </ToggleGroupItem>
          </ToggleGroup>
        ) : (
          <div className="h-10 max-w-xs animate-pulse rounded-md bg-muted" />
        )}
      </CardContent>
    </Card>
  )
}
