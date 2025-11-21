import type { ModelConfig } from '../types';

// RCA NOTE: Switched from 'gemini-2.5-flash' to 'gemini-1.5-flash'.
// '2.5' is a Preview model which enforces strict rate limits (Shared Quota) even on paid accounts.
// '1.5' is the Production model which respects Pay-As-You-Go billing for higher limits.

export const DEFAULT_MODEL_CONFIG: Record<string, ModelConfig> = {
  AI_APPLY: {
    model: 'gemini-1.5-flash',
    maxTokens: 1000,
    temperature: 0.7
  },
  AI_DECISIONING: {
    model: 'gemini-1.5-pro',
    maxTokens: 2000,
    temperature: 0.2
  },
  AI_ASSISTANT: {
    model: 'gemini-1.5-flash',
    maxTokens: 500,
    temperature: 0.9
  },
  ADDRESS_PARSING: {
    model: 'gemini-1.5-flash',
    maxTokens: 200,
    temperature: 0.1
  },
  APP_PARSING: {
    model: 'gemini-1.5-flash',
    maxTokens: 1500,
    temperature: 0.1
  }
};