import { setToastHandler, showToast, type ToastPayload } from '../toastService';

describe('toastService', () => {
  afterEach(() => {
    setToastHandler(null);
  });

  describe('setToastHandler', () => {
    it('sets the toast handler', () => {
      const mockHandler = jest.fn();
      setToastHandler(mockHandler);
      expect(showToast({ message: 'test' })).toBe(true);
      expect(mockHandler).toHaveBeenCalledWith({ message: 'test' });
    });

    it('replaces existing handler', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      setToastHandler(handler1);
      setToastHandler(handler2);
      showToast({ message: 'test' });
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith({ message: 'test' });
    });

    it('clears handler when set to null', () => {
      const handler = jest.fn();
      setToastHandler(handler);
      setToastHandler(null);
      expect(showToast({ message: 'test' })).toBe(false);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('showToast', () => {
    it('returns false when no handler is set', () => {
      setToastHandler(null);
      expect(showToast({ message: 'test' })).toBe(false);
    });

    it('calls handler with payload when handler is set', () => {
      const handler = jest.fn();
      setToastHandler(handler);
      const payload: ToastPayload = { message: 'Test message', title: 'Test', variant: 'success' };
      const result = showToast(payload);
      expect(result).toBe(true);
      expect(handler).toHaveBeenCalledWith(payload);
    });

    it('handles payload with minimal required fields', () => {
      const handler = jest.fn();
      setToastHandler(handler);
      showToast({ message: 'Minimal' });
      expect(handler).toHaveBeenCalledWith({ message: 'Minimal' });
    });

    it('handles payload with all optional fields', () => {
      const handler = jest.fn();
      setToastHandler(handler);
      const payload: ToastPayload = {
        message: 'Full payload',
        title: 'Title',
        variant: 'error',
        durationMs: 5000,
      };
      showToast(payload);
      expect(handler).toHaveBeenCalledWith(payload);
    });

    it('handles empty message string', () => {
      const handler = jest.fn();
      setToastHandler(handler);
      showToast({ message: '' });
      expect(handler).toHaveBeenCalledWith({ message: '' });
    });

    it('handles very long message string', () => {
      const handler = jest.fn();
      setToastHandler(handler);
      const longMessage = 'A'.repeat(10000);
      showToast({ message: longMessage });
      expect(handler).toHaveBeenCalledWith({ message: longMessage });
    });
  });
});
