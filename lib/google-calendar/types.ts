export const GOOGLE_CALENDAR_PROVIDER_ID = 'google-calendar'

export interface GoogleCalendarConnectionStatus {
  connected: boolean
  connectedEmail?: string
  enabled: boolean
}

export interface GoogleCalendarEvent {
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
