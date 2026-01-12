import OpenAI from 'openai'
import { z } from 'zod'
import { getDb } from '../../utils/db'
import { entities } from '../../database/schema'
import { eq } from 'drizzle-orm'

const classifySchema = z.object({
  description: z.string().min(1),
  imageUrl: z.string().url().optional()
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const config = useRuntimeConfig()
  if (!config.openaiApiKey) {
    throw createError({ statusCode: 500, message: 'OpenAI API key not configured' })
  }

  const body = await readBody(event)
  const validated = classifySchema.parse(body)

  const db = getDb()
  const allEntities = await db
    .select()
    .from(entities)
    .where(eq(entities.isActive, true))

  if (allEntities.length === 0) {
    return { entityId: null, confidence: 0, reason: 'No entities available' }
  }

  const entitiesContext = allEntities.map(e => ({
    id: e.id,
    name: e.name,
    description: e.description,
    keywords: e.keywords
  }))

  const openai = new OpenAI({ apiKey: config.openaiApiKey })

  const systemPrompt = `You are an AI assistant that classifies citizen issues to the appropriate government department.

Available departments:
${JSON.stringify(entitiesContext, null, 2)}

Based on the issue description (and image if provided), determine which department should handle this issue.

Respond ONLY with valid JSON in this exact format:
{
  "entityId": "uuid-of-the-best-matching-department",
  "confidence": 0.85,
  "reason": "Brief explanation of why this department was chosen"
}

If no department is a good match, set entityId to null and confidence to 0.`

  try {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt }
    ]

    if (validated.imageUrl) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: `Issue description: ${validated.description}` },
          { type: 'image_url', image_url: { url: validated.imageUrl, detail: 'low' } }
        ]
      })
    } else {
      messages.push({
        role: 'user',
        content: `Issue description: ${validated.description}`
      })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      response_format: { type: 'json_object' },
      max_tokens: 200,
      temperature: 0.3
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('Empty response from OpenAI')
    }

    const result = JSON.parse(responseText)

    const validEntityId = result.entityId && allEntities.some(e => e.id === result.entityId)
      ? result.entityId
      : null

    return {
      entityId: validEntityId,
      confidence: Math.min(1, Math.max(0, result.confidence || 0)),
      reason: result.reason || 'No reason provided'
    }
  } catch (error) {
    console.error('OpenAI classification error:', error)
    throw createError({ statusCode: 500, message: 'Failed to classify issue' })
  }
})
