'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Download, FileSpreadsheet, FileText } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { ColorDot } from '@/components/color-indicator'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ResponsiveDialog } from '@/components/ui/responsive-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSettingsContext } from '@/lib/context/settings-context'
import type { Area } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

const FILENAME_REGEX = /filename="(.+)"/

interface ProjectOption {
  area: Area
  id: number
  name: string
}

interface ExportTasksDialogProps {
  projects: ProjectOption[]
}

const exportSchema = z
  .object({
    selectedProjectId: z.string().min(1, 'Please select a project'),
    startDate: z.date({ required_error: 'Please select a start date' }),
    endDate: z.date({ required_error: 'Please select an end date' }),
    exportFormat: z.enum(['csv', 'pdf']),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'Start date must be before end date',
    path: ['endDate'],
  })

type ExportFormValues = z.infer<typeof exportSchema>

export function ExportTasksDialog({ projects }: ExportTasksDialogProps) {
  const { settings, formatDate } = useSettingsContext()
  const weekStartsOn = settings.weekStartsOn === '0' ? 0 : 1
  const [open, setOpen] = useState(false)
  const formId = 'export-tasks-form'
  const form = useForm<ExportFormValues>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      selectedProjectId: '',
      startDate: undefined,
      endDate: undefined,
      exportFormat: 'csv',
    },
  })
  const isExporting = form.formState.isSubmitting

  function downloadBlob(response: Response, fallbackFormat: string) {
    const blob = response.blob()
    const contentDisposition = response.headers.get('Content-Disposition')
    const filenameMatch = contentDisposition?.match(FILENAME_REGEX)
    const filename = filenameMatch
      ? filenameMatch[1]
      : `export.${fallbackFormat}`
    return { blob, filename }
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const params = new URLSearchParams({
        projectId: values.selectedProjectId,
        startDate: format(values.startDate, 'yyyy-MM-dd'),
        endDate: format(values.endDate, 'yyyy-MM-dd'),
        format: values.exportFormat,
      })

      const response = await fetch(`/api/export?${params.toString()}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }

      const { blob, filename } = downloadBlob(response, values.exportFormat)
      const url = window.URL.createObjectURL(await blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(
        `Tasks exported as ${values.exportFormat.toUpperCase()} successfully`,
      )
      setOpen(false)
      form.reset()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to export tasks',
      )
    }
  })

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value) {
      form.reset()
    }
  }

  const trigger = (
    <Button variant="outline">
      <Download className="mr-2 size-4" />
      Export Tasks
    </Button>
  )

  const footerButtons = (
    <>
      <Button onClick={() => setOpen(false)} type="button" variant="outline">
        Cancel
      </Button>
      <Button disabled={isExporting} form={formId} type="submit">
        {isExporting ? (
          'Exporting...'
        ) : (
          <>
            <Download className="mr-2 size-4" />
            Export {form.watch('exportFormat').toUpperCase()}
          </>
        )}
      </Button>
    </>
  )

  const formFields = (
    <div className="grid gap-5 py-4">
      {/* Project Selection */}
      <FormField
        control={form.control}
        name="selectedProjectId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project</FormLabel>
            <Select
              disabled={isExporting}
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    <div className="flex items-center gap-2">
                      <ColorDot color={project.area.color} />
                      {project.name}
                      <span className="text-muted-foreground">
                        ({project.area.name})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                      disabled={isExporting}
                      variant="outline"
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {field.value ? formatDate(field.value) : 'Pick date'}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    disabled={(date) =>
                      date > new Date() ||
                      (form.getValues('endDate')
                        ? date > form.getValues('endDate')
                        : false)
                    }
                    mode="single"
                    onSelect={field.onChange}
                    selected={field.value}
                    weekStartsOn={weekStartsOn}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                      disabled={isExporting}
                      variant="outline"
                    >
                      <CalendarIcon className="mr-2 size-4" />
                      {field.value ? formatDate(field.value) : 'Pick date'}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    disabled={(date) =>
                      date > new Date() ||
                      (form.getValues('startDate')
                        ? date < form.getValues('startDate')
                        : false)
                    }
                    mode="single"
                    onSelect={field.onChange}
                    selected={field.value}
                    weekStartsOn={weekStartsOn}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Export Format */}
      <FormField
        control={form.control}
        name="exportFormat"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Export Format</FormLabel>
            <FormControl>
              <RadioGroup
                className="grid grid-cols-2 gap-3"
                disabled={isExporting}
                onValueChange={field.onChange}
                value={field.value}
              >
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50',
                    field.value === 'csv' && 'border-primary bg-primary/5',
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
                </label>
                <label
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50',
                    field.value === 'pdf' && 'border-primary bg-primary/5',
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
                </label>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )

  return (
    <ResponsiveDialog
      className="md:max-w-[480px]"
      description={
        <>
          Export time entries for a project within a specific date range. Choose
          between CSV or PDF format.
        </>
      }
      footer={footerButtons}
      mobileFooterClassName="px-0 pb-0"
      onOpenChange={handleOpenChange}
      open={open}
      title="Export Tasks"
      trigger={trigger}
    >
      <Form {...form}>
        <form id={formId} onSubmit={handleSubmit}>
          {formFields}
        </form>
      </Form>
    </ResponsiveDialog>
  )
}
