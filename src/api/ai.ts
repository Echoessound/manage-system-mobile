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

    // 支持两种响应格式
    // 格式1: { success: true, message: "..." } (当前后端返回)
    // 格式2: { code: 200, data: { message: { content: "..." } } }
    let content = '';
    
    if (response.data.success === true && response.data.message) {
      // 新格式
      content = response.data.message;
    } else if (response.data.code === 200 && response.data.data?.message?.content) {
      // 旧格式
      content = response.data.data.message.content;
    } else {
      throw new Error(response.data.message || 'AI 服务错误');
    }

    onChunk?.(content);
    return content;
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

