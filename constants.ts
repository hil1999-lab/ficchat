import { Message, User } from "./types";
import { avatarDataUrl, generateId } from "./utils/helpers";

const USER_A_ID = "user_a";
const USER_B_ID = "user_b";

export const INITIAL_USERS: User[] = [
  {
    id: USER_A_ID,
    name: "Alex",
    avatar: avatarDataUrl("Alex", USER_A_ID),
    isCurrentUser: false,
  },
  {
    id: USER_B_ID,
    name: "Riley",
    avatar: avatarDataUrl("Riley", USER_B_ID),
    isCurrentUser: true,
  },
];

export const INITIAL_MESSAGES: Message[] = [
  { id: generateId(), type: "time", content: "10:30 AM" },
  { id: generateId(), userId: USER_A_ID, type: "text", content: "Quick check-in: are you free today?" },
  { id: generateId(), userId: USER_B_ID, type: "text", content: "Yes — what’s up?" },
  { id: generateId(), userId: USER_A_ID, type: "text", content: "Need your eyes on a draft before I send it." },
];

export const WORK_SKIN_CSS = `
/* CSS for AO3 Work Skin */
#workskin .chat-container {
  max-width: 600px;
  margin: 20px auto;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
/* (Trim/add as needed for your target platform.) */
`;
