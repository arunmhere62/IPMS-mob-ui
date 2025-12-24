import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setSelectedPGLocation } from '../store/slices/pgLocationSlice';
import { Theme } from '../theme';
import { useGetPGLocationsQuery } from '../services/api/pgLocationsApi';
import type { PGLocation } from '../types';

export const PGLocationSelector: React.FC = () => {
  const dispatch = useDispatch();
  const { selectedPGLocationId } = useSelector((state: RootState) => state.pgLocations);
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const [isOpen, setIsOpen] = useState(false);

  const {
    data: pgLocationsResponse,
    isFetching,
    isLoading,
    isUninitialized,
    isError,
    error,
  } = useGetPGLocationsQuery(undefined, {
    skip: false,
  });

  const safeLocations: PGLocation[] = Array.isArray(pgLocationsResponse)
    ? (pgLocationsResponse as PGLocation[])
    : Array.isArray((pgLocationsResponse as any)?.data)
      ? ((pgLocationsResponse as any).data as PGLocation[])
      : [];

  useEffect(() => {
    console.log('pgLocations query status', {
      skip: false,
      isUninitialized,
      isLoading,
      isFetching,
      isError,
      selectedPGLocationId,
      receivedCount: safeLocations.length,
      error,
      hasAccessToken: !!accessToken,
      hasUserId: !!user?.s_no,
      hasOrganizationId: !!user?.organization_id,
      rawResponse: pgLocationsResponse,
    });
  }, [accessToken, error, isError, isFetching, isLoading, isUninitialized, safeLocations.length, selectedPGLocationId, user?.organization_id, user?.s_no, pgLocationsResponse]);

  useEffect(() => {
    if (!selectedPGLocationId && safeLocations.length > 0) {
      dispatch(setSelectedPGLocation(safeLocations[0].s_no));
    }
  }, [dispatch, safeLocations, selectedPGLocationId]);

  const handleLocationChange = (locationId: number) => {
    dispatch(setSelectedPGLocation(locationId));
    setIsOpen(false); // Close dropdown after selection
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const selectedLocation = safeLocations.find((loc) => loc.s_no === selectedPGLocationId);

  // Don't render if no locations
  if (safeLocations.length === 0) {
    return (
      <View style={styles.singleLocationContainer}>
        <Text style={styles.singleLocationLabel}>PG Location</Text>
        <Text style={[styles.singleLocationText, { fontSize: 13, opacity: 0.7 }]}> 
          {isFetching ? 'Loading locations...' : 'No locations found'}
        </Text>
      </View>
    );
  }

  if (safeLocations.length === 1) {
    // If only one location, just display it (no dropdown needed)
    return (
      <View style={styles.singleLocationContainer}>
        <Text style={styles.singleLocationLabel}>PG Location</Text>
        <Text style={styles.singleLocationText}>{safeLocations[0].location_name}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>PG Location</Text>
      
      {/* Selected Item / Dropdown Trigger */}
      <TouchableOpacity 
        style={styles.selectButton}
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <View style={styles.selectContent}>
          <Text style={styles.selectText}>
            {selectedLocation?.location_name || 'Select a location'}
          </Text>
          {selectedLocation?.address && (
            <Text style={styles.selectSubtext} numberOfLines={1}>
              {selectedLocation.address}
            </Text>
          )}
        </View>
        <Text style={[styles.arrow, isOpen && styles.arrowOpen]}>▼</Text>
      </TouchableOpacity>

      {/* Dropdown Options */}
      {isOpen && (
        <>
          <TouchableOpacity 
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setIsOpen(false)}
          />
          <View style={styles.dropdownContainer}>
            <FlatList
              data={safeLocations}
              keyExtractor={(item) => item.s_no.toString()}
              style={styles.scrollView}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              bounces={false}
              renderItem={({ item: location, index }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    selectedPGLocationId === location.s_no && styles.selectedOption,
                    index === safeLocations.length - 1 && styles.lastOption,
                  ]}
                  onPress={() => handleLocationChange(location.s_no)}
                >
                  <View style={styles.optionContent}>
                    <Text
                      style={[
                        styles.optionText,
                        selectedPGLocationId === location.s_no && styles.selectedOptionText,
                      ]}
                    >
                      {location.location_name}
                    </Text>
                    {location.address && (
                      <Text
                        style={[
                          styles.optionSubtext,
                          selectedPGLocationId === location.s_no && styles.selectedOptionSubtext,
                        ]}
                        numberOfLines={1}
                      >
                        {location.address}
                      </Text>
                    )}
                  </View>
                  {selectedPGLocationId === location.s_no && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    position: 'relative',
    zIndex: 1000,
  },
  label: {
    color: Theme.withOpacity(Theme.colors.text.inverse, 0.95),
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectContent: {
    flex: 1,
    paddingRight: 8,
  },
  selectText: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 1,
  },
  selectSubtext: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 1,
  },
  arrow: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: 'bold',
    transform: [{ rotate: '0deg' }],
  },
  arrowOpen: {
    transform: [{ rotate: '180deg' }],
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: -1000,
    right: -1000,
    bottom: -1000,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  dropdownContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(65, 65, 65, 0.3)',
    position: 'absolute',
    top: 68,
    left: 0,
    right: 0,
    zIndex: 1001,
    maxHeight: 250,
  },
  scrollView: {
    maxHeight: 250,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: 'transparent',
  },
  selectedOption: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  optionContent: {
    flex: 1,
    paddingRight: 8,
  },
  optionText: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 1,
  },
  selectedOptionText: {
    fontWeight: '700',
    color: '#1E40AF',
  },
  optionSubtext: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 1,
    lineHeight: 15,
  },
  selectedOptionSubtext: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  checkmark: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: 'bold',
  },
  singleLocationContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  singleLocationLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  singleLocationText: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '600',
  },
});
