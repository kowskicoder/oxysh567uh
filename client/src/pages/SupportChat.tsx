
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { MobileNavigation } from "@/components/MobileNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft, MessageCircle, Clock, CheckCircle2, User, Headphones } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";

interface SupportMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
  senderName?: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: Date;
  lastMessage: string;
  messages: SupportMessage[];
}

export default function SupportChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const [activeView, setActiveView] = useState<'tickets' | 'chat'>('tickets');
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("");
  const [newTicketPriority, setNewTicketPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);

  // Fetch support tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['/api/support/tickets'],
    queryFn: async () => {
      // Mock data for now - replace with real API call
      return [
        {
          id: "1",
          subject: "Withdrawal Issue",
          status: "in_progress" as const,
          priority: "high" as const,
          createdAt: new Date(Date.now() - 86400000),
          lastMessage: "We're processing your withdrawal request...",
          messages: [
            {
              id: "1",
              message: "Hello! I'm having trouble with my withdrawal. It's been pending for 2 days.",
              isUser: true,
              timestamp: new Date(Date.now() - 86400000),
              status: 'read' as const
            },
            {
              id: "2",
              message: "Hi! I understand your concern. Let me check your account details. Can you please provide your transaction ID?",
              isUser: false,
              timestamp: new Date(Date.now() - 86340000),
              senderName: "Support Agent Sarah"
            },
            {
              id: "3",
              message: "The transaction ID is TXN123456789",
              isUser: true,
              timestamp: new Date(Date.now() - 86280000),
              status: 'read' as const
            },
            {
              id: "4",
              message: "Thank you! I can see the transaction. We're processing it now and it should be completed within 24 hours. You'll receive an email confirmation once it's done.",
              isUser: false,
              timestamp: new Date(Date.now() - 86220000),
              senderName: "Support Agent Sarah"
            }
          ]
        },
        {
          id: "2", 
          subject: "Account Verification Help",
          status: "resolved" as const,
          priority: "medium" as const,
          createdAt: new Date(Date.now() - 172800000),
          lastMessage: "Your account has been successfully verified.",
          messages: [
            {
              id: "5",
              message: "I need help with account verification. What documents do I need?",
              isUser: true,
              timestamp: new Date(Date.now() - 172800000),
              status: 'read' as const
            },
            {
              id: "6",
              message: "For account verification, you'll need a government-issued ID and proof of address. Please upload clear photos of both documents.",
              isUser: false,
              timestamp: new Date(Date.now() - 172740000),
              senderName: "Support Agent Mike"
            },
            {
              id: "7",
              message: "Documents uploaded successfully!",
              isUser: true,
              timestamp: new Date(Date.now() - 172680000),
              status: 'read' as const
            },
            {
              id: "8",
              message: "Perfect! Your account has been successfully verified. You now have access to all platform features.",
              isUser: false,
              timestamp: new Date(Date.now() - 172620000),
              senderName: "Support Agent Mike"
            }
          ]
        }
      ];
    },
    retry: false,
  });

  // Create new ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: { subject: string; message: string; priority: string }) => {
      // Mock API call - replace with real endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        id: Date.now().toString(),
        ...ticketData,
        status: 'open' as const,
        createdAt: new Date(),
        lastMessage: ticketData.message,
        messages: [{
          id: Date.now().toString(),
          message: ticketData.message,
          isUser: true,
          timestamp: new Date(),
          status: 'sent' as const
        }]
      };
    },
    onSuccess: () => {
      toast({
        title: "Support Ticket Created",
        description: "Your support ticket has been created. We'll respond within 2 hours.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets'] });
      setNewTicketSubject("");
      setNewTicketMessage("");
      setShowNewTicketForm(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create support ticket. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      // Mock API call - replace with real endpoint
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id: Date.now().toString(),
        message,
        isUser: true,
        timestamp: new Date(),
        status: 'sent' as const
      };
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent to our support team.",
      });
      setNewMessage("");
      // In real implementation, you'd update the messages in the cache
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeView === 'chat') {
      scrollToBottom();
    }
  }, [activeView]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return;
    
    sendMessageMutation.mutate({
      ticketId: selectedTicket,
      message: newMessage.trim()
    });
  };

  const handleCreateTicket = () => {
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both subject and message fields.",
        variant: "destructive",
      });
      return;
    }

    createTicketMutation.mutate({
      subject: newTicketSubject.trim(),
      message: newTicketMessage.trim(),
      priority: newTicketPriority
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const selectedTicketData = tickets.find(t => t.id === selectedTicket);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 theme-transition pb-20 md:pb-0">
      <div className="max-w-4xl mx-auto px-3 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mr-3"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100">
              Support Chat 💬
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Get help from our support team
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6">
          <Button
            variant={activeView === 'tickets' ? 'default' : 'ghost'}
            onClick={() => setActiveView('tickets')}
            className="flex-1"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Support Tickets ({tickets.length})
          </Button>
          <Button
            variant={activeView === 'chat' ? 'default' : 'ghost'}
            onClick={() => setActiveView('chat')}
            className="flex-1"
            disabled={!selectedTicket}
          >
            <Headphones className="w-4 h-4 mr-2" />
            Chat
          </Button>
        </div>

        {activeView === 'tickets' && (
          <div className="space-y-4">
            {/* Create New Ticket Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowNewTicketForm(!showNewTicketForm)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create New Ticket
              </Button>
            </div>

            {/* New Ticket Form */}
            {showNewTicketForm && (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle>Create Support Ticket</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={newTicketSubject}
                      onChange={(e) => setNewTicketSubject(e.target.value)}
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <select
                      value={newTicketPriority}
                      onChange={(e) => setNewTicketPriority(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={newTicketMessage}
                      onChange={(e) => setNewTicketMessage(e.target.value)}
                      placeholder="Describe your issue in detail..."
                      rows={4}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleCreateTicket}
                      disabled={createTicketMutation.isPending}
                    >
                      {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowNewTicketForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tickets List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-600 dark:text-slate-400">Loading tickets...</p>
                </div>
              ) : tickets.length === 0 ? (
                <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardContent className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                      No support tickets yet
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                      Create a ticket to get help from our support team
                    </p>
                    <Button
                      onClick={() => setShowNewTicketForm(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Create Your First Ticket
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                tickets.map((ticket) => (
                  <Card 
                    key={ticket.id}
                    className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                    onClick={() => {
                      setSelectedTicket(ticket.id);
                      setActiveView('chat');
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                            {ticket.subject}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            {ticket.lastMessage}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(ticket.status)}>
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                            <span className="text-xs text-slate-500 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDistanceToNow(ticket.createdAt, { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {activeView === 'chat' && selectedTicket && selectedTicketData && (
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700">
              <CardTitle className="flex items-center">
                Chat - {selectedTicketData.subject}
                <Badge className={`ml-2 ${getStatusColor(selectedTicketData.status)}`}>
                  {selectedTicketData.status.replace('_', ' ')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {selectedTicketData.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isUser
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {!message.isUser && message.senderName && (
                        <div className="flex items-center mb-1">
                          <User className="w-3 h-3 mr-1" />
                          <span className="text-xs font-medium">{message.senderName}</span>
                        </div>
                      )}
                      <p className="text-sm">{message.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-70">
                          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                        </span>
                        {message.isUser && message.status && (
                          <CheckCircle2 className="w-3 h-3 opacity-70" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <Separator />

              {/* Message Input */}
              <div className="p-4">
                <div className="flex space-x-2">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 min-h-[80px]"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <MobileNavigation />
    </div>
  );
}
