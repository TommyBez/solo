import { format } from 'date-fns'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { type NextRequest, NextResponse } from 'next/server'
import { getActiveOrganizationId, getSession } from '@/lib/auth/session'
import { getOrganizationSettings } from '@/lib/queries/organization-settings'
import { getSettings } from '@/lib/queries/settings'
import { getTimeEntriesForProjectAndDateRange } from '@/lib/queries/time-entries'

const MAX_FILENAME_PART_LENGTH = 100
const CSV_FORMULA_PREFIX_PATTERN = /^[=+\-@]/

/**
 * Sanitizes a string for safe use in Content-Disposition filenames.
 * Prevents header injection and invalid filenames by stripping/replacing
 * unsafe characters (control chars, quotes, slashes, newlines, etc.).
 */
function sanitizeForFilename(
  value: string,
  maxLength = MAX_FILENAME_PART_LENGTH,
): string {
  // Strip control chars (0x00-0x1F, 0x7F) - use charCode to avoid control chars in regex (lint)
  const withoutControl = value
    .split('')
    .filter((c) => {
      const code = c.charCodeAt(0)
      return code > 31 && code !== 127
    })
    .join('')
  const sanitized = withoutControl
    .replace(/["'\\/]/g, '-') // replace quotes and slashes (control chars already stripped)
    .replace(/[^A-Za-z0-9 _-]/g, '-') // replace chars outside safe set
    .replace(/\s+/g, '-') // collapse spaces to single dash
    .replace(/-+/g, '-') // collapse runs to single dash
    .replace(/^-+|-+$/g, '') // trim leading/trailing dashes
    .slice(0, maxLength)
  return sanitized || 'export'
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

function buildCsv(
  entries: Awaited<ReturnType<typeof getTimeEntriesForProjectAndDateRange>>,
  dateFormat: string,
  timeFormat: '12' | '24',
): string {
  const headers = [
    'Date',
    'Project',
    'Area',
    'Description',
    'Start Time',
    'End Time',
    'Duration',
    'Duration (minutes)',
    'Billable',
  ]

  const timeFormatStr = timeFormat === '24' ? 'HH:mm' : 'h:mm a'

  const rows = entries.map((entry) => [
    format(new Date(entry.startTime), dateFormat),
    entry.project.name,
    entry.project.area.name,
    entry.description ?? '',
    format(new Date(entry.startTime), timeFormatStr),
    entry.endTime ? format(new Date(entry.endTime), timeFormatStr) : '',
    formatDuration(entry.durationMinutes),
    String(entry.durationMinutes),
    entry.billable ? 'Yes' : 'No',
  ])

  const escapeCsvField = (field: string): string => {
    const trimmed = field.trim()
    // CSV formula injection mitigation: prefix fields starting with =, +, -, @
    let processed = field
    if (CSV_FORMULA_PREFIX_PATTERN.test(trimmed)) {
      processed = `'${field}`
    }
    if (
      processed.includes(',') ||
      processed.includes('"') ||
      processed.includes('\n')
    ) {
      return `"${processed.replace(/"/g, '""')}"`
    }
    return processed
  }

  const csvLines = [
    headers.map(escapeCsvField).join(','),
    ...rows.map((row) => row.map(escapeCsvField).join(',')),
  ]

  return csvLines.join('\n')
}

function buildPdf(
  entries: Awaited<ReturnType<typeof getTimeEntriesForProjectAndDateRange>>,
  projectName: string,
  startDate: string,
  endDate: string,
  dateFormat: string,
  timeFormat: '12' | '24',
  companyInfo: {
    companyName?: string | null
    companyAddress?: string | null
  },
): ArrayBuffer {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(18)
  doc.text('Task Export Report', 14, 22)

  // Metadata
  doc.setFontSize(11)
  doc.setTextColor(100)

  let yOffset = 32

  // Add company info if available
  if (companyInfo.companyName) {
    doc.text(`${companyInfo.companyName}`, 14, yOffset)
    yOffset += 7

    if (companyInfo.companyAddress) {
      const addressLines = companyInfo.companyAddress.split('\n')
      for (const line of addressLines) {
        doc.text(line, 14, yOffset)
        yOffset += 5
      }
      yOffset += 2
    }
  }

  doc.text(`Project: ${projectName}`, 14, yOffset)
  yOffset += 7
  doc.text(`Period: ${startDate} to ${endDate}`, 14, yOffset)
  yOffset += 7
  doc.text(`Generated: ${format(new Date(), dateFormat)}`, 14, yOffset)

  // Summary
  const totalMinutes = entries.reduce(
    (sum, entry) => sum + entry.durationMinutes,
    0,
  )
  const billableMinutes = entries
    .filter((entry) => entry.billable)
    .reduce((sum, entry) => sum + entry.durationMinutes, 0)

  yOffset += 12
  doc.setTextColor(0)
  doc.setFontSize(12)
  doc.text('Summary', 14, yOffset)
  yOffset += 7
  doc.setFontSize(10)
  doc.text(`Total Entries: ${entries.length}`, 14, yOffset)
  yOffset += 6
  doc.text(`Total Time: ${formatDuration(totalMinutes)}`, 14, yOffset)
  yOffset += 6
  doc.text(`Billable Time: ${formatDuration(billableMinutes)}`, 14, yOffset)

  // Table
  const timeFormatStr = timeFormat === '24' ? 'HH:mm' : 'h:mm a'

  const tableData = entries.map((entry) => [
    format(new Date(entry.startTime), dateFormat),
    entry.description ?? '-',
    format(new Date(entry.startTime), timeFormatStr),
    entry.endTime ? format(new Date(entry.endTime), timeFormatStr) : '-',
    formatDuration(entry.durationMinutes),
    entry.billable ? 'Yes' : 'No',
  ])

  autoTable(doc, {
    startY: yOffset + 7,
    head: [['Date', 'Description', 'Start', 'End', 'Duration', 'Billable']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      1: { cellWidth: 60 },
    },
  })

  return doc.output('arraybuffer')
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const formatType = searchParams.get('format')

  if (!(projectId && startDate && endDate && formatType)) {
    return NextResponse.json(
      {
        error:
          'Missing required parameters: projectId, startDate, endDate, format',
      },
      { status: 400 },
    )
  }

  if (formatType !== 'csv' && formatType !== 'pdf') {
    return NextResponse.json(
      { error: 'Invalid format. Must be "csv" or "pdf".' },
      { status: 400 },
    )
  }

  const parsedProjectId = Number.parseInt(projectId, 10)
  if (Number.isNaN(parsedProjectId)) {
    return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 })
  }

  const start = new Date(startDate)
  const end = new Date(endDate)
  // Set end date to end of day
  end.setHours(23, 59, 59, 999)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }

  if (start.getTime() > end.getTime()) {
    return NextResponse.json(
      { error: 'Start date must be on or before end date' },
      { status: 400 },
    )
  }

  // Get user settings for formatting
  const session = await getSession()
  const settings = session?.user ? await getSettings(session.user.id) : null

  const dateFormat = settings?.dateFormat ?? 'MMM d, yyyy'
  const timeFormat = settings?.timeFormat ?? '12'

  const entries = await getTimeEntriesForProjectAndDateRange(
    parsedProjectId,
    start,
    end,
  )

  const rawProjectName =
    entries.length > 0 ? entries[0].project.name : `Project ${projectId}`
  const projectName = sanitizeForFilename(rawProjectName).toLowerCase()
  const safeStartDate = sanitizeForFilename(startDate, 16)
  const safeEndDate = sanitizeForFilename(endDate, 16)

  if (formatType === 'csv') {
    const csv = buildCsv(entries, dateFormat, timeFormat as '12' | '24')
    const filename = `tasks-${projectName}-${safeStartDate}-to-${safeEndDate}.csv`

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  const orgId = await getActiveOrganizationId()
  const orgSettings = orgId ? await getOrganizationSettings(orgId) : null
  const companyInfo = {
    companyName: orgSettings?.companyName,
    companyAddress: orgSettings?.companyAddress,
  }

  const pdfBytes = buildPdf(
    entries,
    rawProjectName,
    startDate,
    endDate,
    dateFormat,
    timeFormat as '12' | '24',
    companyInfo,
  )
  const filename = `tasks-${projectName}-${safeStartDate}-to-${safeEndDate}.pdf`

  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
