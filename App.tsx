import React, { useState, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { Preview } from './components/Preview';
import { Message, User } from './types';
import { INITIAL_USERS, INITIAL_MESSAGES } from './constants';
import { generateId } from './utils/helpers';
import { Eye, Edit2 } from 'lucide-react';

// Declaration for html2canvas attached to window via script tag
declare const html2canvas: any;

function App() {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [chatTitle, setChatTitle] = useState('Group Chat');
  const [isMobilePreview, setIsMobilePreview] = useState(false);

  // --- User Actions ---
  const addUser = useCallback((user: User) => {
    setUsers(prev => [...prev, user]);
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }, []);

  const deleteUser = useCallback((id: string) => {
    if (users.length <= 1) {
      alert("You need at least one character.");
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
  }, [users.length]);

  // --- Message Actions ---
  const addMessage = useCallback((msg: Omit<Message, 'id'>) => {
    setMessages(prev => [...prev, { ...msg, id: generateId() }]);
  }, []);

  // Batch import for script parser
  const batchAdd = useCallback((newUsers: User[], newMessages: Message[]) => {
    setUsers(prev => [...prev, ...newUsers]);
    setMessages(prev => [...prev, ...newMessages]);
  }, []);

  const deleteMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // --- Screenshot ---
  const handleScreenshot = async () => {
    const element = document.getElementById('phone-preview');
    if (!element) return;

    // Capture current scroll position
    const scrollArea = element.querySelector('#chat-scroll-area');
    const currentScrollTop = scrollArea ? scrollArea.scrollTop : 0;

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: null,
        // Ensure we capture everything including the watermark
        ignoreElements: (element: Element) => element.classList.contains('no-screenshot'),
        onclone: (clonedDoc: any) => {
          const clonedScrollArea = clonedDoc.getElementById('chat-scroll-area');
          if (clonedScrollArea) {
            // Hide scrollbars for the screenshot
            clonedScrollArea.style.overflow = 'hidden';
            
            // Manually shift content up to simulate scrolling
            // html2canvas often ignores scrollTop on inner elements, so we use transform
            if (currentScrollTop > 0) {
               Array.from(clonedScrollArea.children).forEach((child: any) => {
                   child.style.transform = `translateY(-${currentScrollTop}px)`;
               });
            }
          }
          
          // Remove border radius for square screenshot
          const clonedPhone = clonedDoc.getElementById('phone-preview');
          if (clonedPhone) {
            clonedPhone.style.borderRadius = '0';
          }
        }
      });
      
      const link = document.createElement('a');
      link.download = `chat-screenshot-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Screenshot failed:", err);
      alert("Failed to capture screenshot.");
    }
  };

  const handleLongScreenshot = async () => {
    const element = document.getElementById('phone-preview');
    if (!element) return;

    // Create a clone to manipulate
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Position it off-screen but part of DOM so it renders
    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '-10000px';
    // Remove fixed height constraints on the main container
    clone.style.height = 'auto';
    clone.style.maxHeight = 'none';
    clone.style.overflow = 'visible';
    clone.style.borderRadius = '0'; 

    // Find internal scrollable areas and expand them
    // IDs were added in Preview.tsx
    const wrapper = clone.querySelector('#chat-content-wrapper') as HTMLElement;
    const scrollArea = clone.querySelector('#chat-scroll-area') as HTMLElement;
    
    if (wrapper && scrollArea) {
        // Expand wrapper
        wrapper.style.height = 'auto';
        wrapper.style.flex = 'none';
        wrapper.style.overflow = 'visible';
        
        // Expand scroll area
        scrollArea.style.height = 'auto';
        scrollArea.style.overflow = 'visible';
        scrollArea.style.flex = 'none';
    }

    document.body.appendChild(clone);

    try {
      // Small delay to ensure rendering of the cloned element
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        windowHeight: clone.scrollHeight + 100, // Hint for canvas height
        ignoreElements: (element: Element) => element.classList.contains('no-screenshot')
      });
      
      const link = document.createElement('a');
      link.download = `ficchat-long-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Long screenshot failed:", err);
      alert("Failed to capture long screenshot.");
    } finally {
      document.body.removeChild(clone);
    }
  };

  return (
    <div className="flex h-screen w-full md:flex-row overflow-hidden font-sans relative bg-slate-900 md:bg-transparent">
      
      {/* Mobile Toggle FAB */}
      <button 
        onClick={() => setIsMobilePreview(!isMobilePreview)}
        className="md:hidden fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center hover:bg-indigo-700 transition-all active:scale-95 ring-2 ring-white/50"
        aria-label="Toggle View"
      >
        {isMobilePreview ? <Edit2 size={24} /> : <Eye size={24} />}
      </button>

      {/* Left: Controls */}
      {/* 
        Mobile Behavior: 
        - Absolute positioning to stack on top
        - Uses transform to slide in/out based on state
        - z-40 to be above preview
      */}
      <div className={`
        absolute inset-0 z-40 bg-white w-full h-full transition-transform duration-300 ease-in-out
        md:relative md:w-[380px] lg:w-[420px] md:h-full md:translate-x-0 md:shadow-xl md:z-20
        ${isMobilePreview ? 'translate-x-full' : 'translate-x-0'}
      `}>
        <ControlPanel 
          users={users}
          onAddUser={addUser}
          onUpdateUser={updateUser}
          onDeleteUser={deleteUser}
          onAddMessage={addMessage}
          onBatchAdd={batchAdd}
          onClearMessages={clearMessages}
          onCaptureScreenshot={handleScreenshot}
          onCaptureLongScreenshot={handleLongScreenshot}
          chatTitle={chatTitle}
          setChatTitle={setChatTitle}
        />
      </div>

      {/* Right: Preview */}
      {/* 
        Mobile Behavior:
        - Always full width/height behind the control panel
        - Visible when ControlPanel slides away
      */}
      <div className="flex-1 h-full relative bg-slate-200 w-full">
        <Preview 
          messages={messages}
          users={users}
          onDelete={deleteMessage}
          onUpdateMessage={updateMessage}
          chatTitle={chatTitle}
        />
      </div>

    </div>
  );
}

export default App;