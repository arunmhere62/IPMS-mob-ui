import React from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  shimmer?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  shimmer = true,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (shimmer) {
      Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ).start();
    }
  }, [shimmer, animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.8, 0.4],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB',
          opacity: shimmer ? opacity : 0.4,
        },
        style,
      ]}
    />
  );
};

interface CardSkeletonProps {
  width?: number;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ width = 160 }) => {
  return (
    <View style={{
      width,
      padding: 12,
      backgroundColor: 'white',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#F3F4F6'
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <SkeletonLoader width={36} height={36} borderRadius={8} style={{ marginRight: 8 }} />
        <View style={{ flex: 1 }}>
          <SkeletonLoader width="40%" height={10} style={{ marginBottom: 4 }} />
          <SkeletonLoader width="60%" height={22} />
        </View>
      </View>
      <View style={{ paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ alignItems: 'center' }}>
            <SkeletonLoader width={30} height={16} style={{ marginBottom: 4 }} />
            <SkeletonLoader width={40} height={9} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <SkeletonLoader width={30} height={16} style={{ marginBottom: 4 }} />
            <SkeletonLoader width={40} height={9} />
          </View>
          <View style={{ alignItems: 'center' }}>
            <SkeletonLoader width={30} height={16} style={{ marginBottom: 4 }} />
            <SkeletonLoader width={40} height={9} />
          </View>
        </View>
      </View>
    </View>
  );
};

// Dashboard-specific skeleton components
export const DashboardHeaderSkeleton: React.FC = () => {
  return (
    <View
      style={{
        backgroundColor: '#F0F9FF',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 20,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1, paddingRight: 12 }}>
          <SkeletonLoader width="60%" height={22} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="80%" height={14} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <SkeletonLoader width={40} height={40} borderRadius={20} />
          <SkeletonLoader width={44} height={44} borderRadius={22} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
        <View style={{ flex: 1 }}>
          <SkeletonLoader width="50%" height={12} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="40%" height={24} />
        </View>
        <View style={{ flex: 1 }}>
          <SkeletonLoader width="50%" height={12} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="60%" height={22} />
        </View>
      </View>
    </View>
  );
};

export const DashboardMetricsSkeleton: React.FC = () => {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
      <View
        style={{
          flex: 1,
          padding: 14,
          backgroundColor: '#EFF6FF',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#DBEAFE',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <SkeletonLoader width="50%" height={14} />
          <SkeletonLoader width={28} height={28} borderRadius={14} />
        </View>
        <SkeletonLoader width="40%" height={28} style={{ marginTop: 10 }} />
      </View>

      <View
        style={{
          flex: 1,
          padding: 14,
          backgroundColor: '#F0FDF4',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#DCFCE7',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <SkeletonLoader width="50%" height={14} />
          <SkeletonLoader width={28} height={28} borderRadius={14} />
        </View>
        <SkeletonLoader width="40%" height={28} style={{ marginTop: 10 }} />
      </View>
    </View>
  );
};

export const DashboardAttentionSkeleton: React.FC = () => {
  return (
    <View style={{ marginTop: 20 }}>
      <SkeletonLoader width="40%" height={18} style={{ marginBottom: 6 }} />
      <SkeletonLoader width="60%" height={14} style={{ marginBottom: 12 }} />

      <View
        style={{
          padding: 14,
          backgroundColor: '#FAFAFA',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#F3F4F6',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            backgroundColor: '#F3F4F6',
            borderRadius: 14,
            padding: 6,
            marginBottom: 14,
          }}
        >
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                minWidth: 120,
                paddingVertical: 10,
                paddingHorizontal: 10,
                borderRadius: 12,
                alignItems: 'center',
              }}
            >
              <SkeletonLoader width={60} height={14} style={{ marginBottom: 6 }} />
              <SkeletonLoader width={40} height={16} borderRadius={99} />
            </View>
          ))}
        </View>

        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: i < 3 ? 1 : 0,
              borderBottomColor: '#F3F4F6',
            }}
          >
            <SkeletonLoader width={34} height={34} borderRadius={17} style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <SkeletonLoader width="50%" height={16} style={{ marginBottom: 4 }} />
              <SkeletonLoader width="40%" height={12} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <SkeletonLoader width={36} height={32} borderRadius={8} />
              <SkeletonLoader width={36} height={32} borderRadius={8} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

export const DashboardMonthlyMetricsSkeleton: React.FC = () => {
  return (
    <View style={{ marginTop: 20 }}>
      <SkeletonLoader width="50%" height={18} style={{ marginBottom: 6 }} />
      <SkeletonLoader width="40%" height={14} style={{ marginBottom: 12 }} />

      <View
        style={{
          padding: 16,
          backgroundColor: '#FAFAFA',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#F3F4F6',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ alignItems: 'center', flex: 1 }}>
              <SkeletonLoader width={50} height={14} style={{ marginBottom: 8 }} />
              <SkeletonLoader width={40} height={24} />
            </View>
          ))}
        </View>

        <View style={{ height: 150, borderRadius: 8, overflow: 'hidden' }}>
          <SkeletonLoader width="100%" height={150} borderRadius={8} />
        </View>
      </View>
    </View>
  );
};
