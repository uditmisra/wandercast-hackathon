import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '@/hooks/useTourChatEngine';

const PROGRESS_PHRASES = [
  'Finding the perfect spots...',
  'Choosing your stories...',
  'Picking the best angles...',
  'Almost there...',
];

function ProgressBubble() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % PROGRESS_PHRASES.length);
        setFade(true);
      }, 200);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2.5">
      {/* Pulsing dots */}
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="block w-1.5 h-1.5 rounded-full bg-foreground/50"
            style={{
              animation: 'pulse-dot 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <span
        className="transition-opacity duration-200"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {PROGRESS_PHRASES[index]}
      </span>
    </div>
  );
}

interface ChatConversationProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  className?: string;
}

export function ChatConversation({ messages, isGenerating, className = '' }: ChatConversationProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={`space-y-3 ${className}`}>
      {messages.map((message) => (
        <div key={message.id} className={`flex animate-slide-up ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            message.role === 'user'
              ? 'bg-primary text-white rounded-br-md'
              : 'bg-card border border-foreground/10 text-foreground/70 rounded-bl-md'
          }`}>
            {message.isProgress ? (
              <ProgressBubble />
            ) : (
              <>
                {message.role === 'assistant' && isGenerating && message.content.includes('...') && (
                  <span className="inline-block w-3 h-3 border-2 border-foreground/10 border-t-foreground rounded-full animate-spin mr-2 align-middle" />
                )}
                {message.content}
              </>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
