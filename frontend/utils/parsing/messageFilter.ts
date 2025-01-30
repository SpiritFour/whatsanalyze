import { type Message } from './types';

export class MessageFilter {
  static filterValidMessages(messages: Message[]): Message[] {
    return messages.filter(msg => msg.author !== null);
  }
}