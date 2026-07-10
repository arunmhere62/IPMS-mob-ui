import { renderHook } from '@testing-library/react-native';
import { useTicketSocket } from '../useTicketSocket';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  io: jest.fn(),
}));

// Mock config
jest.mock('../../config', () => ({
  ENV: {
    API_BASE_URL: 'http://localhost:3000/api/v1/',
  },
}));

describe('useTicketSocket', () => {
  const mockIo = require('socket.io-client').io as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes without errors', () => {
    const mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    mockIo.mockReturnValue(mockSocket);

    const mockOnNewComment = jest.fn();

    renderHook(() =>
      useTicketSocket({
        token: null,
        ticketId: null,
        onNewComment: mockOnNewComment,
      })
    );

    expect(mockIo).not.toHaveBeenCalled();
  });

  it('connects when token and ticketId are provided', () => {
    const mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    mockIo.mockReturnValue(mockSocket);

    const mockOnNewComment = jest.fn();

    renderHook(() =>
      useTicketSocket({
        token: 'test-token',
        ticketId: 123,
        onNewComment: mockOnNewComment,
      })
    );

    expect(mockIo).toHaveBeenCalledWith('http://localhost:3000/tickets', {
      auth: { token: 'test-token' },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  });

  it('joins ticket room on connect', () => {
    const mockSocket = {
      on: jest.fn((event, callback) => {
        if (event === 'connect') {
          callback();
        }
      }),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    mockIo.mockReturnValue(mockSocket);

    const mockOnNewComment = jest.fn();

    renderHook(() =>
      useTicketSocket({
        token: 'test-token',
        ticketId: 123,
        onNewComment: mockOnNewComment,
      })
    );

    expect(mockSocket.emit).toHaveBeenCalledWith('join_ticket', { ticketId: 123 });
  });

  it('sets up new_comment listener', () => {
    const mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    mockIo.mockReturnValue(mockSocket);

    const mockOnNewComment = jest.fn();

    renderHook(() =>
      useTicketSocket({
        token: 'test-token',
        ticketId: 123,
        onNewComment: mockOnNewComment,
      })
    );

    expect(mockSocket.on).toHaveBeenCalledWith('new_comment', expect.any(Function));
  });

  it('sets up ticket_status_changed listener when callback provided', () => {
    const mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    mockIo.mockReturnValue(mockSocket);

    const mockOnNewComment = jest.fn();
    const mockOnStatusChanged = jest.fn();

    renderHook(() =>
      useTicketSocket({
        token: 'test-token',
        ticketId: 123,
        onNewComment: mockOnNewComment,
        onStatusChanged: mockOnStatusChanged,
      })
    );

    expect(mockSocket.on).toHaveBeenCalledWith('ticket_status_changed', expect.any(Function));
  });

  it('disconnects and leaves ticket on unmount', () => {
    const mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    mockIo.mockReturnValue(mockSocket);

    const mockOnNewComment = jest.fn();

    const { unmount } = renderHook(() =>
      useTicketSocket({
        token: 'test-token',
        ticketId: 123,
        onNewComment: mockOnNewComment,
      })
    );

    unmount();

    expect(mockSocket.emit).toHaveBeenCalledWith('leave_ticket', { ticketId: 123 });
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('does not connect when token is null', () => {
    const mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    mockIo.mockReturnValue(mockSocket);

    const mockOnNewComment = jest.fn();

    renderHook(() =>
      useTicketSocket({
        token: null,
        ticketId: 123,
        onNewComment: mockOnNewComment,
      })
    );

    expect(mockIo).not.toHaveBeenCalled();
  });

  it('does not connect when ticketId is null', () => {
    const mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };
    mockIo.mockReturnValue(mockSocket);

    const mockOnNewComment = jest.fn();

    renderHook(() =>
      useTicketSocket({
        token: 'test-token',
        ticketId: null,
        onNewComment: mockOnNewComment,
      })
    );

    expect(mockIo).not.toHaveBeenCalled();
  });
});
