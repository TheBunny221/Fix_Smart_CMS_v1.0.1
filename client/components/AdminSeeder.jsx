import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { toast } from "./ui/use-toast";

const AdminSeeder: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  const seedAdminUser = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch("/api/test/seed-admin", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        setSeedResult(result);
        toast({
          title,
          description: "Admin user created successfully",
        });
      } else {
        throw new Error(result.message || "Failed to create admin user");
      }
    } catch (error) {
      console.error("Failed to seed admin user, error);
      toast({
        title,
        description: error.message || "Failed to create admin user",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    
      
        
          
          Development Tools
        
      
      
        
          This tool creates test users for development and testing purposes.
        

        
          {isSeeding ? (
            
              
              Creating Users...
            
          ) : (
            
              
              Create Test Users
            
          )}
        

        {seedResult && (Test Users Created, index) => ({user.role}))}
            
          
        )}
      
    
  );
};

export default AdminSeeder;
