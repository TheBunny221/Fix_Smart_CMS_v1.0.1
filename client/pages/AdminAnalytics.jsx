import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  Users,
  Clock,
  Target,
  MapPin,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";

const AdminAnalytics: React.FC = () => {
  // Mock data for charts
  const complaintTrends = [
    { month: "Jan", complaints, resolved, satisfaction: 4.2 },
    { month: "Feb", complaints, resolved, satisfaction: 4.1 },
    { month: "Mar", complaints, resolved, satisfaction: 4.3 },
    { month: "Apr", complaints, resolved, satisfaction: 4.5 },
    { month: "May", complaints, resolved, satisfaction: 4.2 },
    { month: "Jun", complaints, resolved, satisfaction: 4.4 },
  ];

  const wardPerformance = [
    {
      ward: "Ward 1",
      complaints,
      resolved,
      efficiency,
      avgTime: 2.1,
    },
    {
      ward: "Ward 2",
      complaints,
      resolved,
      efficiency,
      avgTime: 2.3,
    },
    {
      ward: "Ward 3",
      complaints,
      resolved,
      efficiency,
      avgTime: 2.8,
    },
    {
      ward: "Ward 4",
      complaints,
      resolved,
      efficiency,
      avgTime: 1.9,
    },
    {
      ward: "Ward 5",
      complaints,
      resolved,
      efficiency,
      avgTime: 2.5,
    },
  ];

  const complaintTypes = [
    { name: "Water Supply", value, color: "#3B82F6", resolved: 32 },
    { name: "Electricity", value, color: "#EF4444", resolved: 25 },
    { name: "Road Repair", value, color: "#10B981", resolved: 20 },
    { name: "Garbage", value, color: "#F59E0B", resolved: 14 },
  ];

  const resolutionTimes = [
    { timeRange: " 7 days", count, percentage: 5 },
  ];

  const teamEfficiency = [
    { team: "Electrical", efficiency, workload, satisfaction: 4.6 },
    { team: "Water Works", efficiency, workload, satisfaction: 4.3 },
    {
      team: "Road Maintenance",
      efficiency,
      workload,
      satisfaction: 4.1,
    },
    { team: "Sanitation", efficiency, workload, satisfaction: 4.7 },
  ];

  return (
    
      {/* Header */}
      
        
          System Analytics
          Comprehensive analytics and insights
        
        
          
            
            Refresh Data
          
          
            
            Export Report
          
        
      

      {/* Key Metrics */}
      
        
          
            
              
                
                  Total Complaints
                
                1,247
                ↑ 12% from last month
              
              
            
          
        
        
          
            
              
                
                  Resolution Rate
                
                92.3%
                ↑ 3% from last month
              
              
            
          
        
        
          
            
              
                
                  Avg Resolution
                
                2.3 days
                ↓ 0.5 days improved
              
              
            
          
        
        
          
            
              
                
                  Satisfaction
                
                4.3/5
                ↑ 0.2 points
              
              
            
          
        
      

      {/* Analytics Tabs */}
      
        
          Trends
          Performance
          Complaint Types
          Team Analytics
        

        
          
            {/* Complaint Trends */}
            
              
                Monthly Complaint Trends
              
              
                
                  
                    
                    
                    
                     [
                        value,
                        name === "complaints"
                          ? "Complaints"
                           === "resolved"
                            ? "Resolved"
                            ,
                      ]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    
                    
                  
                
              
            

            {/* Satisfaction Trends */}
            
              
                Citizen Satisfaction Trends
              
              
                
                  
                    
                    
                    
                     [
                        `${value}/5`,
                        "Satisfaction Score",
                      ]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    
                  
                
              
            
          

          {/* Resolution Time Distribution */}
          
            
              Resolution Time Distribution
            
            
              
                {resolutionTimes.map((item, index) => (
                  
                    
                      
                        {item.timeRange}
                      
                      
                      
                        {item.count} cases
                      
                    
                  
                ))}
              
            
          
        

        
          
            {/* Ward Performance */}
            
              
                Ward Performance Comparison
              
              
                
                  
                    
                    
                    
                     [`${value}%`, "Efficiency"]}
                      labelFormatter={(label) => `Ward: ${label}`}
                    />
                    
                  
                
              
            

            {/* Ward Details */}
            
              
                Ward Performance Details
              
              
                
                  {wardPerformance.map((ward, index) => ({ward.ward}
                        = 95
                              ? "bg-green-100 text-green-800"
                              ))}
                
              
            
          
        

        
          
            {/* Complaint Types Distribution */}
            
              
                Complaint Types Distribution
              
              
                
                  
                    
                      {complaintTypes.map((entry, index) => (
                        
                      ))}
                    
                     [
                        `${value} complaints`,
                        "Count",
                      ]}
                      labelFormatter={(label) => `Type: ${label}`}
                    />
                  
                
                
                  {complaintTypes.map((item, index) => (
                    
                      
                      {item.name}
                    
                  ))}
                
              
            

            {/* Type Performance */}
            
              
                Resolution Performance by Type
              
              
                
                  {complaintTypes.map((type, index) => (
                    
                      
                        {type.name}
                        
                          {type.resolved}/{type.value} (
                          {Math.round((type.resolved / type.value) * 100)}%)
                        
                      
                      
                    
                  ))}
                
              
            
          
        

        
          
            
              
                
                Team Efficiency Analytics
              
            
            
              
                {teamEfficiency.map((team, index) => ({team.team}
                    
                      
                        
                          Efficiency
                          {team.efficiency}%
                        
                        
                      
                      
                        Active Jobs))}
              
            
          
        
      
    
  );
};

export default AdminAnalytics;
