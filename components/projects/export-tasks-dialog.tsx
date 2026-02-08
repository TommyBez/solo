'use client'

import { format } from 'date-fns'
import { CalendarIcon, Download, FileSpreadsheet, FileText } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Area } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

const FILENAME_REGEX = /filename="(.+)"/

type ProjectOption = {
  id: number
  name: string
  area: Area
}

type ExportTasksDialogProps = {
  projects: ProjectOption[]
}

export function ExportTasksDialog({ projects }: ExportTasksDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv')
  const [isExporting, setIsExporting] = useState(false)

  function resetForm() {
    setSelectedProjectId('')
    setStartDate(undefined)
    setEndDate(undefined)
    setExportFormat('csv')
  }

  function downloadBlob(response: Response, fallbackFormat: string) {
    const blob = response.blob()
    const contentDisposition = response.headers.get('Content-Disposition')
    const filenameMatch = contentDisposition?.match(FILENAME_REGEX)
    const filename = filenameMatch
      ? filenameMatch[1]
      : `export.${fallbackFormat}`
    return { blob, filename }
  }

  async function handleExport() {
    if (!(selectedProjectId && startDate && endDate)) {
      toast.error('Please fill in all fields')
      return
    }

    if (startDate > endDate) {
      toast.error('Start date must be before end date')
      return
    }

    setIsExporting(true)

    try {
      const params = new URLSearchParams({
        projectId: selectedProjectId,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        format: exportFormat,
      })

      const response = await fetch(`/api/export?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      const { blob, filename } = downloadBlob(response, exportFormat)
      const url = window.URL.createObjectURL(await blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(
        `Tasks exported as ${exportFormat.toUpperCase()} successfully`,
      )
      setOpen(false)
      resetForm()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to export tasks',
      )
    } finally {
      setIsExporting(false)
    }
  }

  const isFormValid = selectedProjectId && startDate && endDate

  return (
    <Dialog
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) {
          resetForm()
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 size-4" />
          Export Tasks
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Export Tasks</DialogTitle>
          <DialogDescription>
            Export time entries for a project within a specific date range.
            Choose between CSV or PDF format.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Project Selection */}
          <div className="grid gap-2">
            <Label htmlFor="project-select">Project</Label>
            <Select
              onValueChange={setSelectedProjectId}
              value={selectedProjectId}
            >
              <SelectTrigger className="w-full" id="project-select">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    <div className="flex items-center gap-2">
                      <div
                        className="size-2 rounded-full"
                        style={{ backgroundColor: project.area.color }}
                      />
                      {project.name}
                      <span className="text-muted-foreground">
                        ({project.area.name})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground',
                    )}
                    variant="outline"
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {startDate ? format(startDate, 'MMM d, yyyy') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    disabled={(date) =>
                      date > new Date() || (endDate ? date > endDate : false)
                    }
                    mode="single"
                    onSelect={setStartDate}
                    selected={startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground',
                    )}
                    variant="outline"
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {endDate ? format(endDate, 'MMM d, yyyy') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    disabled={(date) =>
                      date > new Date() ||
                      (startDate ? date < startDate : false)
                    }
                    mode="single"
                    onSelect={setEndDate}
                    selected={endDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Export Format */}
          <div className="grid gap-3">
            <Label>Export Format</Label>
            <RadioGroup
              className="grid grid-cols-2 gap-3"
              onValueChange={(value) => setExportFormat(value as 'csv' | 'pdf')}
              value={exportFormat}
            >
              <Label
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50',
                  exportFormat === 'csv' && 'border-primary bg-primary/5',
                )}
                htmlFor="format-csv"
              >
                <RadioGroupItem id="format-csv" value="csv" />
                <FileSpreadsheet className="size-4 text-green-600" />
                <div className="grid gap-0.5">
                  <span className="font-medium">CSV</span>
                  <span className="text-[10px] text-muted-foreground">
                    Spreadsheet
                  </span>
                </div>
              </Label>
              <Label
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50',
                  exportFormat === 'pdf' && 'border-primary bg-primary/5',
                )}
                htmlFor="format-pdf"
              >
                <RadioGroupItem id="format-pdf" value="pdf" />
                <FileText className="size-4 text-red-600" />
                <div className="grid gap-0.5">
                  <span className="font-medium">PDF</span>
                  <span className="text-[10px] text-muted-foreground">
                    Document
                  </span>
                </div>
              </Label>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)} variant="outline">
            Cancel
          </Button>
          <Button disabled={!isFormValid || isExporting} onClick={handleExport}>
            {isExporting ? (
              'Exporting...'
            ) : (
              <>
                <Download className="mr-2 size-4" />
                Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
