// Updated interface to include comparison data for trend analysis
export interface AnalyticsData {
  complaints: {
    total: number;
    resolved: number;
    pending: number;
    overdue: number;
  };
  sla: {
    compliance: number;
    avgResolutionTime: number;
    target: number;
  };
  trends: Array<{
    date: string;
    complaints: number;
    resolved: number;
    slaCompliance: number;
  }>;
  wards: Array<{
    id: string;
    name: string;
    complaints: number;
    resolved: number;
    avgTime: number;
    slaScore: number;
  }>;
  categories: Array<{
    name: string;
    count: number;
    avgTime: number;
    color: string;
  }>;
  performance: {
    userSatisfaction: number;
    escalationRate: number;
    firstCallResolution: number;
    repeatComplaints: number;
  };
  comparison?: {
    current: {
      total: number;
      resolved: number;
      pending: number;
      overdue: number;
      slaCompliance: number;
      avgResolutionTime: number;
    };
    previous: {
      total: number;
      resolved: number;
      pending: number;
      overdue: number;
      slaCompliance: number;
      avgResolutionTime: number;
      userSatisfaction: number;
    };
    trends: {
      totalComplaints: string;
      resolvedComplaints: string;
      slaCompliance: string;
      avgResolutionTime: string;
      userSatisfaction: string;
    };
  };
}

export interface FilterOptions {
  dateRange: {
    from: string;
    to: string;
  };
  ward: string;
  complaintType: string;
  status: string;
  priority: string;
}
