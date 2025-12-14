
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Send, X, Bot, User, Maximize2, Minimize2, Move, Settings, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export function FloatingBantzzButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
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
  const buttonRef = useRef<HTMLDivElement>(null);
  const [location, setLocation] = useLocation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Occasional slide-out animation
  useEffect(() => {
    const slideAnimation = () => {
      // Randomly slide out and back every 30-60 seconds
      const randomDelay = Math.random() * 30000 + 30000; // 30-60 seconds
      
      setTimeout(() => {
        setIsHidden(true);
        setTimeout(() => {
          setIsHidden(false);
          slideAnimation(); // Schedule next animation
        }, 2000); // Stay hidden for 2 seconds
      }, randomDelay);
    };

    slideAnimation();
  }, []);

  // Touch/Mouse drag handlers for mobile
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Button stays docked - no hiding behavior
    // Users can drag it but it remains visible and docked to the edge
  };

  // Right-click context menu for desktop
  const handleContextMenu = (e: React.MouseEvent) => {
    if (window.innerWidth >= 768) { // Desktop only
      e.preventDefault();
      setContextMenuPos({ x: e.clientX, y: e.clientY });
      setShowContextMenu(true);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExpandToFullPage = () => {
    setIsOpen(false);
    setLocation('/bantzz');
  };

  const isOnBantzzPage = location === '/bantzz';

  if (!user) return null;

  // Hide the floating button if we're on the Bantzz page
  if (isOnBantzzPage) return null;

  return (
    <>
      {/* Main Floating Button - docked by default with occasional slide-out animation */}
      {(
        <div 
          ref={buttonRef}
          className={cn(
            "fixed bottom-24 md:bottom-6 z-40 transition-all duration-500 ease-in-out",
            isDragging && "scale-110 drop-shadow-lg",
            isHidden ? "right-[-40px] md:right-[-50px]" : "right-4 md:right-6"
          )}
          onContextMenu={handleContextMenu}
        >
          {/* Main Bantzz Button with drag functionality */}
          <button
            onClick={() => !isDragging && setIsOpen(true)}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            className={cn(
              "hover:scale-110 transition-all duration-300 hover:drop-shadow-lg select-none",
              isDragging && "cursor-grabbing"
            )}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <img 
              src="/assets/bantzzlogo.svg" 
              alt="Bantzz AI" 
              className="w-10 h-10 md:w-14 md:h-14 pointer-events-none"
            />
          </button>

          {/* Mobile Drag Indicator - only on mobile when not dragging */}
          <div className="md:hidden absolute -top-1 -right-1">
            <div className="w-4 h-4 bg-primary/30 rounded-full flex items-center justify-center">
              <Move className="w-2 h-2 text-primary" />
            </div>
          </div>


        </div>
      )}



      {/* Desktop Context Menu */}
      {showContextMenu && (
        <div 
          className="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 min-w-[160px]"
          style={{ 
            left: Math.min(contextMenuPos.x, window.innerWidth - 180), 
            top: Math.min(contextMenuPos.y, window.innerHeight - 120) 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setIsOpen(true);
              setShowContextMenu(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Open Chat
          </button>
          <button
            onClick={() => {
              handleExpandToFullPage();
              setShowContextMenu(false);
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-sm"
          >
            <Maximize2 className="w-4 h-4" />
            Full Page View
          </button>

        </div>
      )}

      {/* Clean Chat Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md h-[500px] flex flex-col p-0 gap-0 rounded-3xl">
          {/* Simple Header - Just like the conference meeting */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src="/assets/bantzzlogo.svg" 
                  alt="Bantzz AI" 
                  className="w-6 h-6"
                />
                <h3 className="font-medium text-slate-900 dark:text-slate-100">
                  Bantzz AI by Bantah
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExpandToFullPage}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.isUser
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </div>
                    <p className="text-xs opacity-60 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-b-3xl">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message to Bantzz AI"
                className="flex-1 rounded-full border-slate-300 dark:border-slate-600 focus:border-slate-300 dark:focus:border-slate-600 focus:ring-0"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="rounded-full text-white px-4"
                style={{ backgroundColor: '#7440ff' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6334e6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7440ff'}
              >
                Send now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
