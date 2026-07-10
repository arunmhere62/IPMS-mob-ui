import React, { useState, useMemo } from 'react';
import { AnimatedPressableCard } from './AnimatedPressableCard';
import { View, Text, TextInput, ScrollView, Animated, Easing } from 'react-native';
import { Theme } from '../theme';
import { SlideBottomModal } from './SlideBottomModal';

export interface SelectItem {
  id: number | string;
  label: string;
  value?: any;
}

export interface SelectModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  items: SelectItem[];
  selectedValue?: number | string | null;
  onSelect: (item: SelectItem) => void;
  isLoading?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
}

export const SelectModal: React.FC<SelectModalProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  items,
  selectedValue,
  onSelect,
  isLoading = false,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [animatedValues] = useState(
    items.reduce((acc, item) => {
      acc[item.id] = new Animated.Value(0);
      return acc;
    }, {} as Record<string | number, Animated.Value>)
  );

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    return items.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  // Get selected item label
  const selectedItem = items.find(item => item.id === selectedValue);
  const selectedLabel = selectedItem?.label || placeholder;

  const handleSelect = (item: SelectItem) => {
    onSelect(item);
    setSearchQuery('');
    onClose();
  };

  const handleClearSelection = () => {
    onSelect({ id: '', label: '', value: null } as SelectItem);
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const modalContent = (
    <View style={{ flex: 1 }}>
      {/* Clear Button */}
      {selectedValue && (
        <AnimatedPressableCard
          onPress={handleClearSelection}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 14,
            marginBottom: 12,
            borderRadius: 10,
            backgroundColor: '#FEE2E2',
            borderWidth: 1,
            borderColor: '#FECACA',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8 }}
        >
          <Text style={{ fontSize: 16, color: '#DC2626' }}>✕</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#DC2626' }}>
            Clear Selection
          </Text>
        </AnimatedPressableCard>
      )}

      {/* Search Input */}
      <View style={{ marginBottom: 16 }}>
        <TextInput
          style={{
            backgroundColor: '#F3F4F6',
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 14,
            color: Theme.colors.text.primary,
            borderWidth: 1,
            borderColor: '#E5E7EB' }}
          placeholder={searchPlaceholder}
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Items List */}
      <ScrollView
        style={{ flex: 1 }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
      >
        {filteredItems.length > 0 ? (
          filteredItems.map((item, index) => {
            const isSelected = selectedValue === item.id;
            const scaleValue = animatedValues[item.id]?.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.95] }) || 1;

            const bgColorValue = animatedValues[item.id]?.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(239, 246, 255, 0)', 'rgba(59, 130, 246, 0.1)'] }) || 'rgba(239, 246, 255, 0)';

            return (
              <Animated.View
                key={item.id}
                style={{
                  transform: [{ scale: scaleValue }],
                  marginBottom: index !== filteredItems.length - 1 ? 8 : 0 }}
              >
                <AnimatedPressableCard
                  onPress={() => handleSelect(item)}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    backgroundColor: isSelected ? '#EFF6FF' : '#F9FAFB',
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? Theme.colors.primary : '#E5E7EB',
                    flexDirection: 'row',
                    alignItems: 'center' }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      color: isSelected ? Theme.colors.primary : Theme.colors.text.primary,
                      fontWeight: isSelected ? '600' : '500',
                      flex: 1 }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {item.label}
                  </Text>

                  {/* Checkmark Icon - Always reserve space */}
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      marginLeft: 12,
                      borderRadius: 12,
                      backgroundColor: isSelected ? Theme.colors.primary : 'transparent',
                      justifyContent: 'center',
                      alignItems: 'center' }}
                  >
                    {isSelected && (
                      <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>
                        ✓
                      </Text>
                    )}
                  </View>
                </AnimatedPressableCard>
              </Animated.View>
            );
          })
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, color: Theme.colors.text.secondary, fontWeight: '500' }}>
              No options found
            </Text>
            <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, marginTop: 8 }}>
              Try adjusting your search
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <SlideBottomModal
      visible={visible}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      children={modalContent}
      isLoading={isLoading}
    />
  );
};
