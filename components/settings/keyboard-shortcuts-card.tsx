import { Keyboard } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Kbd, KbdGroup } from '@/components/ui/kbd'
import { Separator } from '@/components/ui/separator'

interface ShortcutEntry {
  context?: string
  description: string
  keys: string[]
}

const SHORTCUT_GROUPS: { label: string; shortcuts: ShortcutEntry[] }[] = [
  {
    label: 'Time Tracking',
    shortcuts: [
      {
        keys: ['Ctrl', 'T'],
        description: 'Toggle timer (start / pause)',
        context: 'Time page',
      },
      {
        keys: ['Ctrl', 'N'],
        description: 'Add a new time entry',
        context: 'Time page',
      },
    ],
  },
]

export function KeyboardShortcutsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Keyboard className="size-5" />
          Keyboard Shortcuts
        </CardTitle>
        <CardDescription>
          Speed up your workflow with these keyboard shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {SHORTCUT_GROUPS.map((group, groupIndex) => (
          <div className="space-y-3" key={group.label}>
            <p className="font-medium text-muted-foreground text-sm">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.shortcuts.map((shortcut, i) => (
                <li
                  key={`${group.label}-${shortcut.description}-${shortcut.context ?? ''}`}
                >
                  {i > 0 && <Separator className="mb-3" />}
                  <div className="flex items-center justify-between gap-4 py-1">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm">{shortcut.description}</p>
                      {shortcut.context ? (
                        <p className="text-muted-foreground text-xs">
                          {shortcut.context}
                        </p>
                      ) : null}
                    </div>
                    <KbdGroup className="shrink-0">
                      {shortcut.keys.map((key) => (
                        <Kbd key={key}>{key}</Kbd>
                      ))}
                    </KbdGroup>
                  </div>
                </li>
              ))}
            </ul>
            {groupIndex < SHORTCUT_GROUPS.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
