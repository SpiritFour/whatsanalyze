import type { Message } from '../types';

export interface Analyzer<T> {
  analyze(messages: Message[]): T;
}