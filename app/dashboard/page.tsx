'use client'

import { useState, useCallback } from 'react'
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
      className={`rounded-lg p-3 shadow-sm w-48 ${data.bgColor} ${data.borderColor} ${
        data.isFocused ? 'border-2 shadow-md' : 'border'
      }`}
    >
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
      <p className="text-xs text-gray">{data.description}</p>
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
  })
  const [selectedConversation, setSelectedConversation] = useState('king-of-eldoria')

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
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
        description: 'Former healer from the eastern isles, queen of Eldoria.',
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
        description: "The current ruler of Eldoria, known for uniting the realm after his father's death.",
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
        description: "Heir to the throne; idealistic but conflicted about his father's rule.",
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
        description: 'Commander of the Royal Guard; Loyal to Eldor since the Great War.',
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
        description: "Advisor and former knight; Once served in the Order of the Flame; now Eldor's chief strategist.",
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
      source: 'king-arion',
      target: 'king-eldor',
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
      id: 'arion-selara',
      source: 'king-arion',
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
      source: 'mira-valen',
      target: 'king-eldor',
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

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
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
              WorldBuilder<span className="text-primary">.ai</span>
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
              <h3 className="font-semibold text-gray-dark">Documents</h3>
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
              <h3 className="font-semibold text-gray-dark">Entities</h3>
              <button className="p-1 hover:bg-gray-light rounded text-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-1">
              <button className="w-full flex items-center justify-between p-2 hover:bg-gray-light rounded text-sm text-gray-dark">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Characters</span>
                </div>
                <span className="text-xs text-gray">12</span>
              </button>
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
                  <span>Events</span>
                </div>
                <span className="text-xs text-gray">15</span>
              </button>
              <button className="w-full flex items-center justify-between p-2 hover:bg-gray-light rounded text-sm text-gray-dark">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Factions</span>
                </div>
                <span className="text-xs text-gray">4</span>
              </button>
              <button className="w-full flex items-center justify-between p-2 hover:bg-gray-light rounded text-sm text-gray-dark">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                  </svg>
                  <span>Artifacts</span>
                </div>
                <span className="text-xs text-gray">6</span>
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
                Geography
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
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              className="bg-gray-light"
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
            <button className="absolute top-4 left-4 z-10 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-dark hover:bg-gray-light transition-colors flex items-center space-x-2 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>+ New Node</span>
            </button>
          </div>
        </main>

        {/* Right Sidebar - AI Assistant */}
        <aside className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
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
        </aside>
      </div>
    </div>
  )
}
