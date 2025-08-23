import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import {
  selectAuth,
  resetRegistrationState,
  getDashboardRouteForRole,
} from "../store/slices/authSlice";
import { getApiErrorMessage } from "../store/api/baseApi";
import { useToast } from "../hooks/use-toast";
import { useApiErrorHandler } from "../hooks/useApiErrorHandler";
import { useRegisterMutation } from "../store/api/authApi";
import { useOtpFlow } from "../contexts/OtpContext";
import { useGetWardsQuery } from "../store/api/guestApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Logo } from "../components/ui/logo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Shield, User, Mail, Lock, Phone, MapPin, Home } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { openOtpFlow } = useOtpFlow();
  const { handleApiError } = useApiErrorHandler();
  const { isAuthenticated, user } = useAppSelector(selectAuth);
  const { appName, appLogoUrl, appLogoSize } = useSystemConfig();

  // API hooks
  const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();
  const {
    data: wardsResponse,
    isLoading: wardsLoading,
    error: wardsError,
  } = useGetWardsQuery();
  const wardsData = Array.isArray(wardsResponse?.data)
    ? wardsResponse.data
    : [];

  // Clear registration state on component mount
  useEffect(() => {
    dispatch(resetRegistrationState());
  }, [dispatch]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoute = getDashboardRouteForRole(user.role);
      navigate(dashboardRoute);
    }
  }, [isAuthenticated, user, navigate]);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    role: "CITIZEN",
    wardId: "",
  });

  // Transform wards data for the form
  const wards = wardsData.map((ward) => ({
    value: ward.id,
    label: ward.name,
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await registerUser({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        role: formData.role,
        wardId: formData.wardId,
      }).unwrap();

      if (result.data?.requiresOtpVerification) {
        // OTP verification required - open unified dialog
        openOtpFlow({
          context: "registration",
          email: formData.email,
          title: "Complete Registration",
          description:
            "Enter the verification code sent to your email to activate your account",
          onSuccess: (data) => {
            toast({
              title: "Success",
              description: `Welcome ${data.user?.fullName}! Your account has been verified.`,
            });
            // Navigation will be handled by auth state change
          },
        });

        toast({
          title: "Check Your Email",
          description: "Please check your email for the verification code.",
        });
      } else {
        // Direct registration without OTP
        toast({
          title: "Success",
          description: "Account created successfully! Welcome aboard!",
        });
        // Navigation will be handled by auth state change
      }
    } catch (error) {
      console.error("Registration error:", JSON.stringify(error, null, 2));
      console.error("Registration error object:", error);

      // Handle RTK Query error structure
      console.log("RTK Query error structure:", error);

      // Check if this is an RTK Query error with data
      const errorData = error?.data?.data || error?.data;
      const errorStatus = error?.status;

      // Handle specific user already exists scenarios
      if (errorStatus === 400 && errorData?.existingUser) {
        const { isActive, action } = errorData;

        if (isActive && action === "login") {
          toast({
            title: "Email Already Registered",
            description:
              "This email is already registered. Please log in instead.",
            variant: "destructive",
            action: (
              <Button variant="outline" onClick={() => navigate("/login")}>
                Go to Login
              </Button>
            ),
          });
        } else if (!isActive && action === "verify_email") {
          toast({
            title: "Email Verification Required",
            description:
              "This email is already registered but not verified. Please check your email for verification code.",
          });

          // Open OTP flow for the existing unverified user
          openOtpFlow({
            context: "registration",
            email: formData.email,
            title: "Complete Registration",
            description:
              "Enter the verification code sent to your email to activate your account. Click 'Resend Code' if you need a new verification email.",
            onSuccess: (data) => {
              toast({
                title: "Success",
                description: `Welcome ${data.user?.fullName}! Your account has been verified.`,
              });
            },
          });
        }
      } else {
        // Handle other errors - extract message from server response
        const errorMessage =
          errorData?.message ||
          error?.data?.message ||
          getApiErrorMessage(error);
        console.log("Extracted error message:", errorMessage);
        toast({
          title: "Registration Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size={appLogoSize} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{appName}</h1>
          <p className="text-gray-600 mt-2">Create Your Account</p>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              <Shield className="h-6 w-6 mx-auto mb-2" />
              Register for E-Governance Portal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Enter your full name"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder="Enter your phone number"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="wardId">Ward</Label>
                <Select
                  value={formData.wardId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, wardId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {wardsLoading ? (
                      <SelectItem value="" disabled>
                        Loading wards...
                      </SelectItem>
                    ) : wardsError ? (
                      <SelectItem value="" disabled>
                        Error loading wards
                      </SelectItem>
                    ) : (
                      wards.map((ward) => (
                        <SelectItem key={ward.value} value={ward.value}>
                          {ward.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Create a password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm your password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isRegistering}>
                {isRegistering ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-600 hover:underline">
                  Sign in here
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Or{" "}
                <Link to="/guest" className="text-blue-600 hover:underline">
                  Submit Complaint as Guest
                </Link>
              </p>
              <div>
                <Button variant="outline" onClick={() => navigate("/")} className="mt-2">
                  <Home className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
