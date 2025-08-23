import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Users, Shield, MapPin, Wrench } from 'lucide-react';

const RoleSwitcher: React.FC = () => {
  const roles = [
    {
      title: 'Citizen Portal',
      description: 'Register complaints, track status, and provide feedback',
      icon: ,
      links: [
        { path: '/', label: 'Register Complaint' },
        { path: '/my-complaints', label: 'My Complaints' },
        { path: '/reopen-complaint', label: 'Reopen Complaint' },
        { path: '/track-status', label: 'Track Status' },
        { path: '/feedback', label: 'Feedback' },
      ]
    },
    {
      title: 'Admin Dashboard',
      description: 'Manage complaints, users, and generate reports',
      icon: ,
      links: [
        { path: '/admin', label: 'Dashboard' },
        { path: '/admin/complaints', label: 'Complaint Management' },
        { path: '/admin/users', label: 'User Management' },
        { path: '/admin/reports', label: 'Reports' },
      ]
    },
    {
      title: 'Ward Officer',
      description: 'Review and forward complaints for your zone',
      icon: ,
      links: [
        { path: '/ward', label: 'Zone Dashboard' },
        { path: '/ward/review', label: 'Review Complaints' },
        { path: '/ward/forward', label: 'Forward Panel' },
      ]
    },
    {
      title: 'Maintenance Team',
      description: 'Update complaint status and track SLA',
      icon: ,
      links: [
        { path: '/maintenance', label: 'Assigned Complaints' },
        { path: '/maintenance/update', label: 'Update Status' },
        { path: '/maintenance/sla', label: 'SLA Tracking' },
      ]
    }
  ];

  return (
    
      
        CitizenConnect Portal
        
          Choose your role to access the relevant features
        
      

      
        {roles.map((role, index) => (
          
            
              
                
                  {role.icon}
                
                
                  {role.title}
                  
                    {role.description}
                  
                
              
            
            
              
                {role.links.map((link, linkIndex) => (
                  
                    
                      {link.label}
                    
                  
                ))}
              
            
          
        ))}
      
    
  );
};

export default RoleSwitcher;
