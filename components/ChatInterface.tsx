import React, { useEffect, useRef } from 'react';
import { Message, Role } from '../types';
import { User, Bot } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const formatText = (text: string) => {
    // Basic formatting for bold and italics handling
    // We split by newlines to handle paragraphs
    return text.split('\n').map((line, i) => (
      <p key={i} className="mb-2 min-h-[1rem] whitespace-pre-wrap leading-relaxed">
        {line.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\])/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="text-amber-700 font-semibold">{part.slice(2, -2)}</strong>;
          } else if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={j} className="text-stone-500 italic">{part.slice(1, -1)}</em>;
          } else if (part.startsWith('[') && part.endsWith(']')) {
             // Highlight system messages or dice rolls embedded in text
             return <span key={j} className="text-blue-700 font-mono text-sm bg-blue-50 px-1 rounded border border-blue-100">{part}</span>;
          }
          return part;
        })}
      </p>
    ));
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-white relative">
       {/* Background accent */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-50 via-white to-white pointer-events-none" />
       
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-stone-400 opacity-80">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
             <Bot size={32} />
          </div>
          <p className="font-fantasy text-lg text-stone-500">The Dungeon Master is waiting...</p>
        </div>
      )}

      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`relative z-10 flex gap-4 ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}
        >
          {msg.role === Role.MODEL && (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 mt-1">
              <Bot size={18} className="text-amber-600" />
            </div>
          )}

          <div 
            className={`
              max-w-[85%] sm:max-w-[75%] rounded-lg px-4 py-3 shadow-sm
              ${msg.role === Role.USER 
                ? 'bg-white border border-stone-200 text-stone-800 rounded-tr-none shadow-sm' 
                : 'bg-stone-50 border border-stone-200 text-stone-800 rounded-tl-none font-narrative'
              }
              ${msg.role === Role.SYSTEM ? 'bg-transparent border-0 text-center w-full max-w-full italic text-stone-500 text-sm shadow-none' : ''}
            `}
          >
            {msg.role === Role.SYSTEM ? (
              <span>{msg.text}</span>
            ) : (
              <div className="text-sm sm:text-base">
                {formatText(msg.text)}
              </div>
            )}
          </div>

          {msg.role === Role.USER && (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 mt-1">
              <User size={18} className="text-stone-500" />
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-4 justify-start relative z-10 animate-pulse">
           <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <Bot size={18} className="text-amber-600" />
            </div>
            <div className="flex items-center gap-1 text-stone-400 text-sm font-fantasy">
              <span>The DM is thinking</span>
              <span className="animate-bounce">.</span>
              <span className="animate-bounce delay-100">.</span>
              <span className="animate-bounce delay-200">.</span>
            </div>
        </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatInterface;