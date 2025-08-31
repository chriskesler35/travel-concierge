import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare } from 'lucide-react';

export default function ConversationList({ conversations, activeConversationId, onSelectConversation, onNewConversation }) {
  return (
    <aside className="w-80 border-r border-slate-200 flex flex-col bg-white">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-900">Conversations</h2>
        <Button onClick={onNewConversation} className="w-full mt-4">
          <Plus className="w-4 h-4 mr-2" />
          New Conversation
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.map((convo) => (
          <button
            key={convo.id}
            onClick={() => onSelectConversation(convo.id)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              activeConversationId === convo.id
                ? 'bg-blue-100 text-blue-800'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activeConversationId === convo.id ? 'bg-blue-200' : 'bg-slate-100'}`}>
                  <MessageSquare className={`w-4 h-4 ${activeConversationId === convo.id ? 'text-blue-700' : 'text-slate-500'}`}/>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-medium text-sm truncate">{convo.metadata?.name || 'New Conversation'}</p>
                <p className="text-xs text-slate-500 truncate">
                  {convo.updated_at ? `Updated ${new Date(convo.updated_at).toLocaleDateString()}` : `Created ${new Date(convo.created_at).toLocaleDateString()}`}
                </p>
              </div>
            </div>
          </button>
        ))}
      </nav>
    </aside>
  );
}