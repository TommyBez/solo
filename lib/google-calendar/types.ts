export const GOOGLE_CALENDAR_PROVIDER_ID = 'google-calendar'

export interface GoogleCalendarAccount {
  email: string
  id: string
}

export interface GoogleCalendarConnectionStatus {
  accounts: GoogleCalendarAccount[]
  connected: boolean
  enabled: boolean
}

export interface GoogleCalendarEvent {
  accountEmail?: string
  allDay: boolean
  description?: string
  endTime: string
  htmlLink?: string
  id: string
  startTime: string
  title: string
}

export interface GoogleTokenPayload {
  accessToken: string
  accessTokenExpiresAt: Date | null
  idToken?: string
  refreshToken?: string
  scope?: string
}
