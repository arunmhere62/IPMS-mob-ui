import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import Theme from '@/theme';

const C = Theme.colors;

// ─── Home Tab Skeleton ───────────────────────────────────────────────────────

export const HomeTabSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Hero card skeleton */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <SkeletonLoader width="40%" height={12} style={{ marginBottom: 6 }} />
            <SkeletonLoader width="50%" height={28} />
          </View>
          <SkeletonLoader width={90} height={28} borderRadius={14} />
        </View>
        <View style={styles.heroDivider} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <SkeletonLoader width={14} height={14} borderRadius={7} />
          <SkeletonLoader width="60%" height={12} />
        </View>
        <SkeletonLoader width="100%" height={40} borderRadius={10} style={{ marginTop: 14 }} />
      </View>

      {/* Vacate card skeleton */}
      <View style={styles.vacateCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <SkeletonLoader width={48} height={48} borderRadius={14} />
          <View style={{ flex: 1 }}>
            <SkeletonLoader width="50%" height={12} style={{ marginBottom: 6 }} />
            <SkeletonLoader width="40%" height={20} style={{ marginBottom: 6 }} />
            <SkeletonLoader width="80%" height={11} />
          </View>
        </View>
        <SkeletonLoader width="100%" height={44} borderRadius={12} style={{ marginTop: 14 }} />
      </View>

      {/* Ticket stats skeleton */}
      <View style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <SkeletonLoader width={20} height={20} borderRadius={4} />
          <SkeletonLoader width="40%" height={16} />
        </View>
        <View style={styles.statsRow}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.statItem}>
              <SkeletonLoader width={40} height={20} style={{ marginBottom: 4 }} />
              <SkeletonLoader width={50} height={11} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// ─── Payments Tab Skeleton ───────────────────────────────────────────────────

export const PaymentsTabSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Tab bar skeleton */}
      <View style={styles.payTabBar}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.payTabItem}>
            <SkeletonLoader width={18} height={18} borderRadius={4} style={{ marginBottom: 4 }} />
            <SkeletonLoader width={60} height={12} />
          </View>
        ))}
      </View>

      {/* Cycle cards skeleton */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.cycleCard}>
          <View style={styles.cycleRowTop}>
            <SkeletonLoader width={32} height={32} borderRadius={16} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <SkeletonLoader width="70%" height={14} style={{ marginBottom: 4 }} />
              <SkeletonLoader width="50%" height={11} />
            </View>
            <SkeletonLoader width={70} height={22} borderRadius={11} />
          </View>
          <SkeletonLoader width="100%" height={44} borderRadius={12} style={{ marginTop: 12 }} />
        </View>
      ))}
    </View>
  );
};

// ─── Tickets Tab Skeleton ────────────────────────────────────────────────────

export const TicketsTabSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.ticketsHeader}>
        <SkeletonLoader width="30%" height={18} />
        <SkeletonLoader width={70} height={28} borderRadius={14} />
      </View>

      {/* Ticket cards skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.ticketCard}>
          <View style={styles.ticketRow}>
            <SkeletonLoader width={36} height={36} borderRadius={10} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <SkeletonLoader width="60%" height={14} style={{ marginBottom: 4 }} />
              <SkeletonLoader width="40%" height={11} />
            </View>
            <SkeletonLoader width={60} height={20} borderRadius={10} />
          </View>
          <View style={styles.ticketFooter}>
            <SkeletonLoader width={12} height={12} borderRadius={4} />
            <SkeletonLoader width={50} height={11} />
            <SkeletonLoader width={50} height={11} style={{ marginLeft: 'auto' }} />
          </View>
        </View>
      ))}
    </View>
  );
};

// ─── Profile Tab Skeleton ────────────────────────────────────────────────────

export const ProfileTabSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Profile hero skeleton */}
      <View style={styles.profileHero}>
        <SkeletonLoader width={72} height={72} borderRadius={36} style={{ marginBottom: 12 }} />
        <SkeletonLoader width="50%" height={20} style={{ marginBottom: 6 }} />
        <SkeletonLoader width="40%" height={14} style={{ marginBottom: 6 }} />
        <SkeletonLoader width={80} height={22} borderRadius={11} />
      </View>

      {/* Personal details skeleton */}
      <View style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <SkeletonLoader width={20} height={20} borderRadius={4} />
          <SkeletonLoader width="40%" height={16} />
        </View>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={styles.infoRow}>
            <SkeletonLoader width={18} height={18} borderRadius={4} />
            <SkeletonLoader width="30%" height={12} />
            <SkeletonLoader width="40%" height={14} style={{ marginLeft: 'auto' }} />
          </View>
        ))}
      </View>

      {/* PG details skeleton */}
      <View style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <SkeletonLoader width={20} height={20} borderRadius={4} />
          <SkeletonLoader width="30%" height={16} />
        </View>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.infoRow}>
            <SkeletonLoader width={18} height={18} borderRadius={4} />
            <SkeletonLoader width="25%" height={12} />
            <SkeletonLoader width="45%" height={14} style={{ marginLeft: 'auto' }} />
          </View>
        ))}
      </View>

      {/* Logout button skeleton */}
      <SkeletonLoader width="100%" height={48} borderRadius={14} style={{ marginTop: 8 }} />
    </View>
  );
};

// ─── Ticket Detail Skeleton ──────────────────────────────────────────────────

export const TicketDetailSkeleton: React.FC = () => {
  return (
    <View style={styles.ticketDetailContainer}>
      {/* Header skeleton */}
      <View style={styles.ticketDetailHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <SkeletonLoader width={40} height={40} borderRadius={20} />
          <View style={{ flex: 1 }}>
            <SkeletonLoader width="60%" height={16} style={{ marginBottom: 6 }} />
            <SkeletonLoader width={80} height={20} borderRadius={10} />
          </View>
        </View>
      </View>

      {/* Info strip skeleton */}
      <View style={styles.infoStrip}>
        <SkeletonLoader width={80} height={24} borderRadius={12} />
        <SkeletonLoader width={80} height={24} borderRadius={12} />
        <SkeletonLoader width={80} height={24} borderRadius={12} />
      </View>

      {/* Chat bubbles skeleton */}
      <View style={{ flex: 1, padding: 16 }}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.bubbleSkeleton,
              i % 2 === 0 ? styles.bubbleMe : styles.bubbleThem,
            ]}
          >
            <SkeletonLoader
              width={i % 2 === 0 ? '70%' : '60%'}
              height={14}
              style={{ marginBottom: 4 }}
            />
            <SkeletonLoader width={40} height={10} />
          </View>
        ))}
      </View>

      {/* Input bar skeleton */}
      <View style={styles.inputBar}>
        <SkeletonLoader width="80%" height={40} borderRadius={20} />
        <SkeletonLoader width={40} height={40} borderRadius={20} />
      </View>
    </View>
  );
};

// ─── Submit Payment Skeleton ─────────────────────────────────────────────────

export const SubmitPaymentSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Amount card skeleton */}
      <View style={styles.sectionCard}>
        <SkeletonLoader width="40%" height={12} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="60%" height={28} style={{ marginBottom: 12 }} />
        <SkeletonLoader width="50%" height={14} />
      </View>

      {/* Payment config skeleton */}
      <View style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <SkeletonLoader width={20} height={20} borderRadius={4} />
          <SkeletonLoader width="50%" height={16} />
        </View>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.infoRow}>
            <SkeletonLoader width={18} height={18} borderRadius={4} />
            <SkeletonLoader width="30%" height={12} />
            <SkeletonLoader width="40%" height={14} style={{ marginLeft: 'auto' }} />
          </View>
        ))}
      </View>

      {/* Pay button skeleton */}
      <SkeletonLoader width="100%" height={48} borderRadius={12} style={{ marginTop: 8 }} />

      {/* Form fields skeleton */}
      <View style={styles.sectionCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <SkeletonLoader width={20} height={20} borderRadius={4} />
          <SkeletonLoader width="40%" height={16} />
        </View>
        {[1, 2, 3].map((i) => (
          <View key={i} style={{ marginBottom: 16 }}>
            <SkeletonLoader width="25%" height={12} style={{ marginBottom: 6 }} />
            <SkeletonLoader width="100%" height={44} borderRadius={10} />
          </View>
        ))}
      </View>

      {/* Submit button skeleton */}
      <SkeletonLoader width="100%" height={50} borderRadius={14} style={{ marginTop: 8 }} />
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Home
  heroCard: { borderRadius: 16, padding: 20, marginBottom: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  heroDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 14 },
  vacateCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 4 },
  statItem: { alignItems: 'center' },

  // Payments
  payTabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.border, marginTop: 8, marginBottom: 12, paddingBottom: 10 },
  payTabItem: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  cycleCard: { paddingVertical: 14, paddingHorizontal: 12, marginBottom: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cycleRowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  // Tickets
  ticketsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  ticketCard: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: C.border },
  ticketRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  ticketFooter: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  // Profile
  profileHero: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, backgroundColor: C.primary, opacity: 0.15 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },

  // Ticket detail
  ticketDetailContainer: { flex: 1, backgroundColor: '#f8fafc' },
  ticketDetailHeader: { padding: 16, paddingBottom: 20 },
  infoStrip: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  bubbleSkeleton: { padding: 12, borderRadius: 16, marginBottom: 12, maxWidth: '75%' },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: '#eff6ff' },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: '#f3f4f6' },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#fff' },
});
