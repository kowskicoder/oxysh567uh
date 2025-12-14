import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/hooks/useWebSocket";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface ChatMessage {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profileImageUrl?: string;
    isTelegramUser?: boolean;
  };
  message: string;
  createdAt: string;
  source?: 'betchat' | 'telegram';
}

export function LiveChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineCount, setOnlineCount] = useState(234);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [telegramStatus, setTelegramStatus] = useState({ enabled: false, connected: false });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Fetch initial messages
  const { data: initialMessages } = useQuery({
    queryKey: ['global-chat-messages'],
    queryFn: () => apiRequest('/api/chat/messages'),
  });

  // Fetch Telegram status
  const { data: telegramStatusData } = useQuery({
    queryKey: ['telegram-status'],
    queryFn: () => apiRequest('/api/telegram/status'),
    refetchInterval: 30000, // Check every 30 seconds
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages.reverse()); // Reverse to show newest at bottom
    }
  }, [initialMessages]);

  useEffect(() => {
    if (telegramStatusData) {
      setTelegramStatus(telegramStatusData);
    }
  }, [telegramStatusData]);
  
  const { sendMessage: sendWebSocketMessage, isConnected } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'chat_message') {
        setMessages(prev => [...prev, data.message].slice(-50)); // Keep last 50 messages
      } else if (data.type === 'user_typing') {
        setTypingUsers(prev => [...prev.filter(u => u !== data.userId), data.userId]);
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u !== data.userId));
        }, 3000);
      } else if (data.type === 'online_count') {
        setOnlineCount(data.count);
      }
    },
    channel: 'global-chat'
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      // Send message via API (which handles both BetChat and Telegram sync)
      await apiRequest('/api/chat/messages', {
        method: 'POST',
        body: { message: newMessage.trim() }
      });
      
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    } else {
      // Send typing indicator
      sendMessage({
        type: 'user_typing',
        userId: 'current_user'
      });
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 theme-transition">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg">Live Chat 💬</CardTitle>
            {telegramStatus.enabled && (
              <Badge variant={telegramStatus.connected ? "default" : "secondary"} className="text-xs">
                <i className="fab fa-telegram-plane mr-1"></i>
                {telegramStatus.connected ? "Synced" : "Connecting"}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {onlineCount} online
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="h-80 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400 py-8">
              <i className="fas fa-comments text-2xl mb-2"></i>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="flex space-x-2">
                <Avatar className="w-6 h-6 flex-shrink-0">
                  <AvatarImage 
                    src={message.user.profileImageUrl || undefined} 
                    alt={message.user.firstName || message.user.username || 'User'} 
                  />
                  <AvatarFallback className={`text-xs ${message.user.isTelegramUser ? 'bg-blue-100 text-blue-600' : ''}`}>
                    {message.user.isTelegramUser ? '📱' : (message.user.firstName?.[0] || message.user.username?.[0] || 'U').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {message.user.firstName || message.user.username || 'Anonymous'}
                    </span>
                    {message.source === 'telegram' && (
                      <Badge variant="outline" className="text-xs">
                        <i className="fab fa-telegram-plane mr-1"></i>
                        Telegram
                      </Badge>
                    )}
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 break-words">
                    {message.message}
                  </p>
                </div>
              </div>
            ))
          )}
          
          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <div className="flex space-x-2">
              <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400 italic">
                    {typingUsers.length === 1 ? 'Someone is' : `${typingUsers.length} people are`} typing...
                  </span>
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 theme-transition"
              disabled={!isConnected}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !isConnected}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <i className="fas fa-paper-plane"></i>
            </Button>
          </div>
          {!isConnected && (
            <p className="text-xs text-red-500 mt-1">Disconnected - trying to reconnect...</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
