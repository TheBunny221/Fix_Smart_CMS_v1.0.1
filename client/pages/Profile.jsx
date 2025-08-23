import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { updateProfile } from "../store/slices/authSlice";
import { addNotification } from "../store/slices/uiSlice";
import {
  useSendPasswordSetupEmailMutation,
  useSetPasswordMutation,
  useChangePasswordMutation,
} from "../store/api/authApi";
import { getApiErrorMessage } from "../store/api/baseApi";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Save,
  Eye,
  EyeOff,
  Lock,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  // API mutations
  const [sendPasswordSetupEmail] = useSendPasswordSetupEmailMutation();
  const [setPassword] = useSetPasswordMutation();
  const [changePassword] = useChangePasswordMutation();

  const [formData, setFormData] = useState({
    fullName,
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    language: user?.language || "en",
    ward: user?.ward?.name || "",
    department: user?.department || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword,
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current,
    new,
    confirm,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [emailStep, setEmailStep] = useState("none");
  const [setupToken, setSetupToken] = useState("");

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]));
  };

  const handleSendPasswordSetupEmail = async () => {
    try {
      const response = await sendPasswordSetupEmail({
        email,
      }).unwrap();
      setEmailStep("sent");
      dispatch(addNotification({
          type,
          title: "Email Sent",
          message: "Password setup link has been sent to your email address",
        }),
      );

      // In development, show the token for testing
      if (process.env.NODE_ENV === "development" && response.data?.resetUrl) {
        const token = response.data.resetUrl.split("/").pop();
        if (token) {
          setSetupToken(token);
          dispatch(addNotification({
              type,
              title: "Development Mode",
              message: `For testing, you can use token: ${token}`,
            }),
          );
        }
      }
    } catch (error) {
      dispatch(addNotification({
          type,
          title: "Error",
          message:
            error?.data?.message || "Failed to send password setup email",
        }),
      );
    }
  };

  const handleSaveProfile = async () => {
    try {
      await dispatch(updateProfile(formData)).unwrap();
      dispatch(addNotification({
          type,
          title: translations?.common?.success || "Success",
          message:
            translations?.profile?.profileUpdated ||
            "Profile updated successfully",
        }),
      );
      setIsEditing(false);
    } catch (error) {
      dispatch(addNotification({
          type,
          title: translations?.common?.error || "Error",
          message: error instanceof Error ? error.message : "Update failed",
        }),
      );
    }
  };

  const handleChangePassword = async () => {
    // Validate password match
    if (passwordData.newPassword == passwordData.confirmPassword) {
      dispatch(addNotification({
          type,
          title: translations?.common?.error || "Error",
          message:
            translations?.profile?.passwordMismatch || "Passwords do not match",
        }),
      );
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (passwordRegex.test(passwordData.newPassword)) {
      dispatch(addNotification({
          type,
          title: "Invalid Password",
          message:
            "Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
        }),
      );
      return;
    }

    // For password setup, require token
    if (user?.hasPassword && setupToken) {
      dispatch(addNotification({
          type,
          title: "Token Required",
          message: "Please get the setup token from your email first",
        }),
      );
      return;
    }

    // Validate current password is provided (only for password change, not setup)
    if (user?.hasPassword && passwordData.currentPassword) {
      dispatch(addNotification({
          type,
          title: translations?.common?.error || "Error",
          message: "Current password is required",
        }),
      );
      return;
    }

    setIsChangingPassword(true);

    try {
      if (user?.hasPassword) {
        // Password setup with token
        await setPassword({
          token,
          password,
        }).unwrap();
      } else {
        // Regular password change
        await changePassword({
          currentPassword,
          newPassword: passwordData.newPassword,
        }).unwrap();
      }

      dispatch(addNotification({
          type,
          title: translations?.common?.success || "Success",
          message: user?.hasPassword
            ? "Password set up successfully"
            : translations?.profile?.passwordChanged ||
              "Password changed successfully",
        }),
      );

      // Reset form and email state
      setPasswordData({
        currentPassword,
        newPassword: "",
        confirmPassword: "",
      });
      setEmailStep("none");
      setSetupToken("");
    } catch (error) {
      console.error("Password change error, error);

      // Use safe error message extraction to avoid response body issues
      const errorMessage =
        getApiErrorMessage(error) || "Failed to change password";

      dispatch(addNotification({
          type,
          title: "Password Change Failed",
          message,
        }),
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (user) {
    return (
      
        
          Please login to view your profile
        
      
    );
  }

  // Show loading state only if user is still loading
  if (isLoading) {
    return (
      
        
          
          Loading...
        
      
    );
  }

  return (
    
      {/* Header */}
      
        
          
            {translations?.nav?.profile || "Profile"}
          
          
            Manage your account information and preferences
          
        
      

      {/* Password Setup Alert */}
      {user?.hasPassword && (
        
          
            
              
                
              
              
                
                  Password Setup Required
                
                
                  Your account was created without a password. Please set up a
                  password to secure your account.
                
                
                   setActiveTab("security")}
                    className="bg-orange-600 hover:bg-orange-700"
                    size="sm"
                  >
                    Set Up Password Now
                  
                
              
            
          
        
      )}

      
        
          
            {translations?.profile?.personalInformation ||
              "Personal Information"}
          
          Security
        

        
          
            
              
                
                
                  {translations?.profile?.personalInformation ||
                    "Personal Information"}
                
              
            
            
              {/* User Info Section */}
              
                {user.fullName}
                {user.ward && (
                  
                    
                    {user.ward.name}
                  
                )}
                {user.department && (
                  
                    
                    {user.department}
                  
                )}
              

              {/* Form Fields */}
              
                
                  Full Name
                  
                      handleInputChange("fullName", e.target.value)
                    }
                    disabled={isEditing}
                  />
                

                
                  Email Address
                  
                    
                    
                        handleInputChange("email", e.target.value)
                      }
                      disabled={isEditing}
                      className="pl-10"
                    />
                  
                

                
                  Phone Number
                  
                    
                    
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      disabled={isEditing}
                      className="pl-10"
                    />
                  
                

                {/* 
                  Role
                  
                 */}

                {user.ward && (
                  
                    Ward Assignment
                    
                        handleInputChange("ward", e.target.value)
                      }
                      disabled={isEditing || user.role == "ward-officer"}
                    />
                  
                )}

                {user.department && (
                  
                    Department
                    
                        handleInputChange("department", e.target.value)
                      }
                      disabled={isEditing || user.role == "maintenance"}
                    />
                  
                )}
              

              {/* Action Buttons */}
              
                {isEditing ? (
                  
                     {
                        setIsEditing(false);
                        setFormData({
                          fullName,
                          email: user.email,
                          phoneNumber: user.phoneNumber || "",
                          language: user.language || "en",
                          ward: user.ward?.name || "",
                          department: user.department || "",
                        });
                      }}
                    >
                      {translations?.common?.cancel || "Cancel"}
                    
                    
                      
                      {translations?.common?.save || "Save"}
                    
                  
                ) : (
                   setIsEditing(true)}>
                    {translations?.common?.edit || "Edit"} Profile
                  
                )}
              
            
          
        

        
          
            
              
                
                
                  {user?.hasPassword
                    ? "Set Up Password"
                    : translations?.profile?.changePassword ||
                      "Change Password"}
                
              
            
            
              {/* Email Setup for Password Setup */}
              {user?.hasPassword && (
                
                  
                    
                      Password Setup Required
                    
                    
                      We'll send you a secure link to set up your password.
                    
                  

                  {emailStep === "none" && (
                    
                      Send Setup Link to {user?.email}
                    
                  )}

                  {emailStep === "sent" && (
                    
                      
                        
                        
                          Setup link sent Check your email.
                        
                      
                      
                        
                          Setup Token (from email)
                        
                         setSetupToken(e.target.value)}
                          placeholder="Enter token from email link"
                          className="w-full"
                        />
                        
                          You can either click the link in your email to go to
                          the setup page, or copy the token from the link and
                          paste it here.
                        
                        
                          Resend Email
                        
                      
                    
                  )}
                
              )}
              {user?.hasPassword && (
                
                  
                    {translations?.profile?.currentPassword ||
                      "Current Password"}
                  
                  
                    
                        handlePasswordChange("currentPassword", e.target.value)
                      }
                      placeholder="Enter current password"
                    />
                    
                        setShowPasswords((prev) => ({
                          ...prev,
                          current,
                        }))
                      }
                    >
                      {showPasswords.current ? (
                        
                      ) : (
                        
                      )}
                    
                  
                
              )}

              
                
                  {translations?.profile?.newPassword || "New Password"}
                
                
                  
                      handlePasswordChange("newPassword", e.target.value)
                    }
                    placeholder="Enter new password"
                    disabled={user?.hasPassword && setupToken}
                  />
                  
                      setShowPasswords((prev) => ({ ...prev, new))
                    }
                  >
                    {showPasswords.new ? (
                      
                    ) : (
                      
                    )}
                  
                
              

              
                
                  {translations?.profile?.confirmPassword || "Confirm Password"}
                
                
                  
                      handlePasswordChange("confirmPassword", e.target.value)
                    }
                    placeholder="Confirm new password"
                    disabled={user?.hasPassword && setupToken}
                  />
                  
                      setShowPasswords((prev) => ({
                        ...prev,
                        confirm,
                      }))
                    }
                  >
                    {showPasswords.confirm ? (
                      
                    ) : (
                      
                    )}
                  
                
              

              {/* Password Requirements */}
              
                Password Requirements:
                
                  At least 6 characters long
                  Contains at least one uppercase letter (A-Z)
                  Contains at least one lowercase letter (a-z)
                  Contains at least one number (0-9)
                
              

              
                {isChangingPassword ? ({user?.hasPassword ? "Setting Up..." ) : user?.hasPassword ? (
                  "Set Up Password"
                ) : (
                  translations?.profile?.changePassword || "Change Password"
                )}
              
            
          
        
      
    
  );
};

export default Profile;
