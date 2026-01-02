import React, { useState } from 'react';
import { Message, User, MessageType } from '../types';
import { avatarDataUrl, fileToBase64, generateId } from '../utils/helpers';
import { 
  Plus, Trash2, UserPlus, Image as ImageIcon, MessageSquare, 
  Camera, Settings, Users, FileText, Play, ArrowDownToLine
} from 'lucide-react';

interface ControlPanelProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (id: string, user: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
  onAddMessage: (msg: Omit<Message, 'id'>) => void;
  onBatchAdd: (newUsers: User[], newMessages: Message[]) => void;
  onClearMessages: () => void;
  onCaptureScreenshot: () => void;
  onCaptureLongScreenshot: () => void;
  chatTitle: string;
  setChatTitle: (t: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onAddMessage,
  onBatchAdd,
  onClearMessages,
  onCaptureScreenshot,
  onCaptureLongScreenshot,
  chatTitle,
  setChatTitle
}) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'users' | 'settings'>('messages');
  
  // Input Modes: 'manual' | 'script'
  const [inputMode, setInputMode] = useState<'manual' | 'script'>('manual');

  // Manual Input State
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [messageType, setMessageType] = useState<MessageType>('text');
  const [textContent, setTextContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Script Input State
  const [scriptText, setScriptText] = useState('');

  // New User State
  const [newUserName, setNewUserName] = useState('');
  
  const handleAddMessage = async () => {
    let content = textContent;
    
    if (messageType === 'image') {
      if (!imageFile) return;
      content = await fileToBase64(imageFile);
    } else {
      if (!content.trim()) return;
    }

    onAddMessage({
      userId: selectedUserId,
      type: messageType,
      content
    });

    setTextContent('');
    setImageFile(null);
  };

  const handleScriptParse = () => {
    if (!scriptText.trim()) return;

    const lines = scriptText.split('\n');
    const newMessages: Message[] = [];
    const newUsers: User[] = [];
    const tempUserMap = new Map<string, string>(); // Name -> ID mapping (combining existing + new)

    // Pre-fill map with existing users
    users.forEach(u => tempUserMap.set(u.name.toLowerCase(), u.id));

    lines.forEach(line => {
      line = line.trim();
      if (!line) return;

      // Match "Name: Content" or "Name：Content"
      const match = line.match(/^([^:：]+)[:：]([\s\S]+)$/);
      
      if (match) {
        const rawName = match[1].trim();
        const content = match[2].trim();
        const lowerName = rawName.toLowerCase();

        // 1. Check for system keywords
        if (['time', 'date', 'narrator', '旁白', '时间'].includes(lowerName)) {
           newMessages.push({
             id: generateId(),
             type: 'time',
             content: content
           });
           return;
        }

        // 2. Find User ID
        let userId = tempUserMap.get(lowerName);

        // 3. If User doesn't exist, create one
        if (!userId) {
          userId = generateId();
          const newUser: User = {
            id: userId,
            name: rawName,
            avatar: avatarDataUrl(rawName, userId),
            isCurrentUser: false // Default to left side
          };
          newUsers.push(newUser);
          tempUserMap.set(lowerName, userId);
        }

        // 4. Create Message
        newMessages.push({
          id: generateId(),
          userId: userId,
          type: 'text',
          content: content
        });

      } else {
        // Fallback: If line has no colon, treat as Narrator/Time if it's short, or just skip?
        // Let's treat it as a "Time/System" message for safety.
        if (line.length > 0) {
           newMessages.push({
             id: generateId(),
             type: 'time',
             content: line
           });
        }
      }
    });

    onBatchAdd(newUsers, newMessages);
    setScriptText('');
    alert(`Imported ${newMessages.length} messages and created ${newUsers.length} new characters.`);
  };

  const handleAddUser = () => {
    if (!newUserName.trim()) return;
    onAddUser({
      id: generateId(),
      name: newUserName,
      avatar: avatarDataUrl(newUserName),
      isCurrentUser: false
    });
    setNewUserName('');
  };

  const handleAvatarUpload = async (userId: string, file: File) => {
    const base64 = await fileToBase64(file);
    onUpdateUser(userId, { avatar: base64 });
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          FicChat Studio
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Create authentic chat screenshots for your stories.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button 
          onClick={() => setActiveTab('messages')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'messages' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <MessageSquare size={16} /> Msgs
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'users' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Users size={16} /> Roles
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Settings size={16} /> Config
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* --- MESSAGES TAB --- */}
        {activeTab === 'messages' && (
          <div className="space-y-6">
            
            {/* Input Mode Toggle */}
            <div className="flex p-1 bg-slate-100 rounded-lg">
               <button
                 onClick={() => setInputMode('manual')}
                 className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-all ${inputMode === 'manual' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
               >
                 <MessageSquare size={14} /> Manual
               </button>
               <button
                 onClick={() => setInputMode('script')}
                 className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-all ${inputMode === 'script' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
               >
                 <FileText size={14} /> Script Import
               </button>
            </div>

            {/* === MANUAL MODE === */}
            {inputMode === 'manual' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                {/* Sender Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Sender</label>
                  <select 
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} {u.isCurrentUser ? '(Me)' : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Type Selection */}
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                  <button 
                    onClick={() => setMessageType('text')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${messageType === 'text' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                  >
                    Text
                  </button>
                  <button 
                    onClick={() => setMessageType('image')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${messageType === 'image' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                  >
                    Image
                  </button>
                </div>

                {/* Content Input */}
                <div className="space-y-2">
                  {messageType === 'text' ? (
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full h-24 p-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
                    />
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors relative">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <ImageIcon size={24} className="mb-2" />
                      <span className="text-xs">{imageFile ? imageFile.name : 'Click to upload image'}</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={handleAddMessage}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus size={16} /> Send Message
                </button>
                
                <div className="border-t border-slate-100 pt-4">
                  <button 
                    onClick={() => onAddMessage({ type: 'time', content: '10:00 AM' })}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-medium transition-colors"
                  >
                    Add Time / System Text
                  </button>
                </div>
              </div>
            )}

            {/* === SCRIPT MODE === */}
            {inputMode === 'script' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">Format Guide:</p>
                  <p><code className="bg-white px-1 border rounded">Name: Message content</code></p>
                  <p><code className="bg-white px-1 border rounded">Narrator: Some context...</code></p>
                  <p className="italic opacity-75">New characters will be created automatically.</p>
                </div>

                <textarea
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder={`Steve: We need to talk.\nBucky: About what?\nTime: 1 hour later...`}
                  className="w-full h-64 p-3 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />

                <button 
                  onClick={handleScriptParse}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Play size={16} /> Parse & Import Script
                </button>
              </div>
            )}

          </div>
        )}

        {/* --- USERS TAB --- */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Add User */}
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="New Character Name"
                className="flex-1 p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAddUser()}
              />
              <button 
                onClick={handleAddUser}
                disabled={!newUserName.trim()}
                className="px-4 py-2 bg-indigo-600 disabled:bg-slate-300 text-white rounded-lg flex items-center justify-center transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            {/* User List */}
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col gap-3">
                   
                   <div className="flex items-center gap-3">
                      {/* Avatar Upload */}
                      <div className="relative w-12 h-12 shrink-0 group cursor-pointer">
                        <img src={user.avatar} className="w-full h-full rounded-full object-cover border border-slate-100" />
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <Camera size={16} className="text-white" />
                        </div>
                        <input 
                           type="file" 
                           accept="image/*"
                           className="absolute inset-0 opacity-0 cursor-pointer"
                           onChange={(e) => e.target.files?.[0] && handleAvatarUpload(user.id, e.target.files[0])}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <input 
                          type="text"
                          value={user.name}
                          onChange={(e) => onUpdateUser(user.id, { name: e.target.value })}
                          className="w-full text-sm font-semibold text-slate-700 bg-transparent border-b border-transparent focus:border-indigo-300 focus:outline-none"
                        />
                        <div className="text-xs text-slate-400 mt-0.5">
                           {user.isCurrentUser ? 'Right Side (Me)' : 'Left Side (Others)'}
                        </div>
                      </div>

                      <button 
                        onClick={() => onDeleteUser(user.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                   </div>

                   {/* Position Toggle */}
                   <div className="flex bg-slate-100 rounded-lg p-1">
                      <button 
                        onClick={() => onUpdateUser(user.id, { isCurrentUser: false })}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${!user.isCurrentUser ? 'bg-white shadow text-slate-800' : 'text-slate-400'}`}
                      >
                        Left
                      </button>
                      <button 
                        onClick={() => onUpdateUser(user.id, { isCurrentUser: true })}
                        className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${user.isCurrentUser ? 'bg-white shadow text-ios-blue' : 'text-slate-400'}`}
                      >
                        Right
                      </button>
                   </div>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Chat Title</label>
              <input 
                type="text" 
                value={chatTitle}
                onChange={(e) => setChatTitle(e.target.value)}
                className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <div className="pt-4 border-t border-slate-100 space-y-3">
               <button
                type="button"
                onClick={onCaptureScreenshot}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Camera size={18} />
                Snapshot (Visible)
              </button>
              
              <button
                type="button"
                onClick={onCaptureLongScreenshot}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <ArrowDownToLine size={18} />
                Long Screenshot (All)
              </button>

              <p className="text-xs text-slate-400 text-center mt-2">
                "Visible" captures just the screen. "All" captures the full conversation history.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClearMessages}
                className="w-full py-2 border border-red-200 text-red-500 rounded-lg text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Clear Chat History
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};