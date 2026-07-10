import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { Theme } from '../theme';
import { AnimatedPressableCard } from './AnimatedPressableCard';

interface DropdownItem {
  id: number;
  label: string;
  value: any;
}

interface SearchableDropdownProps {
  label: string;
  placeholder: string;
  items: DropdownItem[];
  selectedValue: number | null;
  onSelect: (item: DropdownItem) => void;
  loading?: boolean;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  label,
  placeholder,
  items,
  selectedValue,
  onSelect,
  loading = false,
  disabled = false,
  error = '',
  required = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<DropdownItem[]>(items);
  const [scaleAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    setFilteredItems(items);
  }, [items]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = items.filter((item) =>
        item?.label?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [searchQuery, items]);

  const selectedItem = items.find((item) => item.id === selectedValue);

  const openModal = () => {
    if (disabled || loading) return;
    setModalVisible(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSearchQuery('');
    });
  };

  const handleSelect = (item: DropdownItem) => {
    onSelect(item);
    closeModal();
  };

  const handleClearSelection = () => {
    setSearchQuery('');
    onSelect({ id: 0, label: '', value: null });
    closeModal();
  };

  const renderItem = ({ item }: { item: DropdownItem }) => {
    const isSelected = item.id === selectedValue;
    return (
      <AnimatedPressableCard
        style={[
          styles.dropdownItem,
          isSelected && styles.selectedItem,
        ]}
        onPress={() => handleSelect(item)}
      >
        <Text
          style={[
            styles.dropdownItemText,
            isSelected && styles.selectedItemText,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {item.label}
        </Text>
        {isSelected && (
          <Text style={styles.checkmark}>✓</Text>
        )}
      </AnimatedPressableCard>
    );
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>

      {/* Dropdown Button */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <AnimatedPressableCard
          style={[
            styles.dropdownButton,
            error && styles.dropdownButtonError,
            disabled && styles.dropdownButtonDisabled,
            { flex: 1 },
          ]}
          onPress={openModal}
          disabled={disabled || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Theme.colors.primary} />
          ) : (
            <>
              <Text
                style={[
                  styles.dropdownButtonText,
                  !selectedItem && styles.placeholderText,
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {selectedItem ? selectedItem.label : placeholder}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </>
          )}
        </AnimatedPressableCard>
        {selectedItem && !disabled && (
          <AnimatedPressableCard
            onPress={() => {
              onSelect({ id: 0, label: '', value: null });
            }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#FEE2E2',
              borderWidth: 1,
              borderColor: '#FECACA',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 20, color: '#DC2626', fontWeight: '700' }}>✕</Text>
          </AnimatedPressableCard>
        )}
      </View>

      {/* Error Message */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View
          style={styles.modalOverlay}
          onStartShouldSetResponder={() => { closeModal(); return true; }}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {selectedValue && !disabled && (
                  <AnimatedPressableCard onPress={handleClearSelection} style={styles.clearSelectionButton}>
                    <Text style={styles.clearSelectionButtonText} numberOfLines={1} adjustsFontSizeToFit>Clear</Text>
                  </AnimatedPressableCard>
                )}
                <AnimatedPressableCard onPress={closeModal} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </AnimatedPressableCard>
              </View>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${label?.toLowerCase() || 'items'}...`}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery ? (
                <AnimatedPressableCard
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </AnimatedPressableCard>
              ) : null}
            </View>

            {/* Items List */}
            <View style={{ flex: 1 }}>
              {filteredItems.length > 0 ? (
                <FlatList
                  data={filteredItems}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.id.toString()}
                  style={styles.list}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  scrollEnabled={true}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No results found</Text>
                  <Text style={styles.emptySubtext}>
                    Try adjusting your search
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    color: Theme.colors.text.secondary,
    marginBottom: 4,
    marginLeft: 2,
    fontWeight: '600',
  },
  required: {
    color: '#EF4444',
  },
  dropdownButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  dropdownButtonError: {
    borderColor: '#EF4444',
  },
  dropdownButtonDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.6,
  },
  dropdownButtonText: {
    fontSize: 13,
    color: Theme.colors.text.primary,
    flex: 1,
    fontWeight: '500',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontWeight: '400',
    fontSize: 13,
  },
  dropdownIcon: {
    fontSize: 10,
    color: Theme.colors.text.secondary,
    marginLeft: 6,
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 3,
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    padding: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    width: '100%',
    height: '75%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
  },
  clearSelectionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearSelectionButtonText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    height: 44,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: Theme.colors.text.primary,
  },
  clearButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 13,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    paddingHorizontal: 0,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F3F4F6',
  },
  selectedItem: {
    backgroundColor: '#EEF2FF',
  },
  dropdownItemText: {
    fontSize: 14,
    color: Theme.colors.text.primary,
    flex: 1,
    fontWeight: '500',
  },
  selectedItemText: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  checkmark: {
    fontSize: 18,
    color: Theme.colors.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: Theme.colors.text.secondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: Theme.colors.text.tertiary,
    opacity: 0.8,
  },
});
