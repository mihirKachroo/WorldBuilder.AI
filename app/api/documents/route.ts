import { NextResponse } from 'next/server'
import { readdir, stat, readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

interface DocumentItem {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: DocumentItem[]
}

interface DocumentOrder {
  [path: string]: string[] // path -> ordered array of child paths
}

async function readDirectory(dirPath: string, basePath: string, order?: DocumentOrder): Promise<DocumentItem[]> {
  const items: DocumentItem[] = []
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true })
    const relativePath = dirPath.replace(basePath, '').replace(/^\//, '') || '.'
    const orderedPaths = order?.[relativePath]
    
    // Create a map of entries by name for quick lookup
    const entriesMap = new Map<string, typeof entries[0]>()
    entries.forEach(entry => entriesMap.set(entry.name, entry))
    
    // If we have an order for this directory, use it
    if (orderedPaths && orderedPaths.length > 0) {
      // Add items in the specified order
      for (const orderedPath of orderedPaths) {
        const entryName = orderedPath.split('/').pop() || orderedPath
        const entry = entriesMap.get(entryName)
        if (entry) {
          const fullPath = join(dirPath, entry.name)
          const itemRelativePath = fullPath.replace(basePath, '').replace(/^\//, '')
          
          if (entry.isDirectory()) {
            const children = await readDirectory(fullPath, basePath, order)
            items.push({
              name: entry.name,
              path: itemRelativePath,
              type: 'directory',
              children,
            })
          } else if (entry.isFile() && entry.name.endsWith('.md')) {
            items.push({
              name: entry.name.replace('.md', ''),
              path: itemRelativePath,
              type: 'file',
            })
          }
          entriesMap.delete(entry.name)
        }
      }
    }
    
    // Add any remaining items (new files/folders not in order)
    for (const entry of entries) {
      if (!entriesMap.has(entry.name)) continue
      
      const fullPath = join(dirPath, entry.name)
      const itemRelativePath = fullPath.replace(basePath, '').replace(/^\//, '')
      
      if (entry.isDirectory()) {
        const children = await readDirectory(fullPath, basePath, order)
        items.push({
          name: entry.name,
          path: itemRelativePath,
          type: 'directory',
          children,
        })
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        items.push({
          name: entry.name.replace('.md', ''),
          path: itemRelativePath,
          type: 'file',
        })
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error)
  }
  
  return items
}

async function getOrder(): Promise<DocumentOrder> {
  const orderPath = join(process.cwd(), 'documents', '.order.json')
  try {
    if (existsSync(orderPath)) {
      const content = await readFile(orderPath, 'utf-8')
      return JSON.parse(content)
    }
  } catch (error) {
    console.error('Error reading order file:', error)
  }
  return {}
}

async function saveOrder(order: DocumentOrder): Promise<void> {
  const orderPath = join(process.cwd(), 'documents', '.order.json')
  try {
    await writeFile(orderPath, JSON.stringify(order, null, 2), 'utf-8')
  } catch (error) {
    console.error('Error saving order file:', error)
    throw error
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get('path')
  
  // If path is provided, return file content
  if (filePath) {
    try {
      const documentsPath = join(process.cwd(), 'documents')
      let fullPath = join(documentsPath, filePath)
      
      // Ensure .md extension is added if not present
      if (!fullPath.endsWith('.md')) {
        fullPath = `${fullPath}.md`
      }
      
      // Security: ensure the path is within documents directory (check after adding .md)
      if (!fullPath.startsWith(documentsPath)) {
        return NextResponse.json(
          { error: 'Invalid path' },
          { status: 400 }
        )
      }
      
      // Check if file exists
      if (!existsSync(fullPath)) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        )
      }
      
      const content = await readFile(fullPath, 'utf-8')
      return NextResponse.json({ content, path: filePath })
    } catch (error) {
      console.error('Error reading file:', error)
      return NextResponse.json(
        { error: 'Failed to read file' },
        { status: 500 }
      )
    }
  }
  
  // Otherwise, return document list (existing behavior)
  try {
    const documentsPath = join(process.cwd(), 'documents')
    const order = await getOrder()
    const documents = await readDirectory(documentsPath, documentsPath, order)
    
    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Error reading documents:', error)
    return NextResponse.json(
      { error: 'Failed to read documents' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { order } = body as { order: DocumentOrder }
    
    if (!order) {
      return NextResponse.json(
        { error: 'Order is required' },
        { status: 400 }
      )
    }
    
    await saveOrder(order)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving document order:', error)
    return NextResponse.json(
      { error: 'Failed to save document order' },
      { status: 500 }
    )
  }
}

