import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Camera,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Phone,
  User,
  Wrench,
  FileText,
  Upload,
} from "lucide-react";

const TaskDetails: React.FC = () => {
  const { id } = useParams();
  const [workNote, setWorkNote] = useState("");
  const [completionNote, setCompletionNote] = useState("");

  // Mock task data
  const task = {
    id: id || "1",
    title: "Water Pipeline Repair",
    description:
      "Main water pipeline burst at MG Road junction affecting water supply to 200+ households in the area. Requires immediate attention and repair.",
    location: "MG Road, Near Metro Station",
    coordinates: "9.9312, 76.2673",
    priority: "HIGH",
    status: "IN_PROGRESS",
    estimatedTime: "4 hours",
    dueDate: "2024-01-15",
    assignedDate: "2024-01-14",
    submittedBy: "Ward Officer - Central Zone",
    contactPhone: "+91 9876543210",
    materials: ["PVC Pipes (6 inch)", "Pipe Joints", "Sealant", "Sand"],
    tools: ["Excavator", "Welding Equipment", "Safety Gear"],
    workLog: [
      {
        time: "09:00 AM",
        note: "Arrived at site, assessed damage",
        photo,
      },
      {
        time: "09:30 AM",
        note: "Started excavation work",
        photo,
      },
      {
        time: "11:00 AM",
        note: "Identified leak source, preparing for repair",
        photo,
      },
    ],
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
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    
      {/* Header */}
      
        
          
            
              
                
                Back to Tasks
              
            
            
              Task #{task.id}
            
          
          
            
              {task.status.replace("_", " ")}
            
            
              {task.priority} Priority
            
            Due: {task.dueDate}
          
        
        
          
            
            Navigate
          
          
            
            Call Contact
          
        
      

      
        {/* Main Content */}
        
          {/* Task Details */}
          
            
              
                
                Task Details
              
            
            
              
                Title
                {task.title}
              
              
                Description
                {task.description}
              
              
                
                  
                    
                    Location
                  
                  {task.location}
                  {task.coordinates}
                
                
                  
                    
                    Timeline
                  
                  
                    
                      Assigned: {task.assignedDate}
                    
                    Due: {task.dueDate}
                    
                      Est. Time: {task.estimatedTime}
                    
                  
                
              
            
          

          {/* Work Log */}
          
            
              
                
                Work Progress Log
              
            
            
              
                {task.workLog.map((log, index) => (
                  
                    
                      
                        {log.time}
                        {log.note}
                        {log.photo && (
                          
                            📷 Photo Attached
                          
                        )}
                      
                    
                  
                ))}
              

              {/* Add New Log Entry */}
              
                Add Work Update
                
                   setWorkNote(e.target.value)}
                    placeholder="Describe current work status..."
                    className="flex-1"
                    rows={2}
                  />
                  
                    
                      
                      Photo
                    
                    
                      Add Log
                    
                  
                
              
            
          

          {/* Completion Form */}
          {task.status === "IN_PROGRESS" && (
            
              
                
                  
                  Mark Task Complete
                
              
              
                
                  Completion Notes
                   setCompletionNote(e.target.value)}
                    placeholder="Describe the work completed, any issues resolved, and follow-up actions needed..."
                    rows={4}
                  />
                
                
                  
                    
                    Complete Task
                  
                  
                    
                    Add Completion Photo
                  
                
              
            
          )}
        

        {/* Sidebar */}
        
          {/* Contact Info */}
          
            
              
                
                Contact Information
              
            
            
              
                Assigned By
                
                  {typeof task.submittedBy === "object" && task.submittedBy
                    ? task.submittedBy.fullName ||
                      task.submittedBy.name ||
                      "Unknown"
                    : task.submittedBy}
                
              
              
                Contact Phone
                
                  {task.contactPhone}
                  
                    
                  
                
              
            
          

          {/* Required Materials */}
          
            
              Required Materials
            
            
              
                {task.materials.map((material, index) => (
                  
                    {material}
                    
                  
                ))}
              
            
          

          {/* Required Tools */}
          
            
              Required Tools
            
            
              
                {task.tools.map((tool, index) => (
                  
                    {tool}
                    
                  
                ))}
              
            
          

          {/* Quick Actions */}
          
            
              Quick Actions
            
            
              
                
                Take Photo
              
              
                
                Upload Document
              
              
                
                Report Issue
              
            
          
        
      
    
  );
};

export default TaskDetails;
