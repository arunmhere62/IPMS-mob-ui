# PG Location Selection Flow

## 🎯 Core Principle
**No PG-dependent API calls are made until PG location is fetched AND selected.**

## 📋 Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Logs In                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Initialize Dashboard                                │
│  ├─ Fetch PG Locations API                                   │
│  ├─ Wait for response                                        │
│  └─ Store in Redux: pgLocations.locations[]                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Auto-select First PG Location                       │
│  ├─ Check: locations.length > 0 && !selectedPGLocationId    │
│  ├─ Dispatch: setSelectedPGLocation(locations[0].s_no)      │
│  └─ Update Redux: pgLocations.selectedPGLocationId          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Load All Dashboard Data (Parallel)                 │
│  ├─ Summary API                                              │
│  ├─ Financial Analytics API                                  │
│  ├─ Tenant Rent Status API                                   │
│  ├─ Tenants without Advance API                              │
│  ├─ Fetch Tenants (Redux)                                    │
│  └─ Fetch Payments (Redux)                                   │
│                                                               │
│  All requests include: x-pg-location-id header               │
└─────────────────────────────────────────────────────────────┘
```

## 🛡️ Protection Mechanisms

### 1. **Dashboard useEffect Guards**
```typescript
// Step 1: Fetch PG locations on mount
useEffect(() => {
  setIsMounted(true);
  initializeDashboard(); // Only fetches PG locations
}, []);

// Step 2: Auto-select when locations loaded
useEffect(() => {
  if (locations.length > 0 && !selectedPGLocationId) {
    dispatch(setSelectedPGLocation(locations[0].s_no));
  }
}, [locations, selectedPGLocationId]);

// Step 3: Load data ONLY after PG selected
useEffect(() => {
  if (selectedPGLocationId) {
    loadAllDashboardData(); // All PG-dependent APIs
  }
}, [selectedPGLocationId, selectedMonths]);
```

### 2. **RTK Query Base Guard**
```typescript
// In baseApi.ts
const needsPgHeader = (url?: string) => {
  if (!url) return false;
  const path = (url.split('?')[0] || '').toString();
  return /^\/(tenants|rooms|beds|advance-payments|...)/.test(path);
};

// Block request if PG header required but not present
if (needsPgHeader(config.url) && !hasPgHeader) {
  console.error('❌ API call blocked - No PG Location selected:', config.url);
  return Promise.reject(new Error('⚠️ Please select a PG location first'));
}
```

### 3. **Function-level Guards**
```typescript
const loadAllDashboardData = async () => {
  if (!selectedPGLocationId) {
    console.warn('⚠️ Cannot load dashboard data: No PG location selected');
    return; // Early exit
  }
  
  // Safe to proceed with API calls
  await Promise.all([...]);
};
```

## 📊 API Call Sequence

### ✅ Correct Sequence
```
1. fetchPGLocations()           → No PG header needed
2. setSelectedPGLocation(id)    → Updates Redux state
3. loadSummary(id)              → Has PG header ✓
4. loadFinancialAnalytics(id)   → Has PG header ✓
5. loadTenantRentStatus(id)     → Has PG header ✓
```

### ❌ Incorrect Sequence (Prevented)
```
1. loadSummary()                → ❌ Blocked: No PG header
2. fetchPGLocations()           → Too late!
3. setSelectedPGLocation(id)    → Too late!
```

## 🔍 Console Logs

### Expected Log Sequence
```
📍 Step 1: Fetching PG locations...
✅ PG locations fetched successfully
✅ Auto-selecting first PG location: My PG Location
🚀 PG Location selected, loading dashboard data...
📊 Loading dashboard data for PG: 123
📍 PG Location header added: 123 for /pg-locations/123/summary
📍 PG Location header added: 123 for /pg-locations/123/financial-analytics
📍 PG Location header added: 123 for /pg-locations/123/tenant-rent-status
📍 PG Location header added: 123 for /tenants
✅ Dashboard data loaded successfully
```

### Error Logs (If Something Goes Wrong)
```
❌ API call blocked - No PG Location selected: /tenants
⚠️ Cannot load dashboard data: No PG location selected
```

## 🔄 Refresh Flow

```typescript
const onRefresh = async () => {
  setRefreshing(true);
  
  if (selectedPGLocationId) {
    // PG already selected, just refresh data
    await loadAllDashboardData();
  } else {
    // No PG selected, fetch locations again
    await initializeDashboard();
  }
  
  setRefreshing(false);
};
```

## 🎨 UI States

### 1. **Initial Loading** (No PG selected)
```
┌─────────────────────────────────┐
│  Dashboard                       │
│  ┌─────────────────────────────┐│
│  │  Loading PG Locations...    ││
│  │  [Spinner]                  ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

### 2. **PG Selected, Loading Data**
```
┌─────────────────────────────────┐
│  Dashboard                       │
│  [PG Selector: My PG Location]  │
│  ┌─────────────────────────────┐│
│  │  Loading Dashboard...       ││
│  │  [Skeleton Cards]           ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

### 3. **Data Loaded**
```
┌─────────────────────────────────┐
│  Dashboard                       │
│  [PG Selector: My PG Location]  │
│  ┌─────────────────────────────┐│
│  │  Summary Card               ││
│  │  Financial Analytics        ││
│  │  Rent Status                ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

## 🚨 Common Issues & Solutions

### Issue 1: "400 Bad Request - Missing PG Location"
**Cause**: API called before PG location selected  
**Solution**: Check useEffect dependencies, ensure `selectedPGLocationId` is in dependency array

### Issue 2: "Multiple API calls on mount"
**Cause**: Multiple useEffect hooks triggering simultaneously  
**Solution**: Consolidate into single useEffect with proper guards

### Issue 3: "PG location not persisting"
**Cause**: Redux state not properly updated  
**Solution**: Verify `setSelectedPGLocation` action is dispatched

## ✅ Best Practices

1. **Always check `selectedPGLocationId` before PG-dependent API calls**
   ```typescript
   if (!selectedPGLocationId) return;
   ```

2. **Use proper useEffect dependencies**
   ```typescript
   useEffect(() => {
     if (selectedPGLocationId) {
       loadData();
     }
   }, [selectedPGLocationId]); // Include in deps
   ```

3. **Add console logs for debugging**
   ```typescript
   console.log('📍 PG Location:', selectedPGLocationId);
   console.log('🚀 Loading data...');
   ```

4. **Handle loading states properly**
   ```typescript
   if (!isMounted) return <LoadingScreen />;
   if (!selectedPGLocationId) return <SelectPGPrompt />;
   ```

5. **Use RTK Query guard for global protection**
   - Already implemented in `src/services/api/baseApi.ts`
   - Blocks all PG-dependent APIs automatically

## 📈 Performance Benefits

- ✅ **Zero 400 errors** from missing PG location
- ✅ **Faster initial load** (sequential, not parallel chaos)
- ✅ **Better UX** (proper loading states)
- ✅ **Easier debugging** (clear console logs)
- ✅ **Maintainable code** (single source of truth)

---

**Last Updated**: Nov 5, 2025  
**Pattern**: Sequential Loading with Guards  
**Status**: Production Ready ✅
