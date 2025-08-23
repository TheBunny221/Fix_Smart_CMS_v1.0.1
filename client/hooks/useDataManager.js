import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setComplaintsList,
  setComplaintDetails,
  updateComplaintInList,
  setServiceRequestsList,
  setServiceRequestDetails,
  setWards,
  setComplaintTypes,
  setComplaintStats,
  setActiveComplaints,
  setRecentUpdates,
  clearStaleData,
  selectComplaintsList,
  selectComplaintDetails,
  selectWards,
  selectComplaintTypes,
  selectComplaintStats,
  selectActiveComplaints,
  selectRecentUpdates,
  selectIsDataFresh,
} from '../store/slices/dataSlice';

export const useDataManager = () => {
  const dispatch = useAppDispatch();

  // Data management functions
  const cacheComplaintsList = useCallback((data) => {
    dispatch(setComplaintsList(data));
  }, [dispatch]);

  const cacheComplaintDetails = useCallback((id, data) => {
    dispatch(setComplaintDetails({ id, data }));
  }, [dispatch]);

  const updateComplaint = useCallback((id, updates) => {
    dispatch(updateComplaintInList({ id, updates }));
  }, [dispatch]);

  const cacheWards = useCallback((data) => {
    dispatch(setWards(data));
  }, [dispatch]);

  const cacheComplaintTypes = useCallback((data) => {
    dispatch(setComplaintTypes(data));
  }, [dispatch]);

  const cacheComplaintStats = useCallback((data) => {
    dispatch(setComplaintStats(data));
  }, [dispatch]);

  const cacheActiveComplaints = useCallback((data) => {
    dispatch(setActiveComplaints(data));
  }, [dispatch]);

  const cacheRecentUpdates = useCallback((data) => {
    dispatch(setRecentUpdates(data));
  }, [dispatch]);

  const clearStale = useCallback(() => {
    dispatch(clearStaleData());
  }, [dispatch]);

  // Data retrieval functions
  const getComplaintsList = useCallback(() => {
    return useAppSelector(selectComplaintsList);
  }, []);

  const getComplaintDetails = useCallback((id) => {
    return useAppSelector(selectComplaintDetails(id));
  }, []);

  const getWards = useCallback(() => {
    return useAppSelector(selectWards);
  }, []);

  const getComplaintTypes = useCallback(() => {
    return useAppSelector(selectComplaintTypes);
  }, []);

  const getComplaintStats = useCallback(() => {
    return useAppSelector(selectComplaintStats);
  }, []);

  const getActiveComplaints = useCallback(() => {
    return useAppSelector(selectActiveComplaints);
  }, []);

  const getRecentUpdates = useCallback(() => {
    return useAppSelector(selectRecentUpdates);
  }, []);

  // Data freshness checking
  const isDataFresh = useCallback((dataPath) => {
    return useAppSelector(selectIsDataFresh(dataPath));
  }, []);

  return {
    // Cache functions
    cacheComplaintsList,
    cacheComplaintDetails,
    updateComplaint,
    cacheWards,
    cacheComplaintTypes,
    cacheComplaintStats,
    cacheActiveComplaints,
    cacheRecentUpdates,
    clearStale,
    
    // Getter functions
    getComplaintsList,
    getComplaintDetails,
    getWards,
    getComplaintTypes,
    getComplaintStats,
    getActiveComplaints,
    getRecentUpdates,
    
    // Utility functions
    isDataFresh,
  };
};

// Hook for status tracking specifically
export const useStatusTracking = () => {
  const dispatch = useAppDispatch();
  const activeComplaints = useAppSelector(selectActiveComplaints);
  const recentUpdates = useAppSelector(selectRecentUpdates);

  const updateStatus = useCallback((complaintId, status, comment?) => {
    // Update the complaint in the centralized store
    dispatch(updateComplaintInList({ 
      id, 
      updates,
        lastUpdated: new Date().toISOString(),
        ...(comment && { latestComment)
      }
    }));

    // Add to recent updates
    const newUpdate = {
      id: `${complaintId}_${Date.now()}`,
      complaintId,
      status,
      comment,
      timestamp: new Date().toISOString(),
    };

    const currentUpdates = recentUpdates?.data || [];
    dispatch(setRecentUpdates([newUpdate, ...currentUpdates.slice(0, 49)])); // Keep last 50 updates
  }, [dispatch, recentUpdates]);

  const getComplaintStatus = useCallback((complaintId) => {
    const complaint = useAppSelector(selectComplaintDetails(complaintId));
    return complaint?.data?.status;
  }, []);

  const getStatusHistory = useCallback((complaintId) => {
    const updates = recentUpdates?.data || [];
    return updates.filter(update => update.complaintId === complaintId);
  }, [recentUpdates]);

  return {
    activeComplaints: activeComplaints?.data || [],
    recentUpdates: recentUpdates?.data || [],
    updateStatus,
    getComplaintStatus,
    getStatusHistory,
  };
};

// Hook for real-time data synchronization
export const useDataSync = () => {
  const { clearStale, isDataFresh } = useDataManager();

  const syncData = useCallback(async () => {
    // Clear stale data first
    clearStale();
    
    // Could trigger refetch of stale data here
    console.log('Data synchronization completed');
  }, [clearStale]);

  const checkDataFreshness = useCallback((paths) => {
    return paths.reduce((acc, path) => {
      acc[path] = isDataFresh(path);
      return acc;
    }, {});
  }, [isDataFresh]);

  return {
    syncData,
    checkDataFreshness,
  };
};
