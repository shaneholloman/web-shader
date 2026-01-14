// /Users/matiasgf/repos/experiments/ralph-gpu/packages/core/src/event-emitter.ts

import type { RalphGPUEvent, EventType } from "./events";

export type EventListener = (event: RalphGPUEvent) => void;

export interface EventEmitterOptions {
  types?: EventType[];      // Only emit these event types (empty = all)
  historySize?: number;  // Max history size (default: 1000)
}

export class EventEmitter {
  private listeners = new Map<EventType, Set<EventListener>>();
  private allListeners = new Set<EventListener>();
  private history: RalphGPUEvent[] = [];
  private historyIndex = 0;
  private types: Set<EventType> | null; // Filter events by type if set
  private maxHistory: number;
  private isHistoryFull = false; // To manage circular buffer

  constructor(options: EventEmitterOptions = {}) {
    this.types = options.types ? new Set(options.types) : null;
    this.maxHistory = options.historySize ?? 1000;
  }

  /**
   * Subscribe to a specific event type.
   */
  on(type: EventType, listener: EventListener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
    return () => this.off(type, listener);
  }

  /**
   * Unsubscribe from a specific event type.
   */
  off(type: EventType, listener: EventListener): void {
    if (this.listeners.has(type)) {
      this.listeners.get(type)!.delete(listener);
    }
  }

  /**
   * Subscribe to a specific event type once.
   */
  once(type: EventType, listener: EventListener): () => void {
    const onceListener: EventListener = (event) => {
      listener(event);
      this.off(type, onceListener);
    };
    return this.on(type, onceListener);
  }

  /**
   * Subscribe to all events.
   */
  onAll(listener: EventListener): () => void {
    this.allListeners.add(listener);
    return () => this.offAll(listener);
  }

  /**
   * Unsubscribe from all events.
   */
  offAll(listener: EventListener): void {
    this.allListeners.delete(listener);
  }

  /**
   * Emit an event.
   */
  emit(event: RalphGPUEvent): void {
    // Check if this event type is enabled by the filter
    if (this.types && !this.types.has(event.type)) {
      return;
    }

    // Add to history if history size > 0
    if (this.maxHistory > 0) {
      if (this.isHistoryFull) {
        this.history[this.historyIndex] = event;
      } else {
        this.history.push(event);
      }
      this.historyIndex = (this.historyIndex + 1) % this.maxHistory;
      if (this.historyIndex === 0 && !this.isHistoryFull) {
        this.isHistoryFull = true; // History is now full and acting as circular buffer
      }
    }

    // Notify specific listeners
    if (this.listeners.has(event.type)) {
      this.listeners.get(event.type)!.forEach(listener => listener(event));
    }

    // Notify all listeners
    this.allListeners.forEach(listener => listener(event));
  }

  /**
   * Get event history.
   */
  getHistory(filter?: EventType[]): RalphGPUEvent[] {
    const relevantHistory = this.isHistoryFull ?
      [...this.history.slice(this.historyIndex), ...this.history.slice(0, this.historyIndex)] :
      [...this.history];

    if (filter && filter.length > 0) {
      const filterSet = new Set(filter);
      return relevantHistory.filter(event => filterSet.has(event.type));
    }
    return relevantHistory;
  }

  /**
   * Clear event history.
   */
  clearHistory(): void {
    this.history = [];
    this.historyIndex = 0;
    this.isHistoryFull = false;
  }
}
