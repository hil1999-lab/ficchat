import React, { useState, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { Preview } from './components/Preview';
import { Message, User } from './types';
import { INITIAL_USERS, INITIAL_MESSAGES } from './constants';
import { generateId } from './utils/helpers';
import { Eye, Edit2 } from 'lucide-react';

// Declaration for html2canvas attached to window via script tag
declare const html2canvas: any;

// --- Export tuning ---
// The preview uses an iPhone-like frame with a thick border. For exports, we crop the inner screen area
// instead of mutating CSS (mutating borders changes layout and can change line-wrapping).
const FRAME_BORDER_PX = 8;
// html2canvas sometimes renders text with a tiny baseline drift vs the live preview.
// We capture 1px extra at the top (inside the frame) and then shift the bitmap up by 1px.
const EXPORT_TEXT_NUDGE_PX = 1;

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

    // Wait for fonts to be ready (reduces baseline drift in html2canvas)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyDoc = document as any;
      if (anyDoc.fonts?.ready) {
        await anyDoc.fonts.ready;
      }
    } catch {
      // non-blocking
    }

    // Capture current scroll position
    const scrollArea = element.querySelector('#chat-scroll-area') as HTMLElement | null;
    const currentScrollTop = scrollArea ? Math.round(scrollArea.scrollTop) : 0;

    try {
      const scale = 2;
      const w = element.clientWidth;
      const h = element.clientHeight;
      const innerW = Math.max(1, w - FRAME_BORDER_PX * 2);
      const innerH = Math.max(1, h - FRAME_BORDER_PX * 2);

      // Crop out the iPhone frame (black border + shadow) while keeping the same inner layout.
      // We capture 1px extra at the top and then shift the bitmap up by 1px to counter html2canvas baseline drift.
      const cropX = FRAME_BORDER_PX;
      const cropY = Math.max(0, FRAME_BORDER_PX - EXPORT_TEXT_NUDGE_PX);
      const cropW = innerW;
      const cropH = innerH + EXPORT_TEXT_NUDGE_PX;

      const rawCanvas = await html2canvas(element, {
        scale,
        useCORS: true,
        backgroundColor: '#ffffff',
        foreignObjectRendering: true,
        x: cropX,
        y: cropY,
        width: cropW,
        height: cropH,
        ignoreElements: (el: Element) => el.classList.contains('no-screenshot'),
        onclone: (clonedDoc: any) => {
          clonedDoc.documentElement.classList.add('screenshot-mode');

          // Remove only visual effects that can bleed into edges (doesn't affect layout).
          const clonedPhone = clonedDoc.getElementById('phone-preview');
          if (clonedPhone) {
            clonedPhone.style.boxShadow = 'none';
            clonedPhone.style.outline = 'none';
            clonedPhone.style.borderRadius = '0';
            clonedPhone.style.background = '#ffffff';
          }

          const clonedScrollArea = clonedDoc.getElementById('chat-scroll-area');
          if (clonedScrollArea) {
            clonedScrollArea.style.overflow = 'hidden';
            if (currentScrollTop > 0) {
              Array.from(clonedScrollArea.children).forEach((child: any) => {
                child.style.transform = `translateY(-${currentScrollTop}px)`;
              });
            }
          }
        }
      });

      // Nudge bitmap up by 1px (scaled) without re-introducing any border.
      const shift = EXPORT_TEXT_NUDGE_PX * scale;
      const out = document.createElement('canvas');
      out.width = rawCanvas.width;
      out.height = Math.max(1, rawCanvas.height - shift);
      const ctx = out.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(rawCanvas, 0, -shift);
      }

      const link = document.createElement('a');
      link.download = `chat-screenshot-${Date.now()}.png`;
      link.href = out.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Screenshot failed:", err);
      alert("Failed to capture screenshot.");
    }
  };

  const handleLongScreenshot = async () => {
    const element = document.getElementById('phone-preview');
    if (!element) return;

    // Wait for fonts to be ready (reduces baseline drift in html2canvas)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyDoc = document as any;
      if (anyDoc.fonts?.ready) {
        await anyDoc.fonts.ready;
      }
    } catch {
      // non-blocking
    }

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
    // Keep border intact to preserve exact line-wrapping; we will crop it away during render.
    clone.style.borderRadius = '0';
    clone.style.boxShadow = 'none';
    clone.style.outline = 'none';
    clone.style.background = '#ffffff';

    // Find internal scrollable areas and expand them
    // IDs were added in Preview.tsx
    const wrapper = clone.querySelector('#chat-content-wrapper') as HTMLElement | null;
    const scrollArea = clone.querySelector('#chat-scroll-area') as HTMLElement | null;

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

      const scale = 2;
      const w = clone.clientWidth;
      const totalH = clone.scrollHeight;
      const innerW = Math.max(1, w - FRAME_BORDER_PX * 2);
      const innerH = Math.max(1, totalH - FRAME_BORDER_PX * 2);

      const cropX = FRAME_BORDER_PX;
      const cropY = Math.max(0, FRAME_BORDER_PX - EXPORT_TEXT_NUDGE_PX);
      const cropW = innerW;
      const cropH = innerH + EXPORT_TEXT_NUDGE_PX;

      const rawCanvas = await html2canvas(clone, {
        scale,
        useCORS: true,
        backgroundColor: '#ffffff',
        foreignObjectRendering: true,
        x: cropX,
        y: cropY,
        width: cropW,
        height: cropH,
        windowHeight: totalH + 200,
        ignoreElements: (el: Element) => el.classList.contains('no-screenshot'),
        onclone: (clonedDoc: any) => {
          clonedDoc.documentElement.classList.add('screenshot-mode');
          const clonedPhone = clonedDoc.getElementById('phone-preview');
          if (clonedPhone) {
            clonedPhone.style.boxShadow = 'none';
            clonedPhone.style.outline = 'none';
            clonedPhone.style.borderRadius = '0';
            clonedPhone.style.background = '#ffffff';
          }
        }
      });

      const shift = EXPORT_TEXT_NUDGE_PX * scale;
      const out = document.createElement('canvas');
      out.width = rawCanvas.width;
      out.height = Math.max(1, rawCanvas.height - shift);
      const ctx = out.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(rawCanvas, 0, -shift);
      }

      const link = document.createElement('a');
      link.download = `ficchat-long-${Date.now()}.png`;
      link.href = out.toDataURL('image/png');
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
