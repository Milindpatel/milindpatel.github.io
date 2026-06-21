// Browser-side résumé text extraction. PDF via pdf.js, DOCX via mammoth's
// browser build. Returns plain text with line breaks, ready for parseResumeText.
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import mammoth from 'mammoth/mammoth.browser'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

async function readPdf(buffer: ArrayBuffer): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  let text = ''
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    for (const item of content.items) {
      if ('str' in item) {
        text += item.str
        if (item.hasEOL) text += '\n'
      }
    }
    text += '\n'
  }
  return text
}

async function readDocx(buffer: ArrayBuffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ arrayBuffer: buffer })
  return value
}

export async function readResumeFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  if (/\.pdf$/i.test(file.name))  return readPdf(buffer)
  if (/\.docx$/i.test(file.name)) return readDocx(buffer)
  throw new Error('Unsupported file type — please upload a PDF or DOCX.')
}
