import React, { useEffect, useMemo, useState } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../theme';
import { networkLogger } from '../utils/networkLogger';
import { navigate } from '../navigation/navigationRef';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BUTTON_SIZE = 56;
const BOUNDARY_PADDING = 10;
const TOP_SAFE_AREA = 50;
const BOTTOM_SAFE_AREA = 80;

interface NetworkLoggerFloatingButtonProps {
  enabled?: boolean;
}

export const NetworkLoggerFloatingButton: React.FC<NetworkLoggerFloatingButtonProps> = ({ enabled = true }) => {
  const [count, setCount] = useState(0);
  const pan = useState(new Animated.ValueXY({ x: 20, y: 140 }))[0];

  useEffect(() => {
    if (!enabled) return;

    const update = () => setCount(networkLogger.getLogs().length);
    update();

    const t = setInterval(update, 800);
    return () => clearInterval(t);
  }, [enabled]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          pan.setOffset({
            x: (pan.x as any)._value,
            y: (pan.y as any)._value,
          });
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
        onPanResponderRelease: () => {
          pan.flattenOffset();

          const currentX = (pan.x as any)._value;
          const currentY = (pan.y as any)._value;

          const minX = BOUNDARY_PADDING;
          const maxX = SCREEN_WIDTH - BUTTON_SIZE - BOUNDARY_PADDING;
          const minY = TOP_SAFE_AREA;
          const maxY = SCREEN_HEIGHT - BUTTON_SIZE - BOTTOM_SAFE_AREA;

          let newX = currentX;
          let newY = currentY;

          if (currentX < minX) newX = minX;
          if (currentX > maxX) newX = maxX;
          if (currentY < minY) newY = minY;
          if (currentY > maxY) newY = maxY;

          if (newX !== currentX || newY !== currentY) {
            Animated.spring(pan, {
              toValue: { x: newX, y: newY },
              useNativeDriver: false,
              friction: 7,
            }).start();
          }
        },
      }),
    [pan]
  );

  if (!enabled) return null;

  return (
    <Animated.View
      style={[
        styles.floatingButton,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        onPress={() => navigate('NetworkLogger')}
        style={styles.floatingButtonInner}
        activeOpacity={0.85}
      >
        <Text style={styles.floatingButtonText}>🔍</Text>
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 10,
  },
  floatingButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: Theme.withOpacity('#FFFFFF', 0.25),
  },
  floatingButtonText: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Theme.colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
