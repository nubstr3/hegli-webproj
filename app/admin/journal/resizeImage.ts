// Shrinks a photo in the browser before upload: phone photos are 3-8 MB, but
// 1920px wide is plenty for a 1080p screen and keeps each one around 400-600 KB.
//
// iPhone/iPad photos are often HEIC. Safari can read those itself; Chrome, Edge and
// Firefox can't, so for those the converter library is loaded on demand (only when needed).

export type ResizedPhoto = { blob: Blob; width: number; height: number }

const MAX_WIDTH = 1920
const QUALITY = 0.85

const isHeicName = (file: File) => /\.(heic|heif)$/i.test(file.name)
const isHeicType = (file: File) => /^image\/hei[cf]/i.test(file.type)

/** A photo we can handle: any image, including HEIC files that some systems give no type to. */
export const isPhotoFile = (file: File) => file.type.startsWith('image/') || isHeicName(file)

/** Anything drawImage() can paint, with its pixel size and a way to release it. */
type Drawable = { source: CanvasImageSource; width: number; height: number; close: () => void }

/** Plain <img> decode: every browser applies the photo's rotation flag itself when drawing this. */
function decodeWithImg(file: File): Promise<Drawable> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('could not decode image'))
    }
    img.src = url
  })
}

const fromBitmap = (b: ImageBitmap): Drawable => ({ source: b, width: b.width, height: b.height, close: () => b.close() })

async function decode(file: File): Promise<Drawable> {
  // 1. Fast path. Older iPhone Safari rejects the imageOrientation option, so don't rely on it.
  try {
    return fromBitmap(await createImageBitmap(file, { imageOrientation: 'from-image' }))
  } catch {
    /* try the next way */
  }
  // 2. Ordinary image element (applies the photo's rotation flag in every browser)
  try {
    return await decodeWithImg(file)
  } catch (err) {
    if (!isHeicType(file) && !isHeicName(file)) throw err
  }
  // 3. HEIC the browser can't read itself: load the converter on demand
  const { heicTo } = await import('heic-to/next')
  return fromBitmap(await heicTo({ blob: file, type: 'bitmap' }))
}

export async function resizeImage(file: File): Promise<ResizedPhoto> {
  const bitmap = await decode(file)
  const scale = Math.min(1, MAX_WIDTH / bitmap.width)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas not available')
  ctx.drawImage(bitmap.source, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY))
  if (!blob) throw new Error('could not compress that photo')
  return { blob, width, height }
}