import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useGetAllOrganizationsQuery } from '../../services/api/organizationApi';
import { Theme } from '../../theme';
import { Card } from '../../components/Card';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';

interface OrganizationsScreenProps {
  navigation: any;
}

export const OrganizationsScreen: React.FC<OrganizationsScreenProps> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedPGLocations, setExpandedPGLocations] = useState<{ [key: number]: boolean }>({});
  const flatListRef = React.useRef<any>(null);

  const {
    data: organizationsResponse,
    isFetching,
    error,
    refetch,
  } = useGetAllOrganizationsQuery({ page: currentPage, limit: 10 });

  const organizations = organizationsResponse?.data ?? [];
  const pagination = organizationsResponse?.pagination ?? null;

  useEffect(() => {
    loadOrganizations(1);
  }, []);

  const loadOrganizations = async (page: number) => {
    try {
      setCurrentPage(page);
      // Scroll to top when page changes
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const togglePGLocations = (orgId: number) => {
    setExpandedPGLocations(prev => ({
      ...prev,
      [orgId]: !prev[orgId]
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= (pagination?.totalPages || 1)) {
      loadOrganizations(page);
    }
  };

  const renderOrganizationCard = ({ item }: any) => (
    <Card style={{ marginBottom: 16, padding: 16 }}>
      {/* Organization Name */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: Theme.colors.text.primary }}>
          {item.name}
        </Text>
        {item.description && (
          <Text style={{ fontSize: 13, color: Theme.colors.text.secondary, marginTop: 4 }}>
            {item.description}
          </Text>
        )}
      </View>

      {/* Stats Row */}
      <View style={{ 
        flexDirection: 'row', 
        marginBottom: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Theme.colors.border,
      }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: Theme.colors.primary }}>
            {item.pg_locations_count}
          </Text>
          <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, marginTop: 2 }}>
            PG Locations
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#10B981' }}>
            {item.admins.length}
          </Text>
          <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, marginTop: 2 }}>
            Admins
          </Text>
        </View>
      </View>

      {/* PG Locations Details - Collapsible */}
      {item.pg_locations && item.pg_locations.length > 0 && (
        <View style={{ marginBottom: 12 }}>
          <TouchableOpacity 
            onPress={() => togglePGLocations(item.s_no)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: Theme.colors.background.secondary,
              borderRadius: 8,
              marginBottom: expandedPGLocations[item.s_no] ? 8 : 0,
            }}
          >
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '600', 
              color: Theme.colors.text.secondary,
            }}>
              🏢 PG Locations ({item.pg_locations.length})
            </Text>
            <Text style={{ 
              fontSize: 16, 
              color: Theme.colors.text.secondary,
              transform: [{ rotate: expandedPGLocations[item.s_no] ? '180deg' : '0deg' }]
            }}>
              ▼
            </Text>
          </TouchableOpacity>

          {/* Expanded PG Locations List */}
          {expandedPGLocations[item.s_no] && item.pg_locations.map((pg: any, index: number) => (
            <View 
              key={pg.s_no}
              style={{ 
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: Theme.colors.background.secondary,
                borderRadius: 8,
                marginBottom: index < item.pg_locations.length - 1 ? 8 : 0,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary }}>
                {pg.location_name}
              </Text>
              <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginTop: 2 }}>
                📍 {pg.address}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 6, gap: 12 }}>
                <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>
                  🏠 {pg.rooms_count} Rooms
                </Text>
                <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary }}>
                  🛏️ {pg.beds_count} Beds
                </Text>
                <View style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 8,
                  backgroundColor: pg.status === 'ACTIVE' ? '#10B98120' : '#EF444420',
                }}>
                  <Text style={{
                    fontSize: 9,
                    fontWeight: '600',
                    color: pg.status === 'ACTIVE' ? '#10B981' : '#EF4444',
                  }}>
                    {pg.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Admins List */}
      {item.admins.length > 0 && (
        <View>
          <Text style={{ 
            fontSize: 12, 
            fontWeight: '600', 
            color: Theme.colors.text.secondary,
            marginBottom: 8 
          }}>
            Admin Users:
          </Text>
          {item.admins.map((admin: any, index: number) => (
            <View 
              key={admin.s_no}
              style={{ 
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 12,
                backgroundColor: Theme.colors.background.secondary,
                borderRadius: 8,
                marginBottom: index < item.admins.length - 1 ? 8 : 0,
              }}
            >
              {/* Avatar */}
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: Theme.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                  {admin.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              {/* Admin Info */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Theme.colors.text.primary }}>
                  {admin.name}
                </Text>
                <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, marginTop: 2 }}>
                  {admin.email}
                </Text>
                {admin.phone && (
                  <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary, marginTop: 1 }}>
                    📞 {admin.phone}
                  </Text>
                )}
              </View>

              {/* Status Badge */}
              <View style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: admin.status === 'ACTIVE' ? '#10B98120' : '#EF444420',
              }}>
                <Text style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: admin.status === 'ACTIVE' ? '#10B981' : '#EF4444',
                }}>
                  {admin.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* No Admins Message */}
      {item.admins.length === 0 && (
        <View style={{
          padding: 12,
          backgroundColor: '#FEF3C7',
          borderRadius: 8,
          borderLeftWidth: 3,
          borderLeftColor: '#F59E0B',
        }}>
          <Text style={{ fontSize: 12, color: '#92400E' }}>
            ⚠️ No admin users assigned to this organization
          </Text>
        </View>
      )}

      {/* Created Date */}
      <Text style={{ 
        fontSize: 11, 
        color: Theme.colors.text.tertiary, 
        marginTop: 12,
        textAlign: 'right' 
      }}>
        Created: {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </Card>
  );

  const renderPageNumbers = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pages = [];
    const totalPages = pagination.totalPages;
    const current = currentPage;

    // Show max 5 page numbers
    let startPage = Math.max(1, current - 2);
    let endPage = Math.min(totalPages, current + 2);

    // Adjust if at the beginning or end
    if (current <= 3) {
      endPage = Math.min(5, totalPages);
    }
    if (current >= totalPages - 2) {
      startPage = Math.max(1, totalPages - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        gap: 8,
      }}>
        {/* Previous Button */}
        <TouchableOpacity
          onPress={() => goToPage(current - 1)}
          disabled={current === 1}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: current === 1 ? '#E5E7EB' : Theme.colors.primary,
          }}
        >
          <Text style={{ 
            color: current === 1 ? '#9CA3AF' : '#fff', 
            fontWeight: '600',
            fontSize: 14,
          }}>
            ← Prev
          </Text>
        </TouchableOpacity>

        {/* First Page */}
        {startPage > 1 && (
          <>
            <TouchableOpacity
              onPress={() => goToPage(1)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: Theme.colors.text.primary, fontWeight: '600' }}>1</Text>
            </TouchableOpacity>
            {startPage > 2 && <Text style={{ color: Theme.colors.text.tertiary }}>...</Text>}
          </>
        )}

        {/* Page Numbers */}
        {pages.map((page) => (
          <TouchableOpacity
            key={page}
            onPress={() => goToPage(page)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: page === current ?'#F3F4F6' : Theme.colors.primary ,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ 
              color: page === current ? Theme.colors.text.primary : '#fff' , 
              fontWeight: '600' 
            }}>
              {page}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Last Page */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <Text style={{ color: Theme.colors.text.tertiary }}>...</Text>}
            <TouchableOpacity
              onPress={() => goToPage(totalPages)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: Theme.colors.text.primary, fontWeight: '600' }}>{totalPages}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Next Button */}
        <TouchableOpacity
          onPress={() => goToPage(current + 1)}
          disabled={current === totalPages}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: current === totalPages ? '#E5E7EB' : Theme.colors.primary,
          }}
        >
          <Text style={{ 
            color: current === totalPages ? '#9CA3AF' : '#fff', 
            fontWeight: '600',
            fontSize: 14,
          }}>
            Next →
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => {
    if (isFetching) return null;
    return (
      <View style={{ 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center',
        paddingVertical: 60 
      }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🏢</Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary }}>
          No Organizations Found
        </Text>
        <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginTop: 8 }}>
          Organizations will appear here once created
        </Text>
      </View>
    );
  };

  return (
    <ScreenLayout>
      <ScreenHeader 
        title="Organizations"
        subtitle="Manage all organizations"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      {error && (
        <View style={{
          margin: 16,
          padding: 12,
          backgroundColor: '#FEE2E2',
          borderRadius: 8,
          borderLeftWidth: 3,
          borderLeftColor: '#EF4444',
        }}>
          <Text style={{ fontSize: 12, color: '#991B1B' }}>
            ❌ {'Failed to load organizations'}
          </Text>
        </View>
      )}

      {isFetching && organizations.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>
            Loading organizations...
          </Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={organizations}
          renderItem={renderOrganizationCard}
          keyExtractor={(item) => item.s_no.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 0 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Theme.colors.primary]}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Page Navigation */}
      {!isFetching && organizations.length > 0 && renderPageNumbers()}

      {/* Pagination Info */}
      {pagination && organizations.length > 0 && (
        <View style={{
          padding: 12,
          backgroundColor: Theme.colors.background.secondary,
          borderTopWidth: 1,
          borderTopColor: Theme.colors.border,
        }}>
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, textAlign: 'center' }}>
            Page {currentPage} of {pagination.totalPages} • Total: {pagination.total} organizations
          </Text>
        </View>
      )}
    </ScreenLayout>
  );
};
