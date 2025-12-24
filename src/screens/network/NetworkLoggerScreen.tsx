import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenLayout } from '@/components/ScreenLayout';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SlideBottomModal } from '@/components/SlideBottomModal';
import { FullScreenSlideUpModal } from '@/components/FullScreenSlideUpModal';
import { RequestDetailsComponent } from '@/components/RequestDetailsComponent';
import { networkLogger, type NetworkLog } from '@/utils/networkLogger';
import { Theme } from '@/theme';

const NetworkLoggerContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [logs, setLogs] = useState<NetworkLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<NetworkLog | null>(null);

  const countKeys = (obj: any) => {
    if (!obj || typeof obj !== 'object') return 0;
    return Object.keys(obj).length;
  };

  const loadLogs = useCallback(() => {
    setLogs(networkLogger.getLogs());
  }, []);

  useEffect(() => {
    loadLogs();
    const t = setInterval(loadLogs, 800);
    return () => clearInterval(t);
  }, [loadLogs]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((l) => l.status && l.status >= 200 && l.status < 300).length;
    const errors = logs.filter((l) => l.status && l.status >= 400).length;
    return { total, success, errors };
  }, [logs]);

  const getPath = (url: string) => {
    try {
      const u = new URL(url);
      return u.pathname + (u.search || '');
    } catch {
      return url;
    }
  };

  const getStatusColor = (status?: number) => {
    if (!status) return Theme.colors.text.tertiary;
    if (status >= 200 && status < 300) return '#10B981';
    if (status >= 400) return '#EF4444';
    return '#F59E0B';
  };

  const getStatusBg = (status?: number) => {
    if (!status) return Theme.colors.background.tertiary;
    if (status >= 200 && status < 300) return Theme.withOpacity('#10B981', 0.14);
    if (status >= 400) return Theme.withOpacity('#EF4444', 0.14);
    return Theme.withOpacity('#F59E0B', 0.14);
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return '#3B82F6';
      case 'POST':
        return '#10B981';
      case 'PUT':
        return '#F59E0B';
      case 'DELETE':
        return '#EF4444';
      case 'PATCH':
        return '#8B5CF6';
      default:
        return Theme.colors.text.secondary;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadLogs();
    setRefreshing(false);
  };

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue} contentBackgroundColor={Theme.colors.background.secondary}>
      <ScreenHeader
        title="Network Logs"
        subtitle={`Total: ${stats.total} | ✓ ${stats.success} | ✗ ${stats.errors}`}
        showBackButton
        onBackPress={onClose}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, paddingTop: 12 }}>
        <View style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: Theme.colors.background.blueLight,
          borderWidth: 1,
          borderColor: Theme.colors.background.blueMedium,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: Theme.colors.primaryDark }}>📦 {stats.total}</Text>
        </View>
        <View style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: Theme.withOpacity('#10B981', 0.18),
          borderWidth: 1,
          borderColor: Theme.withOpacity('#10B981', 0.35),
        }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}>✅ {stats.success}</Text>
        </View>
        <View style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: Theme.withOpacity('#EF4444', 0.18),
          borderWidth: 1,
          borderColor: Theme.withOpacity('#EF4444', 0.35),
        }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: '#EF4444' }}>❌ {stats.errors}</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            networkLogger.clearLogs();
            loadLogs();
          }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: Theme.colors.danger,
            borderWidth: 1,
            borderColor: Theme.colors.danger,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={loadLogs}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 10,
            backgroundColor: Theme.colors.primary,
            borderWidth: 1,
            borderColor: Theme.colors.primary,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />}
        ListEmptyComponent={
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary }}>No requests yet</Text>
            <Text style={{ marginTop: 8, fontSize: 13, color: Theme.colors.text.secondary }}>
              Make some API calls and come back.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedLog(item)}
            style={{
              backgroundColor: Theme.colors.card.background,
              borderRadius: 16,
              padding: 18,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: Theme.withOpacity(Theme.colors.border, 0.9),
              borderLeftWidth: 5,
              borderLeftColor: getStatusColor(item.status),
              ...Theme.colors.shadows.medium,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 }}>
                <View style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: Theme.colors.background.blueLight,
                  borderWidth: 1,
                  borderColor: Theme.colors.background.blueMedium,
                }}>
                  <Text style={{ fontWeight: '900', fontSize: 11, color: getMethodColor(item.method) }}>{item.method}</Text>
                </View>

                <View style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: getStatusBg(item.status),
                  borderWidth: 1,
                  borderColor: Theme.withOpacity(getStatusColor(item.status), 0.25),
                }}>
                  <Text style={{ fontWeight: '900', fontSize: 11, color: getStatusColor(item.status) }}>
                    {item.status ?? 'PENDING'}
                  </Text>
                </View>

                {item.duration !== undefined && (
                  <View style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 999,
                    backgroundColor: Theme.colors.background.tertiary,
                    borderWidth: 1,
                    borderColor: Theme.colors.border,
                  }}>
                    <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, fontWeight: '800' }}>{item.duration}ms</Text>
                  </View>
                )}

                <View style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: Theme.colors.background.tertiary,
                  borderWidth: 1,
                  borderColor: Theme.colors.border,
                }}>
                  <Text style={{ fontSize: 11, color: Theme.colors.text.secondary, fontWeight: '800' }}>
                    OUT {countKeys((item as any)?.headers?.request ?? (item as any)?.headers)} | IN {countKeys((item as any)?.headers?.response)}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, fontWeight: '600' }}>
                  {item.timestamp.toLocaleTimeString()}
                </Text>
                <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary, marginTop: 2 }}>
                  {item.timestamp.toLocaleDateString()}
                </Text>
              </View>
            </View>

            <Text numberOfLines={2} style={{ fontSize: 16, color: Theme.colors.text.primary, fontWeight: '800', lineHeight: 22 }}>
              {getPath(item.url)}
            </Text>
            <Text numberOfLines={2} style={{ marginTop: 6, fontSize: 13, color: Theme.colors.text.secondary, fontWeight: '500', lineHeight: 18 }}>
              {item.url}
            </Text>

            {item.error && (
              <View style={{
                marginTop: 10,
                padding: 8,
                backgroundColor: Theme.withOpacity(Theme.colors.danger, 0.08),
                borderRadius: 8,
                borderLeftWidth: 3,
                borderLeftColor: Theme.colors.danger,
              }}>
                <Text numberOfLines={2} style={{ fontSize: 12, color: Theme.colors.danger, fontWeight: '700' }}>
                  {item.error}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      <SlideBottomModal
        visible={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? 'Request Details' : 'Request Details'}
        subtitle={selectedLog?.url}
        cancelLabel="Close"
        onCancel={() => setSelectedLog(null)}
      >
        {selectedLog ? <RequestDetailsComponent log={selectedLog} /> : null}
      </SlideBottomModal>
    </ScreenLayout>
  );
};

export const NetworkLoggerModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  return (
    <FullScreenSlideUpModal visible={visible} onClose={onClose}>
      <NetworkLoggerContent onClose={onClose} />
    </FullScreenSlideUpModal>
  );
};

export const NetworkLoggerScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  return <NetworkLoggerContent onClose={() => navigation.goBack()} />;
};
