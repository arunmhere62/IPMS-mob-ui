import { Alert, AlertButton } from 'react-native';

export interface DeleteConfirmationDialogProps {
  title?: string;
  message: string;
  itemName?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

/**
 * Reusable delete confirmation dialog component
 * Shows a confirmation alert before deleting an item
 */
export const showDeleteConfirmation = ({
  title = 'Confirm Delete',
  message,
  itemName,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) => {
  const buttons: AlertButton[] = [
    {
      text: 'Cancel',
      style: 'cancel',
      onPress: onCancel,
    },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: onConfirm,
      isPreferred: false,
    },
  ];

  const displayMessage = itemName 
    ? `${message} "${itemName}"?`
    : `${message}?`;

  Alert.alert(title, displayMessage, buttons);
};
