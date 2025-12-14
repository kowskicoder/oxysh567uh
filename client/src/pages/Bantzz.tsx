
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User, Sparkles, MessageSquare, Zap, Minimize2, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function Bantzz() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hey there! 👋 I'm Bantzz, your AI assistant for Bantah. I can help you with betting strategies, event analysis, challenge tips, wallet management, and answer any questions about the platform. What would you like to explore today?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleMinimizeToModal = () => {
    setLocation('/'); // Go back to main app where the modal will be available
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Simulate typing delay for more realistic AI experience
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: generateAdvancedAIResponse(inputMessage),
          isUser: false,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsLoading(false);
      }, Math.random() * 1000 + 800); // Random delay between 800-1800ms
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const generateAdvancedAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Betting and Events
    if (input.includes('bet') || input.includes('event') || input.includes('predict')) {
      return "🎯 **Smart Betting Tips:**\n\n• Research event details and historical data\n• Start with smaller amounts to test strategies\n• Diversify across different event categories\n• Use the event chat to gather community insights\n• Set profit targets and stick to them\n\n💡 **Pro Tip:** Check the YES/NO pool ratios before betting - they indicate community sentiment!";
    }
    
    // Challenges
    else if (input.includes('challenge') || input.includes('1v1') || input.includes('compete')) {
      return "⚔️ **Challenge Mastery Guide:**\n\n• Choose opponents with similar skill levels\n• Study their betting history in their profile\n• Start with lower stakes to minimize risk\n• Use private challenges for friends\n• Set clear terms and deadlines\n\n🏆 **Strategy:** Create challenges on topics you're knowledgeable about for better winning chances!";
    }
    
    // Wallet and Money Management
    else if (input.includes('wallet') || input.includes('coin') || input.includes('money') || input.includes('balance')) {
      return "💰 **Wallet Management Pro Tips:**\n\n• Track your transaction history regularly\n• Set daily/weekly spending limits\n• Use daily sign-ins for free coins\n• Refer friends for bonus rewards\n• Keep some balance for surprise opportunities\n\n📊 **Tip:** Your wallet shows real-time balance - use it to make informed betting decisions!";
    }
    
    // Strategy and Tips
    else if (input.includes('strategy') || input.includes('win') || input.includes('tips') || input.includes('advice')) {
      return "🧠 **Winning Strategies:**\n\n**For Events:**\n• Analyze event categories you know best\n• Follow trending events for higher activity\n• Join event chats for insider perspectives\n\n**For Challenges:**\n• Challenge friends on familiar topics\n• Set reasonable stakes you can afford\n• Use evidence-based arguments\n\n**General:**\n• Build your level through consistent activity\n• Network with successful players\n• Learn from losses, celebrate wins responsibly";
    }
    
    // Platform Features
    else if (input.includes('level') || input.includes('rank') || input.includes('badge') || input.includes('achievement')) {
      return "🌟 **Leveling System Guide:**\n\n• Earn XP through betting, creating events, and social interactions\n• Higher levels unlock exclusive features\n• Badges showcase your achievements\n• Consistent daily activity boosts progress\n• Participate in community events for bonus XP\n\n🎖️ **Current Level Benefits:** Check your profile to see your progress and available rewards!";
    }
    
    // Social Features
    else if (input.includes('friend') || input.includes('social') || input.includes('community')) {
      return "👥 **Social Features Guide:**\n\n• Add friends to compare performance\n• Join event discussions for insights\n• Share successful predictions\n• Create friend-only private events\n• Use the leaderboard to find top players\n\n🤝 **Community Tip:** Engaging with others increases your network and learning opportunities!";
    }
    
    // Technical Help
    else if (input.includes('help') || input.includes('how') || input.includes('tutorial') || input.includes('guide')) {
      return "📚 **Need Help? I've got you covered:**\n\n**Quick Actions:**\n• 🎲 Create Event: Go to Events → Create\n• ⚔️ Start Challenge: Visit Challenges page\n• 💰 Check Wallet: Click wallet balance in header\n• 🔔 Notifications: Bell icon for updates\n• 👤 Profile: Manage your account settings\n\n**Need specific help?** Just ask me about any feature and I'll guide you through it step by step!";
    }
    
    // Greetings
    else if (input.includes('hello') || input.includes('hi') || input.includes('hey') || input.includes('good')) {
      return "Hey there! 😊 Great to see you on Bantah! I'm here to help you make the most of your betting and challenging experience.\n\n**Quick question:** What brings you here today?\n\n• 🎯 Looking for betting strategies?\n• ⚔️ Want to dominate challenges?\n• 💰 Need wallet management tips?\n• 🤔 Just exploring the platform?\n\nI'm ready to help with whatever you need!";
    }
    
    // Default intelligent response
    else {
      const responses = [
        "That's an interesting question! While I specialize in Bantah-related topics, I can definitely help you with:\n\n• Event betting strategies and analysis\n• Challenge creation and management\n• Wallet optimization tips\n• Platform features and navigation\n• Community engagement strategies\n\n**What specific aspect of Bantah would you like to explore?**",
        
        "I'm constantly learning to better assist Bantah users! Here's what I can help you with right now:\n\n🎯 **Betting:** Event analysis, odds interpretation, portfolio management\n⚔️ **Challenges:** 1v1 strategies, friend competitions, stake management\n💰 **Finance:** Wallet tracking, earning opportunities, spending optimization\n👥 **Social:** Friend systems, leaderboards, community features\n\n**Try asking me about any of these topics!**",
        
        "Great question! I'm designed specifically for Bantah users. Here's how I can make your experience better:\n\n• **Smart Recommendations:** Based on your activity patterns\n• **Strategy Insights:** Proven tips from successful users\n• **Feature Guidance:** Navigate the platform like a pro\n• **Community Intel:** Learn from top performers\n\n**What would you like to dive into first?**"
      ];
      
      return responses[Math.floor(Math.random() * responses.length)];
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <Card className="border-0 shadow-xl">
            <CardContent className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Welcome to Bantzz AI
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Please log in to start chatting with your AI assistant
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/bantzzlogo.svg" 
                alt="Bantzz AI" 
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Bantzz AI by Bantah
                </h1>
                <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Your intelligent Bantah companion
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMinimizeToModal}
              className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Minimize2 className="w-4 h-4" />
              Minimize to Chat
            </Button>
          </div>
        </div>

        {/* Chat Container */}
        <Card className="h-[calc(100vh-200px)] flex flex-col border-0 bg-white dark:bg-slate-800 rounded-3xl">
          <CardHeader className="pb-4 border-b border-slate-200 dark:border-slate-700 rounded-t-3xl">
            <CardTitle className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Bot className="w-5 h-5 text-purple-500" />
              Chat with Bantzz
              <div className="ml-auto flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 dark:text-green-400">Online</span>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl p-4 ${
                        message.isUser
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white ml-4'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 mr-4'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 flex-shrink-0 ${
                          message.isUser 
                            ? 'bg-white/20' 
                            : 'bg-gradient-to-r from-blue-500 to-purple-500'
                        }`}>
                          {message.isUser ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {message.content}
                          </div>
                          <p className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 dark:bg-slate-700 rounded-xl p-4 max-w-[85%] mr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-3xl">
              <div className="flex gap-3">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about Bantah..."
                  className="flex-1 rounded-full border-slate-300 dark:border-slate-600 focus:border-slate-300 dark:focus:border-slate-600 focus:ring-0"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="rounded-full text-white border-0 px-6"
                  style={{ backgroundColor: '#7440ff' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6334e6'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7440ff'}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
