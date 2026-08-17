import React, { useState, useEffect, useRef } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { api } from '../../api/client';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Loader2,
  ChevronRight,
  Brain,
  Lightbulb
} from 'lucide-react';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  suggested_actions?: string[];
}

export const AICopilotDrawer: React.FC = () => {
  const { isAICopilotOpen, setIsAICopilotOpen, triggerRefresh, addToast } = useLifeOS();
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your **LifeOS Copilot**. I have secure, real-time access to your tasks, upcoming deadlines, study plans, and budget. How can I help you organize your day?",
      suggested_actions: [
        "What do I need to finish this week?",
        "I have an exam coming up. Plan my study schedule.",
        "How much have I spent this month?",
        "Spent ₹250 on lunch"
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAICopilotOpen]);

  if (!isAICopilotOpen) return null;

  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isSending) return;

    const userMsg: ChatMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsSending(true);

    try {
      // Check if it's a direct command like "Spent ₹250 on lunch"
      if (/^(?:spent|paid|remind me|todo:|create task|note:)/i.test(text)) {
        const cmdRes = await api.executeCommand(text, true);
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: `⚡ **Action Executed:** ${cmdRes.response_message}`,
            suggested_actions: ["What else needs attention?", "Check today's schedule"]
          }
        ]);
        triggerRefresh();
        addToast(cmdRes.response_message, 'success');
      } else {
        const res = await api.chatWithAI(newMessages, true);
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            content: res.reply,
            suggested_actions: res.suggested_actions
          }
        ]);
      }
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${err.message || 'Unable to connect to assistant'}.`
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-card border-l border-border shadow-2xl flex flex-col animate-slide-up">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">LifeOS Copilot</h3>
            <p className="text-[11px] text-muted-foreground">Authorized System Intelligence</p>
          </div>
        </div>
        <button
          onClick={() => setIsAICopilotOpen(false)}
          className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5 font-bold">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="space-y-2 max-w-[85%]">
              <div
                className={`p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground font-medium rounded-tr-xs'
                    : 'bg-secondary/80 border border-border text-foreground rounded-tl-xs shadow-xs'
                }`}
              >
                {m.content}
              </div>

              {/* Action Chips */}
              {m.suggested_actions && m.suggested_actions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {m.suggested_actions.map((act, aIdx) => (
                    <button
                      key={aIdx}
                      onClick={() => sendMessage(act)}
                      className="px-2.5 py-1 rounded-full bg-secondary/90 hover:bg-secondary text-[11px] font-medium text-foreground border border-border hover:border-primary/40 transition-all text-left flex items-center gap-1"
                    >
                      <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{act}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {m.role === 'user' && (
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
        {isSending && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pl-9">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Analyzing LifeOS data...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-secondary/20">
        <form
          onSubmit={e => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about tasks, exams, budget, or give a command..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="p-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 transition-all shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
