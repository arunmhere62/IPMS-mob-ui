import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ScreenLayout } from '../../components/ScreenLayout'
import { ScreenHeader } from '../../components/ScreenHeader'
import { Theme } from '../../theme'

interface PaymentsScreenProps {
  navigation: any
}

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({ navigation }) => {
  const items = [
    {
      title: 'Rent Payments',
      subtitle: 'Track monthly rent payments and statuses',
      icon: 'card',
      screen: 'RentPayments',
    },
    {
      title: 'Advance Payments',
      subtitle: 'Manage advances paid by tenants',
      icon: 'arrow-up',
      screen: 'AdvancePayments',
    },
    {
      title: 'Refund Payments',
      subtitle: 'Manage refunds and settlement entries',
      icon: 'arrow-down',
      screen: 'RefundPayments',
    },
  ]

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.primary}>
      <ScreenHeader showBackButton onBackPress={() => navigation.goBack()} title='Payments' />

      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        {items.map((it) => (
          <TouchableOpacity
            key={it.screen}
            activeOpacity={0.85}
            onPress={() => navigation.navigate(it.screen)}
            style={{
              borderWidth: 1,
              borderColor: Theme.colors.border,
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              borderLeftWidth: 4,
              borderLeftColor: Theme.colors.primary,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: Theme.withOpacity(Theme.colors.primary, 0.1),
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <Ionicons name={it.icon as any} size={20} color={Theme.colors.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary }}>
                {it.title}
              </Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: Theme.colors.text.secondary }}>
                {it.subtitle}
              </Text>
            </View>

            <Ionicons name='chevron-forward' size={18} color={Theme.colors.text.tertiary} />
          </TouchableOpacity>
        ))}
      </View>
    </ScreenLayout>
  )
}
