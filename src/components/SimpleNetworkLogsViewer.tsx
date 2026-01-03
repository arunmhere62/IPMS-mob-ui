import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { networkLogger, type NetworkLog } from '../utils/networkLogger';

interface SimpleNetworkLogsViewerProps {
  visible: boolean;
  onClose: () => void;
}

export const SimpleNetworkLogsViewer: React.FC<SimpleNetworkLogsViewerProps> = ({
  visible,
  onClose,
}) => {
  const logs: NetworkLog[] = networkLogger.getLogs();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Network Logs</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No network requests logged</Text>
          </View>
        ) : (
          <ScrollView style={styles.logsList}>
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                Total Requests: {logs.length}
              </Text>
              <Text style={styles.statsText}>
                Success: {logs.filter((l: NetworkLog) => l.status && l.status >= 200 && l.status < 300).length}
              </Text>
              <Text style={styles.statsText}>
                Errors: {logs.filter((l: NetworkLog) => l.status && l.status >= 400).length}
              </Text>
            </View>

            {logs.map((log: NetworkLog, index: number) => (
              <View key={`${log.id}-${index}`} style={styles.logItem}>
                <View style={styles.logHeader}>
                  <Text style={[styles.method, { color: getMethodColor(log.method) }]}>
                    {log.method}
                  </Text>
                  <Text
                    style={[
                      styles.status,
                      { color: getStatusColor(log.status) },
                    ]}
                  >
                    {log.status || 'PENDING'}
                  </Text>
                  {log.duration && (
                    <Text style={styles.duration}>{log.duration}ms</Text>
                  )}
                </View>

                <Text style={styles.url} numberOfLines={2}>
                  {log.url}
                </Text>

                <Text style={styles.timestamp}>
                  {log.timestamp.toLocaleTimeString()}
                </Text>

                {log.error && (
                  <Text style={styles.error}>❌ {log.error}</Text>
                )}

                {log.requestData != null && (
                  <View style={styles.dataSection}>
                    <Text style={styles.dataLabel}>Request:</Text>
                    <Text style={styles.dataText}>
                      {typeof log.requestData === 'string'
                        ? log.requestData.substring(0, 200)
                        : JSON.stringify(log.requestData).substring(0, 200)}
                    </Text>
                  </View>
                )}

                {log.responseData != null && (
                  <View style={styles.dataSection}>
                    <Text style={styles.dataLabel}>Response:</Text>
                    <Text style={styles.dataText}>
                      {typeof log.responseData === 'string'
                        ? log.responseData.substring(0, 200)
                        : JSON.stringify(log.responseData).substring(0, 200)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const getMethodColor = (method: string): string => {
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
      return '#6B7280';
  }
};

const getStatusColor = (status?: number): string => {
  if (!status) return '#999';
  if (status >= 200 && status < 300) return '#10B981';
  if (status >= 300 && status < 400) return '#3B82F6';
  if (status >= 400 && status < 500) return '#F59E0B';
  if (status >= 500) return '#EF4444';
  return '#6B7280';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#111827',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  logsList: {
    flex: 1,
    padding: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  statsContainer: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statsText: {
    fontSize: 12,
    color: '#D1D5DB',
    marginBottom: 4,
  },
  logItem: {
    backgroundColor: '#374151',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  method: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 40,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 50,
  },
  duration: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  url: {
    fontSize: 12,
    color: '#D1D5DB',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  error: {
    fontSize: 11,
    color: '#FCA5A5',
    marginTop: 4,
  },
  dataSection: {
    marginTop: 8,
    backgroundColor: '#1F2937',
    padding: 8,
    borderRadius: 4,
  },
  dataLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 4,
  },
  dataText: {
    fontSize: 10,
    color: '#D1D5DB',
    fontFamily: 'monospace',
  },
});
