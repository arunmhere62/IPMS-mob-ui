import React, { useState, useEffect } from 'react';
import { AnimatedPressableCard } from './AnimatedPressableCard';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions } from 'react-native';
import { SlideBottomModal } from './SlideBottomModal';
import { ScreenLayout } from './ScreenLayout';
import { ScreenHeader } from './ScreenHeader';
import { RequestDetailsComponent } from './RequestDetailsComponent';
import { networkLogger, NetworkLog } from '../utils/networkLogger';
import { Theme } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface NetworkLoggerSlideModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NetworkLoggerSlideModal: React.FC<NetworkLoggerSlideModalProps> = ({
  visible,
  onClose }) => {
  const [logs, setLogs] = useState<NetworkLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<NetworkLog | null>(null);

  useEffect(() => {
    if (visible) {
      const currentLogs = networkLogger.getLogs();
      setLogs(currentLogs);
      setSelectedLog(null);
    }
  }, [visible]);

  const getStatusColor = (status?: number) => {
    if (!status) return '#999';
    if (status >= 200 && status < 300) return '#10B981';
    if (status >= 400) return '#EF4444';
    return '#F59E0B';
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
        return '#6B7280';
    }
  };

  const renderLogsList = () => (
    <ScrollView style={styles.logsList}>
      {logs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No network requests logged</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              Total: {logs.length} | Success: {logs.filter(l => l.status && l.status >= 200 && l.status < 300).length} | Errors: {logs.filter(l => l.status && l.status >= 400).length}
            </Text>
          </View>

          {logs.map((log, index) => (
            <AnimatedPressableCard
              key={`${log.id}-${index}`}
              style={styles.logItem}
              onPress={() => setSelectedLog(log)}
            >
              <View style={styles.logHeader}>
                <Text style={[styles.method, { color: getMethodColor(log.method) }]}>
                  {log.method}
                </Text>
                <Text style={[styles.status, { color: getStatusColor(log.status) }]}>
                  {log.status || 'PENDING'}
                </Text>
                {log.duration && (
                  <Text style={styles.duration}>{log.duration}ms</Text>
                )}
              </View>
              <Text style={styles.url} numberOfLines={1} ellipsizeMode="tail">
                {log.url}
              </Text>
              <Text style={styles.timestamp}>
                {log.timestamp.toLocaleTimeString()}
              </Text>
              {log.error && (
                <Text style={styles.error}>❌ {log.error}</Text>
              )}
            </AnimatedPressableCard>
          ))}
        </>
      )}
    </ScrollView>
  );

  const renderLogDetails = () => {
    if (!selectedLog) return null;
    return <RequestDetailsComponent log={selectedLog} onBack={() => setSelectedLog(null)} />;
  };

  return (
    <SlideBottomModal
      visible={visible}
      onClose={onClose}
      title={selectedLog ? 'Request Details' : 'Network Logs'}
      subtitle={selectedLog ? selectedLog.url : `${logs.length} requests`}
      cancelLabel={selectedLog ? 'Back' : 'Close'}
      onCancel={() => {
        if (selectedLog) {
          setSelectedLog(null);
        } else {
          onClose();
        }
      }}
    >
      <ScreenLayout contentBackgroundColor="#fff">
        <ScreenHeader
          title={selectedLog ? 'Request Details' : 'Network Logs'}
          subtitle={selectedLog ? selectedLog.url : `${logs.length} requests`}
          showBackButton={!!selectedLog}
          onBackPress={() => setSelectedLog(null)}
          backgroundColor={Theme.colors.background.blue}
          textColor={Theme.colors.text.inverse}
        />
        {selectedLog ? renderLogDetails() : renderLogsList()}
      </ScreenLayout>
    </SlideBottomModal>
  );
};

const styles = StyleSheet.create({
  logsList: {
    flex: 1,
    maxHeight: SCREEN_HEIGHT * 0.6 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40 },
  emptyText: {
    fontSize: 14,
    color: '#999' },
  statsContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8 },
  statsText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600' },
  logItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginHorizontal: 4 },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8 },
  method: {
    fontSize: 12,
    fontWeight: 'bold',
    minWidth: 40 },
  status: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 50 },
  duration: {
    fontSize: 11,
    color: '#999' },
  url: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4 },
  timestamp: {
    fontSize: 10,
    color: '#999' },
  error: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 4 } });
