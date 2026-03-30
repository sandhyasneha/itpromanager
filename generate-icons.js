// ─────────────────────────────────────────────────────────────────────────────
// generate-icons.js — Run once with: node generate-icons.js
// Generates all PWA icons in public/icons/
// Requires: npm install canvas (run then delete after)
// ─────────────────────────────────────────────────────────────────────────────

const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
const OUT_DIR = path.join(__dirname, 'public', 'icons')

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, '#0a0c10')
  grad.addColorStop(1, '#111318')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, size * 0.2)
  ctx.fill()

  // Accent ring
  ctx.strokeStyle = '#00d4ff'
  ctx.lineWidth = size * 0.03
  ctx.beginPath()
  ctx.roundRect(
    size * 0.06,
    size * 0.06,
    size * 0.88,
    size * 0.88,
    size * 0.16
  )
  ctx.stroke()

  // "N" letter
  const fontSize = size * 0.52
  ctx.font = `900 ${fontSize}px sans-serif`
  ctx.fillStyle = '#00d4ff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('N', size / 2, size / 2 + size * 0.03)

  // Small "P" subscript
  const subSize = size * 0.18
  ctx.font = `700 ${subSize}px sans-serif`
  ctx.fillStyle = '#7c3aed'
  ctx.textAlign = 'center'
  ctx.fillText('P', size * 0.68, size * 0.72)

  const buffer = canvas.toBuffer('image/png')
  const outPath = path.join(OUT_DIR, `icon-${size}x${size}.png`)
  fs.writeFileSync(outPath, buffer)
  console.log(`✅ Generated: icon-${size}x${size}.png`)
}

SIZES.forEach(generateIcon)
console.log('\n🎉 All NexPlan PWA icons generated in public/icons/')
