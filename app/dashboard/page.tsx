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
      {/* Source Handles - All sides for automatic routing - Only visible on hover */}
      {/* Counterclockwise offset: left→down, top→left, right→up, bottom→right */}
      <Handle
        type="source"
        position={Position.Top}
        id="source-top"
        className={`!w-3 !h-3 !bg-primary !border-2 !border-white !cursor-crosshair transition-opacity ${handleVisibility}`}
        style={{ left: 'calc(50% - 10px)', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'all' }}
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className={`!w-3 !h-3 !bg-primary !border-2 !border-white !cursor-crosshair transition-opacity ${handleVisibility}`}
        style={{ top: 'calc(50% - 10px)', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'all' }}
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className={`!w-3 !h-3 !bg-primary !border-2 !border-white !cursor-crosshair transition-opacity ${handleVisibility}`}
        style={{ left: 'calc(50% + 10px)', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'all' }}
        isConnectable={true}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="source-left"
        className={`!w-3 !h-3 !bg-primary !border-2 !border-white !cursor-crosshair transition-opacity ${handleVisibility}`}
        style={{ top: 'calc(50% + 10px)', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'all' }}
        isConnectable={true}
      />
      
      {/* Target Handles - All sides for automatic routing - Only visible on hover */}
      {/* Clockwise offset: left→up, top→right, right→down, bottom→left */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className={`!w-3 !h-3 !bg-primary !border-2 !border-white !cursor-crosshair transition-opacity ${handleVisibility}`}
        style={{ left: 'calc(50% + 10px)', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'all' }}
        isConnectable={true}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        className={`!w-3 !h-3 !bg-primary !border-2 !border-white !cursor-crosshair transition-opacity ${handleVisibility}`}
        style={{ top: 'calc(50% + 10px)', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'all' }}
        isConnectable={true}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom"
        className={`!w-3 !h-3 !bg-primary !border-2 !border-white !cursor-crosshair transition-opacity ${handleVisibility}`}
        style={{ left: 'calc(50% - 10px)', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'all' }}
        isConnectable={true}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className={`!w-3 !h-3 !bg-primary !border-2 !border-white !cursor-crosshair transition-opacity ${handleVisibility}`}
        style={{ top: 'calc(50% - 10px)', transform: 'translateY(-50%)', zIndex: 10, pointerEvents: 'all' }}
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'world-lore': true,
    'geography': false,
    'factions': false,
    'entities': true,
  })
  const [selectedConversation, setSelectedConversation] = useState('king-of-eldoria')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
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

  // Load projects on mount
  useEffect(() => {
    loadProjects()
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

  // Function to render description with clickable character names
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
              <h3 className="font-semibold text-gray-dark">Entities</h3>
              <button className="p-1 hover:bg-gray-light rounded">
                <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-1">
              {/* Story Chapters */}
              <div>
                <button 
                  onClick={() => toggleSection('story-chapters')}
                  className="w-full flex items-center justify-between p-2 hover:bg-gray-light rounded text-sm text-gray-dark"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="truncate text-left">Story Chapters</span>
                  </div>
                  <svg className={`w-4 h-4 transition-transform ${expandedSections['story-chapters'] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {expandedSections['story-chapters'] && (
                  <div className="ml-6 mt-1 space-y-1">
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer truncate text-left">Chapter 1: The Fall of Arion</div>
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer truncate text-left">Chapter 2: Shadows of the...</div>
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer truncate text-left">Chapter 3: The Siege of Eld...</div>
                  </div>
                )}
              </div>

              {/* World Lore */}
              <div>
                <button 
                  onClick={() => toggleSection('world-lore')}
                  className="w-full flex items-center justify-between p-2 hover:bg-gray-light rounded text-sm text-gray-dark"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="truncate text-left">World Lore</span>
                  </div>
                  <svg className={`w-4 h-4 transition-transform ${expandedSections['world-lore'] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {expandedSections['world-lore'] && (
                  <div className="ml-6 mt-1 space-y-1">
                    <div>
                      <button 
                        onClick={() => toggleSection('geography')}
                        className="w-full flex items-center justify-between p-2 hover:bg-gray-light rounded text-sm text-gray"
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <span className="truncate text-left">Geography</span>
                        </div>
                        <svg className={`w-4 h-4 transition-transform ${expandedSections['geography'] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      {expandedSections['geography'] && (
                        <div className="ml-6 mt-1 space-y-1">
                          <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer truncate text-left">The Eastern Continent</div>
                          <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer truncate text-left">The Silver Sea</div>
                          <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer truncate text-left">The Ruins of Velmor</div>
                        </div>
                      )}
                    </div>
                    <div>
                      <button 
                        onClick={() => toggleSection('factions')}
                        className="w-full flex items-center justify-between p-2 hover:bg-gray-light rounded text-sm text-gray"
                      >
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <span className="truncate text-left">Factions</span>
                        </div>
                        <svg className={`w-4 h-4 transition-transform ${expandedSections['factions'] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      {expandedSections['factions'] && (
                        <div className="ml-6 mt-1 space-y-1">
                          <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer truncate text-left">Order of the Flame</div>
                          <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer truncate text-left">The Royal Guard</div>
                          <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer truncate text-left">The Shadow Court</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Historical Timeline */}
              <div>
                <button 
                  onClick={() => toggleSection('timeline')}
                  className="w-full flex items-center justify-between p-2 hover:bg-gray-light rounded text-sm text-gray-dark"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="truncate text-left">Historical Timeline</span>
                  </div>
                  <svg className={`w-4 h-4 transition-transform ${expandedSections['timeline'] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {expandedSections['timeline'] && (
                  <div className="ml-6 mt-1 space-y-1">
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer truncate text-left">Founding of Eldoria</div>
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer truncate text-left">The War of Crowns</div>
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer truncate text-left">Rise of the Flame</div>
                  </div>
                )}
              </div>

              {/* Notes & Ideas */}
              <div>
                <button 
                  onClick={() => toggleSection('notes')}
                  className="w-full flex items-center justify-between p-2 hover:bg-gray-light rounded text-sm text-gray-dark"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="truncate text-left">Notes & Ideas</span>
                  </div>
                  <svg className={`w-4 h-4 transition-transform ${expandedSections['notes'] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {expandedSections['notes'] && (
                  <div className="ml-6 mt-1 space-y-1">
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer truncate text-left">Character Motivations</div>
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer truncate text-left">Plot Threads to Resolve</div>
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer truncate text-left">Future Arc Concepts</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Entities Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-dark">Graphs</h3>
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

          {/* Graph Canvas */}
          <div className="flex-1 relative bg-gray-light">
            {loading && nodes.length === 0 ? (
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
              edges={edges.map(edge => {
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
              })}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onNodeMouseEnter={onNodeMouseEnter}
              onNodeMouseLeave={onNodeMouseLeave}
              onNodeDragStop={onNodeDragStop}
              onNodeContextMenu={onNodeContextMenu}
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
                      sourceHandle: connectionStart.handleId || undefined,
                      targetHandle: (targetHandleId || undefined) as string | undefined,
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
            
            {/* New Node Button */}
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
                <button
                  onClick={() => {
                    setShowEditColorModal(true)
                    closeContextMenu()
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-dark hover:bg-gray-light flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <span>Change Color</span>
                </button>
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
            
            // Find connected nodes
            const connectedNodes = edges
              .filter(e => e.source === selectedNodeId || e.target === selectedNodeId)
              .map(e => {
                const connectedId = e.source === selectedNodeId ? e.target : e.source
                return nodes.find(n => n.id === connectedId)
              })
              .filter(Boolean) as Node<CharacterNodeData>[]
            
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
                  {connectedNodes.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-dark mb-2">Connections</h4>
                      <div className="space-y-2">
                        {connectedNodes.map((node) => {
                          const edge = edges.find(e => 
                            (e.source === selectedNodeId && e.target === node.id) ||
                            (e.source === node.id && e.target === selectedNodeId)
                          )
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
                                <span className="text-xs text-gray">{edge.label}</span>
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
              {/* Conversation Tabs */}
              <div className="border-b border-gray-200 p-2 flex items-center space-x-1 overflow-x-auto">
                <button
                  onClick={() => setSelectedConversation('king-of-eldoria')}
                  className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
                    selectedConversation === 'king-of-eldoria'
                      ? 'bg-gray-light text-gray-dark'
                      : 'text-gray hover:bg-gray-light'
                  }`}
                >
                  King of Eldoria recap
                </button>
                <button
                  onClick={() => setSelectedConversation('magic-fundamentals')}
                  className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap ${
                    selectedConversation === 'magic-fundamentals'
                      ? 'bg-gray-light text-gray-dark'
                      : 'text-gray hover:bg-gray-light'
                  }`}
                >
                  Magic fundamentals
                </button>
                <button className="p-1.5 hover:bg-gray-light rounded">
                  <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button className="p-1.5 hover:bg-gray-light rounded">
                  <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* AI Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Query */}
            <div>
              <div className="font-medium text-gray-dark mb-2">Who is the king of Eldoria?</div>
              <div className="text-sm text-gray leading-relaxed">
                The current king of Eldoria is <span className="text-primary font-medium cursor-pointer hover:underline">King Eldor</span>. 
                He rules from <span className="text-primary font-medium cursor-pointer hover:underline">Eldoria Castle</span> and is a member of 
                the <span className="text-primary font-medium cursor-pointer hover:underline">Order of the Flame</span>.
              </div>
            </div>

            {/* Follow-up */}
            <div className="text-sm text-primary cursor-pointer hover:underline">
              Would you like a follow up on how he became king?
            </div>

            {/* User Input */}
            <div className="text-sm text-gray-dark">
                  The king of Eldoria&apos;s father is King Arion, who was the king before him. He died 10 years before the Siege of Eldor. Add this to the world lore.
            </div>

            {/* Status */}
            <div className="text-xs text-gray">Lore successfully updated.</div>
          </div>

              {/* Bottom Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="relative">
                  <textarea
                    placeholder="Ask about lore, or create new lore connections."
                    className="w-full bg-gray-light border border-gray-200 rounded-lg px-4 py-3 pr-10 text-sm text-gray-dark placeholder-gray resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={2}
                  />
                  <button className="absolute bottom-3 right-3 p-1 text-primary hover:text-primary-dark">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray">Add Context</div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
