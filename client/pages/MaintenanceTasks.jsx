import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
  Wrench,
  Calendar,
  MapPin,
  Clock,
  Camera,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Play,
  Plus,
  RotateCcw,
  ListTodo,
  AlertCircle,
  Upload,
} from "lucide-react";

const MaintenanceTasks: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  const [activeFilter, setActiveFilter] = useState("all");
  const [isMarkResolvedOpen, setIsMarkResolvedOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [resolveComment, setResolveComment] = useState("");
  const [resolvePhoto, setResolvePhoto] = useState(null);

  // Sample task data - in real app this would come from API
  const [tasks, setTasks] = useState([
    {
      id,
      title: "Water Pipeline Repair",
      location: "MG Road, Near Metro Station",
      address: "MG Road, Near Metro Station, Kochi, Kerala 682001",
      priority: "HIGH",
      status: "ASSIGNED",
      estimatedTime: "4 hours",
      dueDate: "2024-01-15",
      isOverdue,
      description:
        "Main water pipeline burst, affecting supply to 200+ households",
      assignedAt: "2024-01-14T10:00:00Z",
      photo: "/api/attachments/complaint-1-photo.jpg",
    },
    {
      id: "2",
      title: "Street Light Installation",
      location: "Marine Drive, Walkway Section",
      address: "Marine Drive, Walkway Section, Fort Kochi, Kerala 682001",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      estimatedTime: "2 hours",
      dueDate: "2024-01-16",
      isOverdue,
      description: "Install 5 new LED street lights along the walkway",
      assignedAt: "2024-01-13T09:00:00Z",
      photo: "/api/attachments/complaint-2-photo.jpg",
    },
    {
      id: "3",
      title: "Road Pothole Filling",
      location: "Broadway Junction",
      address: "Broadway Junction, Ernakulam, Kerala 682011",
      priority: "LOW",
      status: "RESOLVED",
      estimatedTime: "3 hours",
      dueDate: "2024-01-10",
      isOverdue,
      description: "Fill multiple potholes affecting traffic flow",
      assignedAt: "2024-01-08T08:00:00Z",
      resolvedAt: "2024-01-10T15:30:00Z",
      photo: "/api/attachments/complaint-3-photo.jpg",
    },
    {
      id: "4",
      title: "Garbage Collection Issue",
      location: "Kadavanthra Bus Stop",
      address: "Kadavanthra Bus Stop, Kochi, Kerala 682020",
      priority: "HIGH",
      status: "ASSIGNED",
      estimatedTime: "1 hour",
      dueDate: "2024-01-12",
      isOverdue,
      description: "Garbage collection missed for 3 days",
      assignedAt: "2024-01-10T07:00:00Z",
      photo: "/api/attachments/complaint-4-photo.jpg",
    },
    {
      id: "5",
      title: "Sewer Blockage Clearance",
      location: "Panampilly Nagar",
      address: "Panampilly Nagar, Kochi, Kerala 682036",
      priority: "CRITICAL",
      status: "REOPENED",
      estimatedTime: "6 hours",
      dueDate: "2024-01-17",
      isOverdue,
      description: "Sewer blockage causing overflow in residential area",
      assignedAt: "2024-01-15T11:00:00Z",
      photo: "/api/attachments/complaint-5-photo.jpg",
    },
  ]);

  // Calculate task counts
  const taskCounts = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "ASSIGNED").length,
    overdue: tasks.filter((t) => t.isOverdue).length,
    resolved: tasks.filter((t) => t.status === "RESOLVED").length,
    reopened: tasks.filter((t) => t.status === "REOPENED").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
  };

  // Filter tasks based on active filter
  const filteredTasks = tasks.filter((task) => {
    switch (activeFilter) {
      case "pending":
        return task.status === "ASSIGNED";
      case "overdue":
        return task.isOverdue;
      case "resolved":
        return task.status === "RESOLVED";
      case "reopened":
        return task.status === "REOPENED";
      case "inProgress":
        return task.status === "IN_PROGRESS";
      default:
        return true;
    }
  });

  // Handle task status updates
  const handleStartWork = (taskId) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: "IN_PROGRESS" } ,
      ),
    );
  };

  const handleMarkResolved = (task) => {
    setSelectedTask(task);
    setIsMarkResolvedOpen(true);
  };

  const submitMarkResolved = () => {
    if (selectedTask) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === selectedTask.id
            ? {
                ...task,
                status: "RESOLVED",
                resolvedAt: new Date().toISOString(),
                resolveComment,
                resolvePhoto: resolvePhoto?.name,
              }
            ,
        ),
      );
      setIsMarkResolvedOpen(false);
      setResolveComment("");
      setResolvePhoto(null);
      setSelectedTask(null);
    }
  };

  // Handle navigation
  const handleNavigate = (address) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https, "_blank");
  };

  // Handle photo view
  const handleViewPhoto = (photoUrl) => {
    window.open(photoUrl, "_blank");
  };

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
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-orange-100 text-orange-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "REOPENED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ASSIGNED":
        return ;
      case "IN_PROGRESS":
        return ;
      case "RESOLVED":
        return ;
      case "REOPENED":
        return ;
      default:
        return ;
    }
  };

  return (
    
      {/* Header */}
      
        
          
            Maintenance Tasks
          
          Manage your assigned maintenance work
        
      

      {/* Task Count Cards */}
      
         setActiveFilter("all")}
        >
          
            
              
                Total Tasks
                
                  {taskCounts.total}
                
              
              
            
          
        

         setActiveFilter("pending")}
        >
          
            
              
                
                  Pending Tasks
                
                
                  {taskCounts.pending}
                
              
              
            
          
        

         setActiveFilter("overdue")}
        >
          
            
              
                
                  Overdue Tasks
                
                
                  {taskCounts.overdue}
                
              
              
            
          
        

         setActiveFilter("resolved")}
        >
          
            
              
                
                  Resolved Tasks
                
                
                  {taskCounts.resolved}
                
              
              
            
          
        

         setActiveFilter("reopened")}
        >
          
            
              
                
                  Reopened Tasks
                
                
                  {taskCounts.reopened}
                
              
              
            
          
        
      

      {/* Filtered Tasks */}
      
        
          
            
              
              My Tasks{" "}
              {activeFilter == "all" &&
                `(${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)})`}
            
            {filteredTasks.length} tasks
          
        
        
          
            {filteredTasks.map((task) => (
              
                
                  
                    {task.title}
                    
                      {task.description}
                    
                  
                  
                    
                      {task.priority}
                    
                    
                      
                        {getStatusIcon(task.status)}
                        
                          {task.status.replace("_", " ")}
                        
                      
                    
                  
                

                
                  
                    
                    {task.location}
                  
                  
                    
                    Est. {task.estimatedTime}
                  
                  
                    
                    Due: {task.dueDate}
                  
                

                
                  
                     handleNavigate(task.address)}
                    >
                      
                      Navigate
                    
                     handleViewPhoto(task.photo)}
                    >
                      
                      Photo
                    
                  
                  
                    {task.status === "ASSIGNED" && (
                       handleStartWork(task.id)}
                      >
                        
                        Start Work
                      
                    )}
                    {(task.status === "IN_PROGRESS" ||
                      task.status === "REOPENED") && (
                       handleMarkResolved(task)}
                      >
                        
                        Mark
                      
                    )}
                    
                      
                        Details
                      
                    
                  
                
              
            ))}
          
        
      

      {/* Mark Dialog */}
      
        
          
            Mark Task
          
          {selectedTask && (
            
              
                {selectedTask.title}
                {selectedTask.location}
              

              
                Completion Notes
                 setResolveComment(e.target.value)}
                  placeholder="Add notes about the work completed..."
                  rows={3}
                />
              

              
                Upload Completion Photo
                 setResolvePhoto(e.target.files?.[0] || null)}
                />
                {resolvePhoto && (Photo selected)}
              

              
                 {
                    setIsMarkResolvedOpen(false);
                    setResolveComment("");
                    setResolvePhoto(null);
                    setSelectedTask(null);
                  }}
                >
                  Cancel
                
                
                  
                  Mark Resolved
                
              
            
          )}
        
      
    
  );
};

export default MaintenanceTasks;
