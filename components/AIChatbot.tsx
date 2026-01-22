// AI Chatbot Component - Comprehensive AI Assistant for casewhr.com
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatbotProps {
  language?: 'en' | 'zh-TW' | 'zh-CN';
  userId?: string;
  accessToken?: string;
}

const AIChatbot: React.FC<AIChatbotProps> = ({ 
  language = 'zh-TW', 
  userId,
  accessToken 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevLanguageRef = useRef(language);

  // Welcome messages by language
  const welcomeMessages = {
    'en': '👋 Hello! I\'m **casewhr.com Smart Customer Service**.\n\nI can help you with:\n\n💼 Platform features & how-to guides\n📝 Writing project descriptions\n💡 Proposal writing tips\n🔄 Translation services\n🎯 Budget estimation & recommendations\n\nHow can I assist you today?',
    'zh-TW': '👋 您好！我是 **casewhr.com 智能客服助手**。\n\n我可以幫助您：\n\n💼 平台功能與使用教學\n📝 撰寫專案描述\n💡 提案撰寫建議\n🔄 翻譯服務\n🎯 預算估算與建議\n\n請問有什麼我可以幫助您的嗎？',
    'zh-CN': '👋 您好！我是 **casewhr.com 智能客服助手**。\n\n我可以帮助您：\n\n💼 平台功能与使用教学\n📝 撰写项目描述\n💡 提案撰写建议\n🔄 翻译服务\n🎯 预算估算与建议\n\n请问有什么我可以帮助您的吗？'
  };

  // Watch for language changes from parent (main page)
  useEffect(() => {
    if (prevLanguageRef.current !== language) {
      prevLanguageRef.current = language;
      
      // Reset chat with new language welcome message when language changes
      if (messages.length > 0) {
        setMessages([{
          role: 'assistant',
          content: welcomeMessages[language],
          timestamp: new Date()
        }]);
      }
      
      // Reload suggestions in new language
      setSuggestions([]);
      setShowAllSuggestions(false);
      
      // Show notification that language changed
      if (isOpen) {
        toast.success(
          language === 'en' 
            ? '🌐 Language changed to English' 
            : language === 'zh-CN'
            ? '🌐 语言已切换至简体中文'
            : '🌐 語言已切換至繁體中文'
        );
      }
    }
  }, [language, isOpen]);

  // Load suggestions when language changes or chatbot opens
  useEffect(() => {
    if (isOpen) {
      loadSuggestions();
    }
  }, [isOpen, language]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: welcomeMessages[language],
        timestamp: new Date()
      }]);
    }
  }, [isOpen]);

  const loadSuggestions = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/chatbot/suggestions?language=${language}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      ).catch((error) => {
        console.error('❌ [AIChatbot] Failed to load suggestions:', error);
        return null;
      });

      if (response && response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to load chatbot suggestions:', error);
    }
  };

  const sendMessage = async (content?: string) => {
    const messageContent = content || inputMessage.trim();
    
    if (!messageContent) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare conversation history (last 10 messages)
      const conversationHistory = [...messages, userMessage]
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-215f78a5/chatbot/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            messages: conversationHistory,
            language,
            userId
          })
        }
      ).catch((error) => {
        console.error('❌ [AIChatbot] Chat request failed:', error);
        return null;
      });

      if (!response || !response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error(
        language === 'en' 
          ? 'Failed to get response. Please try again.' 
          : '無法獲取回應，請重試。'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Remove emoji from suggestion before sending
    const cleanSuggestion = suggestion.replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, '');
    sendMessage(cleanSuggestion);
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: welcomeMessages[language],
      timestamp: new Date()
    }]);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {/* 文字标签 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg animate-bounce">
          <p className="text-sm font-medium whitespace-nowrap">
            {language === 'en' ? '🤖 Smart Customer Service' : language === 'zh-CN' ? '🤖 智能客服' : '🤖 智能客服'}
          </p>
        </div>
        
        {/* 浮动按钮 */}
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-110"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col bg-white">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg pb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="h-5 w-5" />
              {language === 'en' ? '🤖 Smart Customer Service' : language === 'zh-CN' ? '🤖 智能客服' : '🤖 智能客服'}
            </CardTitle>
            <p className="text-xs text-white/90 mt-1">
              {language === 'en' 
                ? '24/7 AI-Powered Support | GPT-4' 
                : language === 'zh-CN'
                ? '24/7 AI 智能支援 | GPT-4'
                : '24/7 AI 智能支援 | GPT-4'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-white hover:bg-white/20 h-8"
            >
              {language === 'en' ? 'Clear' : language === 'zh-CN' ? '清空' : '清除'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Quick Suggestions */}
        {messages.length === 1 && suggestions.length > 0 && (
          <div className="px-4 py-3 border-t bg-gray-50 max-h-48 overflow-y-auto">
            <p className="text-xs font-medium text-gray-600 mb-2">
              {language === 'en' ? '💡 Quick Suggestions:' : language === 'zh-CN' ? '💡 快速建议：' : '💡 快速建議：'}
            </p>
            <div className="flex flex-wrap gap-2">
              {(showAllSuggestions ? suggestions : suggestions.slice(0, 6)).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs h-auto py-1.5 px-3 whitespace-normal text-left"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
            {suggestions.length > 6 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                className="text-xs mt-2 text-blue-600 hover:text-blue-700 w-full"
              >
                <ChevronDown className={`h-3 w-3 mr-1 transition-transform ${showAllSuggestions ? 'rotate-180' : ''}`} />
                {showAllSuggestions 
                  ? (language === 'en' ? 'Show Less' : language === 'zh-CN' ? '收起' : '收起')
                  : (language === 'en' ? `Show All (${suggestions.length})` : language === 'zh-CN' ? `显示全部 (${suggestions.length})` : `顯示全部 (${suggestions.length})`)}
              </Button>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
              placeholder={
                language === 'en' 
                  ? 'Type your message...' 
                  : language === 'zh-CN'
                  ? '输入您的消息...'
                  : '輸入您的訊息...'
              }
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIChatbot;