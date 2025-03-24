import { DEBUG_ENABLED, DEBUG_PHYSICS, DEBUG_COLLISIONS, DEBUG_PERFORMANCE } from '../constants';

// Simple debugging class
class Debug {
  private isEnabled: boolean;
  private physicDebug: boolean;
  private collisionDebug: boolean;
  private performanceDebug: boolean;
  private logHistory: Array<{timestamp: number, message: string, type: 'log' | 'warn' | 'error' | 'info'}> = [];
  private maxLogHistory: number = 100;
  private performanceMarks: Record<string, { start: number, end?: number }> = {};
  
  constructor(
    isEnabled: boolean, 
    physicsDebug: boolean,
    collisionDebug: boolean,
    performanceDebug: boolean
  ) {
    this.isEnabled = isEnabled;
    this.physicDebug = physicsDebug;
    this.collisionDebug = collisionDebug;
    this.performanceDebug = performanceDebug;
  }
  
  // Standard log with optional tag
  log(message: string, tag?: string): void {
    if (!this.isEnabled) return;
    
    const formattedMessage = tag ? `[${tag}] ${message}` : message;
    console.log(formattedMessage);
    
    this.addToHistory(formattedMessage, 'log');
  }
  
  // Warning log
  warn(message: string, tag?: string): void {
    if (!this.isEnabled) return;
    
    const formattedMessage = tag ? `[${tag}] ${message}` : message;
    console.warn(formattedMessage);
    
    this.addToHistory(formattedMessage, 'warn');
  }
  
  // Error log
  error(message: string, tag?: string): void {
    // Always log errors, even if debug is disabled
    const formattedMessage = tag ? `[${tag}] ${message}` : message;
    console.error(formattedMessage);
    
    this.addToHistory(formattedMessage, 'error');
  }
  
  // Info log
  info(message: string, tag?: string): void {
    if (!this.isEnabled) return;
    
    const formattedMessage = tag ? `[${tag}] ${message}` : message;
    console.info(formattedMessage);
    
    this.addToHistory(formattedMessage, 'info');
  }
  
  // Object log (useful for debugging complex objects)
  object(obj: any, label?: string): void {
    if (!this.isEnabled) return;
    
    if (label) {
      console.log(`[${label}]`, obj);
    } else {
      console.log(obj);
    }
  }
  
  // Physics specific log
  physics(message: string): void {
    if (!this.isEnabled || !this.physicDebug) return;
    
    console.log(`[Physics] ${message}`);
    this.addToHistory(`[Physics] ${message}`, 'log');
  }
  
  // Collision specific log
  collision(message: string): void {
    if (!this.isEnabled || !this.collisionDebug) return;
    
    console.log(`[Collision] ${message}`);
    this.addToHistory(`[Collision] ${message}`, 'log');
  }
  
  // Start timing a performance marker
  startTimer(label: string): void {
    if (!this.isEnabled || !this.performanceDebug) return;
    
    this.performanceMarks[label] = {
      start: performance.now()
    };
  }
  
  // End timing a performance marker and log the result
  endTimer(label: string): void {
    if (!this.isEnabled || !this.performanceDebug) return;
    
    const mark = this.performanceMarks[label];
    if (!mark || mark.end !== undefined) {
      console.warn(`Timer '${label}' was not started or has already ended`);
      return;
    }
    
    mark.end = performance.now();
    const duration = mark.end - mark.start;
    
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }
  
  // Display a group of logs (useful for related logs)
  group(label: string, callback: () => void): void {
    if (!this.isEnabled) {
      callback();
      return;
    }
    
    console.group(label);
    callback();
    console.groupEnd();
  }
  
  // Assert a condition (logs error if condition is false)
  assert(condition: boolean, message: string): void {
    if (!this.isEnabled) return;
    
    console.assert(condition, message);
    
    if (!condition) {
      this.addToHistory(`Assert failed: ${message}`, 'error');
    }
  }
  
  // Add to log history
  private addToHistory(message: string, type: 'log' | 'warn' | 'error' | 'info'): void {
    this.logHistory.push({
      timestamp: Date.now(),
      message,
      type
    });
    
    // Trim history if it gets too long
    if (this.logHistory.length > this.maxLogHistory) {
      this.logHistory.shift();
    }
  }
  
  // Get log history
  getLogHistory(): Array<{timestamp: number, message: string, type: string}> {
    return this.logHistory;
  }
  
  // Clear log history
  clearLogHistory(): void {
    this.logHistory = [];
  }
  
  // Enable or disable debugging
  setEnabled(isEnabled: boolean): void {
    this.isEnabled = isEnabled;
  }
  
  // Check if debugging is enabled
  isDebugEnabled(): boolean {
    return this.isEnabled;
  }
  
  // Enable or disable physics debugging
  setPhysicsDebug(enabled: boolean): void {
    this.physicDebug = enabled;
  }
  
  // Enable or disable collision debugging
  setCollisionDebug(enabled: boolean): void {
    this.collisionDebug = enabled;
  }
  
  // Enable or disable performance debugging
  setPerformanceDebug(enabled: boolean): void {
    this.performanceDebug = enabled;
  }
}

// Create and export a singleton debug instance
const debug = new Debug(
  DEBUG_ENABLED,
  DEBUG_PHYSICS,
  DEBUG_COLLISIONS,
  DEBUG_PERFORMANCE
);

export default debug;
