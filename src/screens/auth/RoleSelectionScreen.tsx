import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Theme } from '../../theme';

interface RoleSelectionScreenProps {
  navigation: any;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../../assets/splash-logo.png')}
          resizeMode="contain"
          style={styles.logo}
        />
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Select your role to continue</Text>
      </View>

      {/* Role Buttons */}
      <View style={styles.buttonsContainer}>
        {/* Tenant Button */}
        <TouchableOpacity
          style={styles.roleButton}
          onPress={() => navigation.navigate('TenantLogin')}
          activeOpacity={0.7}
        >
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>👤</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.roleTitle}>Tenant</Text>
            <Text style={styles.roleDesc}>View PG details & pay rent</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Owner Button */}
        <TouchableOpacity
          style={[styles.roleButton, styles.ownerButton]}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconCircle, styles.ownerIconCircle]}>
            <Text style={styles.icon}>🛡️</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.roleTitle, styles.ownerTitle]}>PG Owner</Text>
            <Text style={[styles.roleDesc, styles.ownerDesc]}>Manage properties & operations</Text>
          </View>
          <Text style={[styles.chevron, styles.ownerChevron]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
  },
  buttonsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 12,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  ownerButton: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  ownerIconCircle: {
    backgroundColor: '#dbeafe',
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  ownerTitle: {
    color: '#2563eb',
  },
  roleDesc: {
    fontSize: 13,
    color: '#64748b',
  },
  ownerDesc: {
    color: '#3b82f6',
  },
  chevron: {
    fontSize: 24,
    color: '#94a3b8',
    fontWeight: '400',
  },
  ownerChevron: {
    color: '#3b82f6',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
