import React, { useRef, useEffect } from 'react';
import { ChevronLeft, Phone, Video, Mic, Image, Smile, PlusCircle, Camera } from '@/components/icons';
interface Message {
  id: number;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}
interface InstagramChatProps {
  messages: Message[];
  inputValue: string;
  setInputValue: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isSending: boolean;
  companyName: string;
  statusText: string;
  clientLogo: string | null;
  onReset: () => void;
}
export default function InstagramChat({
  messages,
  inputValue,
  setInputValue,
  onSend,
  onKeyPress,
  isSending,
  companyName,
  statusText,
  clientLogo
}: InstagramChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toUpperCase();
  };
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    });
  };
  return <div className="w-full h-full flex flex-col bg-[#000000] relative overflow-hidden" style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif'
  }}>
      {/* iOS Status Bar - aligned with Dynamic Island */}
      <div className="h-12 px-6 flex items-center justify-between text-[12px] font-semibold bg-[#000000] relative z-10">
        <span className="text-white font-medium">{getCurrentTime()}</span>
        <div className="flex items-center gap-1">
          <svg width="14" height="10" viewBox="0 0 18 12" fill="white">
            <rect x="0" y="8" width="3" height="4" rx="0.5" />
            <rect x="5" y="5" width="3" height="7" rx="0.5" />
            <rect x="10" y="2" width="3" height="10" rx="0.5" />
            <rect x="15" y="0" width="3" height="12" rx="0.5" />
          </svg>
          <svg width="14" height="10" viewBox="0 0 17 12" fill="white" className="ml-0.5">
            <path d="M8.5 2c2.5 0 4.8.9 6.5 2.4l-1.3 1.5c-1.4-1.2-3.2-1.9-5.2-1.9s-3.8.7-5.2 1.9L2 4.4C3.7 2.9 6 2 8.5 2zm0 4c1.5 0 2.9.5 4 1.4l-1.3 1.5c-.7-.6-1.7-1-2.7-1s-2 .4-2.7 1L4.5 7.4c1.1-.9 2.5-1.4 4-1.4zm0 4c.7 0 1.3.5 1.3 1.2S9.2 12.5 8.5 12.5s-1.3-.5-1.3-1.2S7.8 10 8.5 10z" />
          </svg>
          <div className="flex items-center ml-0.5">
            <div className="w-[20px] h-[9px] border border-white rounded-[2px] flex items-center p-[1px]">
              <div className="h-full w-3/4 bg-white rounded-[1px]" />
            </div>
            <div className="w-[1px] h-[4px] bg-white rounded-r-sm ml-[1px]" />
          </div>
        </div>
      </div>

      {/* Instagram Header */}
      <div className="h-11 px-2 flex items-center gap-1.5 bg-[#000000] border-b border-[#262626] relative z-10">
        <ChevronLeft className="w-5 h-5 text-white flex-shrink-0" strokeWidth={2} />
        
        {clientLogo ? <div className="w-7 h-7 rounded-full overflow-hidden bg-[#262626] flex-shrink-0 ring-[1.5px] ring-[#c837ab] ring-offset-1 ring-offset-black">
            <img src={clientLogo} alt={companyName} className="w-full h-full object-cover" />
          </div> : <div className="w-7 h-7 rounded-full bg-[#262626] flex items-center justify-center text-xs flex-shrink-0">
            👤
          </div>}

        <div className="flex-1 min-w-0 ml-0.5">
          <div className="flex items-center gap-0.5">
            <span className="text-white font-semibold text-[12px] leading-tight truncate max-w-[80px]">{companyName}</span>
            <ChevronLeft className="w-2.5 h-2.5 text-white/60 rotate-[-90deg] flex-shrink-0" strokeWidth={2} />
          </div>
          <div className="text-[#a8a8a8] text-[10px] leading-tight truncate">{statusText}</div>
        </div>

        <div className="flex items-center gap-2.5 text-white flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12h8M12 8v8" strokeLinecap="round" />
          </svg>
          <Phone className="w-[18px] h-[18px]" strokeWidth={1.5} />
          <Video className="w-[18px] h-[18px]" strokeWidth={1.5} />
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 relative z-10">
        {messages.map((message, index) => {
        // Show timestamp above first message or when there's a time gap
        const showTimestamp = index === 0;
        return <div key={message.id}>
              {showTimestamp && <div className="flex justify-center mb-4">
                  <span className="text-[#a8a8a8] text-[11px] font-medium">
                    TODAY {formatTime(new Date())}
                  </span>
                </div>}
              
              <div className={`flex mb-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative max-w-[75%] px-3 py-2 ${message.type === 'user' ? 'bg-[#3797f0] rounded-[20px] rounded-br-[4px]' : 'bg-[#262626] rounded-[20px] rounded-bl-[4px]'}`}>
                  <p className="text-white text-[14px] leading-5 break-words whitespace-pre-wrap">
                    {message.text}
                  </p>
                </div>
              </div>
            </div>;
      })}

        {/* Typing indicator */}
        {isSending && <div className="flex mb-2 justify-start">
            <div className="bg-[#262626] px-4 py-3 rounded-[20px] rounded-bl-[4px]">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#8e8e8e] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#8e8e8e] animate-bounce" style={{
              animationDelay: '150ms'
            }} />
                <span className="w-2 h-2 rounded-full bg-[#8e8e8e] animate-bounce" style={{
              animationDelay: '300ms'
            }} />
              </div>
            </div>
          </div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="pl-2 pr-10 py-1.5 flex items-center gap-2 bg-[#000000] relative z-10 px-[7px]">
        {/* Camera button - blue circle */}
        <button className="w-8 h-8 rounded-full bg-[#0095f6] flex items-center justify-center flex-shrink-0 px-0 mx-[4px]">
          <Camera strokeWidth={2} className="w-4 h-4 text-white mx-0" />
        </button>

        <div className="flex-1 bg-[#262626] rounded-full flex items-center py-1.5 min-h-[34px] border border-[#363636] px-[22px]">
          <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={onKeyPress} placeholder="Message..." disabled={isSending} className="flex-1 bg-transparent text-white text-[13px] outline-none placeholder-[#a8a8a8] min-w-0" />
        </div>

        {/* Mic icon only */}
        <button onClick={inputValue.trim() ? onSend : undefined} disabled={isSending} className="w-7 h-7 flex items-center justify-center text-white flex-shrink-0">
          <Mic className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Home indicator */}
      <div className="h-5 flex items-center justify-center bg-[#000000] relative z-10">
        <div className="w-28 h-1 bg-white/30 rounded-full" />
      </div>
    </div>;
}