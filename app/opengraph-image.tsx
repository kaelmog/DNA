import { ImageResponse } from 'next/og'

/**
 * Default social sharing image (Facebook, iMessage, Slack, X...) for every page.
 * Drawn with plain shapes and the built-in font, so it needs no network access.
 */

export const alt = 'Knotted Studio: thoughtful hand-knotted macrame for softer spaces'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Brand colours from app/globals.css; ImageResponse cannot read CSS variables.
const COLORS = {
  cream: '#f8f5ef',
  espresso: '#332720',
  clay: '#a45d3b',
  clayLight: '#b86e4a',
  clayDark: '#7f452e',
  sand: '#e7d9c9',
  taupe: '#71665c',
}

// A small macrame panel: a dowel, eight hanging cords and a V of square knots.
const CORD_COUNT = 8
const CORD_SPACING = 30
const FIRST_CORD_X = 65
const KNOT_ROWS = [
  [0, 2, 4, 6],
  [1, 3, 5],
  [2, 4],
  [3],
]
const KNOT_SIZE = 24

function MacrameArt() {
  return (
    <div style={{ position: 'relative', display: 'flex', width: 340, height: 480, borderRadius: 36, background: COLORS.sand }}>
      <div
        style={{
          position: 'absolute',
          top: 56,
          left: 30,
          width: 280,
          height: 14,
          borderRadius: 7,
          background: COLORS.clayDark,
        }}
      />
      {Array.from({ length: CORD_COUNT }, (_, index) => {
        // Longer cords in the middle give the fringe its soft V shape.
        const distanceFromCenter = Math.abs(index - (CORD_COUNT - 1) / 2)
        return (
          <div
            key={`cord-${index}`}
            style={{
              position: 'absolute',
              top: 70,
              left: FIRST_CORD_X + index * CORD_SPACING - 2,
              width: 4,
              height: 330 + (3.5 - distanceFromCenter) * 24,
              borderRadius: 2,
              background: COLORS.cream,
            }}
          />
        )
      })}
      {KNOT_ROWS.flatMap((gaps, row) =>
        gaps.map((gap) => (
          <div
            key={`knot-${row}-${gap}`}
            style={{
              position: 'absolute',
              top: 130 + row * 50 - KNOT_SIZE / 2,
              left: FIRST_CORD_X + CORD_SPACING * (gap + 0.5) - KNOT_SIZE / 2,
              width: KNOT_SIZE,
              height: KNOT_SIZE,
              borderRadius: 4,
              background: COLORS.cream,
              border: `3px solid ${COLORS.clayLight}`,
              transform: 'rotate(45deg)',
            }}
          />
        )),
      )}
    </div>
  )
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '72px 88px',
          background: COLORS.cream,
          color: COLORS.espresso,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 640 }}>
          <div style={{ fontSize: 22, letterSpacing: 6, textTransform: 'uppercase', color: COLORS.clay }}>
            Handmade macrame
          </div>
          <div style={{ display: 'flex', fontSize: 168, letterSpacing: -10, lineHeight: 1, marginTop: 24 }}>
            knotted<span style={{ color: COLORS.clayLight }}>.</span>
          </div>
          <div style={{ fontSize: 38, lineHeight: 1.35, color: COLORS.taupe, marginTop: 28 }}>
            Thoughtful hand-knotted macrame for softer spaces.
          </div>
          <div style={{ fontSize: 24, marginTop: 40 }}>Wall hangings · Plant hangers · Custom pieces</div>
        </div>
        <MacrameArt />
      </div>
    ),
    size,
  )
}
