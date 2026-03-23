import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set — emails will not be sent')
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Preview] To: ${to}, Subject: ${subject}`)
    console.log(html)
    return
  }

  const from = process.env.EMAIL_FROM
  if (!from) {
    console.error('[Email Error] EMAIL_FROM is not set')
    return
  }

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  })

  if (error) {
    console.error('[Email Error]', error)
  }
}
