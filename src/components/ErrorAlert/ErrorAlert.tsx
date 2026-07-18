import React, { useEffect, useState } from 'react';
import { AnimatedPressableCard } from '../AnimatedPressableCard';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  error?: {
    code: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}

interface ErrorAlertProps {
  error: ApiError | null;
  onDismiss?: () => void;
  autoHideDuration?: number;
  showDetails?: boolean;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onDismiss,
  autoHideDuration = 5000,
  showDetails = false }) => {
  const [visible, setVisible] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true }).start();

      if (autoHideDuration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoHideDuration);
        return () => clearTimeout(timer);
      }
    }
  }, [error]);

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true }).start(() => {
      setVisible(false);
      onDismiss?.();
    });
  };

  if (!visible || !error) {
    return null;
  }

  const getErrorIcon = (statusCode: number) => {
    if (statusCode === 404) return 'search-off';
    if (statusCode === 401 || statusCode === 403) return 'lock';
    if (statusCode === 409) return 'warning';
    if (statusCode >= 500) return 'error';
    return 'info';
  };

  const getErrorColor = (statusCode: number) => {
    if (statusCode >= 500) return '#D32F2F'; // Red for server errors
    if (statusCode === 401 || statusCode === 403) return '#F57C00'; // Orange for auth errors
    if (statusCode === 409) return '#FBC02D'; // Yellow for conflict
    if (statusCode === 404) return '#1976D2'; // Blue for not found
    return '#D32F2F'; // Red for others
  };

  const errorColor = getErrorColor(error.statusCode);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim },
      ]}
    >
      <View style={[styles.errorBox, { borderLeftColor: errorColor }]}>
        <View style={styles.header}>
          <MaterialIcons
            name={getErrorIcon(error.statusCode)}
            size={24}
            color={errorColor}
          />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Error</Text>
            <Text style={styles.statusCode}>({error.statusCode})</Text>
          </View>
          <AnimatedPressableCard onPress={handleDismiss}>
            <MaterialIcons name="close" size={24} color="#666" />
          </AnimatedPressableCard>
        </View>

        <Text style={styles.message}>{error.message}</Text>

        {showDetails && error.error?.details && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsLabel}>Details:</Text>
            <Text style={styles.detailsText}>
              {typeof error.error.details === 'string'
                ? error.error.details
                : JSON.stringify(error.error.details, null, 2)}
            </Text>
          </View>
        )}

        {showDetails && error.error?.code && (
          <Text style={styles.errorCode}>Code: {error.error.code}</Text>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingTop: 8 },
  errorBox: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12 },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center' },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333' },
  statusCode: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8 },
  message: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8 },
  detailsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE' },
  detailsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4 },
  detailsText: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace' },
  errorCode: {
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    fontFamily: 'monospace' } });

export default ErrorAlert;
