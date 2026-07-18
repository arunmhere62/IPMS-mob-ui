import { Alert } from 'react-native';
import { showDeleteConfirmation } from '../DeleteConfirmationDialog';

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('DeleteConfirmationDialog', () => {
  beforeEach(() => {
    (Alert.alert as jest.Mock).mockClear();
  });

  it('calls Alert.alert with default title', () => {
    showDeleteConfirmation({ message: 'Are you sure you want to delete', onConfirm: jest.fn() });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Confirm Delete',
      'Are you sure you want to delete?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Delete', style: 'destructive' }),
      ])
    );
  });

  it('calls Alert.alert with custom title', () => {
    showDeleteConfirmation({ title: 'Remove Tenant', message: 'Delete', onConfirm: jest.fn() });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Remove Tenant',
      expect.any(String),
      expect.any(Array)
    );
  });

  it('includes item name in message when provided', () => {
    showDeleteConfirmation({ message: 'Delete', itemName: 'John Doe', onConfirm: jest.fn() });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Confirm Delete',
      'Delete "John Doe"?',
      expect.any(Array)
    );
  });

  it('appends ? to message when no itemName', () => {
    showDeleteConfirmation({ message: 'Delete this', onConfirm: jest.fn() });
    expect(Alert.alert).toHaveBeenCalledWith(
      'Confirm Delete',
      'Delete this?',
      expect.any(Array)
    );
  });

  it('passes onConfirm as Delete button onPress', () => {
    const onConfirm = jest.fn();
    showDeleteConfirmation({ message: 'Delete', onConfirm });
    const call = (Alert.alert as jest.Mock).mock.calls[0];
    const deleteBtn = call[2].find((b: any) => b.text === 'Delete');
    deleteBtn.onPress();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('passes onCancel as Cancel button onPress', () => {
    const onCancel = jest.fn();
    showDeleteConfirmation({ message: 'Delete', onConfirm: jest.fn(), onCancel });
    const call = (Alert.alert as jest.Mock).mock.calls[0];
    const cancelBtn = call[2].find((b: any) => b.text === 'Cancel');
    cancelBtn.onPress();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('Cancel button onPress is undefined when onCancel not provided', () => {
    showDeleteConfirmation({ message: 'Delete', onConfirm: jest.fn() });
    const call = (Alert.alert as jest.Mock).mock.calls[0];
    const cancelBtn = call[2].find((b: any) => b.text === 'Cancel');
    expect(cancelBtn.onPress).toBeUndefined();
  });
});
