import { Message, User } from "../types";

const escapeHtml = (s: string) => s
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

export const generateHtml = (messages: Message[], users: User[]): string => {
  const userMap = new Map(users.map(u => [u.id, u]));

  const lines = messages.map((msg) => {
    let safeContent = "";
    
    if (msg.type === 'image') {
       safeContent = `<img src="${msg.content}" style="max-width:100%; border-radius: 12px;" alt="Image" />`;
    } else {
       safeContent = escapeHtml(msg.content);
    }

    if (msg.type === 'time') {
      return `
  <div class="chat-row time">
    <span class="chat-time-text">${safeContent}</span>
  </div>`;
    }

    const user = msg.userId ? userMap.get(msg.userId) : null;
    if (!user) return '';

    const sideClass = user.isCurrentUser ? 'sent' : 'recv';
    
    if (sideClass === 'sent') {
      return `
  <div class="chat-row sent">
    <div class="chat-bubble ${msg.type === 'image' ? 'image-bubble' : ''}">${safeContent}</div>
  </div>`;
    }

    // Recv type
    return `
  <div class="chat-group">
    <div class="chat-name">${escapeHtml(user.name)}</div>
    <div class="chat-row recv">
      <img src="${user.avatar}" class="chat-avatar" alt="${escapeHtml(user.name)}" />
      <div class="chat-bubble ${msg.type === 'image' ? 'image-bubble' : ''}">${safeContent}</div>
    </div>
  </div>`;
  });

  return `<div class="chat-container">\n${lines.join('\n')}\n</div>`;
};
