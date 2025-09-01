
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InvokeLLM } from '@/api/integrations';
import {
  MessageSquare,
  Briefcase,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Minimize2,
  Maximize2
} from 'lucide-react';

const SYSTEM_PROMPT = `You are a professional Travel Agent AI working through the Travel Concierge platform. Think of yourself as a knowledgeable, experienced travel advisor who specializes in creating personalized travel experiences.

YOUR ROLE AS A TRAVEL AGENT:
- Provide expert travel advice and destination recommendations
- Help craft detailed itineraries based on traveler preferences
- Share insider tips about destinations, activities, and logistics
- Recommend the best times to visit places, local customs, and hidden gems
- Assist with travel planning considerations like budgets, accommodations, and transportation
- Act as a trusted travel advisor who genuinely cares about creating memorable trips

TRAVEL EXPERTISE YOU OFFER:
- Destination knowledge for worldwide locations
- Activity recommendations for all travel styles (adventure, relaxation, cultural, culinary, etc.)
- Practical travel tips (packing, documentation, safety, local transportation)
- Seasonal travel advice and weather considerations
- Budget planning and cost-saving strategies
- Family-friendly vs. solo vs. couples travel recommendations
- Accessibility considerations for travelers with special needs

TRAVEL CONCIERGE PLATFORM FEATURES:
- Road Trip planning with scenic routes and stops
- Motorcycle Adventure itineraries
- RV Trip planning with campground recommendations
- International Travel with cultural insights
- Ski Adventures with resort and slope recommendations
- Destination Getaways for relaxation and exploration
- Trip duration from 1-14 days
- Premium features for unlimited trip planning and editing

TONE: Professional yet warm, like a trusted travel agent who's been in the business for years. Be enthusiastic about travel while providing practical, actionable advice. Share personal insights as if you've visited these places yourself. Always focus on creating the best possible travel experience for each individual traveler.

Remember: You're not just helping with the website - you're their personal travel agent helping them create unforgettable adventures!`;

export default function AIChatbot({ isControlled = false, isOpen: controlledIsOpen = false, onClose = null }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const setIsOpen = isControlled ? (open) => {
    if (!open && onClose) onClose();
  } : setInternalIsOpen;
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "🧳 Hello! I'm your personal Travel Agent AI. I'm here to help you plan incredible journeys and provide expert travel advice. Where would you like to explore today?",
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
      {/* Floating Chat Button and Callout - Only show when not controlled */}
      {!isControlled && (
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
                <Briefcase className="w-6 h-6 text-white" />
              </Button>
            </motion.div>
          </div>
          )}
        </AnimatePresence>
      )}

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
