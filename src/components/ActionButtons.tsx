import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedButton } from './AnimatedButton';
import { Theme } from '../theme';

export interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  containerStyle?: ViewStyle;
  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  disableView?: boolean;
  disableEdit?: boolean;
  disableDelete?: boolean;
  blockPressWhenDisabled?: boolean;
}

/**
 * Reusable action buttons component for View, Edit, and Delete actions
 * Used across different screens like PG Locations, Employees, etc.
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onView,
  onEdit,
  onDelete,
  containerStyle,
  showView = true,
  showEdit = true,
  showDelete = true,
  disableView = false,
  disableEdit = false,
  disableDelete = false,
  blockPressWhenDisabled = false,
}) => {
  return (
    <View style={[{ flexDirection: 'row', gap: 8 }, containerStyle]}>
      {showView && onView && (
        <AnimatedButton
          onPress={onView}
          disabled={blockPressWhenDisabled ? disableView : false}
          style={{
            backgroundColor: '#F0F9FF',
            padding: 8,
            borderRadius: 8,
            opacity: disableView ? 0.45 : 1,
          }}
        >
          <Ionicons name="eye" size={18} color={Theme.colors.primary} />
        </AnimatedButton>
      )}

      {showEdit && onEdit && (
        <AnimatedButton
          onPress={onEdit}
          disabled={blockPressWhenDisabled ? disableEdit : false}
          style={{
            backgroundColor: '#EEF2FF',
            padding: 8,
            borderRadius: 8,
            opacity: disableEdit ? 0.45 : 1,
          }}
        >
          <Ionicons name="pencil" size={18} color={Theme.colors.primary} />
        </AnimatedButton>
      )}

      {showDelete && onDelete && (
        <AnimatedButton
          onPress={onDelete}
          disabled={blockPressWhenDisabled ? disableDelete : false}
          style={{
            backgroundColor: '#FEE2E2',
            padding: 8,
            borderRadius: 8,
            opacity: disableDelete ? 0.45 : 1,
          }}
        >
          <Ionicons name="trash" size={18} color="#EF4444" />
        </AnimatedButton>
      )}
    </View>
  );
};
