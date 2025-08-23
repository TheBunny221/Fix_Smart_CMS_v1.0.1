import React, { useEffect } from 'react';
import { useStatusTracking, useDataSync } from '../hooks/useDataManager';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Clock, AlertCircle, CheckCircle, FileText } from 'lucide-react';



const StatusTracker: React.FC = ({ 
  complaintId, 
  showAll = false, 
  maxItems = 10 
}) => {
  const { 
    activeComplaints, 
    recentUpdates, 
    getStatusHistory 
  } = useStatusTracking();
  const { syncData } = useDataSync();

  // Auto-sync data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      syncData();
    }, 30000);

    return () => clearInterval(interval);
  }, [syncData]);

  const getStatusColor = (status) => {
    switch (status.toUpperCase()) {
      case 'REGISTERED':
        return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-orange-100 text-orange-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      case 'REOPENED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toUpperCase()) {
      case 'REGISTERED':
        return ;
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return ;
      case 'RESOLVED':
      case 'CLOSED':
        return ;
      case 'REOPENED':
        return ;
      default:
        return ;
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins 
        
          Status History
        
        
          No status updates available
        
      
    );
  }

  return ({complaintId ? 'Status History' )}
        
      
      
        
          
            {updatesToShow.length === 0 ? (
              No updates available
            ) : (
              updatesToShow.map((update, index) => (
                
                  
                    {getStatusIcon(update.status)}
                  
                  
                    
                      
                        {update.status.replace('_', ' ')}
                      
                      
                        {formatTimestamp(update.timestamp)}
                      
                    
                    {complaintId && (
                      
                        Complaint #{update.complaintId?.slice(-6)}
                      
                    )}
                    {update.comment && (
                      
                        {update.comment}
                      
                    )}
                  
                
              ))
            )}
          
        
        
        {showAll && recentUpdates.length > maxItems && (
          
            
              Showing {Math.min(maxItems, updatesToShow.length)} of {recentUpdates.length} updates
            
          
        )}
      
    
  );
};

// Active complaints overview component
export const ActiveComplaintsTracker: React.FC = () => {
  const { activeComplaints } = useStatusTracking();

  const getComplaintCount = (status) => {
    return activeComplaints.filter(complaint => complaint.status === status).length;
  };

  const statusCounts = [
    { status: 'REGISTERED', label: 'Registered', color: 'bg-yellow-100 text-yellow-800' },
    { status: 'ASSIGNED', label: 'Assigned', color: 'bg-blue-100 text-blue-800' },
    { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-orange-100 text-orange-800' },
    { status: 'RESOLVED', label: 'Resolved', color: 'bg-green-100 text-green-800' },
  ];

  return (
    
      
        
          
          Active Complaints Overview
        
      
      
        
          {statusCounts.map(({ status, label, color }) => {
            const count = getComplaintCount(status);
            return (
              
                
                  {label}
                
                {count}
              
            );
          })}
        
        
          
            Total Active:
            {activeComplaints.length}
          
        
      
    
  );
};

export default StatusTracker;
