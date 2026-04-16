import React, { useRef, useEffect } from 'react';
import { ChevronLeft, Phone, Video, MoreVertical, Plus, Smile, Send } from '@/components/icons';
interface Message {
  id: number;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}
interface WhatsAppChatProps {
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
export default function WhatsAppChat({
  messages,
  inputValue,
  setInputValue,
  onSend,
  onKeyPress,
  isSending,
  companyName,
  statusText,
  clientLogo
}: WhatsAppChatProps) {
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
  return <div className="w-full h-full flex flex-col bg-[#e4ddd4] relative overflow-hidden" style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, sans-serif'
  }}>
      {/* WhatsApp wallpaper pattern - authentic doodle style */}
      <div className="absolute inset-0 pointer-events-none" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d6cdc4' fill-opacity='0.4'%3E%3Ccircle cx='10' cy='10' r='1.5'/%3E%3Ccircle cx='30' cy='10' r='1'/%3E%3Ccircle cx='50' cy='10' r='1.5'/%3E%3Ccircle cx='20' cy='25' r='1'/%3E%3Ccircle cx='40' cy='25' r='1.5'/%3E%3Ccircle cx='10' cy='40' r='1'/%3E%3Ccircle cx='30' cy='40' r='1.5'/%3E%3Ccircle cx='50' cy='40' r='1'/%3E%3Ccircle cx='20' cy='55' r='1.5'/%3E%3Ccircle cx='40' cy='55' r='1'/%3E%3C/g%3E%3C/svg%3E")`
    }} />

      {/* iOS Status Bar - aligned with Dynamic Island */}
      <div className="h-12 px-6 flex items-center justify-between text-[12px] font-semibold bg-[#1f3b37] relative z-10">
        <span className="text-white font-semibold">{getCurrentTime()}</span>
        <div className="flex items-center gap-1">
          {/* Signal bars */}
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
          {/* Battery */}
          <div className="flex items-center ml-0.5">
            <div className="w-[20px] h-[9px] border border-white rounded-[2px] flex items-center p-[1px]">
              <div className="h-full w-3/4 bg-white rounded-[1px]" />
            </div>
            <div className="w-[1px] h-[4px] bg-white rounded-r-sm ml-[1px]" />
          </div>
        </div>
      </div>

      {/* WhatsApp Header - Dark teal green */}
      <div className="h-11 px-2 flex items-center gap-1.5 bg-[#1f3b37] relative z-10">
        <ChevronLeft className="w-5 h-5 text-white flex-shrink-0" strokeWidth={2.5} />
        
        {/* Profile picture with white circle background */}
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
          {clientLogo ? <img src={clientLogo} alt={companyName} className="w-full h-full object-cover" /> : <svg viewBox="0 0 40 40" className="w-7 h-7">
              <circle cx="20" cy="15" r="8" fill="#54656f" />
              <ellipse cx="20" cy="35" rx="12" ry="10" fill="#54656f" />
            </svg>}
        </div>

        <div className="flex-1 min-w-0 ml-1">
          <div className="text-white font-medium text-[14px] leading-tight truncate">{companyName}</div>
          <div className="text-[#8fb8ae] text-[11px] leading-tight">{statusText}</div>
        </div>

        <div className="flex items-center gap-4 text-white pr-1">
          <Video className="w-[18px] h-[18px]" strokeWidth={1.8} />
          <Phone className="w-[16px] h-[16px]" strokeWidth={1.8} />
          <MoreVertical className="w-[18px] h-[18px]" strokeWidth={2} />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 relative z-10">
        {/* Date separator - pill style */}
        <div className="flex justify-center mb-3">
          <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-md shadow-sm text-popover-foreground bg-primary-foreground">
            TODAY {formatTime(new Date())}
          </span>
        </div>

        {messages.map(message => <div key={message.id} className={`flex mb-1.5 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-[85%] px-2 py-1.5 shadow-sm ${message.type === 'user' ? 'bg-[#d9fdd3] rounded-[7px] rounded-tr-none' : 'bg-white rounded-[7px] rounded-tl-none'}`}>
              {/* Message tail - triangular */}
              <div className={`absolute top-0 w-2.5 h-2.5 ${message.type === 'user' ? 'right-[-5px]' : 'left-[-5px]'}`} style={{
            background: message.type === 'user' ? '#d9fdd3' : 'white',
            clipPath: message.type === 'user' ? 'polygon(0 0, 100% 0, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%)'
          }} />
              
              <p className="text-[#111b21] text-[14px] leading-[19px] break-words whitespace-pre-wrap">
                {message.text}
                <span className="text-[10px] text-[#667781] ml-2 float-right mt-1">
                  {formatTime(message.timestamp)}
                </span>
              </p>
            </div>
          </div>)}

        {/* Typing indicator */}
        {isSending && <div className="flex mb-2 justify-start">
            <div className="relative bg-white px-4 py-3 rounded-lg rounded-tl-none shadow-sm">
              {/* Tail */}
              <div className="absolute top-0 left-[-6px] w-3 h-3" style={{
            background: 'white',
            clipPath: 'polygon(0 0, 100% 0, 100% 100%)'
          }} />
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#8696a0] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#8696a0] animate-bounce" style={{
              animationDelay: '150ms'
            }} />
                <span className="w-2 h-2 rounded-full bg-[#8696a0] animate-bounce" style={{
              animationDelay: '300ms'
            }} />
              </div>
            </div>
          </div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Light gray background */}
      <div className="pl-1 pr-14 flex items-center gap-2 bg-[#f0f2f5] relative z-10 my-0 px-px py-[5px]">
        {/* Plus button */}
        <button className="w-7 h-7 flex items-center justify-center text-[#54656f] flex-shrink-0">
          <Plus className="w-5 h-5" strokeWidth={2} />
        </button>

        {/* Input field with emoji inside */}
        <div className="flex-1 bg-white rounded-full flex items-center min-h-[34px] shadow-sm mx-0 py-[7px] my-[5px] px-[15px]">
          <Smile className="w-5 h-5 text-[#8696a0] flex-shrink-0" strokeWidth={1.5} />
          <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={onKeyPress} placeholder="Message" disabled={isSending} className="flex-1 bg-transparent text-[#3b4a54] text-[14px] outline-none ml-2 placeholder-[#8696a0] min-w-0" />
          <button onClick={onSend} disabled={isSending || !inputValue.trim()} className="ml-2 flex-shrink-0">
            <Send className="w-5 h-5 text-[#00a884]" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Home indicator */}
      <div className="h-5 flex items-center justify-center bg-[#f0f2f5] relative z-10">
        <div className="w-28 h-1 bg-black/20 rounded-full" />
      </div>
    </div>;
}