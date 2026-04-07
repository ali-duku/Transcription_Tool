function normalizeMessage(message: string, prefix: string): string {
  if (!message.startsWith(prefix)) {
    return message;
  }
  return message.slice(prefix.length).trim();
}

function scopedMessages(messages: string[] | null | undefined, prefix: string): string[] {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }
  return messages
    .filter((message) => message.startsWith(prefix))
    .map((message) => normalizeMessage(message, prefix));
}

export function questionScopedMessages(messages: string[] | null | undefined, index: number): string[] {
  const prefix = `Question ${index + 1}:`;
  return scopedMessages(messages, prefix);
}

export function contentScopedMessages(messages: string[] | null | undefined, index: number): string[] {
  const prefix = `Content Section ${index + 1}:`;
  return scopedMessages(messages, prefix);
}
