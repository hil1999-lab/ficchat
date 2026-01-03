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
  const EXPORT_SCALE = 2;
  // Nudge only during export to counter html2canvas baseline drift (Windows tends to render text slightly lower)
  const EXPORT_TEXT_NUDGE_PX = 1;

  const waitForFonts = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyDoc = document as any;
      if (anyDoc.fonts?.ready) {
        await anyDoc.fonts.ready;
      }
    } catch {
      // non-blocking
    }
  };

  const getBorderCssPx = (el: HTMLElement) => {
    const cs = window.getComputedStyle(el);
    const bw = parseFloat(cs.borderLeftWidth || '0');
    return Number.isFinite(bw) ? bw : 0;
  };

  const injectExportTextNudge = (clonedDoc: any) => {
    const style = clonedDoc.createElement('style');
    style.textContent = `
      /* Export-only: lift text slightly to match on-screen preview */
      #phone-preview span,
      #phone-preview p,
      #phone-preview h1,
      #phone-preview h2,
      #phone-preview h3,
      #phone-preview div[contenteditable],
      #phone-preview [contenteditable="true"] {
        position: relative;
        top: -${EXPORT_TEXT_NUDGE_PX}px;
      }
    `;
    clonedDoc.head.appendChild(style);
  };

  const cropOutBorder = (src: HTMLCanvasElement, borderCssPx: number) => {
    const borderPx = Math.round(borderCssPx * EXPORT_SCALE);
    const out = document.createElement('canvas');
    out.width = Math.max(1, src.width - borderPx * 2);
    out.height = Math.max(1, src.height - borderPx * 2);
    const ctx = out.getContext('2d');
    if (!ctx) return src;

    // Solid background avoids dark/black edge artifacts around transparency
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);

    ctx.drawImage(
      src,
      borderPx,
      borderPx,
      out.width,
      out.height,
      0,
      0,
      out.width,
      out.height
    );

    return out;
  };

  const downloadPng = (canvas: HTMLCanvasElement, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

    const handleScreenshot = async () => {
    const element = document.getElementById('phone-preview') as HTMLElement | null;
    if (!element) return;

    await waitForFonts();

    // Capture current scroll position
    const scrollArea = element.querySelector('#chat-scroll-area') as HTMLElement | null;
    const currentScrollTop = scrollArea ? Math.round(scrollArea.scrollTop) : 0;

    // Read border width from the real element (so crop stays correct even if you tweak styling later)
    const borderCssPx = getBorderCssPx(element);

    try {
      const canvas = await html2canvas(element, {
        scale: EXPORT_SCALE,
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (el: Element) => el.classList.contains('no-screenshot'),
        onclone: (clonedDoc: any) => {
          // Apply export-only tweaks inside the cloned DOM used by html2canvas
          clonedDoc.documentElement.classList.add('screenshot-mode');
          injectExportTextNudge(clonedDoc);

          const clonedPhone = clonedDoc.getElementById('phone-preview');
          if (clonedPhone) {
            // Shadow sometimes produces a dark edge after rasterization
            clonedPhone.style.boxShadow = 'none';
          }

          const clonedScrollArea = clonedDoc.getElementById('chat-scroll-area');
          if (clonedScrollArea) {
            // Hide scrollbars for the screenshot
            clonedScrollArea.style.overflow = 'hidden';

            // html2canvas can ignore inner scrollTop, so simulate by translating children
            if (currentScrollTop > 0) {
              Array.from(clonedScrollArea.children).forEach((child: any) => {
                child.style.transform = `translateY(-${currentScrollTop}px)`;
              });
            }
          }
        }
      });

      // Remove the device frame/border WITHOUT changing layout during render
      const processed = cropOutBorder(canvas, borderCssPx);
      downloadPng(processed, `chat-screenshot-${Date.now()}.png`);
    } catch (err) {
      console.error('Screenshot failed:', err);
      alert('Failed to capture screenshot.');
    }
  };

    const handleLongScreenshot = async () => {
    const element = document.getElementById('phone-preview') as HTMLElement | null;
    if (!element) return;

    await waitForFonts();

    // Create a clone to manipulate (long screenshot expands the scroll area)
    const clone = element.cloneNode(true) as HTMLElement;

    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '-10000px';
    clone.style.height = 'auto';
    clone.style.maxHeight = 'none';
    clone.style.overflow = 'visible';

    document.body.appendChild(clone);

    // Find internal scrollable areas and expand them (IDs set in Preview.tsx)
    const wrapper = clone.querySelector('#chat-content-wrapper') as HTMLElement | null;
    const scrollArea = clone.querySelector('#chat-scroll-area') as HTMLElement | null;

    if (wrapper && scrollArea) {
      wrapper.style.height = 'auto';
      wrapper.style.flex = 'none';
      wrapper.style.overflow = 'visible';

      scrollArea.style.height = 'auto';
      scrollArea.style.overflow = 'visible';
      scrollArea.style.flex = 'none';
    }

    // Border width for crop (same visual border as in preview)
    const borderCssPx = getBorderCssPx(clone);

    try {
      await new Promise(r => setTimeout(r, 100));

      const canvas = await html2canvas(clone, {
        scale: EXPORT_SCALE,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowHeight: clone.scrollHeight + 100,
        ignoreElements: (el: Element) => el.classList.contains('no-screenshot'),
        onclone: (clonedDoc: any) => {
          clonedDoc.documentElement.classList.add('screenshot-mode');
          injectExportTextNudge(clonedDoc);

          const clonedPhone = clonedDoc.getElementById('phone-preview');
          if (clonedPhone) {
            clonedPhone.style.boxShadow = 'none';
          }
        }
      });

      const processed = cropOutBorder(canvas, borderCssPx);
      downloadPng(processed, `ficchat-long-${Date.now()}.png`);
    } catch (err) {
      console.error('Long screenshot failed:', err);
      alert('Failed to capture long screenshot.');
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
