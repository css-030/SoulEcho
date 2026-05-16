import OpenAI from 'openai'

import type { MonthlyEmotionStats } from '@/types/emotion'
import type { Message } from '@/types/message'
import type { ChatContext, MomoResponse } from '@/types/momo'

import { normalizeMomoResponse } from './normalizeMomoResponse'
import { PromptBuilder } from './PromptBuilder'
import { fallbackMomoResponse, validateMomoResponse } from './validateMomoResponse'

const MODEL = 'gpt-4o'

export class MomoService {
  private readonly client: OpenAI | null
  private readonly promptBuilder = new PromptBuilder()

  constructor(apiKey: string) {
    this.client = apiKey
      ? new OpenAI({
          apiKey,
          dangerouslyAllowBrowser: true
        })
      : null
  }

  async chat(userMessage: string, context: ChatContext): Promise<MomoResponse> {
    if (!this.client) {
      return normalizeMomoResponse({
        ...fallbackMomoResponse,
        say: '我已经在这里啦。只是现在还没有配置 OpenAI API Key，所以暂时不能真正思考回复。'
      })
    }

    try {
      const systemPrompt = this.promptBuilder.buildChatSystemPrompt(context)
      const response = await this.client.chat.completions.create({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.buildConversationHistory(context.recentMessages),
          { role: 'user', content: userMessage }
        ]
      })

      return this.parseJsonResponse(response.choices[0]?.message.content)
    } catch (error) {
      return this.buildApiErrorResponse(error)
    }
  }

  async greet(context: ChatContext): Promise<MomoResponse> {
    if (!this.client) {
      return normalizeMomoResponse({
        ...fallbackMomoResponse,
        say: `欢迎回来，${context.settings.userNickname}。我在这里陪你，等 API Key 配好以后，我们就可以正式聊天了。`
      })
    }

    try {
      const systemPrompt = this.promptBuilder.buildGreetingSystemPrompt(context)
      const response = await this.client.chat.completions.create({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: systemPrompt }]
      })

      return this.parseJsonResponse(response.choices[0]?.message.content)
    } catch (error) {
      return this.buildApiErrorResponse(error)
    }
  }

  async generateMonthlyReport(stats: MonthlyEmotionStats): Promise<string> {
    if (!this.client) {
      return '这个月的情绪还在慢慢长出来。等 API Key 配好后，我会帮你读一读这些细小的变化。'
    }

    const response = await this.client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'system', content: this.promptBuilder.buildMonthlyReportSystemPrompt(stats) }]
    })

    return response.choices[0]?.message.content ?? ''
  }

  async generateLongTermMemory(messages: Message[], previousMemory: string): Promise<string> {
    if (!this.client || messages.length === 0) {
      return previousMemory
    }

    const response = await this.client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `请根据以下用户与 momo 的对话历史，生成一份 200-400 字的用户长期画像摘要。用第三人称“用户”，客观描述，不评判。

上次摘要：
${previousMemory || '暂无'}

对话历史：
${messages.map((message) => `${message.role}: ${message.content}`).join('\n')}`
        }
      ]
    })

    return response.choices[0]?.message.content ?? previousMemory
  }

  private buildConversationHistory(messages: Message[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return messages
      .filter((message) => message.type === 'text' && message.role !== 'system')
      .slice(-12)
      .map((message) => ({
        role: message.role === 'momo' ? 'assistant' : 'user',
        content: message.content
      }))
  }

  private parseJsonResponse(content: string | null | undefined): MomoResponse {
    try {
      const parsed = JSON.parse(content ?? '{}')
      const validated = validateMomoResponse(parsed)
      return normalizeMomoResponse(validated)
    } catch {
      return normalizeMomoResponse(fallbackMomoResponse)
    }
  }

  private buildApiErrorResponse(error: unknown): MomoResponse {
    const status = error instanceof OpenAI.APIError ? error.status : undefined
    const message =
      status === 401
        ? 'OpenAI API Key 好像没有通过验证。你可以检查一下 `.env.local` 里的 Key 是否完整。'
        : status === 429
          ? 'OpenAI 现在拒绝了这次请求，通常是额度不足、计费未开通，或者短时间请求太多。你可以稍等一下，或者去 OpenAI 后台看一下用量和额度。'
          : '我连 OpenAI 的时候有点不顺。你可以检查一下网络，或者稍后再试一次。'

    return normalizeMomoResponse({
      ...fallbackMomoResponse,
      say: message
    })
  }
}
