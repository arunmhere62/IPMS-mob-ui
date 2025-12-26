import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, StyleSheet, Keyboard } from 'react-native';
import { Theme } from '../theme';

interface Country {
  code: string;
  name: string;
  flag: string;
  phoneCode: string;
  phoneLength: number; // Expected phone number length (without country code)
}

// Lightweight country list with common countries and their phone number lengths
const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', flag: '🇮🇳', phoneCode: '+91', phoneLength: 10 },
  { code: 'US', name: 'United States', flag: '🇺🇸', phoneCode: '+1', phoneLength: 10 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', phoneCode: '+44', phoneLength: 10 },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', phoneCode: '+1', phoneLength: 10 },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', phoneCode: '+61', phoneLength: 9 },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', phoneCode: '+65', phoneLength: 8 },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', phoneCode: '+60', phoneLength: 9 },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', phoneCode: '+92', phoneLength: 10 },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', phoneCode: '+880', phoneLength: 10 },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', phoneCode: '+94', phoneLength: 9 },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', phoneCode: '+64', phoneLength: 9 },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', phoneCode: '+971', phoneLength: 9 },
];

export { COUNTRIES };

interface CountryPhoneSelectorProps {
  selectedCountry?: Country;
  onSelectCountry: (country: Country) => void;
  size?: 'small' | 'medium' | 'large';
  phoneValue?: string;
  onPhoneChange?: (phone: string) => void;
}

const getSizeStyles = (size: 'small' | 'medium' | 'large' = 'medium') => {
  switch (size) {
    case 'small':
      return {
        containerPadding: 8,
        fontSize: 12,
        inputPadding: 8,
        flagSize: 18,
      };
    case 'large':
      return {
        containerPadding: 16,
        fontSize: 16,
        inputPadding: 14,
        flagSize: 28,
      };
    case 'medium':
    default:
      return {
        containerPadding: 12,
        fontSize: 14,
        inputPadding: 12,
        flagSize: 24,
      };
  }
};

export const CountryPhoneSelector: React.FC<CountryPhoneSelectorProps> = ({
  selectedCountry = COUNTRIES[0], // Default to India
  onSelectCountry,
  size = 'medium',
  phoneValue = '',
  onPhoneChange,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const sizeStyles = getSizeStyles(size);
  const lastEmittedPhoneRef = useRef<string | null>(null);

  const sanitizePhoneInput = (raw: string) => {
    const trimmed = raw.trim();
    const digitsOnly = trimmed.replace(/[^\d]/g, '');

    const hasExplicitCountryPrefix = trimmed.startsWith('+') || trimmed.startsWith('00');

    const countriesByCodeLength = [...COUNTRIES].sort(
      (a, b) => b.phoneCode.length - a.phoneCode.length
    );

    // Only try to detect country codes when user explicitly provides '+' or '00' prefix.
    // This avoids mis-detecting local numbers like "94xxxxxxxx" as Sri Lanka.
    const normalizedWithPlus = trimmed.startsWith('00') ? `+${digitsOnly}` : trimmed.startsWith('+') ? `+${digitsOnly}` : '';
    const matchedCountry = hasExplicitCountryPrefix
      ? countriesByCodeLength.find(country => normalizedWithPlus.startsWith(country.phoneCode))
      : undefined;

    if (matchedCountry) {
      const countryCodeDigits = matchedCountry.phoneCode.replace('+', '');
      const strippedDigits = digitsOnly.startsWith(countryCodeDigits)
        ? digitsOnly.slice(countryCodeDigits.length)
        : digitsOnly;

      return {
        matchedCountry,
        localDigits: strippedDigits.slice(0, matchedCountry.phoneLength),
        hasExplicitCountryPrefix,
      };
    }

    return {
      matchedCountry: null as Country | null,
      localDigits: digitsOnly.slice(0, selectedCountry.phoneLength),
      hasExplicitCountryPrefix,
    };
  };

  useEffect(() => {
    if (!onPhoneChange) return;

    const { matchedCountry, localDigits, hasExplicitCountryPrefix } = sanitizePhoneInput(phoneValue);
    const shouldSelect = matchedCountry && matchedCountry.code !== selectedCountry.code;
    const shouldSanitize = phoneValue !== localDigits && (hasExplicitCountryPrefix || /[^\d]/.test(phoneValue));

    if (shouldSelect) {
      onSelectCountry(matchedCountry);
    }

    if (shouldSanitize) {
      if (lastEmittedPhoneRef.current === localDigits) return;
      lastEmittedPhoneRef.current = localDigits;
      onPhoneChange(localDigits);
    }
  }, [phoneValue, selectedCountry.code, onPhoneChange, onSelectCountry]);

  const filteredCountries = COUNTRIES.filter(
    country =>
      country.name.toLowerCase().includes(searchText.toLowerCase()) ||
      country.phoneCode.includes(searchText)
  );

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
      }}
      onPress={() => {
        onSelectCountry(item);
        setShowModal(false);
        setSearchText('');
      }}
    >
      <Text style={{ fontSize: 24, marginRight: 12 }}>{item.flag}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary }}>
          {item.name}
        </Text>
        <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
          {item.phoneCode}
        </Text>
      </View>
      <Text style={{ fontSize: 14, color: Theme.colors.text.secondary }}>
        {item.code}
      </Text>
    </TouchableOpacity>
  );

  const getPaddingStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: Theme.spacing.sm,
          paddingVertical: 6,
          fontSize: 12,
          flagSize: 14,
        };
      case 'large':
        return {
          paddingHorizontal: Theme.spacing.lg,
          paddingVertical: 16,
          fontSize: 15,
          flagSize: 14,
        };
      case 'medium':
      default:
        return {
          paddingHorizontal: Theme.spacing.md,
          paddingVertical: 13,
          fontSize: 14,
          flagSize: 14,
        };
    }
  };

  const paddingStyles = getPaddingStyles();

  return (
    <>
      {/* Single Row Country + Phone Input - Matching Input Component Style */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Theme.spacing.md, gap: 8 }}>
        {/* Country Selector Button */}
        <TouchableOpacity
          style={[
            styles.countryButton,
            {
              paddingHorizontal: 6,
              paddingVertical: paddingStyles.paddingVertical,
            },
          ]}
          onPress={() => setShowModal(true)}
        >
          <Text style={{ fontSize: paddingStyles.flagSize, marginRight: 2 }}>
            {selectedCountry.flag}
          </Text>
          <Text style={[styles.phoneCode, { fontSize: paddingStyles.fontSize }]}>
            {selectedCountry.phoneCode}
          </Text>
          <Text style={[styles.dropdown, { fontSize: paddingStyles.fontSize - 2, marginLeft: 2 }]}>▼</Text>
        </TouchableOpacity>

        {/* Phone Input */}
        <TextInput
          style={[
            styles.phoneInput,
            {
              paddingHorizontal: paddingStyles.paddingHorizontal,
              paddingVertical: paddingStyles.paddingVertical,
              fontSize: paddingStyles.fontSize,
            },
          ]}
          placeholder={`${selectedCountry.phoneLength}-digit number`}
          placeholderTextColor={Theme.colors.text.tertiary}
          value={phoneValue}
          onChangeText={(text) => {
            const { matchedCountry, localDigits } = sanitizePhoneInput(text);

            if (matchedCountry && matchedCountry.code !== selectedCountry.code) {
              onSelectCountry(matchedCountry);
            }

            lastEmittedPhoneRef.current = localDigits;
            onPhoneChange?.(localDigits);
          }}
          keyboardType="phone-pad"
          maxLength={20}
          blurOnSubmit
          onSubmitEditing={() => Keyboard.dismiss()}
        />
      </View>

      {/* Country Selection Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowModal(false);
          setSearchText('');
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View
            style={{
              flex: 1,
              marginTop: 100,
              backgroundColor: 'white',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <View
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#F3F4F6',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary }}>
                Select Country
              </Text>
            </View>

            {/* Search Input */}
            <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
              <TextInput
                style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                }}
                placeholder="Search country or code..."
                placeholderTextColor="#9CA3AF"
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            {/* Country List */}
            <FlatList
              data={filteredCountries}
              renderItem={renderCountryItem}
              keyExtractor={item => item.code}
              scrollEnabled
            />

            {/* Close Button */}
            <TouchableOpacity
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderTopWidth: 1,
                borderTopColor: '#F3F4F6',
                backgroundColor: '#F9FAFB',
              }}
              onPress={() => {
                setShowModal(false);
                setSearchText('');
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: Theme.colors.primary,
                  textAlign: 'center',
                }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 8,
    backgroundColor: 'transparent',
    minWidth: 45,
  },
  phoneCode: {
    fontSize: Theme.typography.fontSize.base,
    fontWeight: Theme.typography.fontWeight.medium,
    color: Theme.colors.text.primary,
    marginRight: 4,
  },
  dropdown: {
    fontSize: 12,
    color: Theme.colors.text.secondary,
    marginLeft: 4,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 8,
    fontSize: Theme.typography.fontSize.base,
    color: Theme.colors.text.primary,
    backgroundColor: 'transparent',
    textAlignVertical: 'center',
  },
});
