import { CONTENT_COLOR } from '../index';

describe('constant', () => {
  it('exports CONTENT_COLOR constant', () => {
    expect(CONTENT_COLOR).toBe('#f5f5f5');
  });

  it('CONTENT_COLOR is a string', () => {
    expect(typeof CONTENT_COLOR).toBe('string');
  });

  it('CONTENT_COLOR is a valid hex color', () => {
    expect(CONTENT_COLOR).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});
