import React, { useState, useEffect, useRef } from 'react';
import { agentSDK } from '@/agents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ conversationId }) {
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    if (!conversationId) return;

    // Fetch the initial conversation data
    const fetchConversation = async () => {
        try {
            const convo = await agentSDK.getConversation(conversationId);
            setConversation(convo);
            setMessages(convo.messages);
        } catch (error) {
            console.error("Error fetching conversation:", error);
        }
    };
    fetchConversation();

    // Subscribe to real-time updates
    const unsubscribe = agentSDK.subscribeToConversation(conversationId, (updatedConversation) => {
        setMessages(updatedConversation.messages);
        // Check the last message to see if the agent is done
        const lastMessage = updatedConversation.messages[updatedConversation.messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.status !== 'in_progress') {
            setIsSending(false);
        }
    });

    return () => unsubscribe();
  }, [conversationId]);
  
  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversation) return;

    setIsSending(true);
    try {
      await agentSDK.addMessage(conversation, {
        role: 'user',
        content: inputMessage.trim(),
      });
      setInputMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      <div className="p-4 border-b border-slate-200 bg-white">
        <h3 className="font-semibold text-slate-900">{conversation?.metadata?.name || 'Conversation'}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message, index) => (
          <MessageBubble key={index} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask the AI to help plan your trip..."
            className="flex-1"
            disabled={isSending}
          />
          <Button onClick={handleSendMessage} disabled={isSending || !inputMessage.trim()}>
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          The AI Assistant can help you plan trips, suggest destinations, and refine your itineraries.
        </p>
      </div>
    </div>
  );
}