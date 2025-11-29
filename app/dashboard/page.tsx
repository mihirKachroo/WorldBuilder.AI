'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  Handle,
  Position,
  ReactFlowInstance,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  getProjects,
  createProject,
  getCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  getRelationships,
  createRelationship,
  updateRelationship,
  deleteRelationship,
  type Project,
  type Character as ApiCharacter,
  type Relationship as ApiRelationship,
  type ApiError,
} from '@/lib/api'
import { useRouter } from 'next/navigation'

// Document structure
interface DocumentItem {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: DocumentItem[]
}

// Custom Character Node Component
interface CharacterNodeData {
  name: string
  description: string
  bgColor: string
  borderColor: string
  textColor: string
  iconColor: string
  isFocused?: boolean
  isHighlighted?: boolean
  isHovered?: boolean
  characterId?: number // Store the database ID
}

const CharacterNode = ({ data }: { data: CharacterNodeData }) => {
  const isHighlighted = data.isHighlighted || false
  const isHovered = data.isHovered || false
  const handleVisibility = isHovered ? 'opacity-100' : 'opacity-0'
  return (
    <div
      className={`rounded-lg p-3 shadow-sm w-48 relative ${data.bgColor} ${data.borderColor} ${
        isHighlighted ? 'border-2 border-primary shadow-lg ring-2 ring-primary ring-opacity-50' : 'border'
      }`}
      style={{ pointerEvents: 'auto' }}
    >
      {/* Handles - All sides for automatic routing - Only visible on hover - Centered on edges */}
      {/* Source and target handles overlap at the same positions, so only 4 handles are visible */}
      <Handle
        type="source"
        position={Position.Top}
        id="source-top"
        className={`!w-3 !h-3 !bg-primary !border-2 !border-white !cursor-crosshair transition-opacity ${handleVisibility}`}
        style={{ left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'all' }}
        isConnectable={true}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className={`!w-3 !h-3 !bg-primary !border-2 !border-white !cursor-crosshair transition-opacity ${handleVisibility}`}
        style={{ left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'all' }}
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className={`!w-3 !h-3 !bg-primary !border-2 !border-white !cursor-crosshair transition-opacity ${handleVisibility}`}
        style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'all' }}
        isConnectable={true}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        className={`!w-3 !h-3 !bg-primary !border-2 !border-white !cursor-crosshair transition-opacity ${handleVisibility}`}
        style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'all' }}
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className={`!w-3 !h-3 !bg-primary !border-2 !border-white !cursor-crosshair transition-opacity ${handleVisibility}`}
        style={{ left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'all' }}
        isConnectable={true}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom"
        className={`!w-3 !h-3 !bg-primary !border-2 !border-white !cursor-crosshair transition-opacity ${handleVisibility}`}
        style={{ left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'all' }}
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="source-left"
        className={`!w-3 !h-3 !bg-primary !border-2 !border-white !cursor-crosshair transition-opacity ${handleVisibility}`}
        style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'all' }}
        isConnectable={true}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className={`!w-3 !h-3 !bg-primary !border-2 !border-white !cursor-crosshair transition-opacity ${handleVisibility}`}
        style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'all' }}
        isConnectable={true}
      />

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <svg className={`w-5 h-5 ${data.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h4 className={`font-semibold text-gray-dark`}>{data.name}</h4>
        </div>
        <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
      <p className="text-xs text-gray line-clamp-2 overflow-hidden">{data.description}</p>
    </div>
  )
}

const nodeTypes = {
  character: CharacterNode,
}

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('Characters')
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'world-lore': true,
    'geography': false,
    'factions': false,
    'entities': true,
  })
  const [selectedConversation, setSelectedConversation] = useState('king-of-eldoria')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [openFile, setOpenFile] = useState<{ path: string; name: string; content: string } | null>(null)
  const [loadingFile, setLoadingFile] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; references?: string[] }>>([
    { role: 'user', content: 'Who is the king of Eldoria?' },
    { role: 'assistant', content: 'The current king of Eldoria is King Eldor. He rules from Eldoria Castle and is a member of the Order of the Flame.\n\nWould you like a follow up on how he became king?' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [isProcessingChat, setIsProcessingChat] = useState(false)
  const chatMessagesEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedDescription, setEditedDescription] = useState('')
  const [showNewNodeModal, setShowNewNodeModal] = useState(false)
  const [newNodeName, setNewNodeName] = useState('')
  const [newNodeDescription, setNewNodeDescription] = useState('')
  
  // Relationship modal state
  const [showRelationshipModal, setShowRelationshipModal] = useState(false)
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null)
  const [relationshipLabel, setRelationshipLabel] = useState('')
  
  // Edge editing state
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null)
  const [editingEdgeLabel, setEditingEdgeLabel] = useState('')
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    nodeId: string | null
  }>({ visible: false, x: 0, y: 0, nodeId: null })
  
  // Edit modals state
  const [showEditNameModal, setShowEditNameModal] = useState(false)
  const [editingName, setEditingName] = useState('')
  const [showEditColorModal, setShowEditColorModal] = useState(false)
  
  // API state
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  
  // Track connection state
  const [connectionStart, setConnectionStart] = useState<{ nodeId: string; handleId: string | null } | null>(null)
  const [pendingNewNodeFromConnection, setPendingNewNodeFromConnection] = useState<{
    sourceNodeId: string
    sourceHandleId: string | null
    position: { x: number; y: number }
  } | null>(null)
  
  // Track position for new node created by dragging from a handle
  const [draggedNodePosition, setDraggedNodePosition] = useState<{ x: number; y: number } | null>(null)

  // Sidebar resize state
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(256) // w-64 = 256px
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320) // w-80 = 320px
  const [isResizingLeft, setIsResizingLeft] = useState(false)
  const [isResizingRight, setIsResizingRight] = useState(false)

  // Resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = e.clientX
        if (newWidth >= 200 && newWidth <= 600) {
          setLeftSidebarWidth(newWidth)
        }
      } else if (isResizingRight) {
        const newWidth = window.innerWidth - e.clientX
        if (newWidth >= 200 && newWidth <= 600) {
          setRightSidebarWidth(newWidth)
        }
      }
    }

    const handleMouseUp = () => {
      setIsResizingLeft(false)
      setIsResizingRight(false)
    }

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizingLeft, isResizingRight])

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  
  // ReactFlow instance ref for coordinate conversion
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null)

  // Helper function to calculate optimal handle positions
  const calculateOptimalHandles = useCallback((sourceNode: Node<CharacterNodeData>, targetNode: Node<CharacterNodeData>) => {
    const dx = targetNode.position.x - sourceNode.position.x
    const dy = targetNode.position.y - sourceNode.position.y
    
    let sourceHandle: string
    let targetHandle: string
    
    // Determine source handle based on direction to target
    if (Math.abs(dx) > Math.abs(dy)) {
      sourceHandle = dx > 0 ? 'source-right' : 'source-left'
    } else {
      sourceHandle = dy > 0 ? 'source-bottom' : 'source-top'
    }
    
    // Determine target handle based on direction from source
    if (Math.abs(dx) > Math.abs(dy)) {
      targetHandle = dx > 0 ? 'target-left' : 'target-right'
    } else {
      targetHandle = dy > 0 ? 'target-top' : 'target-bottom'
    }
    
    return { sourceHandle, targetHandle }
  }, [])

  const loadDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (err) {
      console.error('Failed to load documents:', err)
    }
  }, [])

  const loadFileContent = useCallback(async (filePath: string, fileName: string) => {
    try {
      setLoadingFile(true)
      const response = await fetch(`/api/documents?path=${encodeURIComponent(filePath)}`)
      if (response.ok) {
        const data = await response.json()
        setOpenFile({ path: filePath, name: fileName, content: data.content })
      } else {
        setError('Failed to load file')
      }
    } catch (err) {
      console.error('Failed to load file:', err)
      setError('Failed to load file')
    } finally {
      setLoadingFile(false)
    }
  }, [])

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      const projectsList = await getProjects()
      setProjects(projectsList)
      
      // Auto-select first project if available
      if (projectsList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projectsList[0].id)
      }
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to load projects')
      // If unauthorized, redirect to login
      if (apiError.status === 401) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }, [router, selectedProjectId, setProjects, setSelectedProjectId])

  const loadCharactersAndRelationships = useCallback(async () => {
    if (!selectedProjectId) return

    try {
      setLoading(true)
      setError(null)
      
      const [characters, relationships] = await Promise.all([
        getCharacters(selectedProjectId),
        getRelationships(selectedProjectId),
      ])

      // Convert API characters to ReactFlow nodes
      const flowNodes: Node<CharacterNodeData>[] = characters.map((char) => ({
        id: `char-${char.id}`,
        type: 'character',
        position: char.position || { x: Math.random() * 400 + 200, y: Math.random() * 400 + 100 },
        data: {
          name: char.name,
          description: char.description || '',
          bgColor: char.colors?.bg || 'bg-blue-100',
          borderColor: char.colors?.border || 'border-blue-200',
          textColor: char.colors?.text || 'text-gray-dark',
          iconColor: char.colors?.icon || 'text-blue-600',
          characterId: char.id,
        },
      }))

      // Convert API relationships to ReactFlow edges
      const flowEdges: Edge[] = relationships.map((rel) => {
        const sourceNode = flowNodes.find(n => n.id === `char-${rel.source_character_id}`)
        const targetNode = flowNodes.find(n => n.id === `char-${rel.target_character_id}`)
        
        // Calculate optimal handle positions based on node positions
        let sourceHandle: string | undefined
        let targetHandle: string | undefined
        
        if (sourceNode && targetNode) {
          const { sourceHandle: calculatedSource, targetHandle: calculatedTarget } = calculateOptimalHandles(sourceNode, targetNode)
          sourceHandle = calculatedSource
          targetHandle = calculatedTarget
        }
        
        return {
          id: `rel-${rel.id}`,
          source: `char-${rel.source_character_id}`,
          target: `char-${rel.target_character_id}`,
          sourceHandle,
          targetHandle,
          label: rel.label || 'connected to',
          type: 'smoothstep',
          pathOptions: {
            borderRadius: 20,
          },
          style: { stroke: '#5B21B6', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#5B21B6',
          },
          labelStyle: { fill: '#5B21B6', fontWeight: 500, fontSize: 12 },
          labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
          data: { relationshipId: rel.id },
        }
      })

      setNodes(flowNodes)
      setEdges(flowEdges)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to load data')
      if (apiError.status === 401) {
        router.push('/login')
      }
    } finally {
      setLoading(false)
    }
  }, [selectedProjectId, router, setNodes, setEdges, calculateOptimalHandles])

  // Load projects and documents on mount
  useEffect(() => {
    loadProjects()
    loadDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadProjects])

  // Load characters and relationships when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      loadCharactersAndRelationships()
    }
  }, [selectedProjectId, loadCharactersAndRelationships])

  const handleCreateProject = async () => {
    const projectName = prompt('Enter project name:')
    if (!projectName) return

    try {
      setSaving(true)
      const newProject = await createProject(projectName)
      setProjects([...projects, newProject])
      setSelectedProjectId(newProject.id)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Function to save document order
  const saveDocumentOrder = useCallback(async (newDocuments: DocumentItem[]) => {
    try {
      // Build order object from the current document structure
      const buildOrder = (items: DocumentItem[], parentPath: string = '.'): Record<string, string[]> => {
        const order: Record<string, string[]> = {}
        const childPaths = items.map(item => item.path)
        if (childPaths.length > 0) {
          order[parentPath] = childPaths
        }
        
        // Recursively build order for children
        items.forEach(item => {
          if (item.type === 'directory' && item.children) {
            Object.assign(order, buildOrder(item.children, item.path))
          }
        })
        
        return order
      }
      
      const order = buildOrder(newDocuments)
      
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      })
      
      if (!response.ok) {
        console.error('Failed to save document order')
      }
    } catch (error) {
      console.error('Error saving document order:', error)
    }
  }, [])

  // Recursive component to render document tree with drag-and-drop
  const DocumentTreeItem = ({ item, expandedSections, toggleSection, level, parentItems, onReorder, onFileClick }: { 
    item: DocumentItem
    expandedSections: Record<string, boolean>
    toggleSection: (section: string) => void
    level: number
    parentItems: DocumentItem[]
    onReorder: (newItems: DocumentItem[]) => void
    onFileClick: (path: string, name: string) => void
  }) => {
    const sectionKey = item.path.replace(/\//g, '-').replace(/\s+/g, '-').toLowerCase()
    const isExpanded = expandedSections[sectionKey] ?? false
    const [isDragging, setIsDragging] = useState(false)
    const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null)
    
    const handleDragStart = (e: React.DragEvent) => {
      setIsDragging(true)
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', item.path)
    }
    
    const handleDragEnd = () => {
      setIsDragging(false)
      setDropPosition(null)
    }
    
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      
      const draggedPath = e.dataTransfer.getData('text/plain')
      if (draggedPath === item.path) {
        setDropPosition(null)
        return
      }
      
      // Determine if drop should be above or below based on mouse position
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const mouseY = e.clientY
      const elementMiddle = rect.top + rect.height / 2
      
      const position = mouseY < elementMiddle ? 'above' : 'below'
      setDropPosition(position)
      // Store in dataTransfer for use in handleDrop
      e.dataTransfer.setData('drop-position', position)
    }
    
    const handleDragLeave = () => {
      setDropPosition(null)
    }
    
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const draggedPath = e.dataTransfer.getData('text/plain')
      const savedDropPosition = e.dataTransfer.getData('drop-position') as 'above' | 'below' | ''
      const finalDropPosition = savedDropPosition || dropPosition
      setDropPosition(null)
      
      if (draggedPath === item.path) return // Can't drop on itself
      
      if (!draggedPath) return
      
      // Find and remove the dragged item from parentItems
      const findItem = (items: DocumentItem[], path: string): DocumentItem | null => {
        for (const it of items) {
          if (it.path === path) return it
          if (it.children) {
            const found = findItem(it.children, path)
            if (found) return found
          }
        }
        return null
      }
      
      const removeItem = (items: DocumentItem[], path: string): DocumentItem[] => {
        return items.filter(it => {
          if (it.path === path) return false
          if (it.children) {
            it.children = removeItem(it.children, path)
          }
          return true
        })
      }
      
      const draggedItem = findItem(parentItems, draggedPath)
      if (!draggedItem) return
      
      // Remove dragged item from its current position
      const itemsWithoutDragged = removeItem([...parentItems], draggedPath)
      
      // Find the index of the current item
      const currentIndex = itemsWithoutDragged.findIndex(it => it.path === item.path)
      if (currentIndex === -1) return
      
      // Determine insertion position based on drop position
      const insertIndex = finalDropPosition === 'above' ? currentIndex : currentIndex + 1
      
      // Insert the dragged item at the new position
      const newItems = [...itemsWithoutDragged]
      newItems.splice(insertIndex, 0, draggedItem)
      
      onReorder(newItems)
    }
    
    if (item.type === 'directory') {
      return (
        <div className="relative">
          {/* Drop indicator line above */}
          {dropPosition === 'above' && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary z-10" />
          )}
          <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative ${isDragging ? 'opacity-50' : ''}`}
          >
            <div className="flex items-center">
              <div 
                className="flex items-center space-x-2 min-w-0 flex-1 p-2 hover:bg-gray-light rounded text-sm text-gray-dark cursor-move"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="truncate text-left">{item.name}</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  toggleSection(sectionKey)
                }}
                onDragStart={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                draggable={false}
                className="p-2 hover:bg-gray-light rounded text-sm text-gray-dark flex-shrink-0"
              >
                <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            {isExpanded && item.children && item.children.length > 0 && (
              <div className="ml-6 mt-1 space-y-1">
                {item.children.map((child) => (
                  <DocumentTreeItem
                    key={child.path}
                    item={child}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                    level={level + 1}
                    parentItems={item.children || []}
                    onReorder={(newChildren) => {
                      const updatedItem = { ...item, children: newChildren }
                      const updatedParent = parentItems.map(it => 
                        it.path === item.path ? updatedItem : it
                      )
                      onReorder(updatedParent)
                    }}
                    onFileClick={onFileClick}
                  />
                ))}
              </div>
            )}
          </div>
          {/* Drop indicator line below */}
          {dropPosition === 'below' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-10" />
          )}
        </div>
      )
    } else {
      // File item
      return (
        <div className="relative">
          {/* Drop indicator line above */}
          {dropPosition === 'above' && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary z-10" />
          )}
          <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative p-2 text-sm text-gray hover:text-gray-dark cursor-pointer truncate text-left ${isDragging ? 'opacity-50' : ''}`}
            onClick={() => {
              onFileClick(item.path, item.name)
            }}
          >
            <span>{item.name}</span>
          </div>
          {/* Drop indicator line below */}
          {dropPosition === 'below' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary z-10" />
          )}
        </div>
      )
    }
  }
  const renderDescriptionWithLinks = (description: string) => {
    if (!description) return null

    // Get all character names, sorted by length (longest first) to match full names before partial matches
    const characterNames = nodes
      .filter(node => node.id !== selectedNodeId) // Exclude current node
      .map(node => node.data.name)
      .sort((a, b) => b.length - a.length)

    if (characterNames.length === 0) {
      return <p className="text-sm text-gray leading-relaxed whitespace-pre-line">{description}</p>
    }

    // Split by line breaks first, then process each line
    const lines = description.split('\n')
    let globalKeyIndex = 0

    return (
      <p className="text-sm text-gray leading-relaxed">
        {lines.map((line, lineIndex) => {
          // Create a regex pattern that matches character names
          const namePattern = new RegExp(
            `(${characterNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
            'gi'
          )

          const parts: (string | JSX.Element)[] = []
          let lastIndex = 0
          let match: RegExpExecArray | null

          // Reset regex lastIndex
          namePattern.lastIndex = 0

          while ((match = namePattern.exec(line)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
              parts.push(line.substring(lastIndex, match.index))
            }

            // Find the matching node
            const matchedName = match[0]
            const matchedNode = nodes.find(node => 
              node.data.name.toLowerCase() === matchedName.toLowerCase()
            )

            if (matchedNode && matchedNode.id !== selectedNodeId) {
              // Create clickable link for the character name
              parts.push(
                <button
                  key={`link-${globalKeyIndex++}-${lineIndex}-${match.index}`}
                  onClick={() => {
                    setSelectedNodeId(matchedNode.id)
                    setIsEditingDescription(false)
                  }}
                  className="text-primary font-medium hover:underline cursor-pointer"
                >
                  {matchedName}
                </button>
              )
            } else {
              // Just add the text if not found
              parts.push(matchedName)
            }

            lastIndex = match.index + match[0].length
          }

          // Add remaining text
          if (lastIndex < line.length) {
            parts.push(line.substring(lastIndex))
          }

          // If no matches, return the original line
          if (parts.length === 0) {
            parts.push(line)
          }

          return (
            <span key={`line-${lineIndex}`}>
              {parts}
              {lineIndex < lines.length - 1 && <br />}
            </span>
          )
        })}
      </p>
    )
  }

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node<CharacterNodeData>) => {
    setSelectedNodeId(node.id)
    setIsEditingDescription(false)
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: null })
  }, [])

  const onNodeMouseEnter = useCallback((_event: React.MouseEvent, node: Node<CharacterNodeData>) => {
    setHoveredNodeId(node.id)
  }, [])

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null)
  }, [])

  const onEdgeMouseEnter = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setHoveredEdgeId(edge.id)
  }, [])

  const onEdgeMouseLeave = useCallback(() => {
    setHoveredEdgeId(null)
  }, [])

  // Recalculate edge handles when nodes move
  const recalculateEdgeHandles = useCallback((movedNodeId: string, currentNodes: Node<CharacterNodeData>[]) => {
    const movedNode = currentNodes.find(n => n.id === movedNodeId)
    if (!movedNode) return

    // Recalculate handles for all connected edges
    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        if (edge.source === movedNodeId || edge.target === movedNodeId) {
          const sourceNode = currentNodes.find(n => n.id === edge.source)
          const targetNode = currentNodes.find(n => n.id === edge.target)
          
          if (sourceNode && targetNode) {
            const { sourceHandle, targetHandle } = calculateOptimalHandles(sourceNode, targetNode)
            return {
              ...edge,
              sourceHandle,
              targetHandle,
            }
          }
        }
        return edge
      })
    )
  }, [calculateOptimalHandles, setEdges])

  const onNodeDragStop = useCallback(async (_event: React.MouseEvent, node: Node<CharacterNodeData>) => {
    if (!selectedProjectId || !node.data.characterId) return

    try {
      // Save position to database
      await updateCharacter(selectedProjectId, node.data.characterId, {
        position: { x: node.position.x, y: node.position.y },
      })

      // Recalculate edge handles for all edges connected to this node
      // Use functional update to get the latest nodes state
      setNodes((currentNodes) => {
        recalculateEdgeHandles(node.id, currentNodes)
        return currentNodes // Return unchanged since ReactFlow already updated positions
      })
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to save node position')
    }
  }, [selectedProjectId, recalculateEdgeHandles, setNodes])

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node<CharacterNodeData>) => {
    event.preventDefault()
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: node.id,
    })
    setSelectedNodeId(node.id)
  }, [])

  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, nodeId: null })
  }, [])

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        closeContextMenu()
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [contextMenu.visible, closeContextMenu])

  const handleAddNode = useCallback(async () => {
    if (!newNodeName.trim() || !selectedProjectId) return
    
    try {
      setSaving(true)
      
      // Use draggedNodePosition if available, otherwise use random position
      const position = draggedNodePosition || { x: Math.random() * 400 + 200, y: Math.random() * 400 + 100 }
      
      const newCharacter = await createCharacter(selectedProjectId, {
        name: newNodeName.trim(),
        description: newNodeDescription.trim() || '',
        position: position,
        colors: {
          bg: 'bg-blue-100',
          border: 'border-blue-200',
          text: 'text-gray-dark',
          icon: 'text-blue-600',
        },
      })
    
    const newNode: Node<CharacterNodeData> = {
        id: `char-${newCharacter.id}`,
      type: 'character',
        position: newCharacter.position || position,
      data: {
          name: newCharacter.name,
          description: newCharacter.description || '',
          bgColor: newCharacter.colors?.bg || 'bg-blue-100',
          borderColor: newCharacter.colors?.border || 'border-blue-200',
          textColor: newCharacter.colors?.text || 'text-gray-dark',
          iconColor: newCharacter.colors?.icon || 'text-blue-600',
          characterId: newCharacter.id,
      },
    }
    
    setNodes((nds) => [...nds, newNode])
    setSelectedNodeId(newNode.id)
    setNewNodeName('')
    setNewNodeDescription('')
    setShowNewNodeModal(false)
    setDraggedNodePosition(null) // Clear dragged position after creating node
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to create character')
    } finally {
      setSaving(false)
    }
  }, [newNodeName, newNodeDescription, selectedProjectId, setNodes, setSelectedNodeId, draggedNodePosition])

  const handleDeleteNode = useCallback(async (nodeId: string) => {
    if (!selectedProjectId) return

    const node = nodes.find(n => n.id === nodeId)
    if (!node || !node.data.characterId) return

    if (!confirm(`Are you sure you want to delete "${node.data.name}"? This will also remove all connections to this entity.`)) {
      return
    }

    try {
      setSaving(true)
      await deleteCharacter(selectedProjectId, node.data.characterId)
      
    // Remove the node
      setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    
    // Remove all edges connected to this node
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    
    // Clear selection if this node was selected
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null)
      setIsEditingDescription(false)
    }
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to delete character')
    } finally {
      setSaving(false)
    }
  }, [selectedProjectId, nodes, selectedNodeId, setNodes, setEdges])

  // Handle Delete key to delete selected node
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle both Delete and Backspace keys
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedNodeId) {
        // Don't trigger if user is typing in an input, textarea, or contenteditable element
        const target = event.target as HTMLElement
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('input') ||
          target.closest('textarea')
        ) {
        return
      }
        
        // Don't trigger if a modal is open
        if (showNewNodeModal || showRelationshipModal || editingEdgeId || showEditNameModal || showEditColorModal) {
          return
        }
        
        // Prevent default behavior and delete the node
        event.preventDefault()
        event.stopPropagation()
        handleDeleteNode(selectedNodeId)
      }
    }

    // Use capture phase to catch events before ReactFlow handles them
    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [selectedNodeId, handleDeleteNode, showNewNodeModal, showRelationshipModal, editingEdgeId, showEditNameModal, showEditColorModal])

  const onConnect = useCallback((params: Connection) => {
    console.log('✅ onConnect called:', params)
    if (!params.source || !params.target || !selectedProjectId) {
      console.log('❌ Connection rejected: missing source, target, or project', { source: params.source, target: params.target, selectedProjectId })
        return
      }

    // Extract character IDs from node IDs
    const sourceNode = nodes.find(n => n.id === params.source)
    const targetNode = nodes.find(n => n.id === params.target)
    
    console.log('Source node:', sourceNode, 'Target node:', targetNode)
    
    if (!sourceNode?.data.characterId || !targetNode?.data.characterId) {
      console.log('❌ Connection rejected: missing character IDs', { sourceNode, targetNode })
      return
    }

    // Fix handle IDs if they're incorrect (e.g., sourceHandle is 'target-right' instead of 'source-right')
    let sourceHandle = params.sourceHandle
    let targetHandle = params.targetHandle
    
    // If sourceHandle starts with 'target-', it's wrong - calculate optimal handles instead
    if (sourceHandle && sourceHandle.startsWith('target-')) {
      console.log('⚠️ Invalid sourceHandle detected:', sourceHandle, '- calculating optimal handles')
      const { sourceHandle: calculatedSource, targetHandle: calculatedTarget } = calculateOptimalHandles(sourceNode, targetNode)
      sourceHandle = calculatedSource
      targetHandle = calculatedTarget
    } else if (!sourceHandle || !targetHandle) {
      // If handles are missing, calculate optimal positions
      const { sourceHandle: calculatedSource, targetHandle: calculatedTarget } = calculateOptimalHandles(sourceNode, targetNode)
      sourceHandle = calculatedSource
      targetHandle = calculatedTarget
    }

    console.log('✅ All checks passed, showing modal with handles:', { sourceHandle, targetHandle })
    // Store the pending connection with corrected handles
    setPendingConnection({
      ...params,
      sourceHandle,
      targetHandle,
    })
    setRelationshipLabel('')
    setShowRelationshipModal(true)
  }, [selectedProjectId, nodes, calculateOptimalHandles])

  const handleCreateRelationship = useCallback(async () => {
    if (!pendingConnection || !selectedProjectId) return

    const sourceNode = nodes.find(n => n.id === pendingConnection.source)
    const targetNode = nodes.find(n => n.id === pendingConnection.target)
    
    if (!sourceNode?.data.characterId || !targetNode?.data.characterId) return

    try {
      setSaving(true)
      
      const newRelationship = await createRelationship(selectedProjectId, {
        source_character_id: sourceNode.data.characterId,
        target_character_id: targetNode.data.characterId,
        label: relationshipLabel.trim() || 'connected to',
      })

      // Determine the best handle positions based on node positions
      let sourceHandle = pendingConnection.sourceHandle
      let targetHandle = pendingConnection.targetHandle
      
      // If handles weren't specified, calculate optimal positions
      if (sourceNode && targetNode && !sourceHandle && !targetHandle) {
        const { sourceHandle: calculatedSource, targetHandle: calculatedTarget } = calculateOptimalHandles(sourceNode, targetNode)
        sourceHandle = calculatedSource
        targetHandle = calculatedTarget
      }

      const newEdge: Edge = {
        id: `rel-${newRelationship.id}`,
        source: pendingConnection.source!,
        target: pendingConnection.target!,
        sourceHandle: sourceHandle || undefined,
        targetHandle: targetHandle || undefined,
      type: 'smoothstep',
        pathOptions: {
          borderRadius: 20,
        },
        label: newRelationship.label || 'connected to',
      style: { stroke: '#5B21B6', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#5B21B6',
      },
      labelStyle: { fill: '#5B21B6', fontWeight: 500, fontSize: 12 },
      labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
        data: { relationshipId: newRelationship.id },
      }
      
      setEdges((eds) => addEdge(newEdge, eds))
      setShowRelationshipModal(false)
      setPendingConnection(null)
      setRelationshipLabel('')
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to create relationship')
    } finally {
      setSaving(false)
    }
  }, [pendingConnection, selectedProjectId, nodes, relationshipLabel, setEdges, calculateOptimalHandles])

  const onEdgeDoubleClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    setEditingEdgeId(edge.id)
    setEditingEdgeLabel(edge.label as string || '')
  }, [])

  const handleUpdateEdgeLabel = useCallback(async () => {
    if (!editingEdgeId || !selectedProjectId) return

    const edge = edges.find(e => e.id === editingEdgeId)
    if (!edge || !edge.data?.relationshipId) return

    try {
      setSaving(true)
      await updateRelationship(selectedProjectId, edge.data.relationshipId, {
        label: editingEdgeLabel.trim() || 'connected to',
      })

      // Update the edge in state
      setEdges((eds) =>
        eds.map((e) =>
          e.id === editingEdgeId
            ? {
                ...e,
                label: editingEdgeLabel.trim() || 'connected to',
              }
            : e
        )
      )
      setEditingEdgeId(null)
      setEditingEdgeLabel('')
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to update relationship')
    } finally {
      setSaving(false)
    }
  }, [editingEdgeId, editingEdgeLabel, selectedProjectId, edges, setEdges])

  const handleUpdateCharacterDescription = async () => {
    if (!selectedNodeId || !selectedProjectId) return

    const node = nodes.find(n => n.id === selectedNodeId)
    if (!node || !node.data.characterId) return

    try {
      setSaving(true)
      await updateCharacter(selectedProjectId, node.data.characterId, {
        description: editedDescription,
      })

      // Update the node in state
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  description: editedDescription,
                },
              }
            : n
        )
      )
      setIsEditingDescription(false)
      closeContextMenu()
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to update character')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCharacterName = async () => {
    if (!selectedNodeId || !selectedProjectId || !editingName.trim()) return

    const node = nodes.find(n => n.id === selectedNodeId)
    if (!node || !node.data.characterId) return

    try {
      setSaving(true)
      await updateCharacter(selectedProjectId, node.data.characterId, {
        name: editingName.trim(),
      })

      // Update the node in state
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  name: editingName.trim(),
                },
              }
            : n
        )
      )
      setShowEditNameModal(false)
      setEditingName('')
      closeContextMenu()
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to update character name')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCharacterColor = async (colorPreset: {
    bg: string
    border: string
    text: string
    icon: string
  }) => {
    if (!selectedNodeId || !selectedProjectId) return

    const node = nodes.find(n => n.id === selectedNodeId)
    if (!node || !node.data.characterId) return

    try {
      setSaving(true)
      await updateCharacter(selectedProjectId, node.data.characterId, {
        colors: colorPreset,
      })

      // Update the node in state
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  bgColor: colorPreset.bg,
                  borderColor: colorPreset.border,
                  textColor: colorPreset.text,
                  iconColor: colorPreset.icon,
                },
              }
            : n
        )
      )
      setShowEditColorModal(false)
      closeContextMenu()
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message || 'Failed to update character color')
    } finally {
      setSaving(false)
    }
  }

  const handleSendChatMessage = useCallback(async () => {
    if (!chatInput.trim() || !selectedProjectId || isProcessingChat) return

    const userMessage = chatInput.trim()
    setChatInput('')
    
    // Reset textarea height
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto'
    }
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsProcessingChat(true)

    try {
      // Call the parse-entities API
      const response = await fetch('/api/parse-entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userMessage }),
      })

      if (!response.ok) {
        throw new Error('Failed to parse entities')
      }

      const data = await response.json()
      const { entities, relationships } = data

      // Create nodes for new entities
      const createdNodes: Node<CharacterNodeData>[] = []
      for (const entity of entities) {
        // Check if node already exists
        const existingNode = nodes.find(n => 
          n.data.name.toLowerCase() === entity.name.toLowerCase()
        )
        
        if (!existingNode) {
          try {
            const position = { x: Math.random() * 400 + 200, y: Math.random() * 400 + 100 }
            const newCharacter = await createCharacter(selectedProjectId, {
              name: entity.name,
              description: entity.description || '',
              position,
              colors: {
                bg: 'bg-blue-100',
                border: 'border-blue-200',
                text: 'text-gray-dark',
                icon: 'text-blue-600',
              },
            })
    
    const newNode: Node<CharacterNodeData> = {
              id: `char-${newCharacter.id}`,
      type: 'character',
              position: newCharacter.position || position,
      data: {
                name: newCharacter.name,
                description: newCharacter.description || '',
                bgColor: newCharacter.colors?.bg || 'bg-blue-100',
                borderColor: newCharacter.colors?.border || 'border-blue-200',
                textColor: newCharacter.colors?.text || 'text-gray-dark',
                iconColor: newCharacter.colors?.icon || 'text-blue-600',
                characterId: newCharacter.id,
              },
            }
            
            createdNodes.push(newNode)
    setNodes((nds) => [...nds, newNode])
          } catch (err) {
            console.error('Failed to create entity:', err)
          }
        } else {
          // Update existing node description if new information is provided
          if (entity.description && entity.description.trim()) {
            const updatedDescription = existingNode.data.description 
              ? `${existingNode.data.description}\n\n${entity.description}`
              : entity.description
            
            try {
              await updateCharacter(selectedProjectId, existingNode.data.characterId!, {
                description: updatedDescription,
              })
              
              setNodes((nds) =>
                nds.map((n) =>
                  n.id === existingNode.id
                    ? {
                        ...n,
                        data: {
                          ...n.data,
                          description: updatedDescription,
                        },
                      }
                    : n
                )
              )
            } catch (err) {
              console.error('Failed to update entity:', err)
            }
          }
        }
      }

      // Create relationships
      // First, collect all entity names mentioned in relationships
      const relationshipEntityNames = new Set<string>()
      relationships.forEach((rel: { source: string; target: string; label: string }) => {
        relationshipEntityNames.add(rel.source)
        relationshipEntityNames.add(rel.target)
      })

      // Create missing entities that are only mentioned in relationships
      for (const entityName of Array.from(relationshipEntityNames)) {
        const existsInEntities = entities.some((e: { name: string; description: string }) => e.name.toLowerCase() === entityName.toLowerCase())
        const existsInNodes = nodes.some(n => n.data.name.toLowerCase() === entityName.toLowerCase())
        const existsInCreated = createdNodes.some(n => n.data.name.toLowerCase() === entityName.toLowerCase())
        
        if (!existsInEntities && !existsInNodes && !existsInCreated) {
          // Create a minimal entity for this relationship reference
          try {
            const position = { x: Math.random() * 400 + 200, y: Math.random() * 400 + 100 }
            const newCharacter = await createCharacter(selectedProjectId, {
              name: entityName,
              description: '',
              position,
              colors: {
                bg: 'bg-blue-100',
                border: 'border-blue-200',
                text: 'text-gray-dark',
                icon: 'text-blue-600',
              },
            })

            const newNode: Node<CharacterNodeData> = {
              id: `char-${newCharacter.id}`,
              type: 'character',
              position: newCharacter.position || position,
              data: {
                name: newCharacter.name,
                description: newCharacter.description || '',
                bgColor: newCharacter.colors?.bg || 'bg-blue-100',
                borderColor: newCharacter.colors?.border || 'border-blue-200',
                textColor: newCharacter.colors?.text || 'text-gray-dark',
                iconColor: newCharacter.colors?.icon || 'text-blue-600',
                characterId: newCharacter.id,
              },
            }
            
            createdNodes.push(newNode)
            setNodes((nds) => [...nds, newNode])
          } catch (err) {
            console.error('Failed to create entity for relationship:', err)
          }
        }
      }

      // Now create relationships with all nodes available
      for (const rel of relationships) {
        // Find source and target nodes (check all possible locations)
        const allNodes = [...nodes, ...createdNodes]
        const sourceNode = allNodes.find(n => 
          n.data.name.toLowerCase() === rel.source.toLowerCase()
        )
        
        const targetNode = allNodes.find(n => 
          n.data.name.toLowerCase() === rel.target.toLowerCase()
        )

        if (sourceNode && targetNode && sourceNode.data.characterId && targetNode.data.characterId) {
          // Check if relationship already exists
          const existingEdge = edges.find(
            e => e.source === sourceNode.id && e.target === targetNode.id
          )

          if (!existingEdge) {
            try {
              const newRelationship = await createRelationship(selectedProjectId, {
                source_character_id: sourceNode.data.characterId,
                target_character_id: targetNode.data.characterId,
                label: rel.label || 'connected to',
              })

              const { sourceHandle, targetHandle } = calculateOptimalHandles(sourceNode, targetNode)

      const newEdge: Edge = {
                id: `rel-${newRelationship.id}`,
                source: sourceNode.id,
                target: targetNode.id,
                sourceHandle,
                targetHandle,
        type: 'smoothstep',
                pathOptions: {
                  borderRadius: 20,
                },
                label: newRelationship.label || 'connected to',
        style: { stroke: '#5B21B6', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#5B21B6',
        },
        labelStyle: { fill: '#5B21B6', fontWeight: 500, fontSize: 12 },
        labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
                data: { relationshipId: newRelationship.id },
      }
              
      setEdges((eds) => addEdge(newEdge, eds))
            } catch (err) {
              console.error('Failed to create relationship:', err)
            }
          }
        }
      }

      // Collect all created node IDs (from entities and relationship references)
      // All newly created nodes are in createdNodes array
      const createdNodeIds: string[] = createdNodes
        .map(node => node.id)
        .filter((id): id is string => !!id)

      // Generate AI response
      const entityNames = entities.map((e: { name: string; description: string }) => e.name).join(', ')
      const relationshipCount = relationships.length
      let aiResponse = ''
      
      if (entities.length > 0 && relationshipCount > 0) {
        aiResponse = `I've added ${entities.length} ${entities.length === 1 ? 'entity' : 'entities'} (${entityNames}) and ${relationshipCount} ${relationshipCount === 1 ? 'relationship' : 'relationships'} to your world.`
      } else if (entities.length > 0) {
        aiResponse = `I've added ${entities.length} ${entities.length === 1 ? 'entity' : 'entities'} (${entityNames}) to your world.`
      } else if (relationshipCount > 0) {
        aiResponse = `I've added ${relationshipCount} ${relationshipCount === 1 ? 'relationship' : 'relationships'} to your world.`
      } else {
        aiResponse = 'I couldn\'t extract any entities or relationships from that message. Could you provide more details?'
      }

      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: aiResponse,
        references: createdNodeIds.length > 0 ? createdNodeIds : undefined
      }])
    } catch (err) {
      console.error('Error processing chat message:', err)
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error processing your message. Please try again.' 
      }])
    } finally {
      setIsProcessingChat(false)
    }
  }, [chatInput, selectedProjectId, isProcessingChat, nodes, edges, setNodes, setEdges, calculateOptimalHandles])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isProcessingChat])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = chatInputRef.current
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto'
      // Calculate the new height (min 2 rows, max ~6 rows which is ~120px)
      const maxHeight = 120 // ~6 rows
      const newHeight = Math.min(textarea.scrollHeight, maxHeight)
      textarea.style.height = `${newHeight}px`
      // Enable scrolling if content exceeds max height
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
    }
  }, [chatInput])

  // Preset color schemes
  const colorPresets = [
    {
      name: 'Blue',
      bg: 'bg-blue-100',
      border: 'border-blue-200',
      text: 'text-gray-dark',
      icon: 'text-blue-600',
    },
    {
      name: 'Purple',
      bg: 'bg-purple-100',
      border: 'border-purple-200',
      text: 'text-gray-dark',
      icon: 'text-purple-600',
    },
    {
      name: 'Pink',
      bg: 'bg-pink-100',
      border: 'border-primary',
      text: 'text-gray-dark',
      icon: 'text-primary',
    },
    {
      name: 'Green',
      bg: 'bg-green-100',
      border: 'border-green-200',
      text: 'text-gray-dark',
      icon: 'text-green-600',
    },
    {
      name: 'Yellow',
      bg: 'bg-yellow-100',
      border: 'border-yellow-200',
      text: 'text-gray-dark',
      icon: 'text-yellow-600',
    },
    {
      name: 'Red',
      bg: 'bg-red-100',
      border: 'border-red-200',
      text: 'text-gray-dark',
      icon: 'text-red-600',
    },
    {
      name: 'Indigo',
      bg: 'bg-indigo-100',
      border: 'border-indigo-200',
      text: 'text-gray-dark',
      icon: 'text-indigo-600',
    },
    {
      name: 'Teal',
      bg: 'bg-teal-100',
      border: 'border-teal-200',
      text: 'text-gray-dark',
      icon: 'text-teal-600',
    },
  ]

  const selectedProject = projects.find(p => p.id === selectedProjectId)

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l-2 18 2-2 2 2-2-18z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v18" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7l3 3 3-3" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l3 3 3-3" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20l-1.5-1.5h3L12 20z" />
            </svg>
            <span className="text-xl font-semibold text-gray-dark">
              WorldBuilder<span className="text-primary"></span>
            </span>
          </div>
          
          {/* Project Selector */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading || saving}
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleCreateProject}
              disabled={loading || saving}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              + New Project
            </button>
          </div>
          
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-2 text-sm text-gray">
            <span>World Overview</span>
            <span>/</span>
            <span>Characters</span>
            {selectedNodeId && (
              <>
            <span>/</span>
                <span className="text-gray-dark font-medium">
                  {nodes.find(n => n.id === selectedNodeId)?.data.name || 'Character'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Header Icons */}
        <div className="flex items-center space-x-4">
          {error && (
            <div className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
              <button onClick={() => setError(null)} className="ml-2">×</button>
            </div>
          )}
          {loading && (
            <div className="text-sm text-gray">Loading...</div>
          )}
          {saving && (
            <div className="text-sm text-gray">Saving...</div>
          )}
          <button className="p-2 hover:bg-gray-light rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-light rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-light rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-light rounded-lg transition-colors">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
              U
            </div>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside 
          className="bg-white border-r border-gray-200 flex flex-col overflow-y-auto relative"
          style={{ width: `${leftSidebarWidth}px`, minWidth: '200px', maxWidth: '600px' }}
        >
          {/* Resize Handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary hover:opacity-50 transition-colors z-10"
            onMouseDown={(e) => {
              e.preventDefault()
              setIsResizingLeft(true)
            }}
          />
          {/* Project Selector */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                {selectedProject?.name?.[0]?.toUpperCase() || 'E'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-dark truncate text-left">{selectedProject?.name || 'No Project'}</div>
                <div className="text-sm text-gray truncate text-left">
                  {selectedProject?.description || 'Select a project'}
                </div>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-dark">Documents</h3>
              <button className="p-1 hover:bg-gray-light rounded">
                <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-1">
              {documents.map((item) => (
                <DocumentTreeItem
                  key={item.path}
                  item={item}
                  expandedSections={expandedSections}
                  toggleSection={toggleSection}
                  level={0}
                  parentItems={documents}
                  onReorder={(newItems) => {
                    setDocuments(newItems)
                    saveDocumentOrder(newItems)
                  }}
                  onFileClick={loadFileContent}
                />
              ))}
                  </div>
              </div>

          {/* Documents Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-dark">Entities</h3>
              <button 
                onClick={() => setShowNewNodeModal(true)}
                className="p-1 hover:bg-gray-light rounded text-primary"
                title="Add new entity"
                disabled={!selectedProjectId || saving}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-1">
              <button 
                onClick={() => toggleSection('entities')}
                className="w-full flex items-center justify-between p-2 hover:bg-gray-light rounded text-sm text-gray-dark"
              >
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="truncate text-left">Characters</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray">{nodes.length}</span>
                  <svg className={`w-4 h-4 transition-transform ${expandedSections['entities'] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              {expandedSections['entities'] && (
                <div className="ml-6 mt-1 space-y-1">
                  {nodes.map((node) => (
                    <div
                      key={node.id}
                      className={`flex items-center group ${
                        selectedNodeId === node.id ? 'bg-gray-light' : ''
                      }`}
                    >
                      <button
                        onClick={() => {
                          setSelectedNodeId(node.id)
                          setIsEditingDescription(false)
                        }}
                        className={`flex-1 flex items-center space-x-2 p-2 rounded text-sm hover:bg-gray-light transition-colors min-w-0 ${
                          selectedNodeId === node.id ? 'text-gray-dark font-medium' : 'text-gray'
                        }`}
                      >
                        <svg className={`w-4 h-4 flex-shrink-0 ${node.data.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="truncate text-left">{node.data.name}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                            handleDeleteNode(node.id)
                        }}
                        className="p-1 mr-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity"
                        title="Delete entity"
                        disabled={saving}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button className="w-full flex items-center justify-between p-2 hover:bg-gray-light rounded text-sm text-gray-dark">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate text-left">Locations</span>
                </div>
                <span className="text-xs text-gray flex-shrink-0">8</span>
              </button>
              <button className="w-full flex items-center justify-between p-2 hover:bg-gray-light rounded text-sm text-gray-dark">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="truncate text-left">Timeline</span>
                </div>
                <span className="text-xs text-gray flex-shrink-0">15</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Central Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-light" style={{ minWidth: 0 }}>
          {/* Tabs */}
          <div className="bg-white border-b border-gray-200 px-6 py-2">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('Characters')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'Characters'
                    ? 'bg-primary text-white'
                    : 'text-gray hover:bg-gray-light'
                }`}
              >
                Characters
              </button>
              <button
                onClick={() => setActiveTab('Geography')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'Geography'
                    ? 'bg-primary text-white'
                    : 'text-gray hover:bg-gray-light'
                }`}
              >
                Locations
              </button>
              <button
                onClick={() => setActiveTab('Timeline')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'Timeline'
                    ? 'bg-primary text-white'
                    : 'text-gray hover:bg-gray-light'
                }`}
              >
                Timeline
              </button>
            </div>
          </div>

          {/* Graph Canvas or Markdown Viewer */}
          <div className="flex-1 relative bg-gray-light overflow-hidden">
            {openFile ? (
              // Markdown Viewer
              <div className="absolute inset-0 flex flex-col bg-white">
                {/* File Header */}
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setOpenFile(null)}
                      className="p-2 hover:bg-gray-light rounded transition-colors"
                      title="Close file"
                    >
                      <svg className="w-5 h-5 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </button>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-dark">{openFile.name}</h2>
                      <p className="text-xs text-gray">{openFile.path}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpenFile(null)}
                    className="p-2 hover:bg-gray-light rounded transition-colors"
                    title="Close file"
                  >
                    <svg className="w-5 h-5 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Markdown Content */}
                <div className="flex-1 overflow-y-auto p-6 min-h-0">
                  {loadingFile ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-gray">Loading file...</div>
                    </div>
                  ) : (
                    <div className="max-w-4xl mx-auto">
                      <div className="markdown-content text-gray-dark leading-relaxed">
                        {(() => {
                          const lines = openFile.content.split('\n')
                          const elements: JSX.Element[] = []
                          let inCodeBlock = false
                          let codeBlockContent: string[] = []
                          let paragraphLines: string[] = []
                          let listItems: string[] = []
                          
                          const processParagraph = () => {
                            if (paragraphLines.length === 0) return
                            const text = paragraphLines.join(' ')
                            if (!text.trim()) {
                              paragraphLines = []
                              return
                            }
                            
                            // Process markdown in paragraph
                            let processed = text
                            // Bold
                            processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                            // Italic
                            processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>')
                            // Inline code
                            processed = processed.replace(/`(.+?)`/g, '<code class="bg-gray-light px-1 py-0.5 rounded text-sm font-mono">$1</code>')
                            
                            elements.push(
                              <p key={`p-${elements.length}`} className="mb-4" dangerouslySetInnerHTML={{ __html: processed }} />
                            )
                            paragraphLines = []
                          }
                          
                          const processList = () => {
                            if (listItems.length === 0) return
                            
                            const listElements = listItems.map((item, idx) => {
                              let processed = item
                              processed = processed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                              processed = processed.replace(/\*(.+?)\*/g, '<em>$1</em>')
                              processed = processed.replace(/`(.+?)`/g, '<code class="bg-gray-light px-1 py-0.5 rounded text-sm font-mono">$1</code>')
                              return (
                                <li key={`li-${idx}`} className="mb-2" dangerouslySetInnerHTML={{ __html: processed }} />
                              )
                            })
                            
                            elements.push(
                              <ul key={`ul-${elements.length}`} className="list-disc ml-6 mb-4 space-y-1">
                                {listElements}
                              </ul>
                            )
                            listItems = []
                          }
                          
                          const processCodeBlock = () => {
                            if (codeBlockContent.length > 0) {
                              elements.push(
                                <pre key={`code-${elements.length}`} className="bg-gray-light p-4 rounded-lg overflow-x-auto mb-4">
                                  <code className="text-sm font-mono">{codeBlockContent.join('\n')}</code>
                                </pre>
                              )
                              codeBlockContent = []
                            }
                          }
                          
                          lines.forEach((line, index) => {
                            // Code blocks
                            if (line.startsWith('```')) {
                              if (inCodeBlock) {
                                processCodeBlock()
                                inCodeBlock = false
                              } else {
                                processParagraph()
                                processList()
                                inCodeBlock = true
                              }
                              return
                            }
                            
                            if (inCodeBlock) {
                              codeBlockContent.push(line)
                              return
                            }
                            
                            // Headers
                            if (line.startsWith('# ')) {
                              processParagraph()
                              processList()
                              elements.push(<h1 key={`h1-${index}`} className="text-3xl font-bold text-gray-dark mt-8 mb-4">{line.substring(2)}</h1>)
                              return
                            } else if (line.startsWith('## ')) {
                              processParagraph()
                              processList()
                              elements.push(<h2 key={`h2-${index}`} className="text-2xl font-bold text-gray-dark mt-6 mb-3">{line.substring(3)}</h2>)
                              return
                            } else if (line.startsWith('### ')) {
                              processParagraph()
                              processList()
                              elements.push(<h3 key={`h3-${index}`} className="text-xl font-bold text-gray-dark mt-5 mb-2">{line.substring(4)}</h3>)
                              return
                            } else if (line.startsWith('#### ')) {
                              processParagraph()
                              processList()
                              elements.push(<h4 key={`h4-${index}`} className="text-lg font-bold text-gray-dark mt-4 mb-2">{line.substring(5)}</h4>)
                              return
                            }
                            
                            // Lists
                            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                              processParagraph()
                              const listItem = line.trim().substring(2)
                              listItems.push(listItem)
                              return
                            }
                            
                            // Regular line
                            if (line.trim()) {
                              if (listItems.length > 0) {
                                processList()
                              }
                              paragraphLines.push(line)
                            } else {
                              processParagraph()
                              processList()
                            }
                          })
                          
                          processParagraph()
                          processList()
                          processCodeBlock()
                          
                          return elements.length > 0 ? elements : <p className="text-gray">Empty file</p>
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : loading && nodes.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray">Loading characters...</div>
              </div>
            ) : (
            <ReactFlow
              nodes={nodes.map(node => {
                // Hover takes precedence over selection
                const highlightedNodeId = hoveredNodeId || selectedNodeId
                const isHighlighted = node.id === highlightedNodeId
                const isHovered = node.id === hoveredNodeId
                return {
                ...node,
                data: {
                  ...node.data,
                  isFocused: node.id === selectedNodeId,
                    isHighlighted,
                    isHovered,
                  },
                  connectable: true,
                }
              })}
              edges={[
                // Non-hovered edges first
                ...edges
                  .filter(edge => edge.id !== hoveredEdgeId)
                  .map(edge => {
                    // Highlight edges connected to the highlighted node (hover takes precedence)
                    const highlightedNodeId = hoveredNodeId || selectedNodeId
                    const isOutgoing = highlightedNodeId && edge.source === highlightedNodeId
                    const isIncoming = highlightedNodeId && edge.target === highlightedNodeId
                    const isHighlighted = isOutgoing || isIncoming
                    
                    // Different shades of purple for incoming vs outgoing edges
                    let edgeColor = '#5B21B6' // default purple
                    if (isOutgoing) {
                      edgeColor = '#a855f7' // lighter purple for outgoing
                    } else if (isIncoming) {
                      edgeColor = '#7c3aed' // darker purple for incoming
                    }
                    
                    return {
                      ...edge,
                      style: isHighlighted 
                        ? { stroke: edgeColor, strokeWidth: 3, opacity: 1 }
                        : highlightedNodeId
                        ? { stroke: '#5B21B6', strokeWidth: 2, opacity: 0.3 }
                        : { stroke: '#5B21B6', strokeWidth: 2, opacity: 1 },
                      markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: isHighlighted ? edgeColor : '#5B21B6',
                      },
                      labelStyle: { 
                        fill: isHighlighted ? edgeColor : '#5B21B6', 
                        fontWeight: isHighlighted ? 600 : 500, 
                        fontSize: 12 
                      },
                    }
                  }),
                // Hovered edge last (renders on top)
                ...edges
                  .filter(edge => edge.id === hoveredEdgeId)
                  .map(edge => ({
                    ...edge,
                    style: { stroke: '#7c3aed', strokeWidth: 3, opacity: 1 },
                    markerEnd: {
                      type: MarkerType.ArrowClosed,
                      color: '#7c3aed',
                    },
                    labelStyle: { 
                      fill: '#7c3aed', 
                      fontWeight: 700, 
                      fontSize: 12 
                    },
                  })),
              ]}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onNodeMouseEnter={onNodeMouseEnter}
              onNodeMouseLeave={onNodeMouseLeave}
              onNodeDragStop={onNodeDragStop}
              onNodeContextMenu={onNodeContextMenu}
              onEdgeMouseEnter={onEdgeMouseEnter}
              onEdgeMouseLeave={onEdgeMouseLeave}
              onEdgeDoubleClick={onEdgeDoubleClick}
              onInit={(instance) => {
                reactFlowInstance.current = instance
              }}
              nodeTypes={nodeTypes}
              fitView
              className="bg-gray-light"
              connectionLineStyle={{ stroke: '#5B21B6', strokeWidth: 2 }}
              connectionRadius={20}
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: false,
              }}
              isValidConnection={(connection) => {
                console.log('isValidConnection check:', connection, 'edges:', edges.length)
                // Prevent self-connections
                if (connection.source === connection.target) {
                  console.log('Rejected: self-connection')
                  return false
                }
                // Prevent duplicate connections (same source and target, regardless of handles)
                const existingEdge = edges.find(
                  e => e.source === connection.source && 
                       e.target === connection.target
                )
                if (existingEdge) {
                  console.log('Rejected: duplicate connection', existingEdge)
                  return false
                }
                console.log('Connection valid! Will call onConnect')
                return true
              }}
              onConnectStart={(event, { nodeId, handleType, handleId }) => {
                console.log('🔵 onConnectStart:', { nodeId, handleType, handleId, event })
                setConnectionStart({ 
                  nodeId: nodeId || '', 
                  handleId: handleId || null
                })
              }}
              onConnectEnd={(event) => {
                console.log('🔴 onConnectEnd:', event)
                console.log('🔴 onConnectEnd - target:', event.target)
                
                // If onConnect wasn't called, try to manually handle the connection
                if (connectionStart && event.target) {
                  const targetElement = event.target as HTMLElement
                  // Try to find the node ID from the ReactFlow data attributes
                  const reactFlowNode = targetElement.closest('.react-flow__node')
                  const targetNodeId = reactFlowNode?.getAttribute('data-id') || 
                                     targetElement.closest('[data-id]')?.getAttribute('data-id')
                  
                  // Get handle ID from the target element
                  const targetHandleId = targetElement.getAttribute('data-handleid') || 
                                       targetElement.getAttribute('id')
                  
                  console.log('🔴 Manual connection attempt:', { 
                    source: connectionStart.nodeId, 
                    target: targetNodeId,
                    sourceHandle: connectionStart.handleId,
                    targetHandle: targetHandleId,
                    reactFlowNode: reactFlowNode?.className
                  })
                  
                  if (targetNodeId && targetNodeId !== connectionStart.nodeId) {
                    // Manually trigger onConnect
                    const connection: Connection = {
                      source: connectionStart.nodeId,
                      target: targetNodeId,
                      sourceHandle: (connectionStart.handleId || null) as string | null,
                      targetHandle: (targetHandleId || null) as string | null,
                    }
                    console.log('🔴 Manually calling onConnect with:', connection)
                    onConnect(connection)
                  } else if (!targetNodeId && 'clientX' in event && 'clientY' in event && reactFlowInstance.current) {
                    // If dropped on a blank spot, create a new node
                    const mouseEvent = event as MouseEvent
                    const flowPosition = reactFlowInstance.current.screenToFlowPosition({ x: mouseEvent.clientX, y: mouseEvent.clientY })
                    console.log('🔵 Dropped on blank canvas, creating new node at:', flowPosition)
                    setDraggedNodePosition(flowPosition)
                    setShowNewNodeModal(true)
                  } else {
                    console.log('🔴 Connection failed - invalid target or self-connection')
                  }
                }
                
                setConnectionStart(null)
              }}
              style={{
                background: 'radial-gradient(circle, #e5e5e5 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            >
              <Background color="#e5e5e5" gap={20} />
              <Controls className="bg-white border border-gray-200 rounded-lg shadow-sm" />
              <MiniMap
                className="bg-white border border-gray-200 rounded-lg"
                nodeColor={(node) => {
                  if (node.data?.isFocused) return '#5B21B6'
                  if (node.data?.bgColor?.includes('blue')) return '#3B82F6'
                  if (node.data?.bgColor?.includes('purple')) return '#7C3AED'
                  return '#888888'
                }}
                maskColor="rgba(0, 0, 0, 0.1)"
              />
            </ReactFlow>
            )}
            
            {/* New Node Button - Only show when no file is open */}
            {!openFile && (
            <button 
              onClick={() => setShowNewNodeModal(true)}
                disabled={!selectedProjectId || saving}
                className="absolute top-4 left-4 z-10 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-dark hover:bg-gray-light transition-colors flex items-center space-x-2 shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Node</span>
            </button>
            )}

            {/* New Node Modal */}
            {showNewNodeModal && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-dark">Create New Entity</h3>
                    <button
                      onClick={() => {
                        setShowNewNodeModal(false)
                        setNewNodeName('')
                        setNewNodeDescription('')
                        setDraggedNodePosition(null)
                      }}
                      className="p-1 hover:bg-gray-light rounded"
                    >
                      <svg className="w-5 h-5 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-2">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newNodeName}
                        onChange={(e) => setNewNodeName(e.target.value)}
                        placeholder="Enter entity name..."
                        className="w-full bg-gray-light border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-dark placeholder-gray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newNodeName.trim() && !saving) {
                            handleAddNode()
                          }
                        }}
                        autoFocus
                        disabled={saving}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-2">
                        Description
                      </label>
                      <textarea
                        value={newNodeDescription}
                        onChange={(e) => setNewNodeDescription(e.target.value)}
                        placeholder="Enter description (optional)..."
                        className="w-full bg-gray-light border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-dark placeholder-gray resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows={3}
                        disabled={saving}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <button
                        onClick={handleAddNode}
                        disabled={!newNodeName.trim() || saving}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Creating...' : 'Create Entity'}
                      </button>
                      <button
                        onClick={() => {
                          setShowNewNodeModal(false)
                          setNewNodeName('')
                          setNewNodeDescription('')
                          setDraggedNodePosition(null)
                        }}
                        className="px-4 py-2 border border-gray-200 text-gray-dark rounded-lg text-sm font-medium hover:bg-gray-light transition-colors"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Relationship Modal - When connecting nodes */}
            {showRelationshipModal && pendingConnection && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-dark">Create Relationship</h3>
                    <button
                      onClick={() => {
                        setShowRelationshipModal(false)
                        setPendingConnection(null)
                        setRelationshipLabel('')
                      }}
                      className="p-1 hover:bg-gray-light rounded"
                    >
                      <svg className="w-5 h-5 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray mb-2">
                        Connecting:{' '}
                        <span className="font-medium text-gray-dark">
                          {nodes.find(n => n.id === pendingConnection.source)?.data.name}
                        </span>
                        {' → '}
                        <span className="font-medium text-gray-dark">
                          {nodes.find(n => n.id === pendingConnection.target)?.data.name}
                        </span>
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-2">
                        Relationship Label
                      </label>
                      <input
                        type="text"
                        value={relationshipLabel}
                        onChange={(e) => setRelationshipLabel(e.target.value)}
                        placeholder="e.g., father of, commands, allied with..."
                        className="w-full bg-gray-light border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-dark placeholder-gray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !saving) {
                            handleCreateRelationship()
                          }
                        }}
                        autoFocus
                        disabled={saving}
                      />
                      <p className="text-xs text-gray mt-1">Leave empty for &quot;connected to&quot;</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <button
                        onClick={handleCreateRelationship}
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Creating...' : 'Create Relationship'}
                      </button>
                      <button
                        onClick={() => {
                          setShowRelationshipModal(false)
                          setPendingConnection(null)
                          setRelationshipLabel('')
                        }}
                        className="px-4 py-2 border border-gray-200 text-gray-dark rounded-lg text-sm font-medium hover:bg-gray-light transition-colors"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edge Label Edit Modal - When double-clicking edge */}
            {editingEdgeId && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-dark">Edit Relationship</h3>
                    <button
                      onClick={() => {
                        setEditingEdgeId(null)
                        setEditingEdgeLabel('')
                      }}
                      className="p-1 hover:bg-gray-light rounded"
                    >
                      <svg className="w-5 h-5 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-2">
                        Relationship Label
                      </label>
                      <input
                        type="text"
                        value={editingEdgeLabel}
                        onChange={(e) => setEditingEdgeLabel(e.target.value)}
                        placeholder="e.g., father of, commands, allied with..."
                        className="w-full bg-gray-light border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-dark placeholder-gray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !saving) {
                            handleUpdateEdgeLabel()
                          }
                          if (e.key === 'Escape') {
                            setEditingEdgeId(null)
                            setEditingEdgeLabel('')
                          }
                        }}
                        autoFocus
                        disabled={saving}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <button
                        onClick={handleUpdateEdgeLabel}
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingEdgeId(null)
                          setEditingEdgeLabel('')
                        }}
                        className="px-4 py-2 border border-gray-200 text-gray-dark rounded-lg text-sm font-medium hover:bg-gray-light transition-colors"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Context Menu */}
            {contextMenu.visible && contextMenu.nodeId && (
              <div
                className="fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[180px]"
                style={{
                  left: contextMenu.x,
                  top: contextMenu.y,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    const node = nodes.find(n => n.id === contextMenu.nodeId)
                    if (node) {
                      setSelectedNodeId(node.id)
                      setIsEditingDescription(false)
                    }
                    closeContextMenu()
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-dark hover:bg-gray-light flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>View Details</span>
                </button>
                <button
                  onClick={() => {
                    const node = nodes.find(n => n.id === contextMenu.nodeId)
                    if (node) {
                      setEditingName(node.data.name)
                      setShowEditNameModal(true)
                    }
                    closeContextMenu()
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-dark hover:bg-gray-light flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Name</span>
                </button>
                <button
                  onClick={() => {
                    const node = nodes.find(n => n.id === contextMenu.nodeId)
                    if (node) {
                      setSelectedNodeId(node.id)
                      setEditedDescription(node.data.description)
                      setIsEditingDescription(true)
                    }
                    closeContextMenu()
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-dark hover:bg-gray-light flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Description</span>
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <div className="px-2 py-2">
                  <div className="flex items-center space-x-2 mb-2 px-2">
                    <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <span className="text-sm text-gray-dark">Change Color</span>
                  </div>
                  <div className="flex justify-center">
                    <div className="grid grid-cols-4 gap-x-5 gap-y-3">
                      {colorPresets.map((preset) => {
                        const node = nodes.find(n => n.id === contextMenu.nodeId)
                        const isSelected = node?.data.bgColor === preset.bg
                        return (
                          <button
                            key={preset.name}
                            onClick={async () => {
                              if (contextMenu.nodeId) {
                                setSelectedNodeId(contextMenu.nodeId)
                                await handleUpdateCharacterColor({
                                  bg: preset.bg,
                                  border: preset.border,
                                  text: preset.text,
                                  icon: preset.icon,
                                })
                              }
                              closeContextMenu()
                            }}
                            disabled={saving}
                            className={`w-5 h-5 rounded-full ${preset.bg} border-2 transition-all hover:scale-110 ${
                              isSelected ? 'ring-2 ring-primary ring-offset-1 border-primary' : 'border-gray-300'
                            }`}
                            title={preset.name}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    const node = nodes.find(n => n.id === contextMenu.nodeId)
                    if (node) {
                      handleDeleteNode(node.id)
                    }
                    closeContextMenu()
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            )}

            {/* Edit Name Modal */}
            {showEditNameModal && selectedNodeId && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-dark">Edit Name</h3>
                    <button
                      onClick={() => {
                        setShowEditNameModal(false)
                        setEditingName('')
                      }}
                      className="p-1 hover:bg-gray-light rounded"
                    >
                      <svg className="w-5 h-5 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-dark mb-2">
                        Character Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        placeholder="Enter character name..."
                        className="w-full bg-gray-light border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-dark placeholder-gray focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editingName.trim() && !saving) {
                            handleUpdateCharacterName()
                          }
                          if (e.key === 'Escape') {
                            setShowEditNameModal(false)
                            setEditingName('')
                          }
                        }}
                        autoFocus
                        disabled={saving}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <button
                        onClick={handleUpdateCharacterName}
                        disabled={!editingName.trim() || saving}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setShowEditNameModal(false)
                          setEditingName('')
                        }}
                        className="px-4 py-2 border border-gray-200 text-gray-dark rounded-lg text-sm font-medium hover:bg-gray-light transition-colors"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Color Modal */}
            {showEditColorModal && selectedNodeId && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-dark">Change Color</h3>
                    <button
                      onClick={() => setShowEditColorModal(false)}
                      className="p-1 hover:bg-gray-light rounded"
                    >
                      <svg className="w-5 h-5 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-gray">Select a color scheme:</p>
                    <div className="grid grid-cols-2 gap-3">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => handleUpdateCharacterColor({
                            bg: preset.bg,
                            border: preset.border,
                            text: preset.text,
                            icon: preset.icon,
                          })}
                          disabled={saving}
                          className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${preset.bg} ${preset.border} ${
                            nodes.find(n => n.id === selectedNodeId)?.data.bgColor === preset.bg
                              ? 'ring-2 ring-primary ring-offset-2'
                              : ''
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 rounded-full ${preset.bg} ${preset.border} border-2`}></div>
                            <span className={`font-medium ${preset.text}`}>{preset.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    <div className="pt-2">
                      <button
                        onClick={() => setShowEditColorModal(false)}
                        className="w-full px-4 py-2 border border-gray-200 text-gray-dark rounded-lg text-sm font-medium hover:bg-gray-light transition-colors"
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar - Node Details or AI Assistant */}
        <aside 
          className="bg-white border-l border-gray-200 flex flex-col overflow-hidden relative"
          style={{ width: `${rightSidebarWidth}px`, minWidth: '200px', maxWidth: '600px' }}
        >
          {/* Resize Handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary hover:opacity-50 transition-colors z-10"
            onMouseDown={(e) => {
              e.preventDefault()
              setIsResizingRight(true)
            }}
          />
          {selectedNodeId ? (() => {
            const selectedNode = nodes.find(n => n.id === selectedNodeId)
            if (!selectedNode) return null
            
            // Find connected nodes with direction information
            const connectedNodesWithDirection = edges
              .filter(e => e.source === selectedNodeId || e.target === selectedNodeId)
              .map(e => {
                const isOutgoing = e.source === selectedNodeId
                const connectedId = isOutgoing ? e.target : e.source
                const connectedNode = nodes.find(n => n.id === connectedId)
                if (!connectedNode) return null
                return {
                  node: connectedNode,
                  edge: e,
                  isOutgoing,
                }
              })
              .filter(Boolean) as Array<{ node: Node<CharacterNodeData>; edge: Edge; isOutgoing: boolean }>
            
            return (
              <>
                {/* Node Header */}
                <div className="border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-dark">Entity Details</h3>
                    <button 
                      onClick={() => {
                        setSelectedNodeId(null)
                        setIsEditingDescription(false)
                      }}
                      className="p-1 hover:bg-gray-light rounded"
                    >
                      <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Node Preview */}
                  <div className={`rounded-lg p-3 ${selectedNode.data.bgColor} ${selectedNode.data.borderColor} border`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1">
                      <svg className={`w-5 h-5 ${selectedNode.data.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <h4 className="font-semibold text-gray-dark">{selectedNode.data.name}</h4>
                      </div>
                      <button
                        onClick={() => {
                          setEditingName(selectedNode.data.name)
                          setShowEditNameModal(true)
                        }}
                        className="p-1 hover:bg-gray-light rounded transition-colors"
                        title="Edit name"
                      >
                        <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray line-clamp-3 overflow-hidden">{selectedNode.data.description}</p>
                  </div>
                </div>

                {/* Node Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Description */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-dark">Description</h4>
                      {!isEditingDescription && (
                        <button
                          onClick={() => {
                            setEditedDescription(selectedNode.data.description)
                            setIsEditingDescription(true)
                          }}
                          className="p-1 hover:bg-gray-light rounded transition-colors"
                          title="Edit description"
                        >
                          <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {isEditingDescription ? (
                      <div className="space-y-2">
                        <textarea
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          className="w-full bg-gray-light border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-dark placeholder-gray resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={4}
                          placeholder="Enter description..."
                          disabled={saving}
                        />
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleUpdateCharacterDescription}
                            disabled={saving}
                            className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setEditedDescription(selectedNode.data.description)
                              setIsEditingDescription(false)
                            }}
                            className="px-3 py-1.5 border border-gray-200 text-gray-dark rounded-lg text-sm font-medium hover:bg-gray-light transition-colors"
                            disabled={saving}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      renderDescriptionWithLinks(selectedNode.data.description)
                    )}
                  </div>

                  {/* Connections */}
                  {connectedNodesWithDirection.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-dark mb-2">Connections</h4>
                      <div className="space-y-2">
                        {connectedNodesWithDirection.map(({ node, edge, isOutgoing }) => {
                          return (
                            <div
                              key={node.id}
                              className="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:bg-gray-light transition-colors group"
                            >
                              <button
                              onClick={() => {
                                setSelectedNodeId(node.id)
                                setIsEditingDescription(false)
                              }}
                                className="flex-1 text-left"
                            >
                              <div className="flex items-center space-x-2 mb-1">
                                <svg className={`w-4 h-4 ${node.data.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-dark">{node.data.name}</span>
                              </div>
                              {edge?.label && (
                                  <div className="flex items-center space-x-1">
                                    <span className="text-xs text-primary">
                                      {isOutgoing ? '←' : '→'}
                                    </span>
                                <span className="text-xs text-gray">{edge.label}</span>
                                  </div>
                              )}
                            </button>
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {edge && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (edge.id) {
                                          setEditingEdgeId(edge.id)
                                          setEditingEdgeLabel(edge.label as string || '')
                                        }
                                      }}
                                      className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                      title="Edit relationship"
                                    >
                                      <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation()
                                        if (edge.data?.relationshipId && selectedProjectId) {
                                          if (confirm('Are you sure you want to delete this relationship?')) {
                                            try {
                                              setSaving(true)
                                              await deleteRelationship(selectedProjectId, edge.data.relationshipId)
                                              // Remove the edge from state
                                              setEdges((eds) => eds.filter((e) => e.id !== edge.id))
                                            } catch (err) {
                                              const apiError = err as ApiError
                                              setError(apiError.message || 'Failed to delete relationship')
                                            } finally {
                                              setSaving(false)
                                            }
                                          }
                                        }
                                      }}
                                      className="p-1.5 hover:bg-red-100 rounded transition-colors"
                                      title="Delete relationship"
                                      disabled={saving}
                                    >
                                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    {!isEditingDescription ? (
                      <>
                        <button
                          onClick={() => {
                            setEditedDescription(selectedNode.data.description)
                            setIsEditingDescription(true)
                          }}
                          className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                        >
                          Edit Entity
                        </button>
                        <button
                          onClick={() => handleDeleteNode(selectedNodeId)}
                          disabled={saving}
                          className="w-full px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          Delete Entity
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </>
            )
          })() : (
            <>
              {/* Chat Header */}
              <div className="border-b border-gray-200 px-4 py-3 flex-shrink-0">
                <h3 className="font-semibold text-gray-dark">World Lore Assistant</h3>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {chatMessages.map((message, index) => (
                    <div key={index} className="w-full">
                      {message.role === 'user' ? (
                        <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-2">
                          <p className="text-sm text-gray-dark leading-relaxed text-left">{message.content}</p>
                        </div>
                      ) : (
                        <div className="px-4 py-2.5">
                          <p className="text-sm text-gray-dark leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          {message.references && message.references.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {message.references.map((nodeId) => {
                                  const node = nodes.find(n => n.id === nodeId)
                                  if (!node) return null
                                  return (
                                    <button
                                      key={nodeId}
                                      onClick={() => {
                                        setSelectedNodeId(nodeId)
                                        setIsEditingDescription(false)
                                      }}
                                      className="flex items-center gap-1.5 text-sm text-primary underline decoration-primary/50 decoration-1 hover:decoration-primary hover:decoration-2 transition-all cursor-pointer"
                                    >
                                      <svg className={`w-3.5 h-3.5 ${node.data.iconColor || 'text-primary'} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span>{node.data.name}</span>
                                    </button>
                                  )
                                })}
              </div>
              </div>
                          )}
            </div>
                      )}
            </div>
                  ))}
                  {isProcessingChat && (
                    <div className="w-full">
                      <div className="px-4 py-2.5">
                        <p className="text-sm text-gray">Processing...</p>
            </div>
                  </div>
                  )}
                  <div ref={chatMessagesEndRef} />
            </div>
          </div>

              {/* Bottom Input */}
              <div className="border-t border-gray-200 p-4 flex-shrink-0">
                <div className="relative">
                  <textarea
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendChatMessage()
                      }
                    }}
                    placeholder="Ask about lore, or create new lore connections..."
                    className="w-full bg-gray-light border border-gray-200 rounded-lg px-4 py-3 pr-10 text-sm text-gray-dark placeholder-gray resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    style={{ minHeight: '60px', maxHeight: '120px' }}
                    rows={2}
                    disabled={isProcessingChat || !selectedProjectId}
                  />
                  <button 
                    onClick={handleSendChatMessage}
                    disabled={isProcessingChat || !selectedProjectId || !chatInput.trim()}
                    className="absolute bottom-3 right-3 p-1 text-primary hover:text-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
