import type { Reputation } from '../sim/types'

export interface MatrixRenderOptions {
  goodColor?: string
  badColor?: string
  borderColor?: string
  subgroupLineColor?: string
  subgroupBoundaries?: number[]
}

const DEFAULT_OPTIONS: Required<MatrixRenderOptions> = {
  goodColor: '#2e8b57',
  badColor: '#c0392b',
  borderColor: '#d1d5db',
  subgroupLineColor: '#0f172a',
  subgroupBoundaries: [],
}

export interface MatrixHit {
  row: number
  col: number
}

export function drawImageMatrix(
  canvas: HTMLCanvasElement,
  imageMatrix: Reputation[][],
  options: MatrixRenderOptions = {},
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const context = canvas.getContext('2d')
  if (!context) return

  const size = imageMatrix.length
  if (size === 0) {
    context.clearRect(0, 0, canvas.width, canvas.height)
    return
  }

  const dpr = window.devicePixelRatio || 1
  const width = canvas.clientWidth
  const height = canvas.clientHeight

  if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, width, height)

  const cellW = width / size
  const cellH = height / size

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const rep = imageMatrix[row][col]
      context.fillStyle = rep === 'G' ? opts.goodColor : opts.badColor
      context.fillRect(col * cellW, row * cellH, cellW, cellH)
    }
  }

  context.strokeStyle = opts.borderColor
  context.lineWidth = 1
  for (let i = 0; i <= size; i += 1) {
    const x = i * cellW
    const y = i * cellH
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, height)
    context.stroke()

    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(width, y)
    context.stroke()
  }

  if (opts.subgroupBoundaries.length > 0) {
    context.strokeStyle = opts.subgroupLineColor
    context.lineWidth = 2
    for (const boundary of opts.subgroupBoundaries) {
      const x = boundary * cellW
      const y = boundary * cellH

      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, height)
      context.stroke()

      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(width, y)
      context.stroke()
    }
  }
}

export function getMatrixCellAt(
  canvas: HTMLCanvasElement,
  imageMatrix: Reputation[][],
  clientX: number,
  clientY: number,
): MatrixHit | null {
  const size = imageMatrix.length
  if (size === 0) return null

  const rect = canvas.getBoundingClientRect()
  const x = clientX - rect.left
  const y = clientY - rect.top

  if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
    return null
  }

  const col = Math.min(size - 1, Math.floor((x / rect.width) * size))
  const row = Math.min(size - 1, Math.floor((y / rect.height) * size))
  return { row, col }
}
