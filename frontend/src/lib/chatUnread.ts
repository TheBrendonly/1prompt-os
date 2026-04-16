export const CHAT_UNREAD_SYNC_EVENT = 'chat-unread-sync';

export interface ChatUnreadSyncDetail {
  clientId: string;
  hasUnread: boolean;
}

export function hasUnreadMessages(
  lastMessageAt: string | null | undefined,
  lastReadAt: string | null | undefined
) {
  if (!lastMessageAt) return false;
  if (!lastReadAt) return true;

  return new Date(lastMessageAt).getTime() > new Date(lastReadAt).getTime();
}

export function dispatchChatUnreadSync(detail: ChatUnreadSyncDetail) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<ChatUnreadSyncDetail>(CHAT_UNREAD_SYNC_EVENT, { detail })
  );
}

export function isChatUnreadSyncEvent(
  event: Event
): event is CustomEvent<ChatUnreadSyncDetail> {
  return event.type === CHAT_UNREAD_SYNC_EVENT;
}