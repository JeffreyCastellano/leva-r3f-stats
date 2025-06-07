import { TimingRefs } from './timing-state';

export class CleanupManager {
  private cleanupTasks: (() => void)[] = [];

  add(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  execute(gl: any, refs: TimingRefs): void {
    this.cleanupTasks.forEach(task => task());
    this.cleanupTasks = [];
    
    const context = gl?.getContext() as WebGL2RenderingContext;
    if (context?.deleteQuery) {
      if (refs.gpuTimingState.current.query) {
        try {
          context.deleteQuery(refs.gpuTimingState.current.query);
        } catch (error) {
          // Fail
        }
      }
      
      refs.createdQueries.current.forEach(query => {
        try {
          context.deleteQuery(query);
        } catch (error) {
          // Fail
        }
      });
      
      refs.createdQueries.current = [];
    }
    
    refs.stats.current.frameTimestamps = [];
  }
}