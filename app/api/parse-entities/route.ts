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
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

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

    const systemPrompt = `You are an assistant that extracts entities and relationships from natural language text about a fictional world.

IMPORTANT RULES:
1. Only extract information that is EXPLICITLY stated in the text. Do not infer or add details.
2. For entity descriptions, only include facts directly mentioned in the text.
3. If a relationship is mentioned, extract it with an appropriate label (e.g., "brother of", "exiled from", "duke of").
4. Return a JSON object with "entities" (array of {name, description}) and "relationships" (array of {source, target, label}).
5. Use the exact names as they appear in the text.
6. If an entity is mentioned but no description is given, use an empty string for description.

Example:
Input: "King Eldor's brother is Draco Arion, the Duke of Anverda, who was exiled from Eldoria due to suspected treason."
Output: {
  "entities": [
    {"name": "Draco Arion", "description": "Duke of Anverda. Exiled from Eldoria due to suspected treason."}
  ],
  "relationships": [
    {"source": "King Eldor", "target": "Draco Arion", "label": "brother of"}
  ]
}`

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

    const parsedData: ParsedData = JSON.parse(responseContent)

    // Validate the response structure
    if (!Array.isArray(parsedData.entities) || !Array.isArray(parsedData.relationships)) {
      return NextResponse.json(
        { error: 'Invalid response format from OpenAI' },
        { status: 500 }
      )
    }

    return NextResponse.json(parsedData)
  } catch (error) {
    console.error('Error parsing entities:', error)
    return NextResponse.json(
      { error: 'Failed to parse entities' },
      { status: 500 }
    )
  }
}

