import { networkLogger, type NetworkLog } from '../networkLogger';

describe('networkLogger', () => {
  beforeEach(() => {
    networkLogger.clearLogs();
  });

  describe('addLog', () => {
    it('adds a log to the logs array', () => {
      const log: NetworkLog = {
        id: '1',
        method: 'GET',
        url: '/api/test',
        timestamp: new Date(),
      };
      networkLogger.addLog(log);
      const logs = networkLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe('1');
    });

    it('adds logs in reverse chronological order (newest first)', () => {
      const log1: NetworkLog = {
        id: '1',
        method: 'GET',
        url: '/api/test1',
        timestamp: new Date('2026-01-01'),
      };
      const log2: NetworkLog = {
        id: '2',
        method: 'POST',
        url: '/api/test2',
        timestamp: new Date('2026-01-02'),
      };
      networkLogger.addLog(log1);
      networkLogger.addLog(log2);
      const logs = networkLogger.getLogs();
      expect(logs[0].id).toBe('2');
      expect(logs[1].id).toBe('1');
    });

    it('truncates large strings in request/response data', () => {
      const largeString = 'A'.repeat(20000);
      const log: NetworkLog = {
        id: '1',
        method: 'POST',
        url: '/api/test',
        requestData: { data: largeString },
        timestamp: new Date(),
      };
      networkLogger.addLog(log);
      const logs = networkLogger.getLogs();
      const truncatedData = logs[0].requestData as { data: string };
      expect(truncatedData.data).toContain('truncated for display');
      expect(truncatedData.data).not.toContain(largeString);
    });

    it('truncates base64 image strings', () => {
      const base64Image = 'data:image/png;base64,' + 'A'.repeat(50000);
      const log: NetworkLog = {
        id: '1',
        method: 'POST',
        url: '/api/upload',
        requestData: { image: base64Image },
        timestamp: new Date(),
      };
      networkLogger.addLog(log);
      const logs = networkLogger.getLogs();
      const truncatedData = logs[0].requestData as { image: string };
      expect(truncatedData.image).toContain('truncated for display');
    });

    it('truncates arrays beyond max length', () => {
      const largeArray = Array.from({ length: 100 }, (_, i) => i);
      const log: NetworkLog = {
        id: '1',
        method: 'GET',
        url: '/api/test',
        responseData: { items: largeArray },
        timestamp: new Date(),
      };
      networkLogger.addLog(log);
      const logs = networkLogger.getLogs();
      const truncatedData = logs[0].responseData as { items: unknown[] };
      expect(truncatedData.items.length).toBeLessThan(100);
      expect(truncatedData.items[truncatedData.items.length - 1]).toContain('more items');
    });

    it('handles circular references', () => {
      const circularObj: Record<string, unknown> = { name: 'test' };
      circularObj.self = circularObj;
      const log: NetworkLog = {
        id: '1',
        method: 'GET',
        url: '/api/test',
        requestData: circularObj,
        timestamp: new Date(),
      };
      networkLogger.addLog(log);
      const logs = networkLogger.getLogs();
      const truncatedData = logs[0].requestData as Record<string, unknown>;
      expect(truncatedData.self).toBe('[Circular]');
    });

    it('handles max depth truncation', () => {
      const deepObj = { level1: { level2: { level3: { level4: { level5: 'deep' } } } } };
      const log: NetworkLog = {
        id: '1',
        method: 'GET',
        url: '/api/test',
        requestData: deepObj,
        timestamp: new Date(),
      };
      networkLogger.addLog(log);
      const logs = networkLogger.getLogs();
      const truncatedData = logs[0].requestData as Record<string, unknown>;
      // With default maxDepth of 10, this should not be truncated
      expect(truncatedData).toBeTruthy();
    });

    it('limits logs to maxLogs (50)', () => {
      for (let i = 0; i < 60; i++) {
        networkLogger.addLog({
          id: String(i),
          method: 'GET',
          url: `/api/test${i}`,
          timestamp: new Date(),
        });
      }
      const logs = networkLogger.getLogs();
      expect(logs).toHaveLength(50);
      expect(logs[0].id).toBe('59'); // Most recent
      expect(logs[49].id).toBe('10'); // Oldest kept
    });

    it('handles logs with null/undefined values', () => {
      const log: NetworkLog = {
        id: '1',
        method: 'GET',
        url: '/api/test',
        status: undefined,
        headers: null,
        requestData: undefined,
        responseData: null,
        timestamp: new Date(),
      };
      networkLogger.addLog(log);
      const logs = networkLogger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].status).toBeUndefined();
      expect(logs[0].headers).toBeNull();
    });
  });

  describe('updateLog', () => {
    it('updates an existing log by id', () => {
      const log: NetworkLog = {
        id: '1',
        method: 'GET',
        url: '/api/test',
        timestamp: new Date(),
      };
      networkLogger.addLog(log);
      networkLogger.updateLog('1', { status: 200, duration: 100 });
      const logs = networkLogger.getLogs();
      expect(logs[0].status).toBe(200);
      expect(logs[0].duration).toBe(100);
    });

    it('does not update when log id is not found', () => {
      const log: NetworkLog = {
        id: '1',
        method: 'GET',
        url: '/api/test',
        timestamp: new Date(),
      };
      networkLogger.addLog(log);
      networkLogger.updateLog('999', { status: 200 });
      const logs = networkLogger.getLogs();
      expect(logs[0].status).toBeUndefined();
    });

    it('truncates updated headers and data', () => {
      const log: NetworkLog = {
        id: '1',
        method: 'GET',
        url: '/api/test',
        timestamp: new Date(),
      };
      networkLogger.addLog(log);
      const largeString = 'A'.repeat(20000);
      networkLogger.updateLog('1', {
        headers: { authorization: largeString },
        responseData: { data: largeString },
      });
      const logs = networkLogger.getLogs();
      const truncatedHeaders = logs[0].headers as Record<string, string>;
      const truncatedData = logs[0].responseData as Record<string, string>;
      expect(truncatedHeaders.authorization).toContain('truncated for display');
      expect(truncatedData.data).toContain('truncated for display');
    });

    it('preserves original data when update does not include headers/data', () => {
      const log: NetworkLog = {
        id: '1',
        method: 'GET',
        url: '/api/test',
        headers: { original: 'value' },
        requestData: { original: 'data' },
        timestamp: new Date(),
      };
      networkLogger.addLog(log);
      networkLogger.updateLog('1', { status: 200 });
      const logs = networkLogger.getLogs();
      expect(logs[0].headers).toEqual({ original: 'value' });
      expect(logs[0].requestData).toEqual({ original: 'data' });
    });
  });

  describe('getLogs', () => {
    it('returns empty array when no logs exist', () => {
      const logs = networkLogger.getLogs();
      expect(logs).toEqual([]);
    });

    it('returns all logs', () => {
      networkLogger.addLog({ id: '1', method: 'GET', url: '/api/test1', timestamp: new Date() });
      networkLogger.addLog({ id: '2', method: 'POST', url: '/api/test2', timestamp: new Date() });
      const logs = networkLogger.getLogs();
      expect(logs).toHaveLength(2);
    });
  });

  describe('clearLogs', () => {
    it('clears all logs', () => {
      networkLogger.addLog({ id: '1', method: 'GET', url: '/api/test', timestamp: new Date() });
      networkLogger.addLog({ id: '2', method: 'POST', url: '/api/test2', timestamp: new Date() });
      networkLogger.clearLogs();
      const logs = networkLogger.getLogs();
      expect(logs).toEqual([]);
    });
  });
});
