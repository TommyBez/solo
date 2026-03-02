import { ImageResponse } from 'next/og'

export const alt = 'Solo'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background:
          'linear-gradient(135deg, rgb(9, 9, 11) 0%, rgb(39, 39, 42) 100%)',
        color: 'white',
        padding: 72,
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      }}
    >
      <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: -2 }}>
        Solo
      </div>
      <div style={{ marginTop: 24, fontSize: 34, opacity: 0.85 }}>
        Freelance activity and time tracking
      </div>
    </div>,
    size,
  )
}
