import React from 'react';
import { Message, User } from '../types';
import { Trash2, Signal, Wifi, Battery, ChevronLeft, MoreHorizontal, Image as ImageIcon, Mic } from 'lucide-react';

interface PreviewProps {
  messages: Message[];
  users: User[];
  onDelete: (id: string) => void;
  onUpdateMessage: (id: string, updates: Partial<Message>) => void;
  chatTitle: string;
}

export const Preview: React.FC<PreviewProps> = ({ 
  messages, 
  users, 
  onDelete, 
  onUpdateMessage,
  chatTitle 
}) => {
  
  const handleBlur = (id: string, field: 'content', e: React.FormEvent<HTMLElement>) => {
    const text = e.currentTarget.innerText;
    onUpdateMessage(id, { [field]: text });
  };

  const getUser = (userId?: string) => users.find(u => u.id === userId);

  return (
    <div className="h-full bg-slate-100 flex items-center justify-center p-4 md:p-8 overflow-hidden">
      
      {/* Phone Container 
          Updates: 
          - Mobile: w-full h-auto (Width driven)
          - Tablet/Desktop: w-auto h-full (Height driven to prevent vertical overflow)
          - Combined with max-w/max-h constraints and aspect ratio
      */}
      <div 
        id="phone-preview" 
        className="
          w-full h-auto 
          md:w-auto md:h-full 
          max-w-[400px] 
          max-h-full 
          md:max-h-[850px]
          aspect-[9/19.5] 
          bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl border-[8px] border-slate-900 overflow-hidden flex flex-col relative
        "
      >
        
        {/* Status Bar */}
        <div className="h-12 bg-ios-bg/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20 sticky top-0 text-black">
            <span className="text-[15px] font-semibold tracking-tight">9:41</span>
            <div className="flex items-center gap-1.5">
                <Signal size={16} fill="currentColor" />
                <Wifi size={16} />
                <Battery size={20} fill="currentColor" />
            </div>
        </div>

        {/* App Navigation Bar */}
        <div className="h-12 bg-ios-bg/90 backdrop-blur-md border-b border-slate-200/50 flex items-center justify-between px-2 shrink-0 z-10 text-black">
           <div className="flex items-center text-ios-blue cursor-pointer">
              <ChevronLeft size={28} />
              <span className="text-[17px] -ml-1">Back</span>
           </div>
           
           <div className="flex flex-col items-center justify-center">
              <span className="text-[17px] font-semibold">{chatTitle}</span>
           </div>
           
           <div className="w-16 flex justify-end pr-3 text-ios-blue">
             <MoreHorizontal />
           </div>
        </div>

        {/* Messages Area Container */}
        <div id="chat-content-wrapper" className="flex-1 relative overflow-hidden flex flex-col bg-slate-50">
          
          {/* Scrollable Content */}
          <div id="chat-scroll-area" className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10 scroll-smooth" style={{ paddingBottom: '20px' }}>
            {messages.map((msg) => {
               const user = getUser(msg.userId);
               const isMe = user?.isCurrentUser;
               const isTime = msg.type === 'time';

               if (isTime) {
                 return (
                   <div key={msg.id} className="flex justify-center py-2 group relative">
                      <button onClick={() => onDelete(msg.id)} className="absolute right-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                      <span 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleBlur(msg.id, 'content', e)}
                        className="text-xs font-medium text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded outline-none min-w-[30px] text-center backdrop-blur-sm"
                      >
                        {msg.content}
                      </span>
                   </div>
                 );
               }

               if (!user) return null;

               return (
                 <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                   
                   <div className={`relative group flex max-w-[80%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      
                      {/* Delete Button */}
                      <button 
                        onClick={() => onDelete(msg.id)} 
                        className={`
                          absolute top-1/2 -translate-y-1/2 p-1.5 
                          bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 
                          rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 shadow-sm
                          ${isMe ? 'right-full mr-2' : 'left-full ml-2'} 
                        `}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>

                      {/* Avatar */}
                      {!isMe && (
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 self-end mb-1">
                          <img src={user.avatar} crossOrigin="anonymous" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                         {!isMe && <span className="text-[11px] text-slate-400 ml-1 mb-0.5">{user.name}</span>}
                         
                         <div className={`
                           px-3.5 py-2 shadow-sm relative text-[16px] leading-snug break-words
                           ${msg.type === 'image' ? 'p-1 rounded-[12px]' : 'rounded-[18px]'}
                           ${isMe 
                              ? (msg.type === 'text' ? 'bg-ios-blue text-white rounded-br-md' : 'bg-transparent') 
                              : (msg.type === 'text' ? 'bg-ios-gray text-black rounded-bl-md' : 'bg-transparent')}
                         `}>
                            {msg.type === 'text' ? (
                              <div
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => handleBlur(msg.id, 'content', e)}
                                className="outline-none min-w-[10px] whitespace-pre-wrap"
                              >
                                {msg.content}
                              </div>
                            ) : (
                              <img src={msg.content} crossOrigin="anonymous" className="max-w-full rounded-lg" alt="Sent" />
                            )}
                         </div>
                      </div>
                   </div>
                 </div>
               )
            })}
          </div>
        </div>

        {/* Input Bar Simulation (Editable) */}
        <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 flex items-end gap-3 shrink-0 relative z-20">
            <div className="pb-2 text-slate-400"><ImageIcon size={24} /></div>
            <div className="flex-1 min-h-[36px] bg-white border border-slate-300 rounded-[18px] px-4 py-[7px] flex items-center shadow-sm">
                <div 
                   contentEditable 
                   suppressContentEditableWarning 
                   className="text-[16px] w-full outline-none text-slate-800 leading-tight empty:before:content-['iMessage'] empty:before:text-slate-400"
                ></div>
            </div>
            <div className="pb-2 text-slate-400"><Mic size={24} /></div>
        </div>

        {/* Professional Footer Watermark */}
        <div className="bg-slate-50 w-full shrink-0 flex items-center justify-center pb-3 pt-1">
          <span className="text-[10px] text-slate-300 font-medium select-none">
            Made with FicChat Studio — Fictional Content / 虚构内容
          </span>
        </div>

      </div>
    </div>
  );
};