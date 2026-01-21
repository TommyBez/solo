'use client'

import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { format } from 'date-fns'
import type { Client, Invoice, InvoiceLineItem } from '@/lib/db/schema'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    fontFamily: 'Helvetica-Bold',
  },
  invoiceNumber: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: '#6b7280',
  },
  value: {
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  clientDetail: {
    color: '#374151',
    marginBottom: 2,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableCell: {
    color: '#374151',
  },
  descriptionCol: {
    flex: 3,
  },
  qtyCol: {
    flex: 1,
    textAlign: 'right',
  },
  rateCol: {
    flex: 1,
    textAlign: 'right',
  },
  amountCol: {
    flex: 1,
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 4,
    paddingVertical: 4,
  },
  totalsLabel: {
    color: '#6b7280',
  },
  totalsValue: {
    fontFamily: 'Helvetica-Bold',
  },
  totalRow: {
    borderTopWidth: 2,
    borderTopColor: '#374151',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
  },
  footerText: {
    fontSize: 9,
    color: '#9ca3af',
    textAlign: 'center',
  },
  notes: {
    marginTop: 30,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: 'Helvetica-Bold',
  },
  notesText: {
    color: '#6b7280',
    lineHeight: 1.4,
  },
  statusBadge: {
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  statusDraft: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
  },
  statusSent: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  statusPaid: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  statusOverdue: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
})

type InvoicePDFTemplateProps = {
  invoice: Invoice & {
    client: Client
    lineItems: InvoiceLineItem[]
  }
  companyName?: string
  companyAddress?: string
}

const formatCurrency = (amount: string | null, currency: string) => {
  if (!amount) {
    return '$0.00'
  }
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF ',
    JPY: '¥',
  }
  return `${symbols[currency] || ''}${Number(amount).toFixed(2)}`
}

export function InvoicePDFTemplate({
  invoice,
  companyName = 'Your Company',
  companyAddress = '',
}: InvoicePDFTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.companyName}>{companyName}</Text>
            {companyAddress ? (
              <Text style={styles.clientDetail}>{companyAddress}</Text>
            ) : null}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          </View>
        </View>

        {/* Bill To & Invoice Details */}
        <View style={{ flexDirection: 'row', marginBottom: 30 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.clientName}>{invoice.client.name}</Text>
            {invoice.client.email ? (
              <Text style={styles.clientDetail}>{invoice.client.email}</Text>
            ) : null}
            {invoice.client.address ? (
              <Text style={styles.clientDetail}>{invoice.client.address}</Text>
            ) : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Invoice Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Issue Date:</Text>
              <Text style={styles.value}>
                {format(new Date(invoice.issueDate), 'MMM d, yyyy')}
              </Text>
            </View>
            {invoice.dueDate ? (
              <View style={styles.row}>
                <Text style={styles.label}>Due Date:</Text>
                <Text style={styles.value}>
                  {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                </Text>
              </View>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <Text style={styles.value}>
                {invoice.status.charAt(0).toUpperCase() +
                  invoice.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.descriptionCol]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.qtyCol]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.rateCol]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, styles.amountCol]}>
              Amount
            </Text>
          </View>
          {invoice.lineItems.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.descriptionCol]}>
                {item.description}
              </Text>
              <Text style={[styles.tableCell, styles.qtyCol]}>
                {Number(item.quantity).toFixed(2)}
              </Text>
              <Text style={[styles.tableCell, styles.rateCol]}>
                {formatCurrency(item.rate, invoice.currency)}
              </Text>
              <Text style={[styles.tableCell, styles.amountCol]}>
                {formatCurrency(item.amount, invoice.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>
              {formatCurrency(invoice.subtotal, invoice.currency)}
            </Text>
          </View>
          {Number(invoice.taxRate) > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax ({invoice.taxRate}%)</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(invoice.taxAmount, invoice.currency)}
              </Text>
            </View>
          )}
          <View style={[styles.totalsRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.total, invoice.currency)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes ? (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business!</Text>
        </View>
      </Page>
    </Document>
  )
}
