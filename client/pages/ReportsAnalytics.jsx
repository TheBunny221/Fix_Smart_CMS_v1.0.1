import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  CalendarDays,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Users,
  Zap,
  Filter,
  RefreshCw,
  Share2,
} from "lucide-react";
import { showSuccessToast, showErrorToast } from "../store/slices/uiSlice";

;
  sla: {
    compliance;
    avgResolutionTime;
    target;
  };
  trends: Array;
  wards: Array;
  categories: Array;
  performance: Array;
}

const ReportsAnalytics: React.FC = () => {
  const dispatch = useAppDispatch();
  const { translations } = useAppSelector((state) => state.language);
  const [dateRange, setDateRange] = useState("30d");
  const [selectedWard, setSelectedWard] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  // Mock analytics data
  const [analyticsData] = useState({
    complaints,
      resolved,
      pending,
      overdue,
    },
    sla: {
      compliance: 87.6,
      avgResolutionTime: 2.3,
      target: 3.0,
    },
    trends: [
      { date: "2024-01", complaints, resolved, slaCompliance: 85 },
      { date: "2024-02", complaints, resolved, slaCompliance: 88 },
      { date: "2024-03", complaints, resolved, slaCompliance: 92 },
      { date: "2024-04", complaints, resolved, slaCompliance: 89 },
      { date: "2024-05", complaints, resolved, slaCompliance: 87 },
      { date: "2024-06", complaints, resolved, slaCompliance: 91 },
    ],
    wards: [
      {
        id: "ward1",
        name: "Ward 1 - Central",
        complaints,
        resolved,
        avgTime: 2.1,
        slaScore,
        coordinates: { lat: 9.9312, lng: 76.2673 },
      },
      {
        id: "ward2",
        name: "Ward 2 - North",
        complaints,
        resolved,
        avgTime: 2.8,
        slaScore,
        coordinates: { lat: 9.9816, lng: 76.2999 },
      },
      {
        id: "ward3",
        name: "Ward 3 - South",
        complaints,
        resolved,
        avgTime: 3.2,
        slaScore,
        coordinates: { lat: 9.8997, lng: 76.2749 },
      },
    ],
    categories: [
      { name: "Water Supply", count, avgTime: 2.1, color: "#3B82F6" },
      { name: "Electricity", count, avgTime: 1.8, color: "#EF4444" },
      { name: "Road Repair", count, avgTime: 4.2, color: "#10B981" },
      { name: "Garbage", count, avgTime: 1.5, color: "#F59E0B" },
      { name: "Street Lighting", count, avgTime: 2.3, color: "#8B5CF6" },
    ],
    performance: [
      { metric: "Response Time", current: 2.3, target: 4.0, change: -12 },
      { metric: "Resolution Rate", current: 87.6, target: 85.0, change: 8 },
      { metric: "Citizen Satisfaction", current: 4.2, target: 4.0, change: 5 },
      { metric: "SLA Compliance", current: 89.2, target: 85.0, change: 3 },
    ],
  });

  const exportReport = async (format) => {
    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const fileName = `complaint-report-${dateRange}.${format}`;
      dispatch(
        showSuccessToast("Export Successful", `Report exported as ${fileName}`),
      );
    } catch (error) {
      dispatch(showErrorToast("Export Failed", "Failed to export report"));
    } finally {
      setIsExporting(false);
    }
  };

  const generateHeatmapData = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const hours = Array.from({ length, (_, i) => i);

    return days.flatMap((day, dayIndex) =>
      hours.map((hour) => ({
        day,
        hour,
        value) * 50) + 1,
        dayName,
      })),
    );
  };

  const heatmapData = generateHeatmapData();

  const HeatmapCell = ({ x, y, width, height, value }) => {
    const intensity = Math.min(value / 50, 1);
    return (
      
    );
  };

  return (
    
      {/* Header */}
      
        
          
            {translations?.admin?.reportsAnalytics || "Reports & Analytics"}
          
          
            Comprehensive insights and performance metrics
          
        

        
          
            
              
            
            
              Last 7 days
              Last 30 days
              Last 90 days
              Last year
            
          

          
            
            Refresh
          

           exportReport(value)}
          >
            
              
            
            
              PDF Report
              Excel File
              CSV Data
            
          
        
      

      {/* Key Metrics */}
      
        
          
            
              Total Complaints
            
            
          
          
            
              {analyticsData.complaints.total}
            
            
              +12% from last month
            
          
        

        
          
            
              Resolution Rate
            
            
          
          
            
              {(
                (analyticsData.complaints.resolved /
                  analyticsData.complaints.total) *
                100
              ).toFixed(1)}
              %
            
            +5% improvement
          
        

        
          
            
              Avg Resolution Time
            
            
          
          
            
              {analyticsData.sla.avgResolutionTime}d
            
            
              Target: {analyticsData.sla.target}d
            
          
        

        
          
            
              SLA Compliance
            
            
          
          
            
              {analyticsData.sla.compliance}%
            
            Above target (85%)
          
        
      

      {/* Main Analytics */}
      
        
          Overview
          Trends
          Heatmap
          Performance
          Ward Analysis
          Categories
        

        
          
            {/* Complaint Trends */}
            
              
                Complaint Trends (6 Months)
              
              
                
                  
                    
                    
                    
                    
                    
                    
                    
                    
                    
                  
                
              
            

            {/* Category Distribution */}
            
              
                Complaints by Category
              
              
                
                  
                    
                      {analyticsData.categories.map((entry, index) => (
                        
                      ))}
                    
                    
                  
                
                
                  {analyticsData.categories.map((category, index) => (
                    
                      
                        
                        {category.name}
                      
                      
                        {category.count} ({category.avgTime}d avg)
                      
                    
                  ))}
                
              
            
          

          {/* Performance Metrics */}
          
            
              Key Performance Indicators
            
            
              
                {analyticsData.performance.map((metric, index) => (
                  
                    
                      
                        {metric.metric}
                      
                      
                        {metric.change > 0 ? (
                          
                        ) : (
                          
                        )}
                         0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {Math.abs(metric.change)}%
                        
                      
                    
                    
                      
                        Current: {metric.current}
                        Target: {metric.target}
                      
                      
                        
                      
                    
                  
                ))}
              
            
          
        

        
          
            
              Detailed Trend Analysis
            
            
              
                
                  
                  
                  
                  
                  
                  
                  
                
              
            
          
        

        
          
            
              Complaint Activity Heatmap
              
                Peak hours and days for complaint submissions
              
            
            
              
                
                  Days of Week vs Hours
                  
                    Low
                    
                    High
                  
                

                
                  
                    
                    
                        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][value]
                      }
                    />
                     {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return ({data.dayName} {data.hour});
                        }
                        return null;
                      }}
                    />
                    
                  
                
              
            
          
        

        
          
            
              
                SLA Performance Over Time
              
              
                
                  
                    
                    
                    
                    
                    
                  
                
              
            

            
              
                Resolution Time Distribution
              
              
                
                  {[
                    { range: " 5 days", count, percentage: 2 },
                  ].map((item, index) => (
                    
                      
                        
                          {item.range}
                        
                        
                          {item.count} ({item.percentage}%)
                        
                      
                      
                        
                      
                    
                  ))}
                
              
            
          
        

        
          
            
              Ward Performance Comparison
            
            
              
                
                  
                  
                  
                  
                  
                  
                  
                  
                  
                
              
            
          
        

        
          
            
              Category Analysis
            
            
              
                
                  
                  
                  
                  
                  
                  
                  
                  
                
              
            
          
        
      

      {/* Export Status */}
      {isExporting && (
        
          
            
              
                
                
                  Generating Report
                  
                    Please wait while we compile your analytics data...
                  
                
              
            
          
        
      )}
    
  );
};

export default ReportsAnalytics;
