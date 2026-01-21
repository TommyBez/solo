'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { Download, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Client, Invoice, InvoiceLineItem } from '@/lib/db/schema'
import { getStoredSettings } from '@/lib/hooks/use-settings'
import { InvoicePDFTemplate } from './invoice-pdf-template'

type InvoicePDFDownloadProps = {
  invoice: Invoice & {
    client: Client
    lineItems: InvoiceLineItem[]
  }
}

export function InvoicePDFDownload({ invoice }: InvoicePDFDownloadProps) {
  const [isClient, setIsClient] = useState(false)
  const [settings, setSettings] = useState({
    companyName: '',
    companyAddress: '',
  })

  useEffect(() => {
    const stored = getStoredSettings()
    setSettings({
      companyName: stored.companyName || 'Your Company',
      companyAddress: stored.companyAddress || '',
    })
    setIsClient(true)
  }, [])

  const fileName = `${invoice.invoiceNumber}.pdf`

  // Don't render PDFDownloadLink during SSR
  if (!isClient) {
    return (
      <Button disabled variant="outline">
        <Download className="mr-2 size-4" />
        Download PDF
      </Button>
    )
  }

  return (
    <PDFDownloadLink
      document={
        <InvoicePDFTemplate
          companyAddress={settings.companyAddress}
          companyName={settings.companyName}
          invoice={invoice}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <Button disabled={loading} variant="outline">
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 size-4" />
              Download PDF
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  )
}
