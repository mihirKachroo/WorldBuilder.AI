import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Entity {
  name: string
  description: string
}

interface Relationship {
  source: string
  target: string
  label: string
}

interface ParsedData {
  entities: Entity[]
  relationships: Relationship[]
  answer?: string
  isQuestion?: boolean
}

interface ExistingNode {
  name: string
  description: string
}

// Levenshtein distance for fuzzy string matching
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        )
      }
    }
  }

  return dp[m][n]
}

// Calculate similarity score (0-1, where 1 is identical)
function stringSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  return 1 - distance / maxLen
}

// Find best matching node name using fuzzy matching
function findBestMatch(
  query: string,
  existingNodes: ExistingNode[],
  threshold: number = 0.7
): string | null {
  let bestMatch: { name: string; score: number } | null = null

  for (const node of existingNodes) {
    const score = stringSimilarity(query.toLowerCase(), node.name.toLowerCase())
    if (score >= threshold && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { name: node.name, score }
    }
  }

  return bestMatch ? bestMatch.name : null
}

// Normalize entity names in relationships using fuzzy matching
function normalizeEntityNames(
  entities: Entity[],
  relationships: Relationship[],
  existingNodes: ExistingNode[]
): { entities: Entity[]; relationships: Relationship[] } {
  // First, normalize entity names
  const normalizedEntities = entities.map((entity) => {
    const match = findBestMatch(entity.name, existingNodes)
    return {
      ...entity,
      name: match || entity.name,
    }
  })

  // Then normalize relationship source/target names
  const normalizedRelationships = relationships.map((rel) => {
    const sourceMatch = findBestMatch(rel.source, existingNodes)
    const targetMatch = findBestMatch(rel.target, existingNodes)
    return {
      ...rel,
      source: sourceMatch || rel.source,
      target: targetMatch || rel.target,
    }
  })

  return {
    entities: normalizedEntities,
    relationships: normalizedRelationships,
  }
}

export async function POST(request: Request) {
  try {
    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { text, existingNodes = [], documents = [] } = requestBody

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Validate and filter existing nodes
    const validExistingNodes: ExistingNode[] = Array.isArray(existingNodes)
      ? existingNodes
          .filter((node: any) => node && typeof node === 'object' && node.name)
          .map((node: any) => ({
            name: String(node.name || ''),
            description: String(node.description || ''),
          }))
      : []

    // Validate documents
    const validDocuments: Array<{ name: string; content: string }> = Array.isArray(documents)
      ? documents
          .filter((doc: any) => doc && typeof doc === 'object' && doc.name && doc.content)
          .map((doc: any) => ({
            name: String(doc.name || ''),
            content: String(doc.content || ''),
          }))
      : []

    // Build context from existing nodes
    const existingNodesContext =
      validExistingNodes.length > 0
        ? `\n\nEXISTING ENTITIES IN THE WORLD:\n${validExistingNodes
            .map(
              (node: ExistingNode) =>
                `- ${node.name}: ${node.description || 'No description'}`
            )
            .join('\n')}`
        : ''

    // Build context from selected documents
    const documentsContext =
      validDocuments.length > 0
        ? `\n\nDOCUMENTS PROVIDED BY USER:\n${validDocuments
            .map(
              (doc) =>
                `--- Document: ${doc.name} ---\n${doc.content}\n--- End of ${doc.name} ---`
            )
            .join('\n\n')}`
        : ''

    const systemPrompt = `You are an assistant that helps users manage their fictional world. You can do two things:

1. EXTRACT NEW ENTITIES AND RELATIONSHIPS from text that describes new information
2. ANSWER QUESTIONS about existing entities in the world

IMPORTANT RULES FOR EXTRACTION:
1. Only extract information that is EXPLICITLY stated in the text. Do not infer or add details.
2. For entity descriptions, only include facts directly mentioned in the text.
3. CRITICAL: Extract ALL relationships mentioned in the text, regardless of how they are phrased. Relationships can be expressed in many ways:
   - Direct: "X is the killer of Y" → relationship: {source: "X", target: "Y", label: "killer of"}
   - Possessive: "X's enemy is Y" → relationship: {source: "X", target: "Y", label: "enemy of"}
   - Passive: "Y was killed by X" → relationship: {source: "X", target: "Y", label: "killer of"}
   - Descriptive: "X, who killed Y" → relationship: {source: "X", target: "Y", label: "killer of"}
   - Any other phrasing that indicates a connection between entities
4. Relationship labels should be clear and descriptive (e.g., "killer of", "enemy of", "brother of", "exiled from", "duke of", "ruler of", "servant of", "ally of", "betrayed by", etc.)
5. Use the exact names as they appear in the text (fuzzy matching will handle misspellings).
6. If an entity is mentioned but no description is given, use an empty string for description.
7. If an entity name in the text is a misspelling of an existing entity, still use the name as written - normalization happens separately.
8. When processing documents, extract relationships from the ENTIRE document content, not just the user's query.

IMPORTANT RULES FOR QUESTIONS:
1. If the user is asking a question (e.g., "Who is...?", "What is...?", "Tell me about..."), provide an answer in the "answer" field.
2. Use information from existing entities to answer questions.
3. If the question mentions an entity name that might be misspelled, try to match it to existing entities.
4. If you cannot find information to answer the question, say so clearly.

RESPONSE FORMAT:
- If extracting entities: Return JSON with "entities" (array of {name, description}) and "relationships" (array of {source, target, label}).
- If answering a question: Return JSON with "answer" (string) and "isQuestion": true.
- If both: Include all fields.

Example extraction 1:
Input: "King Eldor's brother is Draco Arion, the Duke of Anverda, who was exiled from Eldoria due to suspected treason."
Output: {
  "entities": [
    {"name": "Draco Arion", "description": "Duke of Anverda. Exiled from Eldoria due to suspected treason."}
  ],
  "relationships": [
    {"source": "King Eldor", "target": "Draco Arion", "label": "brother of"}
  ]
}

Example extraction 2 (with multiple relationship types):
Input: "Lorron Gasku - King of the Orcs, a dangerous enemy to the kingdom of Eldoria. He is the killer of Captain Aris Vorn."
Output: {
  "entities": [
    {"name": "Lorron Gasku", "description": "King of the Orcs. A dangerous enemy to the kingdom of Eldoria. Killer of Captain Aris Vorn."},
    {"name": "Captain Aris Vorn", "description": ""}
  ],
  "relationships": [
    {"source": "Lorron Gasku", "target": "Eldoria", "label": "enemy of"},
    {"source": "Lorron Gasku", "target": "Captain Aris Vorn", "label": "killer of"}
  ]
}

Example extraction 3 (passive voice):
Input: "Captain Aris Vorn was killed by Lorron Gasku during the Battle of Eldoria."
Output: {
  "entities": [
    {"name": "Captain Aris Vorn", "description": "Killed by Lorron Gasku during the Battle of Eldoria."},
    {"name": "Lorron Gasku", "description": ""},
    {"name": "Battle of Eldoria", "description": ""}
  ],
  "relationships": [
    {"source": "Lorron Gasku", "target": "Captain Aris Vorn", "label": "killer of"}
  ]
}

Example question:
Input: "Who is the king of Eldoria?"
Output: {
  "answer": "The current king of Eldoria is King Eldor. He rules from Eldoria Castle and is a member of the Order of the Flame.",
  "isQuestion": true,
  "entities": [],
  "relationships": []
}

CRITICAL INSTRUCTIONS FOR DOCUMENT PROCESSING:
- If documents are provided, you MUST extract ALL entities and relationships from the document content itself.
- Process the ENTIRE document content, not just the user's query text.
- Extract relationships from sentences like "X is the killer of Y", "X killed Y", "Y was killed by X", "X's enemy is Y", etc.
- The user's query text may be a question or instruction, but you should still extract information from the documents.
- Example: If a document contains "Lorron Gasku is the killer of Captain Aris Vorn" and the user asks "Process this document", extract the relationship between Lorron Gasku and Captain Aris Vorn.

${existingNodesContext}${documentsContext}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      return NextResponse.json(
        { error: 'No response from OpenAI' },
        { status: 500 }
      )
    }

    let parsedData: any
    try {
      parsedData = JSON.parse(responseContent)
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError)
      console.error('Response content:', responseContent)
      return NextResponse.json(
        { error: 'Invalid JSON response from OpenAI', details: responseContent.substring(0, 200) },
        { status: 500 }
      )
    }

    // Normalize the response structure - ensure entities and relationships are arrays
    const normalizedData: ParsedData = {
      entities: Array.isArray(parsedData.entities) ? parsedData.entities : [],
      relationships: Array.isArray(parsedData.relationships) ? parsedData.relationships : [],
      answer: parsedData.answer || undefined,
      isQuestion: parsedData.isQuestion || false,
    }

    // Log the response for debugging
    console.log('OpenAI response:', JSON.stringify(normalizedData, null, 2))

    // Normalize entity names using fuzzy matching if we have existing nodes
    if (validExistingNodes.length > 0 && normalizedData.entities.length > 0) {
      const normalized = normalizeEntityNames(
        normalizedData.entities,
        normalizedData.relationships,
        validExistingNodes
      )
      normalizedData.entities = normalized.entities
      normalizedData.relationships = normalized.relationships
    }

    return NextResponse.json(normalizedData)
  } catch (error) {
    console.error('Error parsing entities:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      { 
        error: 'Failed to parse entities',
        details: errorMessage 
      },
      { status: 500 }
    )
  }
}

