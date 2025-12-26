import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { Card } from '../../components/Card';
import { Theme } from '../../theme';
import { showErrorAlert, showSuccessAlert } from '../../utils/errorHandler';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ScreenLayout } from '../../components/ScreenLayout';
import { ErrorBanner } from '../../components/ErrorBanner';
import { VisitorFormModal } from '../../components/VisitorFormModal';
import { ActionButtons } from '../../components/ActionButtons';
import { Ionicons } from '@expo/vector-icons';
import { CONTENT_COLOR } from '@/constant';
import {
  useLazyGetVisitorsQuery,
  useDeleteVisitorMutation,
} from '../../services/api/visitorsApi';

interface VisitorsScreenProps {
  navigation: any;
}

export const VisitorsScreen: React.FC<VisitorsScreenProps> = ({ navigation }) => {
  const [triggerGetVisitors, { isFetching: isVisitorsFetching }] = useLazyGetVisitorsQuery();
  const [deleteVisitorMutation, { isLoading: isDeleting }] = useDeleteVisitorMutation();

  const [visitors, setVisitors] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any | null>(null);
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastFailedPage, setLastFailedPage] = useState<number | null>(null);
  const [initialLoadCompleted, setInitialLoadCompleted] = useState(false);
  const [visibleItemsCount, setVisibleItemsCount] = useState(0);
  const [visitorModalVisible, setVisitorModalVisible] = useState(false);
  const [selectedVisitorId, setSelectedVisitorId] = useState<number | undefined>();
  
  const flatListRef = React.useRef<any>(null);

  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    setFetchError(null);
    setLastFailedPage(null);
    setInitialLoadCompleted(false);
    loadVisitors(1, true);
  }, [selectedPGLocationId]);

  useFocusEffect(
    React.useCallback(() => {
      if (currentPage === 1) {
        loadVisitors(1, true);
      }
    }, [selectedPGLocationId])
  );

  const loadVisitors = async (page: number, reset: boolean = false) => {
    try {
      if (isPageLoading) return;
      if (!hasMore && !reset) return;
      if (!initialLoadCompleted && !reset && page > 1) return;
      if (lastFailedPage !== null && !reset && page <= lastFailedPage) return;
      
      setCurrentPage(page);
      setIsPageLoading(true);
      
      const params: any = {
        page,
        limit: 20,
      };

      const result = await triggerGetVisitors(params).unwrap();

      const nextVisitors = Array.isArray(result?.data) ? result.data : [];
      if (reset || page === 1) {
        setVisitors(nextVisitors);
      } else {
        setVisitors((prev) => [...prev, ...nextVisitors]);
      }

      setPagination(result?.pagination ?? null);
      setHasMore(result?.pagination ? page < result.pagination.totalPages : false);
      setFetchError(null);
      setLastFailedPage(null);

      if (page === 1) {
        setInitialLoadCompleted(true);
      }
      
      if (flatListRef.current && reset) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      }
    } catch (error: any) {
      console.error('Error loading visitors:', error);

      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to load visitors. Please try again.';

      setFetchError(errorMessage);
      setLastFailedPage(page);

      if (page === 1) {
        setHasMore(false);
        setInitialLoadCompleted(false);
      }
    } finally {
      setIsPageLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    setFetchError(null);
    setLastFailedPage(null);
    setInitialLoadCompleted(false);
    await loadVisitors(1, true);
    setRefreshing(false);
  };

  const loadMoreVisitors = () => {
    if (isPageLoading) return;
    if (!initialLoadCompleted) return;
    if (!hasMore || isVisitorsFetching) return;
    if (lastFailedPage !== null && currentPage + 1 <= lastFailedPage) return;
    
    const nextPage = currentPage + 1;
    loadVisitors(nextPage, false);
  };

  const handleViewableItemsChanged = React.useCallback(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const lastVisibleIndex = viewableItems[viewableItems.length - 1]?.index || 0;
      setVisibleItemsCount(lastVisibleIndex + 1);
    }
  }, []);

  const viewabilityConfig = React.useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }).current;

  const handleDeleteVisitor = (id: number, name: string) => {
    Alert.alert(
      'Delete Visitor',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteVisitorMutation(id).unwrap();
              showSuccessAlert(res);
              setCurrentPage(1);
              setHasMore(true);
              loadVisitors(1, true);
            } catch (error: any) {
              showErrorAlert(error, 'Delete Error');
            }
          },
        },
      ]
    );
  };

  const handleAddVisitor = () => {
    setSelectedVisitorId(undefined);
    setVisitorModalVisible(true);
  };

  const handleEditVisitor = (visitorId: number) => {
    setSelectedVisitorId(visitorId);
    setVisitorModalVisible(true);
  };

  const handleViewVisitor = (visitorId: number) => {
    navigation.navigate('VisitorDetails', { visitorId });
  };

  const handleVisitorFormSuccess = () => {
    // Refresh the visitors list
    setCurrentPage(1);
    setHasMore(true);
    loadVisitors(1, true);
  };

  const handleCloseModal = () => {
    setVisitorModalVisible(false);
    setSelectedVisitorId(undefined);
  };

  const renderVisitorCard = ({ item }: { item: any }) => {
    const visitorName = item?.visitor_name || 'Unknown Visitor';
    const phoneNo = item?.phone_no || 'N/A';
    const purpose = item?.purpose || '';
    const visitedDate = item?.visited_date || '';
    const remarks = item?.remarks || '';
    
    return (
    <Card style={{ 
      marginBottom: 8, 
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Theme.colors.text.primary, marginBottom: 4 }}>
            {visitorName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="call-outline" size={14} color={Theme.colors.text.tertiary} />
            <Text style={{ fontSize: 13, color: Theme.colors.text.tertiary }}>
              {phoneNo}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <ActionButtons
            onView={() => handleViewVisitor(item?.s_no)}
            onEdit={() => handleEditVisitor(item?.s_no)}
            onDelete={() => handleDeleteVisitor(item?.s_no, visitorName)}
            containerStyle={{ gap: 6 }}
          />
        </View>
      </View>

      {/* Purpose and Date */}
      {(purpose || visitedDate) && (
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
          {purpose && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 }}>
              <Ionicons name="document-text-outline" size={14} color={Theme.colors.text.tertiary} />
              <Text style={{ fontSize: 12, color: Theme.colors.text.secondary, flex: 1 }} numberOfLines={1}>
                {purpose}
              </Text>
            </View>
          )}
          {visitedDate && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="calendar-outline" size={14} color={Theme.colors.text.tertiary} />
              <Text style={{ fontSize: 12, color: Theme.colors.text.tertiary }}>
                {new Date(visitedDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                })}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Room & Bed Info */}
      {(item.rooms || item.beds) && (
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
          {item.rooms && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary }}>🏠</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.text.primary }}>
                {item.rooms.room_no}
              </Text>
            </View>
          )}
          {item.beds && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 10, color: Theme.colors.text.tertiary }}>🛏️</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: Theme.colors.text.primary }}>
                {item.beds.bed_no}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Converted Badge */}
      {item.convertedTo_tenant && (
        <View style={{ 
          backgroundColor: '#10B98120', 
          paddingHorizontal: 8, 
          paddingVertical: 4, 
          borderRadius: 6,
          alignSelf: 'flex-start',
          marginBottom: 4,
        }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>
            ✓ CONVERTED TO TENANT
          </Text>
        </View>
      )}

      {/* Remarks */}
      {remarks && (
        <View style={{ 
          marginTop: 8, 
          padding: 8, 
          backgroundColor: '#F9FAFB', 
          borderRadius: 6,
          borderLeftWidth: 2,
          borderLeftColor: Theme.colors.primary,
        }}>
          <Text style={{ fontSize: 11, color: Theme.colors.text.tertiary, marginBottom: 2 }}>Remarks</Text>
          <Text style={{ fontSize: 12, color: Theme.colors.text.secondary }} numberOfLines={2}>
            {remarks}
          </Text>
        </View>
      )}
    </Card>
    );
  };

  return (
    <ScreenLayout backgroundColor={Theme.colors.background.blue}  contentBackgroundColor ={ CONTENT_COLOR}>
      <ScreenHeader 
        title="Visitors" 
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        subtitle={`${pagination?.total || 0} total`}
        showPGSelector={false}
      />

      {/* Scroll Position Indicator */}
      {visibleItemsCount > 0 && (
        <View style={{
          position: 'absolute',
          bottom: 160,
          right: 16,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          zIndex: 1000,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}>
          <Text style={{ 
            fontSize: 12, 
            fontWeight: '700', 
            color: '#fff',
            textAlign: 'center',
          }}>
            {visibleItemsCount} of {pagination?.total || visitors.length}
          </Text>
          <Text style={{ 
            fontSize: 10, 
            color: '#fff',
            opacity: 0.8,
            textAlign: 'center',
            marginTop: 2,
          }}>
            {(pagination?.total || visitors.length) - visibleItemsCount} remaining
          </Text>
        </View>
      )}

      {/* Visitors List */}
      <ErrorBanner
        error={fetchError}
        title="Error Loading Visitors"
        onRetry={() => {
          setCurrentPage(1);
          setHasMore(true);
          setFetchError(null);
          setLastFailedPage(null);
          setInitialLoadCompleted(false);
          loadVisitors(1, true);
        }}
      />

      {(isVisitorsFetching || isPageLoading) && visitors.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={{ marginTop: 16, color: Theme.colors.text.secondary }}>Loading visitors...</Text>
        </View>
      ) : (
        <FlatList
        style={{ backgroundColor : '#ffff'}}
          ref={flatListRef}
          data={visitors}
          renderItem={renderVisitorCard}
          keyExtractor={(item) => item.s_no.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 0 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>👥</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: Theme.colors.text.primary }}>No Visitors Found</Text>
              <Text style={{ fontSize: 14, color: Theme.colors.text.secondary, marginTop: 8 }}>
                Add your first visitor to get started
              </Text>
            </View>
          }
          ListFooterComponent={
            (isVisitorsFetching || isPageLoading || isDeleting) && currentPage > 1 ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={Theme.colors.primary} />
                <Text style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: Theme.colors.text.secondary }}>
                  Loading more...
                </Text>
              </View>
            ) : null
          }
          onEndReached={loadMoreVisitors}
          onEndReachedThreshold={0.5}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      )}

      {/* Floating Add Visitor Button */}
      <TouchableOpacity
        onPress={handleAddVisitor}
        style={{
          position: 'absolute',
          right: 20,
          bottom: 80,
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: Theme.colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 32, fontWeight: '300' }}>+</Text>
      </TouchableOpacity>

      {/* Visitor Form Modal */}
      <VisitorFormModal
        visible={visitorModalVisible}
        onClose={handleCloseModal}
        onSuccess={handleVisitorFormSuccess}
        visitorId={selectedVisitorId}
      />
    </ScreenLayout>
  );
};
