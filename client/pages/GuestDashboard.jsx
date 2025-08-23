import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  Eye,
  Search,
  User,
  Mail,
  Phone,
  CreditCard,
  Bell,
  Settings,
  BarChart3,
  TrendingUp,
  History,
} from "lucide-react";
import QuickComplaintModal from "../components/QuickComplaintModal";

// Mock data - in real app this would come from API
const mockProfile = {
  fullName: "John Doe",
  email: "john.doe@example.com",
  phoneNumber: "+91-9876543210",
  address: "123 Marine Drive, Fort Kochi",
  joinedDate: "2024-01-15",
  totalRequests,
  resolvedRequests,
};

const mockComplaints = [
  {
    id: "CMP001",
    title: "Water Supply Issue",
    type: "WATER_SUPPLY",
    status: "IN_PROGRESS",
    priority: "HIGH",
    submittedOn: "2024-01-20",
    ward: "Fort Kochi",
    description: "No water supply for 3 days",
  },
  {
    id: "CMP002",
    title: "Street Light Repair",
    type: "STREET_LIGHTING",
    status: "RESOLVED",
    priority: "MEDIUM",
    submittedOn: "2024-01-15",
    resolvedOn: "2024-01-18",
    ward: "Fort Kochi",
    description: "Street light not working on Marine Drive",
  },
];

const mockServiceRequests = [
  {
    id: "SRV001",
    title: "Birth Certificate",
    type: "BIRTH_CERTIFICATE",
    status: "PROCESSING",
    submittedOn: "2024-01-22",
    expectedCompletion: "2024-01-29",
    description: "Birth certificate for newborn",
  },
  {
    id: "SRV002",
    title: "Trade License Renewal",
    type: "TRADE_LICENSE",
    status: "APPROVED",
    submittedOn: "2024-01-10",
    completedOn: "2024-01-25",
    description: "Renewal of trade license for restaurant",
  },
];

const mockPayments = [
  {
    id: "PAY001",
    description: "Property Tax - Q1 2024",
    amount,
    status: "PAID",
    paidOn: "2024-01-15",
    method: "Online Banking",
  },
  {
    id: "PAY002",
    description: "Trade License Fee",
    amount,
    status: "PAID",
    paidOn: "2024-01-25",
    method: "Credit Card",
  },
  {
    id: "PAY003",
    description: "Water Connection Fee",
    amount,
    status: "PENDING",
    dueDate: "2024-02-05",
  },
];

const mockNotifications = [
  {
    id: "NOT001",
    title: "Complaint Status Update",
    message: "Your water supply complaint has been assigned to a technician",
    type: "COMPLAINT_UPDATE",
    timestamp: "2024-01-23T10:30:00Z",
    read,
  },
  {
    id: "NOT002",
    title: "Service Request Approved",
    message: "Your trade license renewal has been approved",
    type: "SERVICE_UPDATE",
    timestamp: "2024-01-25T14:15:00Z",
    read,
  },
];

const GuestDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case "REGISTERED":
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-orange-100 text-orange-800";
      case "RESOLVED":
      case "APPROVED":
      case "PAID":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      case "PENDING":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style,
      currency: "INR",
    }).format(amount);
  };

  return (
    
      
        {/* Header */}
        
          
            
              
                Welcome back, {mockProfile.fullName}
              
              
                Manage your complaints, service requests, and profile
              
            
            
               setIsQuickFormOpen(true)}
                className="bg-white text-blue-600 hover:bg-gray-50"
              >
                
                New Complaint
              
               navigate("/guest/service-request")}
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600"
              >
                
                New Service Request
              
            
          
        

        {/* Tabs */}
        
          
            Overview
            Complaints
            Services
            Payments
            Notifications
            Profile
          

          {/* Overview Tab */}
          
            {/* Quick Stats */}
            
              
                
                  
                    Total Requests
                  
                  
                
                
                  
                    {mockProfile.totalRequests}
                  
                  
                    All time submissions
                  
                
              

              
                
                  
                    Resolved
                  
                  
                
                
                  
                    {mockProfile.resolvedRequests}
                  
                  
                    Successfully resolved
                  
                
              

              
                
                  
                    In Progress
                  
                  
                
                
                  
                    {mockProfile.totalRequests - mockProfile.resolvedRequests}
                  
                  
                    Being worked on
                  
                
              

              
                
                  
                    Success Rate
                  
                  
                
                
                  
                    {Math.round(
                      (mockProfile.resolvedRequests /
                        mockProfile.totalRequests) *
                        100,
                    )}
                    %
                  
                  
                    Resolution rate
                  
                
              
            

            {/* Recent Activity */}
            
              {/* Recent Complaints */}
              
                
                  Recent Complaints
                
                
                  
                    {mockComplaints.slice(0, 3).map((complaint) => ({complaint.title}
                          
                          
                            ID, " ")}
                        
                      
                    ))}
                  
                  
                     setActiveTab("complaints")}
                      className="w-full"
                    >
                      View All Complaints
                    
                  
                
              

              {/* Recent Service Requests */}
              
                
                  
                    Recent Service Requests
                  
                
                
                  
                    {mockServiceRequests.slice(0, 3).map((service) => ({service.title}
                          
                          
                            ID))}
                  
                  
                     setActiveTab("services")}
                      className="w-full"
                    >
                      View All Services
                    
                  
                
              
            

            {/* Quick Actions */}
            
              
                Quick Actions
              
              
                
                   navigate("/guest/complaint")}
                    className="justify-start h-auto p-4"
                  >
                    
                    
                      Submit Complaint
                      
                        Report civic issues
                      
                    
                  
                   navigate("/guest/service-request")}
                    variant="outline"
                    className="justify-start h-auto p-4"
                  >
                    
                    
                      Request Service
                      
                        Municipal services
                      
                    
                  
                   navigate("/guest/track")}
                    variant="outline"
                    className="justify-start h-auto p-4"
                  >
                    
                    
                      Track Status
                      Check progress
                    
                  
                
              
            
          

          {/* Complaints Tab */}
          
            
              
                
                  My Complaints
                   setIsQuickFormOpen(true)}>
                    
                    New Complaint
                  
                
              
              
                {/* Search */}
                
                  
                    
                     setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  
                

                {/* Complaints Table */}
                
                  
                    
                      ID
                      Title
                      Type
                      Status
                      Priority
                      Submitted
                      Actions
                    
                  
                  
                    {mockComplaints.map((complaint) => (
                      
                        
                          {complaint.id}
                        
                        
                          
                            
                              {complaint.title}
                            
                            
                              {complaint.description}
                            
                          
                        
                        
                          {complaint.type.replace("_", " ")}
                        
                        
                          
                            {complaint.status.replace("_", " ")}
                          
                        
                        
                          
                            {complaint.priority}
                          
                        
                        
                          
                            
                            {formatDate(complaint.submittedOn)}
                          
                        
                        
                          
                            
                          
                        
                      
                    ))}
                  
                
              
            
          

          {/* Services Tab */}
          
            
              
                
                  My Service Requests
                   navigate("/guest/service-request")}>
                    
                    New Service Request
                  
                
              
              
                
                  
                    
                      ID
                      Service
                      Status
                      Submitted
                      Expected Completion
                      Actions
                    
                  
                  
                    {mockServiceRequests.map((service) => (
                      
                        
                          {service.id}
                        
                        
                          
                            
                              {service.title}
                            
                            
                              {service.description}
                            
                          
                        
                        
                          
                            {service.status}
                          
                        
                        {formatDate(service.submittedOn)}
                        
                          {service.status === "APPROVED" && service.completedOn
                            ? formatDate(service.completedOn)
                            : service.expectedCompletion
                              ? formatDate(service.expectedCompletion)
                              : "TBD"}
                        
                        
                          
                            
                          
                        
                      
                    ))}
                  
                
              
            
          

          {/* Payments Tab */}
          
            
              
                Payment History
              
              
                
                  
                    
                      ID
                      Description
                      Amount
                      Status
                      Date
                      Method
                    
                  
                  
                    {mockPayments.map((payment) => (
                      
                        
                          {payment.id}
                        
                        
                          {payment.description}
                        
                        
                          {formatCurrency(payment.amount)}
                        
                        
                          
                            {payment.status}
                          
                        
                        
                          {payment.status === "PAID"
                            ? formatDate(payment.paidOn)
                            : `Due: ${formatDate(payment.dueDate)}`}
                        
                        {payment.method || "—"}
                      
                    ))}
                  
                
              
            
          

          {/* Notifications Tab */}
          
            
              
                Notifications
              
              
                
                  {mockNotifications.map((notification) => (
                    
                      
                        
                          
                            
                              {notification.title}
                            
                            {notification.read && (
                              
                                New
                              
                            )}
                          
                          
                            {notification.message}
                          
                          
                            {new Date(notification.timestamp).toLocaleString()}
                          
                        
                        
                      
                    
                  ))}
                
              
            
          

          {/* Profile Tab */}
          
            
              {/* Profile Information */}
              
                
                  Profile Information
                
                
                  
                    Full Name
                    
                  
                  
                    Email Address
                    
                  
                  
                    Phone Number
                    
                  
                  
                    Address
                    
                  
                  
                    Member Since
                    
                  
                  
                    
                    Edit Profile (Coming Soon)
                  
                
              

              {/* Account Summary */}
              
                
                  Account Summary
                
                
                  
                    
                      
                        {mockProfile.totalRequests}
                      
                      
                        Total Requests
                      
                    
                    
                      
                        {mockProfile.resolvedRequests}
                      
                      Resolved
                    
                  

                  
                    
                      
                        Success Rate
                      
                      
                        {Math.round(
                          (mockProfile.resolvedRequests /
                            mockProfile.totalRequests) *
                            100,
                        )}
                        %
                      
                    
                    
                      
                        Active Requests
                      
                      
                        {mockProfile.totalRequests -
                          mockProfile.resolvedRequests}
                      
                    
                    
                      
                        Member Since
                      
                      
                        {formatDate(mockProfile.joinedDate)}
                      
                    
                  

                  
                    Account Features
                    
                      • Submit unlimited complaints
                      • Request municipal services
                      • Track request status in real-time
                      • Receive email notifications
                      • Access payment history
                    
                  
                
              
            
          
        
      

      {/* Quick Complaint Modal */}
       setIsQuickFormOpen(false)}
        onSuccess={(complaintId) => {
          // Could add refresh logic here if needed
          setActiveTab("complaints");
        }}
      />
    
  );
};

export default GuestDashboard;
