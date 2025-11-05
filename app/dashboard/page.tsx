'use client'

import React, { useState, useCallback } from 'react'
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
} from 'reactflow'
import 'reactflow/dist/style.css'

// Custom Character Node Component
interface CharacterNodeData {
  name: string
  description: string
  bgColor: string
  borderColor: string
  textColor: string
  iconColor: string
  isFocused?: boolean
}

const CharacterNode = ({ data }: { data: CharacterNodeData }) => {
  return (
    <div
      className={`rounded-lg p-3 shadow-sm w-48 relative ${data.bgColor} ${data.borderColor} ${
        data.isFocused ? 'border-2 shadow-md' : 'border'
      }`}
    >
      {/* Source Handle - Right side for outgoing connections */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary !border-2 !border-white"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      />
      
      {/* Target Handle - Left side for incoming connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary !border-2 !border-white"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
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
  const [activeTab, setActiveTab] = useState('Characters')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'world-lore': true,
    'geography': false,
    'factions': false,
    'entities': true,
  })
  const [selectedConversation, setSelectedConversation] = useState('king-of-eldoria')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('king-eldor')
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedDescription, setEditedDescription] = useState('')
  const [showNewNodeModal, setShowNewNodeModal] = useState(false)
  const [newNodeName, setNewNodeName] = useState('')
  const [newNodeDescription, setNewNodeDescription] = useState('')

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

  // Initial nodes
  const initialNodes: Node<CharacterNodeData>[] = [
    {
      id: 'king-arion',
      type: 'character',
      position: { x: 200, y: 100 },
      data: {
        name: 'King Arion',
        description: 'Former monarch, died 10 years before the Siege of Eldor.',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
        textColor: 'text-gray-dark',
        iconColor: 'text-blue-600',
      },
    },
    {
      id: 'queen-selara',
      type: 'character',
      position: { x: 250, y: 50 },
      data: {
        name: 'Queen Selara',
        description: `Queen Selara hails from the mist-shrouded Eastern Isles, where she once served as a gifted healer before her marriage to King Eldor bound two distant realms. Though foreign to Eldoria's courtly intrigues, Selara's calm presence and compassion quickly earned her the loyalty of the common folk and the cautious respect of the nobility.

During the Siege of Eldor, she tended to the wounded herself, transforming the palace halls into makeshift infirmaries. Many still whisper that her healing saved the king's life after the final assault. Yet behind her serene demeanor lies quiet political acumen—Selara often mediates between Eldor's hard-edged advisors, especially Mira Valen and Captain Aris Vorn, whose rivalry threatens the fragile peace of the court.

Selara's devotion to her children, Prince Kael and Princess Lyra, anchors her amidst the turbulence of rule. To Eldoria's people, she represents the heart that softens the crown—a queen whose mercy tempers the steel of her husband's reign.
`,
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
        textColor: 'text-gray-dark',
        iconColor: 'text-blue-600',
      },
    },
    {
      id: 'king-eldor',
      type: 'character',
      position: { x: 400, y: 150 },
      data: {
        name: 'King Eldor',
        description: `King Eldor is the reigning monarch of Eldoria, a ruler forged in the aftermath of his father's death and the chaos that followed. Ten years after King Arion's passing, Eldor ascended the throne amid political unrest and the looming threat of rebellion. His leadership during the Siege of Eldor defined a new era—marked by both unity and unease.

Once a disciplined commander under his father's reign, Eldor rose to power through sheer resolve. With his queen, Selara, he strives to stabilize a kingdom scarred by war, though his rule often balances on a knife's edge between diplomacy and domination.

Eldor is advised by Mira Valen, whose sharp counsel and past in the Order of the Flame lend him strategic insight. He entrusts the protection of the crown to Captain Aris Vorn, yet whispers in the court suggest growing tensions between Aris's loyalty and Mira's influence.

Despite his power, Eldor remains haunted by his father's shadow and the legacy of King Arion, whose ideals of faith and honor often clash with Eldor's pragmatic rule. His rivalry with Lord Kaen Darros threatens to ignite civil unrest, while his strained alliance with Grandmaster Thalos of the Order hints at deeper ideological divides.

To his people, Eldor is both savior and symbol—a king who rebuilt what was broken but may yet sow the seeds of a new conflict.
`,
        bgColor: 'bg-pink-100',
        borderColor: 'border-primary',
        textColor: 'text-gray-dark',
        iconColor: 'text-primary',
        isFocused: true,
      },
    },
    {
      id: 'prince-kael',
      type: 'character',
      position: { x: 500, y: 250 },
      data: {
        name: 'Prince Kael',
        description: `Prince Kael, heir to the throne of Eldoria, stands at the crossroads between legacy and change. Born during the final years of the Siege of Eldor, he grew up amidst reconstruction and the quiet disillusionment of a kingdom rebuilding from ash. Unlike his father, King Eldor, Kael believes peace cannot be forged solely through strength. He dreams of a gentler Eldoria—one guided by diplomacy, education, and trust in its people.

Despite his noble ideals, Kael's defiance often puts him at odds with his father's hardened rule. His mother, Queen Selara, remains his closest confidant, encouraging his compassion even as the court whispers that his youth blinds him to the realities of power. Torn between admiration and resentment, Kael struggles to live up to a legacy that glorifies war while his heart seeks peace.

His bond with Princess Lyra keeps him grounded, though his friendship with Sister Nira of the Order of the Flame has begun to draw suspicion—especially from Captain Aris Vorn, who sees danger in the prince's sympathies toward the old faith.

To the realm, Kael is the promise of renewal; to his father, he is a reminder that the next age may not be his own.
`,
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
        textColor: 'text-gray-dark',
        iconColor: 'text-blue-600',
      },
    },
    {
      id: 'captain-aris',
      type: 'character',
      position: { x: 600, y: 100 },
      data: {
        name: 'Captain Aris Vorn',
        description: `Captain Aris Vorn commands the Royal Guard of Eldoria, a soldier whose loyalty to King Eldor was forged in the blood and fire of the Siege of Eldor. Once a battlefield companion of Mira Valen, Aris now embodies the rigid discipline and honor of the old guard—unquestioning service to crown and country.

Though respected for his valor, Aris often clashes with Mira's strategic pragmatism and Queen Selara's diplomacy. He believes strength—not negotiation—is the surest path to stability. His devotion to Eldor borders on absolute, yet beneath the iron exterior lies a man weary of endless war, quietly haunted by the memory of fallen comrades and the shadow of King Arion, whose ideals he still holds sacred.

Aris represents the soldier's burden in Eldoria's new age: steadfast, scarred, and struggling to serve a peace he no longer fully understands.
`,
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-200',
        textColor: 'text-gray-dark',
        iconColor: 'text-purple-600',
      },
    },
    {
      id: 'high-seer-elenwen',
      type: 'character',
      position: { x: 600, y: 250 },
      data: {
        name: 'High Seer Elenwen',
        description: 'Court prophet; Interprets omens; rumored to have opposed the war privately.',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-200',
        textColor: 'text-gray-dark',
        iconColor: 'text-purple-600',
      },
    },
    {
      id: 'mira-valen',
      type: 'character',
      position: { x: 600, y: 350 },
      data: {
        name: 'Mira Valen',
        description: `Once a rising knight within the Order of the Flame, Mira Valen walked away from the Order after witnessing its corruption during the Siege of Eldor. Her tactical brilliance and unwavering sense of purpose caught the attention of King Eldor, who named her his royal strategist and closest counselor.\n
        Though admired for her intellect, Mira's past ties to the Order make her a figure of quiet controversy within the palace. Many question where her loyalty truly lies—between the crown she now serves or the faith she once abandoned. Her friendship with Queen Selara lends her warmth among the royal circle, but her rivalry with Captain Aris Vorn simmers beneath the surface, each challenging the other's vision of how Eldoria should be defended.\n
        To Eldor, she is both weapon and conscience: the one who helps him win wars, and the one who reminds him why he fights them.`,
                bgColor: 'bg-purple-100',
        borderColor: 'border-purple-200',
        textColor: 'text-gray-dark',
        iconColor: 'text-purple-600',
      },
    },
  ]

  // Initial edges
  const initialEdges: Edge[] = [
    {
      id: 'arion-eldor',
      source: 'king-eldor',
      target: 'king-arion',
      label: 'son of',
      type: 'smoothstep',
      style: { stroke: '#3B82F6', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#3B82F6',
      },
      labelStyle: { fill: '#2563EB', fontWeight: 500, fontSize: 12 },
      labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
    },
    {
      id: 'arion-selara',
      source: 'king-eldor',
      target: 'queen-selara',
      label: 'husband of',
      type: 'smoothstep',
      style: { stroke: '#3B82F6', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#3B82F6',
      },
      labelStyle: { fill: '#2563EB', fontWeight: 500, fontSize: 12 },
      labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
    },
    {
      id: 'eldor-kael',
      source: 'king-eldor',
      target: 'prince-kael',
      label: 'father of',
      type: 'smoothstep',
      style: { stroke: '#3B82F6', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#3B82F6',
      },
      labelStyle: { fill: '#2563EB', fontWeight: 500, fontSize: 12 },
      labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
    },
    {
      id: 'eldor-aris',
      source: 'king-eldor',
      target: 'captain-aris',
      label: 'commands',
      type: 'smoothstep',
      style: { stroke: '#5B21B6', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#5B21B6',
      },
      labelStyle: { fill: '#5B21B6', fontWeight: 500, fontSize: 12 },
      labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
    },
    {
      id: 'eldor-elenwen',
      source: 'king-eldor',
      target: 'high-seer-elenwen',
      label: 'consults',
      type: 'smoothstep',
      style: { stroke: '#5B21B6', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#5B21B6',
      },
      labelStyle: { fill: '#5B21B6', fontWeight: 500, fontSize: 12 },
      labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
    },
    {
      id: 'mira-eldor',
      source: 'king-eldor',
      target: 'mira-valen',
      label: 'advised by',
      type: 'smoothstep',
      style: { stroke: '#5B21B6', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#5B21B6',
      },
      labelStyle: { fill: '#5B21B6', fontWeight: 500, fontSize: 12 },
      labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
    },
  ]

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node<CharacterNodeData>) => {
    setSelectedNodeId(node.id)
    setIsEditingDescription(false)
  }, [])

  const handleAddNode = useCallback(() => {
    if (!newNodeName.trim()) return
    
    const newNode: Node<CharacterNodeData> = {
      id: `node-${Date.now()}`,
      type: 'character',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 400 + 100 },
      data: {
        name: newNodeName.trim(),
        description: newNodeDescription.trim() || 'No description provided.',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
        textColor: 'text-gray-dark',
        iconColor: 'text-blue-600',
      },
    }
    
    setNodes((nds) => [...nds, newNode])
    setSelectedNodeId(newNode.id)
    setNewNodeName('')
    setNewNodeDescription('')
    setShowNewNodeModal(false)
  }, [newNodeName, newNodeDescription, setNodes])

  const handleDeleteNode = useCallback((nodeId: string) => {
    // Remove the node
    setNodes((nds) => nds.filter((node) => node.id !== nodeId))
    
    // Remove all edges connected to this node
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
    
    // Clear selection if this node was selected
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null)
      setIsEditingDescription(false)
    }
  }, [setNodes, setEdges, selectedNodeId])

  const onConnect = useCallback(
    (params: Connection) => {
      // Only create edge if source and target are valid
      if (!params.source || !params.target) {
        return
      }
      const newEdge: Edge = {
        id: `${params.source}-${params.target}-${Date.now()}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle ?? null,
        targetHandle: params.targetHandle ?? null,
        type: 'smoothstep',
        label: 'connected to',
        style: { stroke: '#5B21B6', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#5B21B6',
        },
        labelStyle: { fill: '#5B21B6', fontWeight: 500, fontSize: 12 },
        labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [setEdges]
  )

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
          
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-2 text-sm text-gray">
            <span>World Overview</span>
            <span>/</span>
            <span>Characters</span>
            <span>/</span>
            <span className="text-gray-dark font-medium">King Eldor</span>
          </div>
        </div>

        {/* Header Icons */}
        <div className="flex items-center space-x-4">
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
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
          {/* Project Selector */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                E
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-dark">Eldoria</div>
                <div className="text-sm text-gray flex items-center">
                  Book 1: Legend of Eldoria
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
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
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span>Story Chapters</span>
                  </div>
                  <svg className={`w-4 h-4 transition-transform ${expandedSections['story-chapters'] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {expandedSections['story-chapters'] && (
                  <div className="ml-6 mt-1 space-y-1">
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer">Chapter 1: The Fall of Arion</div>
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer">Chapter 2: Shadows of the...</div>
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer">Chapter 3: The Siege of Eld...</div>
                  </div>
                )}
              </div>

              {/* World Lore */}
              <div>
                <button 
                  onClick={() => toggleSection('world-lore')}
                  className="w-full flex items-center justify-between p-2 hover:bg-gray-light rounded text-sm text-gray-dark"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span>World Lore</span>
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
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <span>Geography</span>
                        </div>
                        <svg className={`w-4 h-4 transition-transform ${expandedSections['geography'] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      {expandedSections['geography'] && (
                        <div className="ml-6 mt-1 space-y-1">
                          <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer">The Eastern Continent</div>
                          <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer">The Silver Sea</div>
                          <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer">The Ruins of Velmor</div>
                        </div>
                      )}
                    </div>
                    <div>
                      <button 
                        onClick={() => toggleSection('factions')}
                        className="w-full flex items-center justify-between p-2 hover:bg-gray-light rounded text-sm text-gray"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <span>Factions</span>
                        </div>
                        <svg className={`w-4 h-4 transition-transform ${expandedSections['factions'] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      {expandedSections['factions'] && (
                        <div className="ml-6 mt-1 space-y-1">
                          <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer">Order of the Flame</div>
                          <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer">The Royal Guard</div>
                          <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer">The Shadow Court</div>
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
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span>Historical Timeline</span>
                  </div>
                  <svg className={`w-4 h-4 transition-transform ${expandedSections['timeline'] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {expandedSections['timeline'] && (
                  <div className="ml-6 mt-1 space-y-1">
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer">Founding of Eldoria</div>
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer">The War of Crowns</div>
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer">Rise of the Flame</div>
                  </div>
                )}
              </div>

              {/* Notes & Ideas */}
              <div>
                <button 
                  onClick={() => toggleSection('notes')}
                  className="w-full flex items-center justify-between p-2 hover:bg-gray-light rounded text-sm text-gray-dark"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span>Notes & Ideas</span>
                  </div>
                  <svg className={`w-4 h-4 transition-transform ${expandedSections['notes'] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {expandedSections['notes'] && (
                  <div className="ml-6 mt-1 space-y-1">
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer">Character Motivations</div>
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer">Plot Threads to Resolve</div>
                    <div className="p-2 text-sm text-gray hover:text-gray-dark cursor-pointer">Future Arc Concepts</div>
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
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Characters</span>
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
                        className={`flex-1 flex items-center space-x-2 p-2 rounded text-sm hover:bg-gray-light transition-colors ${
                          selectedNodeId === node.id ? 'text-gray-dark font-medium' : 'text-gray'
                        }`}
                      >
                        <svg className={`w-4 h-4 ${node.data.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{node.data.name}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Are you sure you want to delete "${node.data.name}"? This will also remove all connections to this entity.`)) {
                            handleDeleteNode(node.id)
                          }
                        }}
                        className="p-1 mr-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity"
                        title="Delete entity"
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
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Locations</span>
                </div>
                <span className="text-xs text-gray">8</span>
              </button>
              <button className="w-full flex items-center justify-between p-2 hover:bg-gray-light rounded text-sm text-gray-dark">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Timeline</span>
                </div>
                <span className="text-xs text-gray">15</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Central Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-gray-light">
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
            <ReactFlow
              nodes={nodes.map(node => ({
                ...node,
                data: {
                  ...node.data,
                  isFocused: node.id === selectedNodeId,
                }
              }))}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              className="bg-gray-light"
              connectionLineStyle={{ stroke: '#5B21B6', strokeWidth: 2 }}
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
            
            {/* New Node Button */}
            <button 
              onClick={() => setShowNewNodeModal(true)}
              className="absolute top-4 left-4 z-10 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-dark hover:bg-gray-light transition-colors flex items-center space-x-2 shadow-sm"
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
                          if (e.key === 'Enter' && newNodeName.trim()) {
                            handleAddNode()
                          }
                        }}
                        autoFocus
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
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-2">
                      <button
                        onClick={handleAddNode}
                        disabled={!newNodeName.trim()}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Create Entity
                      </button>
                      <button
                        onClick={() => {
                          setShowNewNodeModal(false)
                          setNewNodeName('')
                          setNewNodeDescription('')
                        }}
                        className="px-4 py-2 border border-gray-200 text-gray-dark rounded-lg text-sm font-medium hover:bg-gray-light transition-colors"
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
        <aside className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
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
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className={`w-5 h-5 ${selectedNode.data.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <h4 className="font-semibold text-gray-dark">{selectedNode.data.name}</h4>
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
                    </div>
                    {isEditingDescription ? (
                      <div className="space-y-2">
                        <textarea
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          className="w-full bg-gray-light border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-dark placeholder-gray resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={4}
                          placeholder="Enter description..."
                        />
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              // Update the node's description
                              setNodes((nds) =>
                                nds.map((node) =>
                                  node.id === selectedNodeId
                                    ? {
                                        ...node,
                                        data: {
                                          ...node.data,
                                          description: editedDescription,
                                        },
                                      }
                                    : node
                                )
                              )
                              setIsEditingDescription(false)
                            }}
                            className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditedDescription(selectedNode.data.description)
                              setIsEditingDescription(false)
                            }}
                            className="px-3 py-1.5 border border-gray-200 text-gray-dark rounded-lg text-sm font-medium hover:bg-gray-light transition-colors"
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
                            <button
                              key={node.id}
                              onClick={() => {
                                setSelectedNodeId(node.id)
                                setIsEditingDescription(false)
                              }}
                              className="w-full text-left p-2 rounded-lg border border-gray-200 hover:bg-gray-light transition-colors"
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
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${selectedNode.data.name}"? This will also remove all connections to this entity.`)) {
                              handleDeleteNode(selectedNodeId!)
                            }
                          }}
                          className="w-full px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
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
              The king of Eldoria's father is King Arion, who was the king before him. He died 10 years before the Siege of Eldor. Add this to the world lore.
            </div>

            {/* Status */}
            <div className="text-xs text-gray">Lore successfully updated.</div>

            {/* Updates */}
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <div>
                <div className="text-xs text-gray mb-1">New node created:</div>
                <div className="bg-gray-light rounded-lg px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-dark">King Arion (Character)</span>
                  </div>
                  <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray mb-1">Relationships added:</div>
                <div className="space-y-1 text-sm">
                  <div className="text-gray-dark">
                    <span className="text-primary font-medium">King Arion</span> → father of → <span className="text-primary font-medium">King Eldor</span>
                  </div>
                  <div className="text-gray-dark">
                    <span className="text-primary font-medium">Death of King Arion</span> → happens before → <span className="text-primary font-medium">Siege of Eldor</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray mb-1">Timeline update:</div>
                <div className="text-sm text-gray-dark">
                  <span className="text-primary font-medium">Death of King Arion</span> placed 10 years before the <span className="text-primary font-medium">Siege of Eldor</span>.
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <div className="text-xs font-semibold text-gray-dark mb-2">Summary:</div>
                <div className="text-sm text-gray leading-relaxed">
                  A new character node for King Arion has been added to your graph and linked to King Eldor and the Siege of Eldor.
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 bg-gray-light text-gray-dark px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>View New Nodes</span>
                </button>
                <button className="flex-1 bg-gray-light text-gray-dark px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Open Timeline</span>
                </button>
              </div>

              <button className="w-full text-primary text-sm font-medium hover:underline flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Refine Relationship</span>
              </button>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-dark">Review Changes</span>
                  <div className="flex items-center space-x-2">
                    <button className="p-1 hover:bg-gray-light rounded">
                      <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                    <button className="p-1 hover:bg-gray-light rounded">
                      <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6-6m6 6l-6 6" />
                      </svg>
                    </button>
                    <button className="p-1 hover:bg-gray-light rounded">
                      <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
