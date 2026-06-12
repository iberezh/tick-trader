export const TOPICS = {
  prices: 'prices',
  trades: 'trades',
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];
