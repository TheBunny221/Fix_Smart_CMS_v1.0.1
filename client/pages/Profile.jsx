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

const Profile = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  // API mutations
  const [sendPasswordSetupEmail] = useSendPasswordSetupEmailMutation();
  const [setPassword] = useSetPasswordMutation();
  const [changePassword] = useChangePasswordMutation();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    language: user?.language || "en",
    ward: user?.ward?.name || "",
    department: user?.department || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [emailStep, setEmailStep] = useState("none");
  const [setupToken, setSetupToken] = useState("");

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      await dispatch(updateProfile(formData)).unwrap();
      setIsEditing(false);
      dispatch(
        addNotification({
          type: "success",
          message:
            translations?.profile?.profileUpdated ||
            "Profile updated successfully",
        }),
      );
    } catch (error) {
      console.error("Profile update error", error);
      dispatch(
        addNotification({
          type: "error",
          message: getApiErrorMessage(error),
        }),
      );
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      dispatch(
        addNotification({
          type: "error",
          message: "Passwords do not match",
        }),
      );
      return;
    }

    setIsChangingPassword(true);
    try {
      if (!user?.hasPassword && setupToken) {
        // First time password setup with token
        await setPassword({
          token: setupToken,
          password: passwordData.newPassword,
        }).unwrap();
      } else {
        // Regular password change
        await changePassword({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }).unwrap();
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSetupToken("");
      setEmailStep("none");

      dispatch(
        addNotification({
          type: "success",
          message: user?.hasPassword
            ? "Password set successfully"
            : "Password changed successfully",
        }),
      );
    } catch (error) {
      console.error("Password change error", error);
      dispatch(
        addNotification({
          type: "error",
          message: getApiErrorMessage(error),
        }),
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendSetupEmail = async () => {
    try {
      await sendPasswordSetupEmail({
        email: user?.email,
      }).unwrap();
      setEmailStep("sent");
      dispatch(
        addNotification({
          type: "success",
          message: "Password setup link sent to your email",
        }),
      );
    } catch (error) {
      dispatch(
        addNotification({
          type: "error",
          message: getApiErrorMessage(error),
        }),
      );
    }
  };

  const isPasswordValid =
    passwordData.newPassword.length >= 6 &&
    /[A-Z]/.test(passwordData.newPassword) &&
    /[a-z]/.test(passwordData.newPassword) &&
    /\d/.test(passwordData.newPassword);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          {translations?.profile?.title || "My Profile"}
        </h1>
        <p className="text-gray-600 mt-2">
          {translations?.profile?.description ||
            "Manage your account settings and preferences"}
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                {translations?.profile?.personalInformation ||
                  "Personal Information"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* User Info Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-lg">{user?.fullName}</h3>
                {user?.ward && (
                  <p className="text-sm text-gray-600">
                    Ward: {user.ward.name}
                  </p>
                )}
                {user?.department && (
                  <p className="text-sm text-gray-600">
                    Department: {user.department}
                  </p>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                {user?.ward && (
                  <div className="space-y-2">
                    <Label htmlFor="ward">Ward Assignment</Label>
                    <Input
                      id="ward"
                      value={formData.ward}
                      onChange={(e) =>
                        handleInputChange("ward", e.target.value)
                      }
                      disabled={!isEditing || user.role === "ward-officer"}
                    />
                  </div>
                )}

                {user?.department && (
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) =>
                        handleInputChange("department", e.target.value)
                      }
                      disabled={!isEditing || user.role === "maintenance"}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex space-x-4">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          fullName: user?.fullName || "",
                          email: user?.email || "",
                          phoneNumber: user?.phoneNumber || "",
                          language: user?.language || "en",
                          ward: user?.ward?.name || "",
                          department: user?.department || "",
                        });
                      }}
                    >
                      {translations?.common?.cancel || "Cancel"}
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={isLoading}>
                      <Save className="w-4 h-4 mr-2" />
                      {translations?.common?.save || "Save"}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    {translations?.common?.edit || "Edit"} Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                {!user?.hasPassword
                  ? "Set Up Password"
                  : translations?.profile?.changePassword || "Change Password"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Email Setup for Password Setup */}
              {!user?.hasPassword && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <AlertTriangle className="w-5 h-5 text-blue-600 mr-2" />
                    <h4 className="font-semibold text-blue-800">
                      Password Setup Required
                    </h4>
                  </div>
                  <p className="text-blue-700 mb-4">
                    We'll send you a secure link to set up your password.
                  </p>

                  {emailStep === "none" && (
                    <Button onClick={handleSendSetupEmail}>
                      Send Setup Link to {user?.email}
                    </Button>
                  )}

                  {emailStep === "sent" && (
                    <div className="space-y-4">
                      <div className="flex items-center text-green-700">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Setup link sent! Check your email.
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="setupToken">
                          Setup Token (from email)
                        </Label>
                        <Input
                          id="setupToken"
                          value={setupToken}
                          onChange={(e) => setSetupToken(e.target.value)}
                          placeholder="Enter token from email link"
                          className="w-full"
                        />
                        <p className="text-sm text-gray-600">
                          You can either click the link in your email to go to
                          the setup page, or copy the token from the link and
                          paste it here.
                        </p>
                        <Button
                          variant="outline"
                          onClick={handleSendSetupEmail}
                        >
                          Resend Email
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {user?.hasPassword && (
                <div className="space-y-4 mb-6">
                  <Label htmlFor="currentPassword">
                    {translations?.profile?.currentPassword ||
                      "Current Password"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        handlePasswordChange("currentPassword", e.target.value)
                      }
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <Label htmlFor="newPassword">
                  {translations?.profile?.newPassword || "New Password"}
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      handlePasswordChange("newPassword", e.target.value)
                    }
                    placeholder="Enter new password"
                    disabled={!user?.hasPassword && !setupToken}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() =>
                      setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                    }
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="confirmPassword">
                  {translations?.profile?.confirmPassword || "Confirm Password"}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      handlePasswordChange("confirmPassword", e.target.value)
                    }
                    placeholder="Confirm new password"
                    disabled={!user?.hasPassword && !setupToken}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        confirm: !prev.confirm,
                      }))
                    }
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm mb-2">
                  Password Requirements:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>At least 6 characters long</li>
                  <li>Contains at least one uppercase letter (A-Z)</li>
                  <li>Contains at least one lowercase letter (a-z)</li>
                  <li>Contains at least one number (0-9)</li>
                </ul>
              </div>

              <Button
                onClick={handlePasswordUpdate}
                disabled={
                  isChangingPassword ||
                  !isPasswordValid ||
                  passwordData.newPassword !== passwordData.confirmPassword
                }
                className="mt-6"
              >
                <Lock className="w-4 h-4 mr-2" />
                {isChangingPassword
                  ? !user?.hasPassword
                    ? "Setting Up..."
                    : "Changing..."
                  : !user?.hasPassword
                    ? "Set Up Password"
                    : translations?.profile?.changePassword ||
                      "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
