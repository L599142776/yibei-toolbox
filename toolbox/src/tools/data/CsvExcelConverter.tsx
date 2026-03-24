// src/tools/data/CsvExcelConverter.tsx
import { useState, useCallback, useRef } from 'react'
import { Upload, Download, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import ToolLayout from '../../components/ToolLayout'

// Types
interface ParsedSheet {
  name: string
  data: string[][]
  headers: string[]
}

// CSV Parser
function parseCSV(text: string, delimiter: string, hasHeader: boolean): { data: string[][], headers: string[] } {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length === 0) return { data: [], headers: [] }

  const parseRow = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          current += '"'
          i++
        } else if (char === '"') {
          inQuotes = false
        } else {
          current += char
        }
      } else {
        if (char === '"') {
          inQuotes = true
        } else if (char === delimiter) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
    }
    result.push(current.trim())
    return result
  }

  const data = lines.map(parseRow)
  const headers = hasHeader && data.length > 0 ? data[0] : data[0].map((_, i) => `列${i + 1}`)
  const body = hasHeader ? data.slice(1) : data

  return { data: body, headers }
}

// CSV Generator
function generateCSV(data: string[][], headers: string[], delimiter: string, includeHeader: boolean): string {
  const escapeCell = (val: string): string => {
    if (val.includes(delimiter) || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }

  const rows = data.map(row => row.map(escapeCell).join(delimiter))
  if (includeHeader) {
    rows.unshift(headers.map(escapeCell).join(delimiter))
  }
  return rows.join('\n')
}

// Simple XLSX Generator (Office Open XML)
function generateXLSX(data: string[][], headers: string[], sheetName: string): Blob {
  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  const sharedStrings: string[] = []
  const stringIndex = new Map<string, number>()

  const getStringIndex = (str: string): number => {
    if (stringIndex.has(str)) return stringIndex.get(str)!
    const idx = sharedStrings.length
    sharedStrings.push(str)
    stringIndex.set(str, idx)
    return idx
  }

  const isNumeric = (str: string): boolean => {
    if (!str || str === '') return false
    return !isNaN(Number(str)) && /^-?\d+(\.\d+)?$/.test(str)
  }

  // Build sheet data
  const rows: string[] = []
  
  // Header row
  headers.forEach((h, i) => {
    const colLetter = String.fromCharCode(65 + i)
    rows.push(`<c r="${colLetter}1" t="s"><v>${getStringIndex(escapeXml(h))}</v></c>`)
  })

  // Data rows
  data.forEach((row, rowIdx) => {
    row.forEach((cell, colIdx) => {
      const colLetter = String.fromCharCode(65 + colIdx)
      const rowNum = rowIdx + 2
      if (isNumeric(cell)) {
        rows.push(`<c r="${colLetter}${rowNum}"><v>${cell}</v></c>`)
      } else {
        rows.push(`<c r="${colLetter}${rowNum}" t="s"><v>${getStringIndex(escapeXml(cell))}</v></c>`)
      }
    })
  })

  const sheetData = rows.length > 0 
    ? `<sheetData>${data.length > 0 || headers.length > 0 ? `<row r="1">${rows.slice(0, headers.length).join('')}</row>` : ''}${data.map((row, rowIdx) => {
      const rowNum = rowIdx + 2
      const rowCells = row.map((cell, colIdx) => {
        const colLetter = String.fromCharCode(65 + colIdx)
        if (isNumeric(cell)) {
          return `<c r="${colLetter}${rowNum}"><v>${cell}</v></c>`
        } else {
          return `<c r="${colLetter}${rowNum}" t="s"><v>${getStringIndex(escapeXml(cell))}</v></c>`
        }
      }).join('')
      return `<row r="${rowNum}">${rowCells}</row>`
    }).join('')}</sheetData>`
    : '<sheetData/>'

  const sharedStringsXml = sharedStrings.length > 0
    ? `<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">${sharedStrings.map(s => `<si><t>${escapeXml(s)}</t></si>`).join('')}</sst>`
    : ''

  // Build workbook
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`

  // Build sheet
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
${sheetData}
</worksheet>`

  // Build relationships
  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>`

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>`

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`

  // Manually create ZIP file
  const files: { name: string, data: string }[] = [
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: rootRels },
    { name: 'xl/workbook.xml', data: workbook },
    { name: 'xl/_rels/workbook.xml.rels', data: workbookRels },
    { name: 'xl/worksheets/sheet1.xml', data: sheet },
  ]
  if (sharedStrings.length > 0) {
    files.push({ name: 'xl/sharedStrings.xml', data: sharedStringsXml })
  }

  // Create ZIP manually (simple implementation)
  const zip = createZip(files)
  return new Blob([zip], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// Simple ZIP creator
function createZip(files: { name: string, data: string }[]): Blob {
  const parts: BlobPart[] = []
  const centralDirectory: BlobPart[] = []
  let offset = 0

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name)
    const contentBytes = new TextEncoder().encode(file.data)
    
    // Local file header
    const localHeader = new Uint8Array([
      0x50, 0x4b, 0x03, 0x04, // signature
      20, 0,                  // version needed
      0,                      // flags
      0,                      // compression method (stored)
      0, 0,                   // mod time
      0, 0,                   // mod date
      0, 0, 0, 0,             // crc32 (placeholder)
      ...numberToBytes(contentBytes.length, 4),
      ...numberToBytes(nameBytes.length, 4),
      0, 0,                   // extra field length
    ])
    parts.push(localHeader)
    parts.push(nameBytes)
    parts.push(contentBytes)
    
    // Store central directory entry
    const cdEntry = new Uint8Array([
      0x50, 0x4b, 0x01, 0x02, // signature
      20, 0,                  // version made by
      20, 0,                  // version needed
      0,                      // flags
      0,                      // compression method
      0, 0,                   // mod time
      0, 0,                   // mod date
      0, 0, 0, 0,             // crc32
      ...numberToBytes(contentBytes.length, 4),
      ...numberToBytes(contentBytes.length, 4),
      ...numberToBytes(nameBytes.length, 2),
      0, 0,                   // extra field length
      0, 0,                   // file comment length
      0, 0,                   // disk number start
      0, 0,                   // internal attrs
      0, 0, 0, 0,             // external attrs
      ...numberToBytes(offset, 4),
      ...Array.from(nameBytes),
    ])
    centralDirectory.push(cdEntry)
    offset += localHeader.length + nameBytes.length + contentBytes.length
  }

  const cdOffset = offset
  parts.push(...centralDirectory)
  
  // End of central directory
  const eocd = new Uint8Array([
    0x50, 0x4b, 0x05, 0x06, // signature
    0, 0,                   // disk number
    0, 0,                   // disk with cd
    ...numberToBytes(files.length, 2),
    ...numberToBytes(files.length, 2),
    ...numberToBytes(centralDirectory.reduce((acc: number, b: BlobPart) => acc + (b as Uint8Array).length, 0), 4),
    ...numberToBytes(cdOffset, 4),
    0, 0,                   // comment length
  ])
  parts.push(eocd)

  return new Blob(parts, { type: 'application/zip' })
}

function numberToBytes(n: number, bytes: number): number[] {
  const result: number[] = []
  for (let i = 0; i < bytes; i++) {
    result.push((n >> (i * 8)) & 0xff)
  }
  return result
}

// XLSX Parser (read Excel files)
async function parseXLSX(file: File): Promise<ParsedSheet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = e.target?.result as ArrayBuffer
        const sheets = extractXLSXSheets(result)
        resolve(sheets)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

function extractXLSXSheets(buffer: ArrayBuffer): ParsedSheet[] {
  const sheets: ParsedSheet[] = []
  
  // Find ZIP entries
  const entries = parseZipEntries(buffer)
  
  // Find workbook to get sheet names
  let workbookXml = ''
  for (const entry of entries) {
    if (entry.name === 'xl/workbook.xml') {
      workbookXml = decodeUtf8(entry.data)
    }
  }
  
  if (!workbookXml) return sheets
  
  // Parse sheet names
  const sheetNameRegex = /<sheet[^>]+name="([^"]+)"[^>]*/g
  const sheetNames: string[] = []
  let match
  while ((match = sheetNameRegex.exec(workbookXml)) !== null) {
    sheetNames.push(match[1])
  }
  
  // Find shared strings
  let sharedStrings: string[] = []
  for (const entry of entries) {
    if (entry.name === 'xl/sharedStrings.xml') {
      sharedStrings = parseSharedStrings(decodeUtf8(entry.data))
    }
  }
  
  // Parse each sheet
  for (let i = 0; i < sheetNames.length; i++) {
    const sheetEntry = entries.find(e => e.name === `xl/worksheets/sheet${i + 1}.xml`)
    if (sheetEntry) {
      const sheetData = parseSheetData(decodeUtf8(sheetEntry.data), sharedStrings)
      sheets.push({
        name: sheetNames[i] || `Sheet ${i + 1}`,
        data: sheetData.slice(1),
        headers: sheetData.length > 0 ? sheetData[0] : []
      })
    }
  }
  
  return sheets
}

function parseZipEntries(buffer: ArrayBuffer): { name: string, data: Uint8Array }[] {
  const entries: { name: string, data: Uint8Array }[] = []
  const view = new DataView(buffer)
  
  // Find end of central directory
  let eocdOffset = -1
  for (let i = buffer.byteLength - 22; i >= 0; i--) {
    if (view.getUint32(i) === 0x06054b50) {
      eocdOffset = i
      break
    }
  }
  
  if (eocdOffset === -1) return entries
  
  // Parse EOCD
  const cdEntries = view.getUint16(eocdOffset + 10)
  const cdOffset = view.getUint32(eocdOffset + 16)
  
  // Parse central directory
  let cdPos = cdOffset
  for (let i = 0; i < cdEntries; i++) {
    if (view.getUint32(cdPos) !== 0x02014b50) break
    
    const compMethod = view.getUint16(cdPos + 10)
    const uncompSize = view.getUint32(cdPos + 24)
    const nameLen = view.getUint16(cdPos + 28)
    const extraLen = view.getUint16(cdPos + 30)
    const commentLen = view.getUint16(cdPos + 32)
    const localHeaderOffset = view.getUint32(cdPos + 42)
    
    const nameBytes = new Uint8Array(buffer, cdPos + 46, nameLen)
    const name = new TextDecoder('utf-8').decode(nameBytes).replace(/\\/g, '/')
    
    // Read local header to get actual data offset and size
    const localNameLen = view.getUint16(localHeaderOffset + 26)
    const localExtraLen = view.getUint16(localHeaderOffset + 28)
    const dataOffset = localHeaderOffset + 30 + localNameLen + localExtraLen
    
    let data: Uint8Array
    if (compMethod === 0) {
      // Stored (no compression)
      data = new Uint8Array(buffer, dataOffset, uncompSize)
    } else {
      // Deflate - need to decompress
      data = decompressDeflate(new Uint8Array(buffer, dataOffset, view.getUint32(cdPos + 20)))
    }
    
    entries.push({ name, data })
    cdPos += 46 + nameLen + extraLen + commentLen
  }
  
  return entries
}

function decompressDeflate(data: Uint8Array): Uint8Array {
  // Simple inflate - skip zlib header if present
  let start = 0
  if (data.length > 2 && (data[0] === 0x78) && (data[1] === 0x9c || data[1] === 0x01 || data[1] === 0xda)) {
    start = 2
  }
  
  // Use pako-like decompression or fallback to simple output
  const result: number[] = []
  let pos = start
  
  while (pos < data.length) {
    // Read block header
    const header = data[pos++]
    const isFinal = (header & 0x80) !== 0
    const blockType = header & 0x03
    
    if (blockType === 0) {
      // No compression
      const len = data[pos] | (data[pos + 1] << 8)
      pos += 2
      for (let i = 0; i < len; i++) {
        result.push(data[pos + i])
      }
      pos += len
    } else if (blockType === 1 || blockType === 2) {
      // Fixed (type 1) or dynamic (type 2) Huffman
      const output = huffmanDecode(data, pos)
      result.push(...output.data)
      pos = output.endPos
    }
    
    if (isFinal) break
  }
  
  return new Uint8Array(result)
}

function huffmanDecode(data: Uint8Array, start: number): { data: number[], endPos: number } {
  // Simplified fixed Huffman codes for deflate
  const result: number[] = []
  let pos = start
  let current = 0
  let bits = 0
  let outputLength = 0
  const maxOutput = 65536
  
  // Fixed literal/length codes
  const fixedLitLen = new Map<number, number>()
  const fixedDist = new Map<number, number>()
  
  // Build fixed codes (simplified)
  for (let i = 0; i < 144; i++) fixedLitLen.set(i + 0x30, i)
  for (let i = 144; i < 256; i++) fixedLitLen.set((i + 0x190 - 144) * 2, i)
  for (let i = 256; i < 280; i++) fixedLitLen.set((0x18 - (280 - i)) * 2, i)
  for (let i = 280; i < 288; i++) fixedLitLen.set((i - 280) * 2 + 1, i)
  for (let i = 0; i < 32; i++) fixedDist.set(i, i)
  
  const litLensExtra = [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0]
  const distExtra = [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13]
  
  const getBits = (n: number): number => {
    while (bits < n) {
      current = (current << 8) | data[pos++]
      bits += 8
    }
    bits -= n
    return (current >> bits) & ((1 << n) - 1)
  }
  
  while (outputLength < maxOutput) {
    const code = getBits(7)
    
    if (code < 0x100) {
      result.push(code)
      outputLength++
      continue
    }
    
    if (code === 256) break // End of block
    
    let length: number
    if (code < 265) {
      length = code - 254
    } else {
      const extra = litLensExtra[code - 257]
      length = getBits(extra) + (2 << extra)
    }
    
    const distCode = getBits(5)
    const dExtra = distExtra[distCode]
    const distance = getBits(dExtra) + (1 << dExtra)
    
    for (let i = 0; i < length && result.length < maxOutput; i++) {
      const srcIdx = result.length - distance
      result.push(srcIdx >= 0 ? result[srcIdx] : 0)
    }
    outputLength += length
  }
  
  return { data: result, endPos: pos }
}

function parseSharedStrings(xml: string): string[] {
  const strings: string[] = []
  const siRegex = /<si>([\s\S]*?)<\/si>/g
  let match
  
  while ((match = siRegex.exec(xml)) !== null) {
    const content = match[1]
    const tMatch = content.match(/<t[^>]*>([\s\S]*?)<\/t>/)
    if (tMatch) {
      const text = tMatch[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
      strings.push(text)
    } else {
      // Rich text - just extract all <t> tags
      const richText = content.replace(/<t[^>]*>([\s\S]*?)<\/t>/g, (_, t) => t)
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
      strings.push(richText)
    }
  }
  
  return strings
}

function parseSheetData(xml: string, sharedStrings: string[]): string[][] {
  const rows: string[][] = []
  const rowRegex = /<row[^>]+r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g
  const cellRegex = /<c\s+r="([A-Z]+)(\d+)"[^>]*>([\s\S]*?)<\/c>/g
  
  let rowMatch
  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    const rowNum = parseInt(rowMatch[1])
    const rowData: string[] = []
    
    const rowContent = rowMatch[2]
    let cellMatch
    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
      const colLetter = cellMatch[1]
      const cellRowNum = parseInt(cellMatch[2])
      const cellContent = cellMatch[3]
      
      if (cellRowNum !== rowNum) continue
      
      const colIdx = colToIndex(colLetter)
      const typeMatch = cellContent.match(/t="([^"]+)"/)
      const valueMatch = cellContent.match(/<v>([^<]*)<\/v>/)
      
      let value = ''
      if (typeMatch && typeMatch[1] === 's' && valueMatch) {
        const idx = parseInt(valueMatch[1])
        value = sharedStrings[idx] || ''
      } else if (valueMatch) {
        value = valueMatch[1]
      }
      
      // Ensure row array is large enough
      while (rowData.length <= colIdx) {
        rowData.push('')
      }
      rowData[colIdx] = value
    }
    
    rows.push(rowData)
  }
  
  return rows
}

function colToIndex(col: string): number {
  let idx = 0
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.charCodeAt(i) - 64)
  }
  return idx - 1
}

function decodeUtf8(data: Uint8Array): string {
  return new TextDecoder('utf-8').decode(data)
}

// Download helper
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function downloadText(text: string, filename: string, encoding: string = 'utf-8') {
  const blob = new Blob([text], { type: 'text/csv;charset=' + encoding })
  downloadBlob(blob, filename)
}

// Encoding list
const encodings = [
  { label: 'UTF-8', value: 'utf-8' },
  { label: 'UTF-8 BOM', value: 'utf-8-bom' },
  { label: 'GBK', value: 'gbk' },
  { label: 'GB2312', value: 'gb2312' },
  { label: 'BIG5', value: 'big5' },
]

// Delimiter options
const delimiters = [
  { label: '逗号 (,)', value: ',' },
  { label: '分号 (;)', value: ';' },
  { label: '制表符 (Tab)', value: '\t' },
  { label: '空格', value: ' ' },
]

export default function CsvExcelConverter() {
  const [mode, setMode] = useState<'csv2xlsx' | 'xlsx2csv'>('csv2xlsx')
  const [csvInput, setCsvInput] = useState('')
  const [delimiter, setDelimiter] = useState(',')
  const [hasHeader, setHasHeader] = useState(true)
  const [encoding, setEncoding] = useState('utf-8')
  const [excelSheets, setExcelSheets] = useState<ParsedSheet[]>([])
  const [selectedSheet, setSelectedSheet] = useState(0)
  const [parsedData, setParsedData] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const excelInputRef = useRef<HTMLInputElement>(null)
  
  const PAGE_SIZE = 100
  
  // Process CSV input
  const processCSV = useCallback(() => {
    if (!csvInput.trim()) {
      setParsedData([])
      setHeaders([])
      return
    }
    try {
      const { data, headers: h } = parseCSV(csvInput, delimiter, hasHeader)
      setParsedData(data)
      setHeaders(h)
      setError('')
      setPage(0)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [csvInput, delimiter, hasHeader])
  
  // Handle Excel file upload
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      const sheets = await parseXLSX(file)
      if (sheets.length === 0) {
        setError('无法解析 Excel 文件')
        return
      }
      setExcelSheets(sheets)
      setSelectedSheet(0)
      setFileName(file.name.replace(/\.(xlsx|xls)$/i, ''))
      setError('')
    } catch (err: unknown) {
      setError('解析 Excel 文件失败: ' + (err instanceof Error ? err.message : String(err)))
    }
  }
  
  // Handle CSV file upload
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      let text = event.target?.result as string
      // Handle BOM
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1)
      }
      setCsvInput(text)
      setFileName(file.name.replace(/\.csv$/i, ''))
    }
    reader.readAsText(file)
  }
  
  // Update parsed data when sheet selection changes
  useState(() => {
    if (excelSheets.length > 0 && selectedSheet < excelSheets.length) {
      setParsedData(excelSheets[selectedSheet].data)
      setHeaders(excelSheets[selectedSheet].headers)
      setPage(0)
    }
  })
  
  // Get current sheet data
  const currentSheet = excelSheets[selectedSheet]
  const previewData = mode === 'xlsx2csv' && currentSheet ? currentSheet.data : parsedData
  const previewHeaders = mode === 'xlsx2csv' && currentSheet ? currentSheet.headers : headers
  
  // Pagination
  const totalPages = Math.max(1, Math.ceil(previewData.length / PAGE_SIZE))
  const paginatedData = previewData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  
  // Download handlers
  const handleDownload = () => {
    const dataToUse = mode === 'csv2xlsx' ? parsedData : excelSheets[selectedSheet]?.data || []
    const headersToUse = mode === 'csv2xlsx' ? headers : excelSheets[selectedSheet]?.headers || []
    
    if (mode === 'csv2xlsx') {
      if (dataToUse.length === 0 && headersToUse.length === 0) {
        setError('没有可导出的数据')
        return
      }
      const xlsxBlob = generateXLSX(dataToUse, headersToUse, 'Sheet1')
      downloadBlob(xlsxBlob, `${fileName || 'data'}.xlsx`)
    } else {
      if (dataToUse.length === 0) {
        setError('没有可导出的数据')
        return
      }
      const csvContent = generateCSV(dataToUse, headersToUse, delimiter, hasHeader)
      const encodingToUse = encoding === 'utf-8-bom' ? 'utf-8' : encoding
      const bom = encoding === 'utf-8-bom' ? '\uFEFF' : ''
      downloadText(bom + csvContent, `${fileName || 'data'}.csv`, encodingToUse)
    }
    setError('')
  }
  
  // Clear handlers
  const handleClear = () => {
    setCsvInput('')
    setParsedData([])
    setHeaders([])
    setExcelSheets([])
    setFileName('')
    setError('')
    setPage(0)
  }
  
  return (
    <ToolLayout title="CSV ↔ Excel 转换器" description="CSV 与 Excel 文件互转，支持分隔符和编码设置">
      {/* Mode Toggle */}
      <div className="btn-group" style={{ marginBottom: 16 }}>
        <button 
          className={`btn ${mode === 'csv2xlsx' ? '' : 'btn-outline'}`}
          onClick={() => setMode('csv2xlsx')}
        >
          <FileText size={16} /> CSV → Excel
        </button>
        <button 
          className={`btn ${mode === 'xlsx2csv' ? '' : 'btn-outline'}`}
          onClick={() => setMode('xlsx2csv')}
        >
          <FileSpreadsheet size={16} /> Excel → CSV
        </button>
      </div>
      
      {/* Input Area */}
      {mode === 'csv2xlsx' ? (
        <div style={{ marginBottom: 16 }}>
          <div className="tool-output-label">
            <span className="tool-label">CSV 输入</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleCSVUpload}
                style={{ display: 'none' }}
              />
              <button 
                className="btn btn-outline"
                style={{ padding: '4px 10px', fontSize: 12 }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={12} /> 导入 CSV
              </button>
              <button 
                className="btn btn-outline"
                style={{ padding: '4px 10px', fontSize: 12 }}
                onClick={handleClear}
              >
                <Trash2 size={12} /> 清空
              </button>
            </div>
          </div>
          <textarea
            className="textarea"
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            onBlur={processCSV}
            placeholder="粘贴 CSV 内容或点击上方按钮导入文件..."
            style={{ minHeight: 150, fontFamily: 'monospace', fontSize: 12 }}
          />
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <input
            ref={excelInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            style={{ display: 'none' }}
          />
          <div 
            className="tool-output"
            style={{ 
              border: '2px dashed var(--border-color)', 
              borderRadius: 8, 
              padding: '40px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}
            onClick={() => excelInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary)' }}
            onDragLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            onDrop={(e) => {
              e.preventDefault()
              e.currentTarget.style.borderColor = 'var(--border-color)'
              const file = e.dataTransfer.files[0]
              if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                const input = excelInputRef.current!
                const dt = new DataTransfer()
                dt.items.add(file)
                input.files = dt.files
                input.dispatchEvent(new Event('change', { bubbles: true }))
              }
            }}
          >
            <FileSpreadsheet size={48} style={{ opacity: 0.5, marginBottom: 12 }} />
            <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
              拖拽 Excel 文件到此处或点击选择
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              支持 .xlsx 和 .xls 格式
            </p>
          </div>
        </div>
      )}
      
      {/* Options Panel */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 12, 
        marginBottom: 16,
        padding: 16,
        background: 'var(--bg-secondary)',
        borderRadius: 8
      }}>
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
            分隔符
          </label>
          <select 
            className="input"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
          >
            {delimiters.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
            CSV 编码
          </label>
          <select 
            className="input"
            value={encoding}
            onChange={(e) => setEncoding(e.target.value)}
          >
            {encodings.map(e => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
            首行作为表头
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
            />
            <span style={{ fontSize: 13 }}>{hasHeader ? '是' : '否'}</span>
          </label>
        </div>
        
        {mode === 'xlsx2csv' && excelSheets.length > 0 && (
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
              工作表
            </label>
            <select 
              className="input"
              value={selectedSheet}
              onChange={(e) => {
                setSelectedSheet(Number(e.target.value))
                if (excelSheets[Number(e.target.value)]) {
                  setParsedData(excelSheets[Number(e.target.value)].data)
                  setHeaders(excelSheets[Number(e.target.value)].headers)
                  setPage(0)
                }
              }}
            >
              {excelSheets.map((s, i) => (
                <option key={i} value={i}>{s.name} ({s.data.length} 行)</option>
              ))}
            </select>
          </div>
        )}
        
        {mode === 'csv2xlsx' && (
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
              文件名
            </label>
            <input
              type="text"
              className="input"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="data"
            />
          </div>
        )}
      </div>
      
      {/* Process Button */}
      {mode === 'csv2xlsx' && (
        <button className="btn btn-primary" onClick={processCSV} style={{ marginBottom: 16 }}>
          解析 CSV
        </button>
      )}
      
      {/* Error Message */}
      {error && (
        <div style={{ 
          color: '#ef4444', 
          fontSize: 13, 
          margin: '8px 0',
          padding: '8px 12px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: 4
        }}>
          ⚠ {error}
        </div>
      )}
      
      {/* Preview Table */}
      {previewData.length > 0 || previewHeaders.length > 0 ? (
        <div style={{ marginBottom: 16 }}>
          <div className="tool-output-label" style={{ marginBottom: 8 }}>
            <span className="tool-label">
              预览 ({previewData.length} 行{previewHeaders.length > 0 ? `, ${previewHeaders.length} 列` : ''})
              {mode === 'csv2xlsx' && hasHeader && previewHeaders.length > 0 && ' — 首行作为表头'}
            </span>
          </div>
          
          <div style={{ 
            overflowX: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            maxHeight: 400,
            overflow: 'auto'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: 12,
              fontFamily: 'monospace'
            }}>
              <thead>
                <tr>
                  <th style={{ 
                    position: 'sticky', 
                    top: 0, 
                    background: 'var(--bg-secondary)',
                    padding: '8px 12px',
                    textAlign: 'left',
                    borderBottom: '1px solid var(--border-color)',
                    fontWeight: 600,
                    width: 50,
                    minWidth: 50
                  }}>
                    #
                  </th>
                  {previewHeaders.length > 0 ? previewHeaders.map((h, i) => (
                    <th key={i} style={{ 
                      position: 'sticky', 
                      top: 0, 
                      background: 'var(--bg-secondary)',
                      padding: '8px 12px',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--border-color)',
                      borderLeft: '1px solid var(--border-color)',
                      fontWeight: 600,
                      minWidth: 100
                    }}>
                      {h || `列${i + 1}`}
                    </th>
                  )) : (
                    <th style={{ 
                      position: 'sticky', 
                      top: 0, 
                      background: 'var(--bg-secondary)',
                      padding: '8px 12px',
                      textAlign: 'left',
                      borderBottom: '1px solid var(--border-color)'
                    }}>
                      数据
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? paginatedData.map((row, rowIdx) => (
                  <tr key={rowIdx} style={{ background: rowIdx % 2 === 0 ? 'transparent' : 'var(--bg-secondary)' }}>
                    <td style={{ 
                      padding: '6px 12px',
                      borderBottom: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)'
                    }}>
                      {page * PAGE_SIZE + rowIdx + 1}
                    </td>
                    {previewHeaders.length > 0 ? (
                      row.length > 0 ? row.map((cell, colIdx) => (
                        <td key={colIdx} style={{ 
                          padding: '6px 12px',
                          borderBottom: '1px solid var(--border-color)',
                          borderLeft: '1px solid var(--border-color)',
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {cell}
                        </td>
                      )) : (
                        <td style={{ 
                          padding: '6px 12px',
                          borderBottom: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                          fontStyle: 'italic'
                        }}>
                          (空行)
                        </td>
                      )
                    ) : (
                      <td style={{ 
                        padding: '6px 12px',
                        borderBottom: '1px solid var(--border-color)',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {row.join(delimiter === '\t' ? '    ' : delimiter)}
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={previewHeaders.length > 0 ? previewHeaders.length + 1 : 2} style={{ 
                      padding: '20px',
                      textAlign: 'center',
                      color: 'var(--text-secondary)'
                    }}>
                      暂无数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: 12,
              marginTop: 12
            }}>
              <button 
                className="btn btn-outline"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                style={{ padding: '4px 8px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                第 {page + 1} / {totalPages} 页
              </span>
              <button 
                className="btn btn-outline"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                style={{ padding: '4px 8px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: 'var(--text-secondary)',
          background: 'var(--bg-secondary)',
          borderRadius: 8,
          marginBottom: 16
        }}>
          <FileSpreadsheet size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ margin: 0 }}>
            {mode === 'csv2xlsx' ? '输入 CSV 内容查看预览' : '上传 Excel 文件查看预览'}
          </p>
        </div>
      )}
      
      {/* Download Button */}
      {(previewData.length > 0 || (previewHeaders.length > 0 && mode === 'csv2xlsx')) && (
        <button 
          className="btn btn-primary"
          onClick={handleDownload}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}
        >
          <Download size={16} />
          导出 {mode === 'csv2xlsx' ? 'Excel' : 'CSV'}
        </button>
      )}
      
      {/* Style for scrollbar */}
      <style>{`
        .tool-output::-webkit-scrollbar,
        .tool-output *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .tool-output::-webkit-scrollbar-track,
        .tool-output *::-webkit-scrollbar-track {
          background: var(--bg-secondary);
        }
        .tool-output::-webkit-scrollbar-thumb,
        .tool-output *::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 4px;
        }
        .tool-output::-webkit-scrollbar-thumb:hover,
        .tool-output *::-webkit-scrollbar-thumb:hover {
          background: var(--text-secondary);
        }
      `}</style>
    </ToolLayout>
  )
}
