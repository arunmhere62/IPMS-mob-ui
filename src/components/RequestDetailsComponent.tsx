import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Clipboard,
  Alert,
  Share,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { NetworkLog } from '../utils/networkLogger';
import { Theme } from '../theme';

interface RequestDetailsComponentProps {
  log: NetworkLog;
  onBack?: () => void;
}

export const RequestDetailsComponent: React.FC<RequestDetailsComponentProps> = ({
  log,
  onBack,
}) => {
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const [expandedSections, setExpandedSections] = useState<{
    request: boolean;
    response: boolean;
    outgoingHeaders: boolean;
    incomingHeaders: boolean;
    curl: boolean;
  }>({
    request: true,
    response: true,
    outgoingHeaders: false,
    incomingHeaders: false,
    curl: false,
  });

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

  const formatJson = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const safeString = (v: any) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    return formatJson(v);
  };

  const outgoingHeaders = (log as any)?.headers?.request ?? (log as any)?.headers;
  const incomingHeaders = (log as any)?.headers?.response;

  const requestBody =
    log.requestData && typeof log.requestData === 'object' && 'body' in (log.requestData as any)
      ? (log.requestData as any).body
      : log.requestData;

  const generateCurl = () => {
    let curl = `curl -X ${log.method} '${log.url}'`;

    if (outgoingHeaders) {
      Object.entries(outgoingHeaders).forEach(([k, v]) => {
        curl += ` \\\n+  -H '${k}: ${String(v).replace(/'/g, "'\\''")}'`;
      });
    }

    if (requestBody !== undefined && requestBody !== null) {
      const body = safeString(requestBody);
      if (body) {
        curl += ` \\\n+  -d '${body.replace(/'/g, "'\\''")}'`;
      }
    }

    return curl;
  };

  const copyToClipboard = (value: string, label: string) => {
    Clipboard.setString(value);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const shareText = async (value: string, title: string) => {
    try {
      await Share.share({ message: value, title });
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to share');
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCopyData = (data: any, label: string) => {
    copyToClipboard(formatJson(data), label);
  };

  const renderCollapsibleSection = (
    title: string,
    sectionKey: keyof typeof expandedSections,
    content: string,
    color?: string,
    actions?: Array<{ label: string; onPress: () => void; variant?: 'primary' | 'neutral' }>
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <TouchableOpacity activeOpacity={1} onPress={() => toggleSection(sectionKey)} style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, color ? { color } : {}]}>
            {expandedSections[sectionKey] ? '▼' : '▶'} {title}
          </Text>
        </TouchableOpacity>
        {expandedSections[sectionKey] && actions && actions.length > 0 && (
          <View style={styles.sectionActions}>
            {actions.map((a, idx) => (
              <TouchableOpacity
                key={`${sectionKey}-${idx}`}
                onPress={a.onPress}
                style={[styles.actionButton, a.variant === 'primary' ? styles.actionPrimary : styles.actionNeutral]}
              >
                <Text style={[styles.actionText, a.variant === 'primary' ? styles.actionTextPrimary : styles.actionTextNeutral]}>
                  {a.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      {expandedSections[sectionKey] && (
        <View style={styles.sectionContent}>
          <ScrollView horizontal showsHorizontalScrollIndicator={true} nestedScrollEnabled={true} style={styles.jsonOuter}>
            <ScrollView
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              style={styles.jsonInner}
              contentContainerStyle={styles.jsonInnerContent}
            >
              <Text style={[styles.dataText, color ? { color } : {}]} selectable>
                {content}
              </Text>
            </ScrollView>
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Method</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: getMethodColor(log.method) },
              ]}
            >
              {log.method}
            </Text>
          </View>
          {log.status && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: getStatusColor(log.status) },
                ]}
              >
                {log.status}
              </Text>
            </View>
          )}
          {log.duration && (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{log.duration}ms</Text>
            </View>
          )}
        </View>

        <View style={styles.urlSection}>
          <Text style={styles.summaryLabel}>URL</Text>
          <Text style={styles.urlText} numberOfLines={2}>
            {log.url}
          </Text>
        </View>

        <Text style={styles.timestampText}>
          {log.timestamp.toLocaleString()}
        </Text>
      </View>

      <View style={styles.topActionsRow}>
        <TouchableOpacity
          onPress={() => copyToClipboard(generateCurl(), 'CURL')}
          style={[styles.topActionButton, styles.buttonPrimary]}
        >
          <Text style={styles.topActionText}>Copy CURL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => shareText(generateCurl(), 'CURL')}
          style={[styles.topActionButton, styles.buttonNeutral]}
        >
          <Text style={styles.topActionTextNeutral}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Request Data */}
      {log.requestData !== undefined && log.requestData !== null &&
        renderCollapsibleSection(
          '📤 Request Data',
          'request',
          formatJson(log.requestData),
          '#F59E0B',
          [
            { label: 'Copy', variant: 'primary', onPress: () => handleCopyData(log.requestData, 'Request Data') },
            { label: 'Share', variant: 'neutral', onPress: () => shareText(formatJson(log.requestData), 'Request Data') },
          ]
        )}

      {/* Response Data */}
      {log.responseData !== undefined && log.responseData !== null &&
        renderCollapsibleSection(
          '📥 Response Data',
          'response',
          formatJson(log.responseData),
          '#10B981',
          [
            { label: 'Copy', variant: 'primary', onPress: () => handleCopyData(log.responseData, 'Response Data') },
            { label: 'Share', variant: 'neutral', onPress: () => shareText(formatJson(log.responseData), 'Response Data') },
          ]
        )}

      {/* Headers */}
      {outgoingHeaders &&
        renderCollapsibleSection(
          '📤 Outgoing Headers',
          'outgoingHeaders',
          formatJson(outgoingHeaders),
          '#60A5FA',
          [
            { label: 'Copy', variant: 'primary', onPress: () => handleCopyData(outgoingHeaders, 'Outgoing Headers') },
            { label: 'Share', variant: 'neutral', onPress: () => shareText(formatJson(outgoingHeaders), 'Outgoing Headers') },
          ]
        )}

      {incomingHeaders &&
        renderCollapsibleSection(
          '📥 Incoming Headers',
          'incomingHeaders',
          formatJson(incomingHeaders),
          '#60A5FA',
          [
            { label: 'Copy', variant: 'primary', onPress: () => handleCopyData(incomingHeaders, 'Incoming Headers') },
            { label: 'Share', variant: 'neutral', onPress: () => shareText(formatJson(incomingHeaders), 'Incoming Headers') },
          ]
        )}

      {renderCollapsibleSection(
        '🔧 CURL',
        'curl',
        generateCurl(),
        '#8B5CF6',
        [
          { label: 'Copy', variant: 'primary', onPress: () => copyToClipboard(generateCurl(), 'CURL') },
          { label: 'Share', variant: 'neutral', onPress: () => shareText(generateCurl(), 'CURL') },
        ]
        )}

      {/* Error */}
      {log.error && (
        <View style={styles.errorSection}>
          <Text style={styles.errorTitle}>❌ Error</Text>
          <Text style={styles.errorText}>{log.error}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background.secondary,
  },
  summaryCard: {
    backgroundColor: Theme.colors.card.background,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: Theme.colors.text.tertiary,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    color: Theme.colors.text.primary,
    fontWeight: '600',
  },
  urlSection: {
    marginBottom: 12,
  },
  urlText: {
    fontSize: 13,
    color: Theme.colors.text.secondary,
    fontWeight: '500',
  },
  timestampText: {
    fontSize: 11,
    color: Theme.colors.text.tertiary,
    marginTop: 4,
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionHeader: {
    paddingVertical: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text.primary,
  },
  sectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionPrimary: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  actionNeutral: {
    backgroundColor: Theme.colors.background.tertiary,
    borderColor: Theme.colors.border,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionTextPrimary: {
    color: '#fff',
  },
  actionTextNeutral: {
    color: Theme.colors.text.primary,
  },
  sectionContent: {
    marginTop: 12,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#0B1220',
    borderRadius: 8,
    padding: 12,
  },
  jsonOuter: {
    height: 320,
  },
  jsonInner: {
    height: 320,
  },
  jsonInnerContent: {
    paddingBottom: 12,
  },
  dataText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#E5E7EB',
    fontFamily: 'monospace',
  },
  topActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  topActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  topActionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 12,
  },
  topActionTextNeutral: {
    color: Theme.colors.text.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  buttonPrimary: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  buttonNeutral: {
    backgroundColor: Theme.colors.background.tertiary,
    borderColor: Theme.colors.border,
  },
  errorSection: {
    backgroundColor: Theme.withOpacity(Theme.colors.danger, 0.12),
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.danger,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.dangerDark,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 13,
    color: Theme.colors.dangerDark,
  },
});
