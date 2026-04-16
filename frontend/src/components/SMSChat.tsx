import React, { useRef, useEffect } from 'react';
import { ChevronLeft } from '@/components/icons';
interface Message {
  id: number;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}
interface SMSChatProps {
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
export default function SMSChat({
  messages,
  inputValue,
  setInputValue,
  onSend,
  onKeyPress,
  isSending,
  companyName,
  statusText,
  clientLogo
}: SMSChatProps) {
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
    });
  };
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    });
  };
  return <div className="w-full h-full flex flex-col bg-black relative overflow-hidden" style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif'
  }}>
      {/* iOS Status Bar */}
      <div className="h-12 px-6 flex items-center justify-between text-[12px] font-semibold bg-black relative z-10">
        <span className="text-white font-semibold">{getCurrentTime()}</span>
        <div className="flex items-center gap-1">
          {/* Signal bars - dots style like in screenshot */}
          <svg width="14" height="10" viewBox="0 0 18 12" fill="white">
            <rect x="0" y="8" width="3" height="4" rx="0.5" />
            <rect x="5" y="5" width="3" height="7" rx="0.5" />
            <rect x="10" y="2" width="3" height="10" rx="0.5" />
            <rect x="15" y="0" width="3" height="12" rx="0.5" />
          </svg>
          {/* WiFi */}
          <svg width="14" height="10" viewBox="0 0 17 12" fill="white" className="ml-0.5">
            <path d="M8.5 2c2.5 0 4.8.9 6.5 2.4l-1.3 1.5c-1.4-1.2-3.2-1.9-5.2-1.9s-3.8.7-5.2 1.9L2 4.4C3.7 2.9 6 2 8.5 2zm0 4c1.5 0 2.9.5 4 1.4l-1.3 1.5c-.7-.6-1.7-1-2.7-1s-2 .4-2.7 1L4.5 7.4c1.1-.9 2.5-1.4 4-1.4zm0 4c.7 0 1.3.5 1.3 1.2S9.2 12.5 8.5 12.5s-1.3-.5-1.3-1.2S7.8 10 8.5 10z" />
          </svg>
          {/* Battery with percentage */}
          <div className="flex items-center ml-0.5 gap-0.5">
            <span className="text-[10px] text-yellow-400 font-semibold">64</span>
            <div className="w-[20px] h-[9px] border border-white rounded-[2px] flex items-center p-[1px]">
              <div className="h-full w-2/3 bg-yellow-400 rounded-[1px]" />
            </div>
            <div className="w-[1px] h-[4px] bg-white rounded-r-sm" />
          </div>
        </div>
      </div>

      {/* iMessage Header */}
      <div className="py-2 px-3 flex items-center gap-2 bg-black relative z-10">
        <div className="flex items-center gap-1">
          <ChevronLeft className="w-6 h-6 text-[#0a84ff]" strokeWidth={2.5} />
          <span className="text-[#0a84ff] text-[15px] font-normal">392</span>
        </div>

        <div className="flex-1 flex justify-center">
          {clientLogo ? <div className="w-8 h-8 rounded-full overflow-hidden bg-[#3a3a3c]">
              <img src={clientLogo} alt={companyName} className="w-full h-full object-cover" />
            </div> : <div className="w-8 h-8 rounded-full bg-[#3a3a3c] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>}
        </div>

        <div className="w-12" /> {/* Spacer for balance */}
      </div>

      {/* Contact Name */}
      <div className="text-center pb-2 bg-black">
        <span className="text-[#8e8e93] text-[11px] font-medium tracking-wide">{companyName}</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 bg-black relative z-10">
        {messages.map((message, index) => {
        const isUser = message.type === 'user';
        const showTimestamp = index === 0 || messages[index - 1] && new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 3600000;
        return <div key={message.id}>
        {showTimestamp && <div className="flex justify-center my-3">
                  <span className="text-[#8e8e93] text-[11px] font-medium">
                    Today {formatTime(new Date())}
                  </span>
                </div>}
              
              <div className={`flex mb-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {/* Contact icon for bot messages */}
                {!isUser && <div className="w-6 h-6 rounded-md bg-[#3a3a3c] flex items-center justify-center mr-1.5 self-end mb-0.5 flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="1.5">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                  </div>}
                
                <div className={`max-w-[75%] px-3 py-2 ${isUser ? 'bg-[#0a84ff] rounded-[18px] rounded-br-[4px]' : 'bg-[#3a3a3c] rounded-[18px] rounded-bl-[4px]'}`}>
                  <p className="text-white text-[15px] leading-[1.35] break-words whitespace-pre-wrap">
                    {message.text}
                  </p>
                </div>
              </div>
            </div>;
      })}

        {/* Typing indicator */}
        {isSending && <div className="flex mb-1.5 justify-start">
            <div className="w-6 h-6 rounded-md bg-[#3a3a3c] flex items-center justify-center mr-1.5 self-end mb-0.5 flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <div className="bg-[#3a3a3c] px-4 py-3 rounded-[18px] rounded-bl-[4px]">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#8e8e93] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#8e8e93] animate-bounce" style={{
              animationDelay: '150ms'
            }} />
                <span className="w-2 h-2 rounded-full bg-[#8e8e93] animate-bounce" style={{
              animationDelay: '300ms'
            }} />
              </div>
            </div>
          </div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-3 py-2 flex items-center gap-2 bg-black relative z-10">
        {/* Plus button */}
        <button className="w-8 h-8 rounded-full bg-[#3a3a3c] flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Input field */}
        <div className="flex-1 bg-[#1c1c1e] rounded-full flex items-center py-2 min-h-[36px] border border-[#3a3a3c] px-[12px]">
          <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={onKeyPress} placeholder="Text Message" disabled={isSending} className="flex-1 bg-transparent text-white text-[15px] outline-none placeholder-[#8e8e93] min-w-0" />
        </div>

        {/* Send button */}
        <button onClick={onSend} disabled={isSending || !inputValue.trim()} className="w-8 h-8 rounded-full bg-[#0a84ff] flex items-center justify-center flex-shrink-0 disabled:opacity-50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
          </svg>
        </button>
      </div>

      {/* Home indicator */}
      <div className="h-5 flex items-center justify-center bg-black relative z-10">
        <div className="w-28 h-1 bg-white/30 rounded-full" />
      </div>
    </div>;
}