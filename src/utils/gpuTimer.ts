interface GPUTimerQuery {
    query: WebGLQuery;
    available: boolean;
    result: number | null;
    type: 'frame' | 'render' | 'custom';
    label?: string;
    timestamp: number;
  }
  
  export class GPUTimer {
    private gl: WebGL2RenderingContext | null = null;
    private ext: any = null;
    private queries: Map<string, GPUTimerQuery> = new Map();
    private queryPool: WebGLQuery[] = [];
    private isSupported: boolean = false;
    private currentQuery: GPUTimerQuery | null = null;
    private frameQueries: GPUTimerQuery[] = [];
    private maxQueries: number = 100;
  
    constructor() {}
  
    init(gl: WebGLRenderingContext | WebGL2RenderingContext): boolean {
      if (!(gl instanceof WebGL2RenderingContext)) {
        console.debug('leva-r3f-stats: GPU timing requires WebGL2');
        return false;
      }
  
      this.gl = gl;
      
      this.ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
      
      if (!this.ext) {
        console.debug('leva-r3f-stats: EXT_disjoint_timer_query_webgl2 not supported');
        return false;
      }
  
      this.isSupported = true;
      console.debug('leva-r3f-stats: GPU timing enabled');
      
      for (let i = 0; i < this.maxQueries; i++) {
        const query = gl.createQuery();
        if (query) {
          this.queryPool.push(query);
        }
      }
  
      return true;
    }
  
    isAvailable(): boolean {
      return this.isSupported && this.gl !== null && this.ext !== null;
    }
  
    beginFrame(): void {
      if (!this.isAvailable() || !this.gl) return;
  
      const disjoint = this.gl.getParameter(this.ext.GPU_DISJOINT_EXT);
      if (disjoint) {
        console.debug('leva-r3f-stats: GPU disjoint detected, skipping frame');
        this.frameQueries.forEach(q => {
          this.recycleQuery(q);
        });
        this.frameQueries = [];
        return;
      }
  
      const query = this.getOrCreateQuery('frame');
      if (query && query.query) {
        try {
          this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, query.query);
          this.currentQuery = query;
          query.timestamp = performance.now();
        } catch (error) {
          console.debug('leva-r3f-stats: Failed to begin GPU query', error);
        }
      }
    }
  
    endFrame(): void {
      if (!this.isAvailable() || !this.gl || !this.currentQuery) return;
  
      try {
        this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
        this.frameQueries.push(this.currentQuery);
        this.currentQuery = null;
      } catch (error) {
        console.debug('leva-r3f-stats: Failed to end GPU query', error);
      }
    }
  
    begin(label: string): void {
      if (!this.isAvailable() || !this.gl) return;
  
      const query = this.getOrCreateQuery(label);
      if (query && query.query) {
        try {
          this.gl.beginQuery(this.ext.TIME_ELAPSED_EXT, query.query);
          this.queries.set(label, query);
          query.timestamp = performance.now();
        } catch (error) {
          console.debug(`leva-r3f-stats: Failed to begin GPU query for ${label}`, error);
        }
      }
    }
  
    end(label: string): void {
      if (!this.isAvailable() || !this.gl) return;
  
      const query = this.queries.get(label);
      if (query) {
        try {
          this.gl.endQuery(this.ext.TIME_ELAPSED_EXT);
          this.frameQueries.push(query);
        } catch (error) {
          console.debug(`leva-r3f-stats: Failed to end GPU query for ${label}`, error);
        }
      }
    }
  
    update(): number | null {
      if (!this.isAvailable() || !this.gl) return null;
  
      let totalGPUTime = 0;
      let validQueries = 0;
  
      // Process all pending queries
      const queriesToProcess = [...this.frameQueries];
      this.frameQueries = [];
  
      for (const query of queriesToProcess) {
        if (!query.available) {
          // Check if result is available
          try {
            query.available = this.gl.getQueryParameter(
              query.query,
              this.gl.QUERY_RESULT_AVAILABLE
            );
          } catch (error) {
            // Query might be invalid, recycle it
            this.recycleQuery(query);
            continue;
          }
        }
  
        if (query.available && !query.result) {
          try {
            // Get the result in nanoseconds
            const resultNs = this.gl.getQueryParameter(
              query.query,
              this.gl.QUERY_RESULT
            );
            
            // Convert to milliseconds
            query.result = resultNs / 1000000;
            
            if (query.type === 'frame' && query.result > 0) {
              totalGPUTime += query.result;
              validQueries++;
            }
            
            // Recycle the query
            this.recycleQuery(query);
          } catch (error) {
            console.debug('leva-r3f-stats: Failed to get query result', error);
            this.recycleQuery(query);
          }
        } else if (query.available) {
          // Already processed
          if (query.type === 'frame' && query.result && query.result > 0) {
            totalGPUTime += query.result;
            validQueries++;
          }
          this.recycleQuery(query);
        } else {
          // Not ready yet, keep it for next frame
          const age = performance.now() - query.timestamp;
          if (age > 1000) {
            // Query is too old, probably stuck
            console.debug('leva-r3f-stats: Query timeout, recycling');
            this.recycleQuery(query);
          } else {
            this.frameQueries.push(query);
          }
        }
      }
  
      return validQueries > 0 ? totalGPUTime / validQueries : null;
    }
  
    getCustomMetric(label: string): number | null {
      const query = this.queries.get(label);
      return query?.result || null;
    }
  
    private getOrCreateQuery(label: string): GPUTimerQuery | null {
      if (!this.gl) return null;
  
      const pooledQuery = this.queryPool.pop();
      
      if (pooledQuery) {
        return {
          query: pooledQuery,
          available: false,
          result: null,
          type: label === 'frame' ? 'frame' : 'custom',
          label,
          timestamp: performance.now()
        };
      }
  
      try {
        const query = this.gl.createQuery();
        if (query) {
          return {
            query,
            available: false,
            result: null,
            type: label === 'frame' ? 'frame' : 'custom',
            label,
            timestamp: performance.now()
          };
        }
      } catch (error) {
        console.debug('leva-r3f-stats: Failed to create query', error);
      }
  
      return null;
    }
  
    private recycleQuery(query: GPUTimerQuery): void {
      query.available = false;
      query.result = null;
      
      if (this.queryPool.length < this.maxQueries) {
        this.queryPool.push(query.query);
      } else if (this.gl) {
        // Pool is full, delete the query
        this.gl.deleteQuery(query.query);
      }
    }
  
    dispose(): void {
      if (this.gl) {
        // Clean up all queries
        this.queryPool.forEach(query => {
          this.gl!.deleteQuery(query);
        });
        this.queryPool = [];
        
        this.frameQueries.forEach(q => {
          this.gl!.deleteQuery(q.query);
        });
        this.frameQueries = [];
        
        this.queries.forEach(q => {
          this.gl!.deleteQuery(q.query);
        });
        this.queries.clear();
      }
  
      this.gl = null;
      this.ext = null;
      this.isSupported = false;
    }
  }