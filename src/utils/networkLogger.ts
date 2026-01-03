export interface NetworkLog {
  id: string;
  method: string;
  url: string;
  status?: number;
  headers?: unknown;
  requestData?: unknown;
  responseData?: unknown;
  error?: string;
  timestamp: Date;
  duration?: number;
}

type TruncateOptions = {
  maxStringLength: number;
  maxArrayLength: number;
  maxDepth: number;
};

const defaultTruncateOptions: TruncateOptions = {
  maxStringLength: 2500,
  maxArrayLength: 50,
  maxDepth: 6,
};

const truncateValue = (
  value: unknown,
  options: TruncateOptions = defaultTruncateOptions,
  depth: number = 0,
  seen: WeakSet<object> = new WeakSet(),
): unknown => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.length <= options.maxStringLength) return value;
    return `${value.slice(0, options.maxStringLength)}… (truncated, ${value.length} chars)`;
  }

  if (typeof value !== 'object') return String(value);
  if (seen.has(value)) return '[Circular]';
  if (depth >= options.maxDepth) return '[MaxDepth]';

  seen.add(value);

  if (Array.isArray(value)) {
    const trimmed = value.slice(0, options.maxArrayLength).map((v) => truncateValue(v, options, depth + 1, seen));
    if (value.length > options.maxArrayLength) {
      trimmed.push(`… (${value.length - options.maxArrayLength} more items)`);
    }
    return trimmed;
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = truncateValue(v, options, depth + 1, seen);
  }
  return out;
};

class NetworkLogger {
  private logs: NetworkLog[] = [];
  private maxLogs = 50;

  addLog(log: NetworkLog) {
    const safeLog: NetworkLog = {
      ...log,
      headers: truncateValue(log.headers),
      requestData: truncateValue(log.requestData),
      responseData: truncateValue(log.responseData),
    };

    this.logs.unshift(safeLog);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }

  updateLog(id: string, updates: Partial<NetworkLog>) {
    const index = this.logs.findIndex(log => log.id === id);
    
    if (index !== -1) {
      this.logs[index] = {
        ...this.logs[index],
        ...updates,
        headers: updates.headers !== undefined ? truncateValue(updates.headers) : this.logs[index].headers,
        requestData:
          updates.requestData !== undefined ? truncateValue(updates.requestData) : this.logs[index].requestData,
        responseData:
          updates.responseData !== undefined ? truncateValue(updates.responseData) : this.logs[index].responseData,
      };
    } 
  }

  getLogs(): NetworkLog[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const networkLogger = new NetworkLogger();
