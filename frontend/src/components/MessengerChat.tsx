import React, { useRef, useEffect } from 'react';
import { ChevronLeft, Phone, Video, Info, ThumbsUp, Image, Mic, Plus, Smile, Send } from '@/components/icons';
interface Message {
  id: number;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}
interface MessengerChatProps {
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
export default function MessengerChat({
  messages,
  inputValue,
  setInputValue,
  onSend,
  onKeyPress,
  isSending,
  companyName,
  statusText,
  clientLogo
}: MessengerChatProps) {
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
  return <div className="w-full h-full flex flex-col bg-white relative overflow-hidden" style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif'
  }}>
      {/* iOS Status Bar */}
      <div className="h-12 px-6 flex items-center justify-between text-[12px] font-semibold bg-white relative z-10">
        <span className="text-black font-semibold">{getCurrentTime()}</span>
        <div className="flex items-center gap-1">
          {/* Signal bars */}
          <svg width="14" height="10" viewBox="0 0 18 12" fill="black">
            <rect x="0" y="8" width="3" height="4" rx="0.5" />
            <rect x="5" y="5" width="3" height="7" rx="0.5" />
            <rect x="10" y="2" width="3" height="10" rx="0.5" />
            <rect x="15" y="0" width="3" height="12" rx="0.5" />
          </svg>
          {/* WiFi */}
          <svg width="14" height="10" viewBox="0 0 17 12" fill="black" className="ml-0.5">
            <path d="M8.5 2c2.5 0 4.8.9 6.5 2.4l-1.3 1.5c-1.4-1.2-3.2-1.9-5.2-1.9s-3.8.7-5.2 1.9L2 4.4C3.7 2.9 6 2 8.5 2zm0 4c1.5 0 2.9.5 4 1.4l-1.3 1.5c-.7-.6-1.7-1-2.7-1s-2 .4-2.7 1L4.5 7.4c1.1-.9 2.5-1.4 4-1.4zm0 4c.7 0 1.3.5 1.3 1.2S9.2 12.5 8.5 12.5s-1.3-.5-1.3-1.2S7.8 10 8.5 10z" />
          </svg>
          {/* Battery */}
          <div className="flex items-center ml-0.5">
            <div className="w-[20px] h-[9px] border border-black rounded-[2px] flex items-center p-[1px]">
              <div className="h-full w-3/4 bg-black rounded-[1px]" />
            </div>
            <div className="w-[1px] h-[4px] bg-black rounded-r-sm ml-[1px]" />
          </div>
        </div>
      </div>

      {/* Messenger Header */}
      <div className="py-1.5 flex items-center gap-1.5 bg-white border-b border-gray-100 px-[9px] my-[15px]">
        <ChevronLeft className="w-5 h-5 text-[#0084ff]" strokeWidth={2.5} />
        
        <div className="relative">
          {clientLogo ? <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200">
              <img src={clientLogo} alt={companyName} className="w-full h-full object-cover" />
            </div> : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0084ff] to-[#00c6ff] flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{companyName.charAt(0)}</span>
            </div>}
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#31a24c] rounded-full border-[1.5px] border-white" />
        </div>

        <div className="flex-1 min-w-0 ml-0.5">
          <div className="text-black font-semibold text-[13px] leading-tight truncate">{companyName}</div>
          <div className="text-[#65676b] text-[10px] leading-tight">Active now</div>
        </div>

        <div className="flex items-center gap-3">
          <Phone className="w-4 h-4 text-[#0084ff]" strokeWidth={2} fill="#0084ff" />
          <Video className="w-4 h-4 text-[#0084ff]" strokeWidth={2} fill="#0084ff" />
          <Info className="w-4 h-4 text-[#0084ff]" strokeWidth={2} />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-2 py-2 bg-white">
        {messages.map((message, index) => {
        const isUser = message.type === 'user';
        const isFirstInGroup = index === 0 || messages[index - 1]?.type !== message.type;
        const isLastInGroup = index === messages.length - 1 || messages[index + 1]?.type !== message.type;
        const isMiddle = !isFirstInGroup && !isLastInGroup;
        
        // Determine border radius based on position in group
        let borderRadius = 'rounded-[18px]';
        if (isUser) {
          if (isFirstInGroup && isLastInGroup) borderRadius = 'rounded-[18px]';
          else if (isFirstInGroup) borderRadius = 'rounded-[18px] rounded-br-[4px]';
          else if (isLastInGroup) borderRadius = 'rounded-[18px] rounded-tr-[4px]';
          else borderRadius = 'rounded-l-[18px] rounded-r-[4px]';
        } else {
          if (isFirstInGroup && isLastInGroup) borderRadius = 'rounded-[18px]';
          else if (isFirstInGroup) borderRadius = 'rounded-[18px] rounded-bl-[4px]';
          else if (isLastInGroup) borderRadius = 'rounded-[18px] rounded-tl-[4px]';
          else borderRadius = 'rounded-r-[18px] rounded-l-[4px]';
        }
        
        // Tighter spacing for consecutive messages from same sender
        const marginBottom = isLastInGroup ? 'mb-2' : 'mb-[2px]';
        
        return <div key={message.id} className={`flex ${marginBottom} ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && isLastInGroup && clientLogo && <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 mr-1.5 self-end">
                  <img src={clientLogo} alt={companyName} className="w-full h-full object-cover" />
                </div>}
              {!isUser && !isLastInGroup && <div className="w-6 mr-1.5" />}
              
              <div className={`max-w-[75%] px-3 py-1.5 ${isUser ? 'bg-[#0084ff] text-white' : 'bg-[#e4e6eb] text-black'} ${borderRadius}`}>
                <p className="text-[13px] leading-[1.35] break-words whitespace-pre-wrap">
                  {message.text}
                </p>
              </div>
            </div>;
      })}

        {/* Timestamp */}
        {messages.length > 0 && <div className="flex justify-center mt-1.5 mb-0.5">
            <span className="text-[9px] text-[#65676b] font-normal">
              Today {formatTime(new Date())}
            </span>
          </div>}

        {/* Typing indicator */}
        {isSending && <div className="flex mb-0.5 justify-start">
            {clientLogo && <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 mr-1.5 self-end mb-0.5">
                <img src={clientLogo} alt={companyName} className="w-full h-full object-cover" />
              </div>}
            <div className="bg-[#e4e6eb] px-3 py-2 rounded-[14px] rounded-bl-[3px]">
              <div className="flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#65676b] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#65676b] animate-bounce" style={{
              animationDelay: '150ms'
            }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#65676b] animate-bounce" style={{
              animationDelay: '300ms'
            }} />
              </div>
            </div>
          </div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-1.5 py-1.5 flex items-center gap-1 bg-white border-t border-gray-100">
        <button className="w-7 h-7 flex items-center justify-center text-[#0084ff] rounded-full hover:bg-gray-100">
          <Plus className="w-5 h-5" strokeWidth={2} />
        </button>
        <button className="w-7 h-7 flex items-center justify-center text-[#0084ff] rounded-full hover:bg-gray-100">
          <Image className="w-4 h-4" strokeWidth={2} />
        </button>
        <button className="w-7 h-7 flex items-center justify-center text-[#0084ff] rounded-full hover:bg-gray-100">
          <Mic className="w-4 h-4" strokeWidth={2} />
        </button>

        <div className="flex-1 bg-[#f0f2f5] rounded-full flex items-center py-1 min-h-[28px] px-px">
          <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={onKeyPress} disabled={isSending} placeholder="  Aa" className="flex-1 bg-transparent text-black text-[13px] outline-none placeholder-[#65676b] min-w-0 px-[3px]" />
          <Smile strokeWidth={2} className="w-4 h-4 text-[#0084ff] ml-1.5 mx-1" />
        </div>

        {inputValue.trim() ? <button onClick={onSend} disabled={isSending} className="w-7 h-7 flex items-center justify-center text-[#0084ff] rounded-full hover:bg-gray-100">
            <Send className="w-4 h-4" strokeWidth={2} />
          </button> : <button className="w-7 h-7 flex items-center justify-center text-[#0084ff] rounded-full hover:bg-gray-100">
            <ThumbsUp className="w-5 h-5" strokeWidth={2} fill="#0084ff" />
          </button>}
      </div>

      {/* Home indicator */}
      <div className="h-4 flex items-center justify-center bg-white">
        <div className="w-24 h-1 bg-black/20 rounded-full" />
      </div>
    </div>;
}