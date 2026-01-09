import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SkeletonLoader } from "../../../components/SkeletonLoader";
import type { RentPaymentGap } from "@/services/api/paymentsApi";
import { Theme } from "../../../theme";

interface MissingRentPeriodsProps {
  checkingGaps: boolean;
  gaps: RentPaymentGap[];
  selectedGap?: RentPaymentGap | null;
  onSelectGap: (gap: RentPaymentGap) => void;
  onSkipAllGaps: () => void;
  formatGapMonthDisplay: (gapStart: string, gapEnd: string) => string;
}

export const MissingRentPeriods: React.FC<MissingRentPeriodsProps> = ({
  checkingGaps,
  gaps,
  selectedGap,
  onSelectGap,
  onSkipAllGaps,
  formatGapMonthDisplay,
}) => {
  const formatINR = (n?: unknown) => {
    const num = typeof n === 'number' ? n : typeof n === 'string' ? Number(n) : 0;
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num || 0);
    } catch {
      return `₹${Math.round(num || 0)}`;
    }
  };

  if (checkingGaps) {
    return (
      <View
        style={{
          marginHorizontal: 0,
          marginBottom: 16,
          padding: 12,
          backgroundColor: Theme.colors.canvas,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: Theme.colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              backgroundColor: Theme.colors.dangerLight,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
              borderWidth: 1,
              borderColor: Theme.colors.dangerLight,
            }}
          >
            <Text style={{ fontSize: 18 }}>📅</Text>
          </View>
          <View style={{ flex: 1 }}>
            <SkeletonLoader width="55%" height={14} borderRadius={6} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="90%" height={12} borderRadius={6} />
          </View>
        </View>

        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <SkeletonLoader width={96} height={44} borderRadius={8} />
            <SkeletonLoader width={96} height={44} borderRadius={8} />
            <SkeletonLoader width={96} height={44} borderRadius={8} />
          </View>
        </View>

        <SkeletonLoader width="100%" height={42} borderRadius={10} />
      </View>
    );
  }

  if (!Array.isArray(gaps) || gaps.length === 0) return null;

  const totalRemaining = gaps.reduce((acc, g) => {
    const rem = typeof g?.remainingDue === 'number'
      ? g.remainingDue
      : typeof g?.rentDue === 'number' && typeof g?.totalPaid === 'number'
        ? Number(g.rentDue) - Number(g.totalPaid)
        : 0;
    return acc + (Number.isFinite(rem) ? Math.max(0, rem) : 0);
  }, 0);
  type RentPaymentGapWithPriority = RentPaymentGap & { priority?: number };
  const getPriority = (g: RentPaymentGapWithPriority) => {
    const p = g?.priority;
    return typeof p === 'number' && Number.isFinite(p) ? p : Number.POSITIVE_INFINITY;
  };

  const gapsSorted = [...gaps].sort((a, b) => {
    const pa = getPriority(a);
    const pb = getPriority(b);
    if (pa !== pb) return pa - pb; // lower priority number first if provided by API
    const at = new Date(a.gapStart).getTime() || 0;
    const bt = new Date(b.gapStart).getTime() || 0;
    return at - bt; // else earliest start date first
  });
  const recommendedGapId = gapsSorted[0]?.gapId;

  return (
    <View
      style={{
        marginHorizontal: 0,
        marginBottom: 16,
        padding: 12,
        backgroundColor: Theme.colors.canvas,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Theme.colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            backgroundColor: Theme.colors.dangerLight,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
            borderWidth: 1,
            borderColor: Theme.colors.dangerLight,
          }}
        >
          <Text style={{ fontSize: 18 }}>📅</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: Theme.colors.text.primary,
              marginBottom: 2,
            }}
          >
            Missing Rent Period{gaps.length > 1 ? 's' : ''}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: Theme.colors.text.tertiary,
              lineHeight: 16,
            }}
          >
            We found {gaps.length} unpaid period{gaps.length > 1 ? 's' : ''} where rent hasn't been paid.
            Tap a period to auto-fill the dates and expected amount.
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: Theme.colors.danger,
              fontWeight: '700',
              marginTop: 6,
            }}
          >
            Total remaining due: {formatINR(totalRemaining)}
          </Text>
        </View>
      </View>
      {/* Simple list (default) */}
      <View style={{ marginBottom: 14 }}>
        <View style={{ gap: 8 }}>
          {gapsSorted.map((gap) => {
            const isSelected = selectedGap?.gapId === gap.gapId;
            const monthDisplay = formatGapMonthDisplay(gap.gapStart, gap.gapEnd);
            const remaining = typeof gap?.remainingDue === 'number'
              ? gap.remainingDue
              : typeof gap?.rentDue === 'number' && typeof gap?.totalPaid === 'number'
                ? Number(gap.rentDue) - Number(gap.totalPaid)
                : 0;
            const recommended = gap.gapId === recommendedGapId;
            return (
              <TouchableOpacity
                key={gap.gapId}
                onPress={() => onSelectGap(gap)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  backgroundColor: Theme.colors.canvas,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: isSelected ? Theme.colors.dangerDark : Theme.colors.background.blueMedium,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: Theme.colors.text.primary }}>{monthDisplay}</Text>
                    {recommended ? (
                      <Text style={{ marginLeft: 8, fontSize: 10, color: Theme.colors.dangerDark, fontWeight: '700' }}>Recommended</Text>
                    ) : null}
                  </View>
                  <Text style={{ marginTop: 2, fontSize: 11, color: Theme.colors.danger, fontWeight: '700' }}>
                    Due {formatINR(remaining)} • {gap.daysMissing}d
                  </Text>
                </View>
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: isSelected ? Theme.colors.dangerDark : Theme.colors.background.blueMedium,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSelected ? (
                    <View style={{ width: 10, height: 10, borderRadius: 6, backgroundColor: Theme.colors.dangerDark }} />
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selectedGap ? (
        <View
          style={{
            marginBottom: 12,
            paddingHorizontal: 10,
            paddingVertical: 8,
            backgroundColor: Theme.withOpacity(Theme.colors.danger, 0.06),
            borderRadius: 10,
            borderWidth: 1,
            borderColor: Theme.colors.dangerLight,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: '600',
              color: Theme.colors.text.tertiary,
              marginBottom: 4,
              textTransform: 'uppercase',
              letterSpacing: 0.3,
            }}
          >
            Selected
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: Theme.colors.text.primary,
              }}
            >
              {selectedGap.gapStart}
            </Text>
            <Text
              style={{
                fontSize: 11,
                color: Theme.colors.text.tertiary,
                marginHorizontal: 6,
              }}
            >
              →
            </Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: Theme.colors.text.primary,
              }}
            >
              {selectedGap.gapEnd}
            </Text>
            <Text
              style={{
                fontSize: 10,
                color: Theme.colors.text.tertiary,
                marginLeft: 8,
              }}
            >
              ({selectedGap.daysMissing}d)
            </Text>
          </View>
          <Text
            style={{
              marginTop: 6,
              fontSize: 11,
              fontWeight: '700',
              color: Theme.colors.danger,
            }}
          >
            Remaining due: {formatINR(
              typeof selectedGap?.remainingDue === 'number'
                ? selectedGap.remainingDue
                : typeof selectedGap?.rentDue === 'number' && typeof selectedGap?.totalPaid === 'number'
                  ? Number(selectedGap.rentDue) - Number(selectedGap.totalPaid)
                  : 0
            )}
          </Text>
        </View>
      ) : null}

      <View style={{ gap: 8 }}>
        <TouchableOpacity
          onPress={onSkipAllGaps}
          style={{
            paddingVertical: 11,
            paddingHorizontal: 12,
            backgroundColor: Theme.colors.canvas,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: Theme.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: Theme.colors.primary,
            }}
          >
            Skip All Gaps
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
