import React, { useState } from 'react';
import { AnimatedPressableCard } from '@/components/AnimatedPressableCard';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { Theme } from '../../../../theme';
import { ScreenLayout } from '../../../../components/ScreenLayout';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { Card } from '../../../../components/Card';
import { CONTENT_COLOR } from '@/constant';
import { useGetUpcomingVacanciesQuery } from '../../api/tenantsApi';
import type { UpcomingVacancy } from '../../api/tenantsApi';

interface UpcomingVacanciesScreenProps {
  navigation: any;
}

const FILTER_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const daysUntil = (dateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const UrgencyBadge = ({ days }: { days: number }) => {
  let bg = '#DCFCE7';
  let text = '#166534';
  let label = `${days}d left`;

  if (days <= 3) {
    bg = '#FEE2E2'; text = '#991B1B'; label = days === 0 ? 'Today' : `${days}d left`;
  } else if (days <= 7) {
    bg = '#FEF3C7'; text = '#92400E';
  } else if (days <= 15) {
    bg = '#E0F2FE'; text = '#075985';
  }

  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: bg }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: text }}>{label}</Text>
    </View>
  );
};

export const UpcomingVacanciesScreen: React.FC<UpcomingVacanciesScreenProps> = ({ navigation }) => {
  const [days, setDays] = useState(30);

  const { data, isLoading, isFetching, refetch } = useGetUpcomingVacanciesQuery({ days });
  const vacancies: UpcomingVacancy[] = data?.data ?? [];

  return (
    <ScreenLayout contentBackgroundColor={CONTENT_COLOR}>
      <ScreenHeader
        title="Upcoming Vacancies"
        subtitle={`Beds going vacant in next ${days} days`}
        showBackButton={navigation.canGoBack()}
        onBackPress={() => navigation.goBack()}
        backgroundColor={Theme.colors.background.blue}
        syncMobileHeaderBg
      />
      <View style={{ flex: 1, backgroundColor: CONTENT_COLOR }}>
        {/* Filter chips */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
          {FILTER_OPTIONS.map((opt) => (
            <AnimatedPressableCard
              key={opt.value}
              onPress={() => setDays(opt.value)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: days === opt.value ? Theme.colors.primary : '#F1F5F9',
                borderWidth: 1,
                borderColor: days === opt.value ? Theme.colors.primary : '#E2E8F0' }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: days === opt.value ? '#fff' : Theme.colors.text.secondary }}>
                {opt.label}
              </Text>
            </AnimatedPressableCard>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
              <Text style={{ marginTop: 12, color: Theme.colors.text.secondary }}>Loading vacancies...</Text>
            </View>
          ) : vacancies.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🛏️</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 6 }}>
                No Upcoming Vacancies
              </Text>
              <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, textAlign: 'center', paddingHorizontal: 32 }}>
                No tenants are expected to vacate in the next {days} days.
              </Text>
            </View>
          ) : (
            <>
              <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginBottom: 12 }}>
                {vacancies.length} bed{vacancies.length !== 1 ? 's' : ''} going vacant
              </Text>
              {vacancies.map((v) => {
                const d = daysUntil(v.expected_vacate_date);
                return (
                  <AnimatedPressableCard
                    key={v.s_no}
                    onPress={() => navigation.navigate('TenantDetails', { tenantId: v.s_no })}
                  >
                    <Card style={{ padding: 14, marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '700', color: Theme.colors.text.primary }}>
                            {v.name}
                          </Text>
                          {v.phone_no ? (
                            <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginTop: 2 }}>
                              {v.phone_no}
                            </Text>
                          ) : null}
                        </View>
                        <UrgencyBadge days={d} />
                      </View>

                      <View style={{ flexDirection: 'row', gap: 16, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Theme.colors.border + '30' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>🏠</Text>
                          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
                            Room {v.rooms?.room_no ?? '—'}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>🛏️</Text>
                          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
                            Bed {v.beds?.bed_no ?? '—'}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>📅</Text>
                          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }}>
                            {formatDate(v.expected_vacate_date)}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </AnimatedPressableCard>
                );
              })}
            </>
          )}
        </ScrollView>
      </View>
    </ScreenLayout>
  );
};
