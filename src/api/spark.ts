/**
 * 讯飞星火大模型 API
 */

import CryptoJS from 'crypto-js';

// API 配置
const SPARK_CONFIG = {
  appId: '8c1cd4b7eedcbbc67bb3e50552362943',
  apiKey: 'ZDZlM2ViNGZlNWMyMDY5ZDliYTE2YzVi',
  apiHost: 'maas-api.cn-huabei-1.xf-yun.com',
  apiPath: '/v2/chat',
};

// 鉴权参数
const AUTH_SECRET = 'YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXo=';

/**
 * 生成鉴权 URL
 */
function getAuthUrl(): string {
  const now = new Date();
  const date = now.toUTCString();

  // 拼接原始签名字符串
  const signatureOrigin = `host: ${SPARK_CONFIG.apiHost}\ndate: ${date}\nGET ${SPARK_CONFIG.apiPath} HTTP/1.1`;

  // HMAC-SHA256 签名
  const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, AUTH_SECRET);
  const signatureShaBase64 = CryptoJS.enc.Base64.stringify(signatureSha);

  // 构造 Authorization
  const authorizationOrigin = `api_key="${SPARK_CONFIG.apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureShaBase64}"`;
  const authorization = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(authorizationOrigin));

  // 拼接最终 URL
  const url = `wss://${SPARK_CONFIG.apiHost}${SPARK_CONFIG.apiPath}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(SPARK_CONFIG.apiHost)}`;

  return url;
}

/**
 * 消息类型
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * 调用讯飞星火 API (使用 WebSocket)
 */
export async function chatWithSpark(
  messages: Message[],
  onChunk?: (content: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const wsUrl = getAuthUrl();
    const ws = new WebSocket(wsUrl);

    let fullContent = '';

    ws.onopen = () => {
      const params = {
        header: {
          app_id: SPARK_CONFIG.appId,
        },
        parameter: {
          chat: {
            domain: 'generalv3.5',
            temperature: 0.5,
            max_tokens: 2048,
          },
        },
        payload: {
          message: {
            text: messages,
          },
        },
      };
      ws.send(JSON.stringify(params));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.header.code !== 0) {
          reject(new Error(`API error: ${data.header.message}`));
          return;
        }

        const content = data.payload.choices.text[0]?.content || '';
        fullContent += content;
        onChunk?.(content);
      } catch (e) {
        console.error('Parse error:', e);
      }
    };

    ws.onerror = (error) => {
      reject(error);
    };

    ws.onclose = () => {
      resolve(fullContent);
    };
  });
}

/**
 * 简化版本 - 发送单条消息获取回复
 */
export async function askSpark(
  question: string,
  onChunk?: (content: string) => void
): Promise<string> {
  const systemPrompt = `你是一个酒店预订助手，专门帮助用户解答关于酒店的问题。请用中文回答用户的问题。

你可以帮助用户：
1. 推荐合适的酒店
2. 解答酒店设施、入住退房政策等问题
3. 提供酒店价格信息
4. 介绍酒店位置和周边环境
5. 回答会员权益和优惠相关问题

请用友好、专业的语气回答问题。如果不确定某些信息，请告知用户建议直接联系酒店确认。`;

  const messages: Message[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: question },
  ];

  return chatWithSpark(messages, onChunk);
}

