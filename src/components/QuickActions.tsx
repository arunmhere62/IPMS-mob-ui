import React, { memo, useRef } from 'react';
import type { ComponentProps } from 'react';
import { View, Text, TouchableOpacity, Animated, useWindowDimensions, ScrollView } from 'react-native';
import { Theme } from '../theme';
import { Ionicons } from '@expo/vector-icons';

interface MenuItem {
  title: string;
  icon: string;
  screen: string;
  color: string;
}

interface QuickActionsProps {
  menuItems: MenuItem[];
  onNavigate: (screen: string) => void;
  variant?: 'grid' | 'horizontal';
  horizontalRows?: 1 | 2;
}

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const QuickActions = memo<QuickActionsProps>(({ menuItems, onNavigate, variant = 'grid', horizontalRows = 1 }) => {
  const { width: screenWidth } = useWindowDimensions();

  // Fewer columns on small screens to avoid words breaking mid-word
  const columns = screenWidth < 360 ? 2 : screenWidth < 420 ? 3 : screenWidth < 520 ? 4 : 5;
  const itemWidth = `${100 / columns}%` as `${number}%`;

  const rows = horizontalRows ?? 1;
  const horizontalColumns = React.useMemo(() => {
    if (variant !== 'horizontal') return [] as MenuItem[][];
    if (rows === 1) return [] as MenuItem[][];

    const cols: MenuItem[][] = [];
    for (let i = 0; i < menuItems.length; i += rows) {
      cols.push(menuItems.slice(i, i + rows));
    }
    return cols;
  }, [menuItems, rows, variant]);

  const renderActionItem = (item: MenuItem, index: number) => {
    const scaleValue = useRef(new Animated.Value(1)).current;
    const opacityValue = useRef(new Animated.Value(1)).current;
    
    const handlePressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
      
      Animated.timing(opacityValue, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 6,
      }).start();
      
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    };
    
    return (
      <Animated.View
        key={index}
        style={{
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
          width: itemWidth,
          padding: 6,
        }}
      >
        <TouchableOpacity
          onPress={() => onNavigate(item.screen)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={{
            borderRadius: 14,
            paddingVertical: 10,
            paddingHorizontal: 6,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              backgroundColor: Theme.withOpacity(item.color, 0.14),
              borderRadius: 19,
              borderWidth: 1,
              borderColor: Theme.withOpacity(item.color, 0.22),
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
            }}
          >
            <Ionicons name={item.icon as IoniconName} size={18} color={item.color} />
          </View>

          <Text
            style={{
              color: Theme.colors.text.primary,
              fontWeight: '800',
              textAlign: 'center',
              fontSize: 11,
              lineHeight: 13,
              width: '100%',
              flexWrap: 'wrap',
            }}
          >
            {item.title}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderHorizontalItem = (
    item: MenuItem,
    index: number,
    opts?: {
      marginRight?: number;
      marginBottom?: number;
    },
  ) => {
    const scaleValue = useRef(new Animated.Value(1)).current;
    const opacityValue = useRef(new Animated.Value(1)).current;

    const marginRight = opts?.marginRight ?? 10;
    const marginBottom = opts?.marginBottom ?? 0;

    const handlePressIn = () => {
      Animated.spring(scaleValue, {
        toValue: 0.97,
        useNativeDriver: true,
        tension: 120,
        friction: 9,
      }).start();
      Animated.timing(opacityValue, {
        toValue: 0.85,
        duration: 110,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }).start();
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        key={index}
        style={{
          transform: [{ scale: scaleValue }],
          opacity: opacityValue,
          marginRight,
          marginBottom,
        }}
      >
        <TouchableOpacity
          onPress={() => onNavigate(item.screen)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          style={{
            minWidth: 130,
            borderRadius: 16,
            paddingVertical: 12,
            paddingHorizontal: 12,
            backgroundColor: Theme.colors.background.secondary,
            borderWidth: 1,
            borderColor: Theme.colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: Theme.withOpacity(item.color, 0.14),
                borderWidth: 1,
                borderColor: Theme.withOpacity(item.color, 0.22),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={item.icon as IoniconName} size={16} color={item.color} />
            </View>

            <Ionicons name="chevron-forward" size={14} color={Theme.colors.text.tertiary} />
          </View>

          <Text
            numberOfLines={1}
            style={{
              marginTop: 10,
              color: Theme.colors.text.primary,
              fontWeight: '900',
              fontSize: 12,
            }}
          >
            {item.title}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={{ marginBottom: 12, paddingHorizontal: 16, marginTop: 10 }}>
      <View
        style={{
          backgroundColor: Theme.colors.background.blueMedium,
          borderRadius: 18,
          padding: 10,
          borderWidth: 1,
          borderColor: Theme.colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '900', color: Theme.colors.text.primary }}>
            Quick Actions
          </Text>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: Theme.withOpacity(Theme.colors.primary, 0.10),
              borderWidth: 1,
              borderColor: Theme.withOpacity(Theme.colors.primary, 0.18),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="flash" size={14} color={Theme.colors.primary} />
          </View>
        </View>

        {variant === 'horizontal' ? (
          rows === 2 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 4, paddingRight: 6 }}
            >
              {horizontalColumns.map((colItems, colIndex) => (
                <View key={colIndex} style={{ marginRight: colIndex === horizontalColumns.length - 1 ? 0 : 10 }}>
                  {colItems.map((item, rowIndex) =>
                    renderHorizontalItem(item, colIndex * rows + rowIndex, {
                      marginRight: 0,
                      marginBottom: rowIndex === colItems.length - 1 ? 0 : 10,
                    }),
                  )}
                </View>
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 4, paddingRight: 6 }}
            >
              {menuItems.map((item, index) => renderHorizontalItem(item, index, { marginRight: 10, marginBottom: 0 }))}
            </ScrollView>
          )
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {menuItems.map((item, index) => renderActionItem(item, index))}
          </View>
        )}
      </View>
    </View>
  );
});

QuickActions.displayName = 'QuickActions';
