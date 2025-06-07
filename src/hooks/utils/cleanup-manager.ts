// cleanup-manager.ts
import { TimingRefs } from './timing-state';

export class CleanupManager {
  private cleanupTasks: (() => void)[] = [];

  add(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  execute(gl: any, refs: TimingRefs): void {
    this.cleanupTasks.forEach(task => task());
    this.cleanupTasks = [];
    
    // Remove global buffer clearing - now handled by instance management
    // Object.values(globalBuffers).forEach(buffer => buffer.clear());
    
    // Remove store reset - now handled by instance management
    // statsStore.reset();
    
    const context = gl?.getContext() as WebGL2RenderingContext;
    if (context?.deleteQuery) {
      if (refs.gpuTimingState.current.query) {
        try {
          context.deleteQuery(refs.gpuTimingState.current.query);
        } catch (error) {
          // Silent fail
        }
      }
      
      refs.createdQueries.current.forEach(query => {
        try {
          context.deleteQuery(query);
        } catch (error) {
          // Silent fail
        }
      });
      
      refs.createdQueries.current = [];
    }
    
    refs.stats.current.frameTimestamps = [];
  }
}