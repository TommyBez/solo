import { format } from 'date-fns'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { type NextRequest, NextResponse } from 'next/server'
import { getTimeEntriesForProjectAndDateRange } from '@/lib/queries/time-entries'

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

function buildCsv(
  entries: Awaited<ReturnType<typeof getTimeEntriesForProjectAndDateRange>>,
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

  const rows = entries.map((entry) => [
    format(new Date(entry.startTime), 'yyyy-MM-dd'),
    entry.project.name,
    entry.project.area.name,
    entry.description ?? '',
    format(new Date(entry.startTime), 'HH:mm'),
    entry.endTime ? format(new Date(entry.endTime), 'HH:mm') : '',
    formatDuration(entry.durationMinutes),
    String(entry.durationMinutes),
    entry.billable ? 'Yes' : 'No',
  ])

  const escapeCsvField = (field: string): string => {
    const trimmed = field.trim()
    // CSV formula injection mitigation: prefix fields starting with =, +, -, @
    let processed = field
    if (/^[=+\-@]/.test(trimmed)) {
      processed = "'" + field
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
): ArrayBuffer {
  const doc = new jsPDF()

  // Title
  doc.setFontSize(18)
  doc.text('Task Export Report', 14, 22)

  // Metadata
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(`Project: ${projectName}`, 14, 32)
  doc.text(`Period: ${startDate} to ${endDate}`, 14, 39)
  doc.text(`Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, 46)

  // Summary
  const totalMinutes = entries.reduce(
    (sum, entry) => sum + entry.durationMinutes,
    0,
  )
  const billableMinutes = entries
    .filter((entry) => entry.billable)
    .reduce((sum, entry) => sum + entry.durationMinutes, 0)

  doc.setTextColor(0)
  doc.setFontSize(12)
  doc.text('Summary', 14, 58)
  doc.setFontSize(10)
  doc.text(`Total Entries: ${entries.length}`, 14, 65)
  doc.text(`Total Time: ${formatDuration(totalMinutes)}`, 14, 71)
  doc.text(`Billable Time: ${formatDuration(billableMinutes)}`, 14, 77)

  // Table
  const tableData = entries.map((entry) => [
    format(new Date(entry.startTime), 'yyyy-MM-dd'),
    entry.description ?? '-',
    format(new Date(entry.startTime), 'HH:mm'),
    entry.endTime ? format(new Date(entry.endTime), 'HH:mm') : '-',
    formatDuration(entry.durationMinutes),
    entry.billable ? 'Yes' : 'No',
  ])

  autoTable(doc, {
    startY: 84,
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

  const entries = await getTimeEntriesForProjectAndDateRange(
    parsedProjectId,
    start,
    end,
  )

  const projectName =
    entries.length > 0 ? entries[0].project.name : `Project ${projectId}`

  if (formatType === 'csv') {
    const csv = buildCsv(entries)
    const filename = `tasks-${projectName.replace(/\s+/g, '-').toLowerCase()}-${startDate}-to-${endDate}.csv`

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  }

  const pdfBytes = buildPdf(entries, projectName, startDate, endDate)
  const filename = `tasks-${projectName.replace(/\s+/g, '-').toLowerCase()}-${startDate}-to-${endDate}.pdf`

  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
