import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Shield, AlertTriangle, Home, LogIn } from "lucide-react";

const Unauthorized = () => {
  const { appName } = useSystemConfig();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-600">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            You don't have permission to access this page. Please contact your
            administrator if you believe this is an error.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild variant="outline">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            <Button asChild>
              <Link to="/login">
                <LogIn className="w-4 h-4 mr-2" />
                Login
              </Link>
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            {appName} E-Governance
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized;
