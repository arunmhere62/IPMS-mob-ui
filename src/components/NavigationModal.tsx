import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';

interface NavigationModalProps {
  visible: boolean;
  onClose: () => void;
  menuItems: Array<{
    title: string;
    icon: string;
    screen: string;
    color: string;
  }>;
  onNavigate: (screen: string) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const NavigationModal: React.FC<NavigationModalProps> = ({
  visible,
  onClose,
  menuItems,
  onNavigate,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNavigate = (screen: string) => {
    onNavigate(screen);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: fadeAnim,
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 20,
            paddingHorizontal: 20,
            paddingBottom: 30,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 12,
          }}
        >
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}>
            <View>
              <Text style={{
                fontSize: 20,
                fontWeight: '800',
                color: Theme.colors.text.primary,
              }}>
                Quick Navigation
              </Text>
              <Text style={{
                fontSize: 13,
                color: Theme.colors.text.secondary,
                marginTop: 4,
              }}>
                Jump to any section
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: Theme.colors.light,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: Theme.colors.border,
              }}
            >
              <Ionicons name="close" size={18} color={Theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Navigation Grid */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleNavigate(item.screen)}
                style={{
                  width: (screenWidth - 60) / 3, // 3 columns with padding
                  backgroundColor: Theme.colors.background.secondary,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: Theme.colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: Theme.withOpacity(item.color, 0.12),
                    borderRadius: 24,
                    borderWidth: 1,
                    borderColor: Theme.withOpacity(item.color, 0.2),
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name={item.icon as ComponentProps<typeof Ionicons>['name']} size={24} color={item.color} />
                </View>
                
                <Text
                  style={{
                    color: Theme.colors.text.primary,
                    fontWeight: '700',
                    textAlign: 'center',
                    fontSize: 12,
                    lineHeight: 14,
                  }}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom Hint */}
          <View style={{
            alignItems: 'center',
            marginTop: 8,
          }}>
            <Text style={{
              fontSize: 11,
              color: Theme.colors.text.secondary,
              fontStyle: 'italic',
            }}>
              Swipe down or tap outside to close
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};
