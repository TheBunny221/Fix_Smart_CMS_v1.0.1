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
  CheckSquare,
  Calendar,
  User,
  MapPin,
  Clock,
  AlertTriangle,
} from "lucide-react";

const WardTasks: React.FC = () => {
  const mockTasks = [
    {
      id: "1",
      title: "Water Supply Issue - MG Road",
      priority: "HIGH",
      status: "PENDING",
      assignedTo: "Maintenance Team A",
      dueDate: "2024-01-15",
      location: "MG Road, Ward 1",
    },
    {
      id: "2",
      title: "Street Light Repair - Broadway",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      assignedTo: "Electrical Team",
      dueDate: "2024-01-16",
      location: "Broadway, Ward 1",
    },
    {
      id: "3",
      title: "Road Pothole Repair - Marine Drive",
      priority: "LOW",
      status: "COMPLETED",
      assignedTo: "Road Maintenance",
      dueDate: "2024-01-10",
      location: "Marine Drive, Ward 3",
    },
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    
      {/* Header */}
      
        Ward Tasks
        
          Manage and track tasks assigned to your ward
        
      

      {/* Summary Cards */}
      
        
          
            
              
                Total Tasks
                12
              
              
            
          
        
        
          
            
              
                Pending
                4
              
              
            
          
        
        
          
            
              
                In Progress
                5
              
              
            
          
        
        
          
            
              
                Completed
                3
              
              
            
          
        
      

      {/* Tasks List */}
      
        
          Recent Tasks
        
        
          
            {mockTasks.map((task) => ({task.title}
                  
                    
                      {task.priority}
                    
                    
                      {task.status}
                    
                  
                
                
                  
                    
                    {task.assignedTo}
                  
                  
                    
                    {task.location}
                  
                  
                    
                    Due))}
          
        
      
    
  );
};

export default WardTasks;
