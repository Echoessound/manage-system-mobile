/**
 * AI 助手 API - 调用后端代理接口
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '../constants';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * 调用后端 AI 聊天接口
 */
export async function chatWithAI(
  messages: Message[],
  onChunk?: (content: string) => void
): Promise<string> {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
  if (!token) {
    throw new Error('未登录');
  }

  const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      messages: messages.filter(m => m.role !== 'system'),
    }),
  });

  const data = await response.json();

  let content = '';
  if (data.success === true && data.message) {
    content = data.message;
  } else if (data.code === 200 && data.data?.message?.content) {
    content = data.data.message.content;
  } else {
    throw new Error(data.message || data.error || 'AI 服务错误');
  }

  onChunk?.(content);
  return content;
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

