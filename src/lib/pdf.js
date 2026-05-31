import * as pdfjsLib from 'pdfjs-dist'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker

export { pdfjsLib }

const extractYear = (rawValue) => {
  if (!rawValue) {
    return ''
  }

  const match = String(rawValue).match(/(19|20)\d{2}/)
  return match?.[0] || ''
}

export const getPdfPreview = async (pdfUrl, scale = 1.2) => {
  const documentTask = pdfjsLib.getDocument(pdfUrl)
  const pdfDocument = await documentTask.promise

  try {
    const metadata = await pdfDocument.getMetadata().catch(() => null)
    const firstPage = await pdfDocument.getPage(1)
    const baseViewport = firstPage.getViewport({ scale: 1 })
    const renderViewport = firstPage.getViewport({ scale })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { alpha: false })

    if (!context) {
      throw new Error('Canvas 2D context is unavailable.')
    }

    canvas.width = Math.floor(renderViewport.width)
    canvas.height = Math.floor(renderViewport.height)

    await firstPage.render({
      canvasContext: context,
      viewport: renderViewport,
    }).promise

    return {
      summary: {
        title: metadata?.info?.Title || '',
        author: metadata?.info?.Author || '',
        creator: metadata?.info?.Creator || '',
        year:
          extractYear(metadata?.info?.ModDate) ||
          extractYear(metadata?.info?.CreationDate),
        pages: pdfDocument.numPages,
        width: baseViewport.width,
        height: baseViewport.height,
        aspectRatio: baseViewport.width / baseViewport.height,
      },
      cover: {
        width: canvas.width,
        height: canvas.height,
        src: canvas.toDataURL('image/png'),
      },
    }
  } finally {
    await pdfDocument.destroy()
  }
}

export const renderPdfPagesToImages = async (
  pdfUrl,
  {
    scale = 1.8,
    quality = 0.95,
  } = {},
) => {
  const documentTask = pdfjsLib.getDocument(pdfUrl)
  const pdfDocument = await documentTask.promise

  try {
    const metadata = await pdfDocument.getMetadata().catch(() => null)
    const firstPage = await pdfDocument.getPage(1)
    const baseViewport = firstPage.getViewport({ scale: 1 })
    const pages = []

    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = pageNumber === 1 ? firstPage : await pdfDocument.getPage(pageNumber)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d', { alpha: false, willReadFrequently: false })

      if (!context) {
        throw new Error('Canvas 2D context is unavailable.')
      }

      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)

      await page.render({
        canvasContext: context,
        viewport,
      }).promise

      pages.push({
        index: pageNumber - 1,
        width: Math.floor(baseViewport.width),
        height: Math.floor(baseViewport.height),
        src: canvas.toDataURL('image/jpeg', quality),
      })
    }

    return {
      summary: {
        title: metadata?.info?.Title || '',
        author: metadata?.info?.Author || '',
        creator: metadata?.info?.Creator || '',
        year:
          extractYear(metadata?.info?.ModDate) ||
          extractYear(metadata?.info?.CreationDate),
        pages: pdfDocument.numPages,
        width: Math.floor(baseViewport.width),
        height: Math.floor(baseViewport.height),
        aspectRatio: baseViewport.width / baseViewport.height,
      },
      pages,
    }
  } finally {
    await pdfDocument.destroy()
  }
}
