import type { Quote } from '../../quotes/types';

export type PhotoTarget = 'cover' | number | `extra:${string}`;
/** A single contract for every Quote editor field mutation, from details to canvas. */
export type EditQuoteField = (key: keyof Quote, value: Quote[keyof Quote]) => void;
