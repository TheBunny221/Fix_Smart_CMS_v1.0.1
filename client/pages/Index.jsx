import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  FileText,
  Phone,
  Mail,
  User,
  Clock,
  BarChart3,
  Shield,
  MapPin,
  CheckCircle,
} from "lucide-react";
import QuickComplaintForm from "../components/QuickComplaintForm";

const Index = () => {
  const { translations, currentLanguage } = useAppSelector(
    (state) => state.language,
  );
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { appName, getConfig } = useSystemConfig();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Show loading if translations not ready
  if (!translations) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {translations?.common?.loading || "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              {translations?.nav?.home || `${appName} Portal`}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {translations?.guest?.guestSubmissionDescription ||
                "Empowering citizens with digital governance solutions for a smarter, more connected community."}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link to="/guest/complaint">
                <FileText className="w-5 h-5 mr-2" />
                {translations?.guest?.submitComplaint || "Submit Complaint"}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link to="/guest/track">
                <BarChart3 className="w-5 h-5 mr-2" />
                {translations?.guest?.trackComplaint || "Track Complaint"}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
              <Link to="/login">
                <User className="w-5 h-5 mr-2" />
                {translations?.auth?.login || "Login"}
              </Link>
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600">
                  <Clock className="w-8 h-8 mr-3" />
                  {translations?.features?.quickService || "Quick Service"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {translations?.features?.quickServiceDesc ||
                    "Submit and track complaints efficiently with our streamlined digital platform."}
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-green-600">
                  <Shield className="w-8 h-8 mr-3" />
                  {translations?.features?.transparent || "Transparent Process"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {translations?.features?.transparentDesc ||
                    "Real-time updates and transparent tracking of your service requests."}
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-600">
                  <CheckCircle className="w-8 h-8 mr-3" />
                  {translations?.features?.efficient || "Efficient Resolution"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {translations?.features?.efficientDesc ||
                    "Direct communication with relevant departments for faster resolution."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Quick Complaint Form Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {translations?.guest?.quickComplaint || "Quick Complaint"}
            </h2>
            <p className="text-gray-600">
              {translations?.guest?.quickComplaintDesc ||
                "Submit your complaint quickly using our simplified form."}
            </p>
          </div>
          <QuickComplaintForm />
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {translations?.contact?.title || "Contact Information"}
            </h2>
            <p className="text-gray-600">
              {translations?.contact?.description ||
                "Get in touch with us for any assistance or inquiries."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="flex flex-col items-center text-blue-600">
                  <Phone className="w-12 h-12 mb-3" />
                  {translations?.contact?.phone || "Phone"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{getConfig("contactPhone") || "+91-XXX-XXX-XXXX"}</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="flex flex-col items-center text-green-600">
                  <Mail className="w-12 h-12 mb-3" />
                  {translations?.contact?.email || "Email"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{getConfig("contactEmail") || "info@smartcity.gov.in"}</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <CardTitle className="flex flex-col items-center text-purple-600">
                  <MapPin className="w-12 h-12 mb-3" />
                  {translations?.contact?.address || "Address"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  {getConfig("contactAddress") || "Smart City Office, Government Building"}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 {appName}. {translations?.footer?.rights || "All rights reserved."}
          </p>
          <div className="mt-4 flex justify-center space-x-6">
            <Link to="/privacy" className="text-gray-400 hover:text-white text-sm">
              {translations?.footer?.privacy || "Privacy Policy"}
            </Link>
            <Link to="/terms" className="text-gray-400 hover:text-white text-sm">
              {translations?.footer?.terms || "Terms of Service"}
            </Link>
            <Link to="/help" className="text-gray-400 hover:text-white text-sm">
              {translations?.footer?.help || "Help"}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
