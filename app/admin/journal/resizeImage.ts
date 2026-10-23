// Shrinks a photo in the browser before upload: phone photos are 3-8 MB, but
// 1920px wide is plenty for a 1080p screen and keeps each one around 400-600 KB.

export type ResizedPhoto = { blob: Blob; width: number; height: number }

const MAX_WIDTH = 1920
const QUALITY = 0.85

export async function resizeImage(file: File): Promise<ResizedPhoto> {
  // imageOrientation "from-image" applies the phone's rotation flag
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_WIDTH / bitmap.width)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas not available')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY))
  if (!blob) throw new Error('could not compress that photo')
  return { blob, width, height }
}