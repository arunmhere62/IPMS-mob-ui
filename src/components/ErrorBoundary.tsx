import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NetworkLoggerModal } from '../screens/network/NetworkLoggerScreen';
import { showSuccessAlert } from '@/utils/errorHandler';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showNetworkLogs: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showNetworkLogs: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showNetworkLogs: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 ErrorBoundary caught an error:', error, errorInfo);
    console.error('🔴 Component Stack:', errorInfo.componentStack);
    console.error('🔴 Error Stack:', error.stack);
    
    this.setState({
      error,
      errorInfo,
    });
    
    // Log to any crash reporting service here if needed
    // Example: Crashlytics.recordError(error);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showNetworkLogs: false,
    });
  };

  handleClearStorage = async () => {
    Alert.alert(
      'Clear All Data',
      'This will clear all stored data including auth tokens, user info, and app cache. You will need to log in again.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Clearing AsyncStorage...');
              await AsyncStorage.clear();
              console.log('✅ AsyncStorage cleared successfully');
              
              // Reset error state
              this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                showNetworkLogs: false,
              });
              
              showSuccessAlert('All data cleared. Please restart the app.');
            } catch (error) {
              console.error('❌ Error clearing storage:', error);
              Alert.alert('Error', 'Failed to clear storage: ' + (error instanceof Error ? error.message : String(error)));
            }
          },
        },
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{
          flex: 1,
          backgroundColor: Theme.colors.background.blue,
          padding: 20,
          justifyContent: 'center',
        }}>
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
          }}>
            <View style={{
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#FEE2E2',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}>
                <MaterialCommunityIcons name="alert-circle" size={36} color={Theme.colors.danger} />
              </View>
              <Text style={{
                fontSize: 22,
                fontWeight: '700',
                color: '#1F2937',
                marginBottom: 8,
                textAlign: 'center',
              }}>
                Something Went Wrong
              </Text>
            </View>

            <Text style={{
              fontSize: 14,
              color: '#6B7280',
              marginBottom: 24,
              textAlign: 'center',
              lineHeight: 20,
            }}>
              The app encountered an unexpected error. Try again or clear your data to start fresh.
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={{
                maxHeight: 200,
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                padding: 12,
                marginBottom: 20,
              }}>
                <Text style={{
                  fontSize: 12,
                  color: '#666',
                  fontFamily: 'monospace',
                }}>
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </Text>
              </ScrollView>
            )}

            <TouchableOpacity
              onPress={this.handleReset}
              style={{
                backgroundColor: Theme.colors.primary,
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                marginBottom: 12,
                shadowColor: Theme.colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
              <Text style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: '600',
              }}>
                Try Again
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                this.setState({ showNetworkLogs: true });
              }}
              style={{
                backgroundColor: '#0EA5E9',
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                marginBottom: 12,
                shadowColor: '#0EA5E9',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <MaterialCommunityIcons name="network" size={20} color="#fff" />
              <Text style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: '600',
              }}>
                View Network Logs
              </Text>
            </TouchableOpacity>

            <NetworkLoggerModal
              visible={this.state.showNetworkLogs}
              onClose={() => this.setState({ showNetworkLogs: false })}
            />

            <TouchableOpacity
              onPress={this.handleClearStorage}
              style={{
                backgroundColor: '#EF4444',
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color="#fff" />
              <Text style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: '600',
              }}>
                Clear Storage & Restart
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
