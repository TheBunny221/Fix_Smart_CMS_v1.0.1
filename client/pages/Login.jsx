import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import {
  loginWithPassword,
  sendPasswordSetupEmail,
  clearError,
  selectAuth,
  selectRequiresPasswordSetup,
  getDashboardRouteForRole,
} from "../store/slices/authSlice";
import { useRequestOTPLoginMutation } from "../store/api/authApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Logo } from "../components/ui/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Eye, EyeOff, Mail, Lock, Home } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useOtpFlow } from "../contexts/OtpContext";
import AdminSeeder from "../components/AdminSeeder";

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { openOtpFlow } = useOtpFlow();
  const { appName, appLogoUrl, appLogoSize } = useSystemConfig();

  // Set document title
  useDocumentTitle("Login");

  const { isLoading, error, isAuthenticated, user } =
    useAppSelector(selectAuth);
  const requiresPasswordSetup = useAppSelector(selectRequiresPasswordSetup);

  // API hooks
  const [requestOTPLogin, { isLoading: isRequestingOtp }] =
    useRequestOTPLoginMutation();

  // Form states
  const [loginMethod, setLoginMethod] = useState("password");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoute = getDashboardRouteForRole(user.role);
      navigate(dashboardRoute);
    }
  }, [isAuthenticated, user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (error) {
      dispatch(clearError());
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      return;
    }

    try {
      await dispatch(
        loginWithPassword({
          email: formData.email,
          password: formData.password,
        }),
      ).unwrap();

      toast({
        title: "Success",
        description: "Welcome back!",
      });
    } catch (error) {
      // Error is handled by the reducer
    }
  };

  const handleOTPRequest = async (e) => {
    e.preventDefault();

    if (!formData.email) {
      return;
    }

    try {
      // Request OTP first
      console.log("Requesting OTP for email", formData.email);
      const response = await requestOTPLogin({
        email: formData.email,
      }).unwrap();
      console.log("OTP response", response);

      // Open the unified OTP dialog
      openOtpFlow({
        context: "login",
        email: formData.email,
        onSuccess: (data) => {
          toast({
            title: "Success",
            description: "Welcome back!",
          });
          // Navigation will be handled by the auth state change
        },
      });

      toast({
        title: "OTP Sent",
        description: `A verification code has been sent to ${formData.email}`,
      });
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const handlePasswordSetupRequest = async () => {
    try {
      await dispatch(
        sendPasswordSetupEmail({
          email: formData.email,
        }),
      ).unwrap();

      toast({
        title: "Email Sent",
        description: `Password setup instructions have been sent to ${formData.email}. Please check your email and follow the instructions.`,
      });
    } catch (error) {
      // Error is handled by the reducer
    }
  };

  // Demo credentials for testing
  const demoCredentials = [
    {
      email: "admin@cochinsmartcity.gov.in",
      password: "admin123",
      role: "Administrator",
    },
    {
      email: "ward.officer@cochinsmartcity.gov.in",
      password: "ward123",
      role: "Ward Officer",
    },
    {
      email: "maintenance@cochinsmartcity.gov.in",
      password: "maintenance123",
      role: "Maintenance Team",
    },
    {
      email: "citizen@example.com",
      password: "citizen123",
      role: "Citizen",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo size={appLogoSize} url={appLogoUrl} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {appName} E-Governance Portal
          </h1>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Choose your preferred login method
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Password Setup Required */}
            {requiresPasswordSetup && (
              <Alert className="border-amber-300 bg-amber-50">
                <AlertDescription className="space-y-3">
                  <div className="text-amber-700">
                    Your password is not set. You can:
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setLoginMethod("otp")}
                      variant="outline"
                      size="sm"
                      className="text-amber-700 border-amber-300"
                    >
                      Login with OTP
                    </Button>
                    <Button
                      onClick={handlePasswordSetupRequest}
                      variant="outline"
                      size="sm"
                      className="text-amber-700 border-amber-300"
                    >
                      Set Password
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Tabs
              value={loginMethod}
              onValueChange={(value) => setLoginMethod(value)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="password">
                  <Lock className="w-4 h-4 mr-2" />
                  Password
                </TabsTrigger>
                <TabsTrigger value="otp">
                  <Mail className="w-4 h-4 mr-2" />
                  OTP
                </TabsTrigger>
              </TabsList>

              {/* Password Login Tab */}
              <TabsContent value="password" className="space-y-4">
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      isLoading || !formData.email || !formData.password
                    }
                  >
                    {isLoading ? "Signing in..." : "Sign in with Password"}
                  </Button>
                </form>
              </TabsContent>

              {/* OTP Login Tab */}
              <TabsContent value="otp" className="space-y-4">
                <form onSubmit={handleOTPRequest} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-otp">Email Address</Label>
                    <Input
                      id="email-otp"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isRequestingOtp || !formData.email}
                  >
                    {isRequestingOtp ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Demo Credentials */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Demo Credentials (Development Only)
                </h3>
                <div className="space-y-2">
                  {demoCredentials.map((cred, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="text-xs">
                        <Badge variant="outline" className="mr-2">
                          {cred.role}
                        </Badge>
                        <span className="text-gray-600">{cred.email}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFormData({
                            email: cred.email,
                            password: cred.password,
                          });
                          setLoginMethod("password");
                        }}
                      >
                        Use
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guest Options */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-center space-x-4 text-sm">
                <Link
                  to="/guest/complaint"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Home className="w-4 h-4 mr-1" />
                  Guest Portal
                </Link>
                <Link
                  to="/guest/track"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Track Complaint
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Seeder for Development */}
        {process.env.NODE_ENV === "development" && <AdminSeeder />}
      </div>
    </div>
  );
};

export default Login;
