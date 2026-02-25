/**
 * AI 助手 API - 调用后端代理接口
 */

import axios from 'axios';
import { Message } from './spark';

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * 调用后端 AI 聊天接口
 */
export async function chatWithAI(
  messages: Message[],
  onChunk?: (content: string) => void
): Promise<string> {
  try {
    const response = await axios.post(`${API_BASE_URL}/ai/chat`, {
      messages: messages.filter(m => m.role !== 'system'),
    });

    if (response.data.code === 200) {
      const content = response.data.data.message.content;
      onChunk?.(content);
      return content;
    } else {
      throw new Error(response.data.message || 'AI 服务错误');
    }
  } catch (error: any) {
    console.error('AI API Error:', error);
    throw new Error(error.response?.data?.message || error.message || '请求失败');
  }
}

/**
 * 简化版本 - 发送单条消息获取回复
 */
export async function askAI(
  question: string,
  onChunk?: (content: string) => void
): Promise<string> {
  const messages: Message[] = [
    { role: 'user', content: question },
  ];

  return chatWithAI(messages, onChunk);
}

// 导出类型供其他模块使用
export { Message };

