import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';
import { SlideBottomModal } from './SlideBottomModal';
import { AnimatedPressableCard } from './AnimatedPressableCard';

const C = Theme.colors;

// ─── UPI App definitions ───────────────────────────────────
// Each app has:
// - id: unique identifier
// - label: display name
// - scheme: URL scheme to check if app is installed (for canOpenURL)
// - icon: Ionicons icon name (we don't have brand icons, use generic)
// - color: brand color for the icon background
// - buildUrl: function to generate the app-specific UPI deep link
export interface UpiApp {
  id: string;
  label: string;
  scheme: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  buildUrl: (upiId: string, amount: number, payeeName: string, note: string) => string;
}

const UPI_APPS: UpiApp[] = [
  {
    id: 'gpay',
    label: 'Google Pay',
    scheme: 'tez://',
    icon: 'logo-google',
    color: '#4285F4',
    buildUrl: (pa, am, pn, tn) =>
      `tez://upi/pay?pa=${pa}&am=${am}&pn=${encodeURIComponent(pn)}&tn=${encodeURIComponent(tn)}&cu=INR`,
  },
  {
    id: 'phonepe',
    label: 'PhonePe',
    scheme: 'phonepe://',
    icon: 'phone-portrait-outline',
    color: '#5F259F',
    buildUrl: (pa, am, pn, tn) =>
      `phonepe://upi/pay?pa=${pa}&am=${am}&pn=${encodeURIComponent(pn)}&tn=${encodeURIComponent(tn)}&cu=INR`,
  },
  {
    id: 'paytm',
    label: 'Paytm',
    scheme: 'paytmmp://',
    icon: 'wallet-outline',
    color: '#00BAF2',
    buildUrl: (pa, am, pn, tn) =>
      `paytmmp://upi/pay?pa=${pa}&am=${am}&pn=${encodeURIComponent(pn)}&tn=${encodeURIComponent(tn)}&cu=INR`,
  },
  {
    id: 'bhim',
    label: 'BHIM',
    scheme: 'bhim://',
    icon: 'shield-checkmark-outline',
    color: '#F47216',
    buildUrl: (pa, am, pn, tn) =>
      `bhim://upi/pay?pa=${pa}&am=${am}&pn=${encodeURIComponent(pn)}&tn=${encodeURIComponent(tn)}&cu=INR`,
  },
  {
    id: 'amazonpay',
    label: 'Amazon Pay',
    scheme: 'amzn://',
    icon: 'cart-outline',
    color: '#FF9900',
    buildUrl: (pa, am, pn, tn) =>
      `amzn://upi/pay?pa=${pa}&am=${am}&pn=${encodeURIComponent(pn)}&tn=${encodeURIComponent(tn)}&cu=INR`,
  },
  {
    id: 'mobikwik',
    label: 'Mobikwik',
    scheme: 'mobikwik://',
    icon: 'card-outline',
    color: '#0A5C36',
    buildUrl: (pa, am, pn, tn) =>
      `mobikwik://upi/pay?pa=${pa}&am=${am}&pn=${encodeURIComponent(pn)}&tn=${encodeURIComponent(tn)}&cu=INR`,
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    scheme: 'whatsapp://',
    icon: 'chatbubble-ellipses-outline',
    color: '#25D366',
    buildUrl: (pa, am, pn, tn) =>
      `whatsapp://upi/pay?pa=${pa}&am=${am}&pn=${encodeURIComponent(pn)}&tn=${encodeURIComponent(tn)}&cu=INR`,
  },
  {
    id: 'other',
    label: 'Other UPI App',
    scheme: 'upi://',
    icon: 'apps-outline',
    color: '#6B7280',
    buildUrl: (pa, am, pn, tn) =>
      `upi://pay?pa=${pa}&am=${am}&pn=${encodeURIComponent(pn)}&tn=${encodeURIComponent(tn)}&cu=INR`,
  },
];

export interface UpiAppPickerProps {
  visible: boolean;
  onClose: () => void;
  upiId: string;
  amount: number;
  payeeName: string;
  note?: string;
  onSelectApp: (appId: string, appLabel: string) => void;
}

export const UpiAppPicker: React.FC<UpiAppPickerProps> = ({
  visible,
  onClose,
  upiId,
  amount,
  payeeName,
  note = 'Rent Payment',
  onSelectApp,
}) => {
  const [availableApps, setAvailableApps] = useState<UpiApp[]>([]);
  const [checking, setChecking] = useState(true);

  // Check which UPI apps are installed on the device
  const checkInstalledApps = useCallback(async () => {
    setChecking(true);
    const installed: UpiApp[] = [];

    // In Expo Go (dev), canOpenURL always returns false for custom schemes
    // because Expo Go is sandboxed and can't query other apps.
    // In standalone builds (EAS Build), canOpenURL works correctly.
    // So in dev mode, show all apps. In production, filter by canOpenURL.
    const isExpoGo = __DEV__ && (Platform.OS === 'android' || Platform.OS === 'ios');

    for (const app of UPI_APPS) {
      try {
        // "other" (generic upi://) is always available as fallback
        if (app.id === 'other') {
          installed.push(app);
          continue;
        }

        if (isExpoGo) {
          // Expo Go can't detect apps — show all so user can pick
          installed.push(app);
          continue;
        }

        // Standalone build — actually check if app is installed
        const canOpen = await Linking.canOpenURL(app.scheme);
        if (canOpen) {
          installed.push(app);
        }
      } catch {
        // canOpenURL may reject on some platforms — skip silently
      }
    }

    setAvailableApps(installed);
    setChecking(false);
  }, []);

  useEffect(() => {
    if (visible) {
      checkInstalledApps();
    }
  }, [visible, checkInstalledApps]);

  const handleSelectApp = async (app: UpiApp) => {
    const url = app.buildUrl(upiId, amount, payeeName, note);
    try {
      await Linking.openURL(url);
      onSelectApp(app.id, app.label);
      onClose();
    } catch {
      // Fallback to generic upi:// if app-specific scheme fails
      if (app.id !== 'other') {
        try {
          const fallbackUrl = `upi://pay?pa=${upiId}&am=${amount}&pn=${encodeURIComponent(payeeName)}&tn=${encodeURIComponent(note)}&cu=INR`;
          await Linking.openURL(fallbackUrl);
          onSelectApp('other', 'Other UPI App');
          onClose();
          return;
        } catch {
          // continue to error below
        }
      }
      onClose();
    }
  };

  return (
    <SlideBottomModal
      visible={visible}
      onClose={onClose}
      title="Pay via UPI"
      subtitle={`₹${amount.toLocaleString('en-IN')} to ${upiId}`}
      minHeightPercent={0.4}
      maxHeightPercent={0.7}
      enableFlexibleHeightDrag
    >
      {checking ? (
        <View style={styles.checkingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.checkingText}>Checking available apps...</Text>
        </View>
      ) : availableApps.length <= 1 ? (
        <View style={styles.noAppsContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={C.warning} />
          <Text style={styles.noAppsTitle}>No UPI App Found</Text>
          <Text style={styles.noAppsSubtitle}>
            {__DEV__
              ? 'Could not detect UPI apps (this is normal in Expo Go). In a standalone build, installed apps will appear here. You can still try the generic UPI option below.'
              : 'No UPI payment apps detected on your device. Please install GPay, PhonePe, or Paytm to pay online.'}
          </Text>
          <AnimatedPressableCard
            onPress={() => handleSelectApp(UPI_APPS[UPI_APPS.length - 1])}
            style={styles.fallbackBtn}
          >
            <Text style={styles.fallbackBtnText}>Try anyway with default UPI</Text>
          </AnimatedPressableCard>
        </View>
      ) : (
        <View style={styles.appList}>
          {availableApps.map((app) => (
            <AnimatedPressableCard
              key={app.id}
              onPress={() => handleSelectApp(app)}
              style={styles.appItem}
            >
              <View style={[styles.appIcon, { backgroundColor: app.color }]}>
                <Ionicons name={app.icon} size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.appLabel}>{app.label}</Text>
                <Text style={styles.appHint}>Open & pay ₹{amount.toLocaleString('en-IN')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.darkTertiary} />
            </AnimatedPressableCard>
          ))}
        </View>
      )}
    </SlideBottomModal>
  );
};

const styles = StyleSheet.create({
  checkingContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  checkingText: { fontSize: 13, color: C.darkTertiary, fontWeight: '500' },

  noAppsContainer: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  noAppsTitle: { fontSize: 16, fontWeight: '700', color: C.dark },
  noAppsSubtitle: { fontSize: 12, color: C.darkTertiary, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  fallbackBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: C.background.blueLight },
  fallbackBtnText: { fontSize: 13, fontWeight: '600', color: C.primary },

  appList: { gap: 8 },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appLabel: { fontSize: 15, fontWeight: '700', color: C.dark },
  appHint: { fontSize: 11, color: C.darkTertiary, marginTop: 2 },
});
