import React, { useState, useEffect } from 'react';
import { agentSDK } from '@/agents';
import { User } from '@/api/entities';
import ConversationList from '@/components/agent/ConversationList';
import ChatWindow from '@/components/agent/ChatWindow';
import { Bot, MessageSquare } from 'lucide-react';

const AGENT_NAME = 'travel_planner';

export default function AIAssistantPage() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const userData = await User.me();
        setUser(userData);
        
        const convos = await agentSDK.listConversations({ agent_name: AGENT_NAME });
        setConversations(convos);
        
        // If there are conversations, set the first one as active
        if (convos.length > 0) {
          setActiveConversationId(convos[0].id);
        }
        
      } catch (error) {
        console.error("Error loading user or conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleNewConversation = async () => {
    try {
      const newConversation = await agentSDK.createConversation({
        agent_name: AGENT_NAME,
        metadata: {
          name: `New Journey Plan ${new Date().toLocaleDateString()}`,
        }
      });
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
    } catch (error) {
      console.error("Error creating new conversation:", error);
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-900" /></div>;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <ConversationList
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewConversation={handleNewConversation}
      />
      <main className="flex-1 flex flex-col">
        {activeConversation ? (
          <ChatWindow
            key={activeConversationId} // Force re-mount when conversation changes
            conversationId={activeConversationId}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Welcome to your AI Travel Assistant</h2>
              <p className="text-slate-600 mt-2 max-w-md">
                Select a conversation from the left or start a new one to begin planning your next adventure with our AI-powered travel expert.
              </p>
               <button 
                  onClick={handleNewConversation}
                  className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  Start a New Conversation
                </button>
          </div>
        )}
      </main>
    </div>
  );
}