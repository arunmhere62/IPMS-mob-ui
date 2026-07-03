import { navigationRef, navigate } from '../navigationRef';

describe('navigationRef', () => {
  it('creates a navigation ref', () => {
    expect(navigationRef).toBeDefined();
    expect(navigationRef.current).toBeDefined();
  });

  describe('navigate', () => {
    it('does nothing when navigation ref is null', () => {
      const originalCurrent = navigationRef.current;
      navigationRef.current = null;

      expect(() => navigate('TestScreen')).not.toThrow();

      navigationRef.current = originalCurrent;
    });

    it('does nothing when navigation ref does not have navigate function', () => {
      const originalCurrent = navigationRef.current;
      navigationRef.current = {};

      expect(() => navigate('TestScreen')).not.toThrow();

      navigationRef.current = originalCurrent;
    });

    it('calls navigate on navigation ref when available', () => {
      const mockNavigate = jest.fn();
      const originalCurrent = navigationRef.current;
      navigationRef.current = {
        navigate: mockNavigate,
      };

      navigate('TestScreen', { param1: 'value1' });

      expect(mockNavigate).toHaveBeenCalledWith('TestScreen', { param1: 'value1' });

      navigationRef.current = originalCurrent;
    });

    it('calls navigate without params when params not provided', () => {
      const mockNavigate = jest.fn();
      const originalCurrent = navigationRef.current;
      navigationRef.current = {
        navigate: mockNavigate,
      };

      navigate('TestScreen');

      expect(mockNavigate).toHaveBeenCalledWith('TestScreen', undefined);

      navigationRef.current = originalCurrent;
    });
  });
});
