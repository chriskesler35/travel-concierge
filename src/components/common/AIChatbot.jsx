
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InvokeLLM } from '@/api/integrations';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Minimize2,
  Maximize2
} from 'lucide-react';

const SYSTEM_PROMPT = `You are the Travel Concierge AI Assistant, a helpful chatbot for the Travel Concierge web application. You help users plan their trips and navigate the site.

ABOUT TRAVEL CONCIERGE:
- Travel Concierge is an AI-powered trip planning platform
- It offers personalized itinerary generation for different travel types
- Travel types include: Road Trip, Motorcycle Adventure, RV Trip, International Travel, Ski Adventures, and Destination Getaways
- Users can plan trips from 1-14 days
- The platform offers both Free (1 journey) and Premium (unlimited) tiers
- Premium costs $24.99/year and includes editing, unlimited journeys, and priority support

FEATURES YOU CAN HELP WITH:
- How to create a new trip/journey
- Explaining different travel types
- How to use the trip planning form
- Understanding subscription tiers and pricing
- Navigating between pages (Home, My Journeys, Account, About Us)
- Editing and refining existing itineraries
- Sharing trip plans
- Account management and settings

NAVIGATION HELP:
- Home page: Select journey type and start planning
- Plan page: Fill out trip details form
- My Journeys: View all created trips
- Journey Details: View and edit specific trip itinerary
- Account: Manage subscription and settings
- About Us: Learn about the company

TONE: Be friendly, helpful, and enthusiastic about travel. Provide clear, actionable guidance. If users ask general travel questions not specific to the site, still answer helpfully but try to relate it back to how Travel Concierge can help them plan their trip.

Always offer to help with next steps and encourage users to start planning their adventure!`;

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "👋 Hi! I'm your Travel Concierge AI Assistant! I'm here to help you navigate the site and plan your perfect trip. What can I help you with today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCallout, setShowCallout] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const hasSeenCallout = sessionStorage.getItem('hasSeenChatbotCallout');
    if (!hasSeenCallout) {
      const timer1 = setTimeout(() => {
        setShowCallout(true);
        sessionStorage.setItem('hasSeenChatbotCallout', 'true');
      }, 1500); // Wait 1.5s before showing

      const timer2 = setTimeout(() => {
        setShowCallout(false);
      }, 8500); // Show for 7 seconds

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, []); // Run only once on mount

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    const userMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Create conversation context
      const conversationHistory = [...messages, userMessage]
        .slice(-6) // Keep last 6 messages for context
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n\n');

      const prompt = `${SYSTEM_PROMPT}

RECENT CONVERSATION:
${conversationHistory}

Please respond to the user's latest message. Be helpful, concise, and encouraging. If they're asking about Travel Concierge features, provide specific guidance. If it's a general travel question, answer it and suggest how Travel Concierge can help them plan it.`;

      const response = await InvokeLLM({
        prompt,
        add_context_from_internet: false
      });

      const assistantMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: "I apologize, but I'm having trouble responding right now. Please try again in a moment, or feel free to explore the site - you can start planning a trip from the Home page!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Chat cleared! How can I help you with your travel planning today?",
        timestamp: new Date()
      }
    ]);
  };

  return (
    <>
      {/* Floating Chat Button and Callout */}
      <AnimatePresence>
        {!isOpen && (
          <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
              {showCallout && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="absolute bottom-full right-0 mb-3 w-max max-w-xs bg-slate-900 text-white text-sm font-medium py-2 px-4 rounded-lg shadow-lg"
                >
                  Have questions? Ask me anything!
                  {/* Arrow pointing down */}
                  <div className="absolute top-full right-5 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-900" />
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              <Button
                onClick={() => setIsOpen(true)}
                className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <MessageSquare className="w-6 h-6 text-white" />
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 ${
              isMinimized ? 'w-80 h-16' : 'w-96 h-[32rem]'
            } flex flex-col transition-all duration-300`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Travel Assistant</h3>
                  <p className="text-xs text-white/80">Here to help you plan!</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/20 w-8 h-8 p-0"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 w-8 h-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-blue-600' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className={`max-w-[75%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <div className={`inline-block p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white text-slate-800 rounded-bl-sm shadow-sm'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 px-1">
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-white rounded-lg rounded-bl-sm shadow-sm p-3">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-200 bg-white rounded-b-xl">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about planning your trip..."
                      className="flex-1"
                      disabled={isTyping}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isTyping}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isTyping ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        Travel Planning
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Site Navigation  
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearChat}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Clear Chat
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
