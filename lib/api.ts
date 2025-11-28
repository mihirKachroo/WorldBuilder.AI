/**
 * API utility functions for communicating with the backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000'

export interface ApiError {
  message: string
  status?: number
}

/**
 * Get the authentication token from localStorage
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

/**
 * Make an authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An error occurred' }))
    const error: ApiError = {
      message: errorData.message || `HTTP error! status: ${response.status}`,
      status: response.status,
    }
    
    // Handle authentication errors
    if (response.status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    
    throw error
  }

  return response.json()
}

// ==================== PROJECTS ====================

export interface Project {
  id: number
  user_id: number
  name: string
  description?: string
  created_at?: string
  updated_at?: string
}

export async function getProjects(): Promise<Project[]> {
  return apiRequest<Project[]>('/api/projects')
}

export async function createProject(name: string, description?: string): Promise<Project> {
  return apiRequest<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  })
}

export async function getProject(projectId: number): Promise<Project> {
  return apiRequest<Project>(`/api/projects/${projectId}`)
}

// ==================== CHARACTERS ====================

export interface Character {
  id: number
  project_id: number
  name: string
  description?: string
  position?: { x: number; y: number } | null
  colors?: {
    bg?: string
    border?: string
    text?: string
    icon?: string
  }
  metadata?: Record<string, any>
  created_at?: string
  updated_at?: string
  relationships?: {
    outgoing: Relationship[]
    incoming: Relationship[]
  }
}

export async function getCharacters(projectId: number): Promise<Character[]> {
  return apiRequest<Character[]>(`/api/projects/${projectId}/characters`)
}

export async function getCharacter(projectId: number, characterId: number): Promise<Character> {
  return apiRequest<Character>(`/api/projects/${projectId}/characters/${characterId}`)
}

export async function createCharacter(
  projectId: number,
  character: {
    name: string
    description?: string
    position?: { x: number; y: number }
    colors?: {
      bg?: string
      border?: string
      text?: string
      icon?: string
    }
    metadata?: Record<string, any>
  }
): Promise<Character> {
  return apiRequest<Character>(`/api/projects/${projectId}/characters`, {
    method: 'POST',
    body: JSON.stringify(character),
  })
}

export async function updateCharacter(
  projectId: number,
  characterId: number,
  updates: {
    name?: string
    description?: string
    position?: { x: number; y: number }
    colors?: {
      bg?: string
      border?: string
      text?: string
      icon?: string
    }
    metadata?: Record<string, any>
  }
): Promise<Character> {
  return apiRequest<Character>(`/api/projects/${projectId}/characters/${characterId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function deleteCharacter(projectId: number, characterId: number): Promise<void> {
  return apiRequest<void>(`/api/projects/${projectId}/characters/${characterId}`, {
    method: 'DELETE',
  })
}

// ==================== RELATIONSHIPS ====================

export interface Relationship {
  id: number
  project_id: number
  source_character_id: number
  target_character_id: number
  source_character_name?: string
  target_character_name?: string
  label?: string
  relationship_type_id?: number
  metadata?: Record<string, any>
  created_at?: string
}

export async function getRelationships(projectId: number): Promise<Relationship[]> {
  return apiRequest<Relationship[]>(`/api/projects/${projectId}/relationships`)
}

export async function createRelationship(
  projectId: number,
  relationship: {
    source_character_id: number
    target_character_id: number
    label?: string
    relationship_type_id?: number
    metadata?: Record<string, any>
  }
): Promise<Relationship> {
  return apiRequest<Relationship>(`/api/projects/${projectId}/relationships`, {
    method: 'POST',
    body: JSON.stringify(relationship),
  })
}

export async function updateRelationship(
  projectId: number,
  relationshipId: number,
  updates: {
    label?: string
    relationship_type_id?: number
    metadata?: Record<string, any>
  }
): Promise<Relationship> {
  return apiRequest<Relationship>(`/api/projects/${projectId}/relationships/${relationshipId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function deleteRelationship(projectId: number, relationshipId: number): Promise<void> {
  return apiRequest<void>(`/api/projects/${projectId}/relationships/${relationshipId}`, {
    method: 'DELETE',
  })
}

