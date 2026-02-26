/**
 * AI 助手屏幕 - 讯飞星火智能问答
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { askAI } from '../../api/ai';
import { MainTabScreenProps } from '../../navigation/types';
import { colors } from '../../constants';

type Props = MainTabScreenProps<'AIAssistant'>;

// 初始欢迎消息
const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content: '您好！我是酒店预订助手，可以帮您解答关于酒店的问题。您可以问我：\n\n1. 推荐合适的酒店\n2. 酒店设施和入住政策\n3. 价格和优惠信息\n4. 酒店位置和周边环境\n\n请输入您的问题，我会尽力为您解答！',
};

const AIAssistantScreen: React.FC<Props> = ({ navigation }) => {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputText.trim(),
    };

    // 添加用户消息
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    // 添加一个空的助手消息用于流式更新
    const assistantMessageId = messages.length + 1;
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      let fullResponse = '';
      
      await askAI(userMessage.content, (chunk) => {
        fullResponse += chunk;
        // 更新最后一条助手消息
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: 'assistant',
            content: fullResponse,
          };
          return newMessages;
        });
      });
    } catch (error) {
      console.error('AI Error:', error);
      // 更新最后一条消息为错误信息
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: 'assistant',
          content: '抱歉，我遇到了一些问题，请稍后重试。',
        };
        return newMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.role === 'user';
    const isFirstMessage = index === 0 && item.role === 'assistant';

    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}>
        {!isUser && (
          <View style={styles.avatar}>
            <MaterialIcons name="smart-toy" size={24} color={colors.primary} />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.assistantMessageText
          ]}>
            {item.content}
          </Text>
        </View>
        {isUser && (
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={24} color={colors.white} />
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      

      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderMessage}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>AI 正在思考...</Text>
          </View>
        ) : null}
      />

      {/* 输入区域 */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, {
            height: 50,
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
          }]}
          placeholder="请输入您的问题..."
          placeholderTextColor="#999999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          editable={!loading}
          textAlignVertical="bottom"
          
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || loading) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || loading}
          activeOpacity={0.7}
        >
          <View style={styles.sendButtonContent}>
            <MaterialIcons name="send" size={18} color={colors.white} />
          </View>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginLeft: 10,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 15,
    marginHorizontal: 10,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.white,
  },
  assistantMessageText: {
    color: colors.text,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginLeft: 50,
  },
  loadingText: {
    marginLeft: 8,
    color: colors.textSecondary,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    // 添加微妙阴影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    // 添加阴影
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#DADADA',
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default AIAssistantScreen;

