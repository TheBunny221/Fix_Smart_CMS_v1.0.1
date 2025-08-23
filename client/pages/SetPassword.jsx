import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { clearError, selectAuth } from "../store/slices/authSlice";
import { useSetPasswordMutation } from "../store/api/authApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Eye, EyeOff, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const SetPassword = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token } = useParams();
  const { toast } = useToast();
  const { appName } = useSystemConfig();

  const { error, isAuthenticated } = useAppSelector(selectAuth);
  const [setPasswordMutation, { isLoading }] = useSetPasswordMutation();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    match: false,
  });

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Validate password requirements
  useEffect(() => {
    const { password, confirmPassword } = formData;

    setPasswordValidation({
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      match: password === confirmPassword && password.length > 0,
    });
  }, [formData]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid || !token) {
      return;
    }

    try {
      await setPasswordMutation({
        token,
        password: formData.password,
      }).unwrap();

      toast({
        title: "Success",
        description: "Password set successfully! You can now log in.",
      });

      navigate("/login");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  // Check if form is valid
  const isFormValid = Object.values(passwordValidation).every(Boolean);

  const ValidationItem = ({ isValid, text }) => (
    <div className="flex items-center space-x-2">
      {isValid ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <AlertCircle className="w-4 h-4 text-gray-400" />
      )}
      <span
        className={`text-sm ${isValid ? "text-green-600" : "text-gray-500"}`}
      >
        {text}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Shield className="w-12 h-12 text-blue-600 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">
            Set Your Password
          </h1>
          <p className="text-gray-600">{appName} - Secure your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Password</CardTitle>
            <CardDescription>
              Choose a strong password to secure your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
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

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Password Requirements
                </Label>
                <div className="space-y-1 p-3 bg-gray-50 rounded-md">
                  <ValidationItem
                    isValid={passwordValidation.minLength}
                    text="At least 8 characters long"
                  />
                  <ValidationItem
                    isValid={passwordValidation.hasUpper}
                    text="Contains uppercase letter"
                  />
                  <ValidationItem
                    isValid={passwordValidation.hasLower}
                    text="Contains lowercase letter"
                  />
                  <ValidationItem
                    isValid={passwordValidation.hasNumber}
                    text="Contains a number"
                  />
                  <ValidationItem
                    isValid={passwordValidation.match}
                    text="Passwords match"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !isFormValid || !token}
              >
                {isLoading ? "Setting Password..." : "Set Password"}
              </Button>
            </form>

            {!token && (
              <Alert variant="destructive">
                <AlertDescription>
                  Invalid or expired password reset token. Please request a new
                  password reset link.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetPassword;
