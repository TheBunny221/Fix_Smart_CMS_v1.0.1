import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger, } from "../components/ui/tabs";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { updateProfile, setCredentials } from "../store/slices/authSlice";
import { addNotification } from "../store/slices/uiSlice";
import { useSendPasswordSetupEmailMutation, useSetPasswordMutation, useChangePasswordMutation, useGetCurrentUserQuery, } from "../store/api/authApi";
import { getApiErrorMessage } from "../store/api/baseApi";
import { User, Mail, Phone, MapPin, Shield, Save, Eye, EyeOff, Lock, AlertTriangle, RefreshCw, } from "lucide-react";
const Profile = () => {
    const dispatch = useAppDispatch();
    const { user, isLoading, token } = useAppSelector((state) => state.auth);
    const { translations } = useAppSelector((state) => state.language);
    // API mutations
    const [sendPasswordSetupEmail] = useSendPasswordSetupEmailMutation();
    const [setPassword] = useSetPasswordMutation();
    const [changePassword] = useChangePasswordMutation();
    const { refetch: refetchCurrentUser } = useGetCurrentUserQuery(undefined);
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
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [activeTab, setActiveTab] = useState("personal");
    const [emailStep, setEmailStep] = useState("none");
    const [setupToken, setSetupToken] = useState("");
    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };
    const handlePasswordChange = (field, value) => {
        setPasswordData((prev) => ({ ...prev, [field]: value }));
    };
    const handleSendPasswordSetupEmail = async () => {
        try {
            // Always re-check with backend to avoid stale state
            const me = await refetchCurrentUser().unwrap();
            const backendHasPassword = !!me?.data?.user?.hasPassword;
            if (backendHasPassword) {
                dispatch(addNotification({
                    type: "warning",
                    title: "Password Already Set",
                    message: "You have already set a password. Please use the Change Password option instead.",
                }));
                setActiveTab("security");
                return;
            }
            const response = await sendPasswordSetupEmail({
                email: user?.email || "",
            }).unwrap();
            setEmailStep("sent");
            dispatch(addNotification({
                type: "success",
                title: "Email Sent",
                message: "Password setup link has been sent to your email address",
            }));
            // In development, show the token for testing
            if (process.env.NODE_ENV === "development" && response?.data?.resetUrl) {
                const token = response.data.resetUrl.split("/").pop();
                if (token) {
                    setSetupToken(token);
                    dispatch(addNotification({
                        type: "info",
                        title: "Development Mode",
                        message: `For testing, you can use token: ${token}`,
                    }));
                }
            }
        }
        catch (error) {
            dispatch(addNotification({
                type: "error",
                title: "Error",
                message: error?.data?.message || "Failed to send password setup email",
            }));
        }
    };
    const handleSaveProfile = async () => {
        try {
            await dispatch(updateProfile(formData)).unwrap();
            dispatch(addNotification({
                type: "success",
                title: translations?.common?.success || "Success",
                message: translations?.profile?.profileUpdated ||
                    "Profile updated successfully",
            }));
            setIsEditing(false);
        }
        catch (error) {
            dispatch(addNotification({
                type: "error",
                title: translations?.common?.error || "Error",
                message: error instanceof Error ? error.message : "Update failed",
            }));
        }
    };
    const handleChangePassword = async () => {
        // Validate password match
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            dispatch(addNotification({
                type: "error",
                title: translations?.common?.error || "Error",
                message: translations?.profile?.passwordMismatch || "Passwords do not match",
            }));
            return;
        }
        // Validate password strength
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
        if (!passwordRegex.test(passwordData.newPassword)) {
            dispatch(addNotification({
                type: "error",
                title: "Invalid Password",
                message: "Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
            }));
            return;
        }
        // For password setup, require token
        if (!user?.hasPassword && !setupToken) {
            dispatch(addNotification({
                type: "error",
                title: "Token Required",
                message: "Please get the setup token from your email first",
            }));
            return;
        }
        // Validate current password is provided (only for password change, not setup)
        if (user?.hasPassword && !passwordData.currentPassword) {
            dispatch(addNotification({
                type: "error",
                title: translations?.common?.error || "Error",
                message: "Current password is required",
            }));
            return;
        }
        setIsChangingPassword(true);
        try {
            if (!user?.hasPassword) {
                // Password setup with token
                await setPassword({
                    token: setupToken,
                    password: passwordData.newPassword,
                }).unwrap();
            }
            else {
                // Regular password change
                await changePassword({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }).unwrap();
            }
            dispatch(addNotification({
                type: "success",
                title: translations?.common?.success || "Success",
                message: !user?.hasPassword
                    ? "Password set up successfully"
                    : translations?.profile?.passwordChanged ||
                        "Password changed successfully",
            }));
            // Immediately refresh profile to update hasPassword flag and store
            try {
                const me = await refetchCurrentUser().unwrap();
                const refreshedUser = me?.data?.user;
                if (refreshedUser) {
                    dispatch(setCredentials({
                        token: token || localStorage.getItem("token") || "",
                        user: refreshedUser,
                    }));
                }
                else if (user && !user.hasPassword) {
                    // Fallback: optimistically set hasPassword=true if API didn't return user
                    dispatch(setCredentials({
                        token: token || localStorage.getItem("token") || "",
                        user: { ...user, hasPassword: true },
                    }));
                }
            }
            catch (e) {
                // As a fallback, optimistically update local state
                if (user && !user.hasPassword) {
                    dispatch(setCredentials({
                        token: token || localStorage.getItem("token") || "",
                        user: { ...user, hasPassword: true },
                    }));
                }
            }
            // Reset form and email state
            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
            setEmailStep("none");
            setSetupToken("");
        }
        catch (error) {
            console.error("Password change error:", error);
            // Use safe error message extraction to avoid response body issues
            const errorMessage = getApiErrorMessage(error) || "Failed to change password";
            dispatch(addNotification({
                type: "error",
                title: "Password Change Failed",
                message: errorMessage,
            }));
        }
        finally {
            setIsChangingPassword(false);
        }
    };
    if (!user) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("p", { className: "text-muted-foreground", children: "Please login to view your profile" }) }));
    }
    // Show loading state only if user is still loading
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" }), _jsx("p", { className: "mt-2", children: "Loading..." })] }) }));
    }
    return (_jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: translations?.nav?.profile || "Profile" }), _jsx("p", { className: "text-muted-foreground", children: "Manage your account information and preferences" })] }) }), !user?.hasPassword && (_jsx(Card, { className: "border-orange-200 bg-orange-50", children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-start space-x-4", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(AlertTriangle, { className: "h-6 w-6 text-orange-600" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-sm font-medium text-orange-800", children: "Password Setup Required" }), _jsx("p", { className: "mt-1 text-sm text-orange-700", children: "Your account was created without a password. Please set up a password to secure your account." }), _jsx("div", { className: "mt-4", children: _jsx(Button, { onClick: () => setActiveTab("security"), className: "bg-orange-600 hover:bg-orange-700", size: "sm", children: "Set Up Password Now" }) })] })] }) }) })), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [_jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [_jsx(TabsTrigger, { value: "personal", children: translations?.profile?.personalInformation ||
                                    "Personal Information" }), _jsx(TabsTrigger, { value: "security", children: "Security" })] }), _jsx(TabsContent, { value: "personal", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(User, { className: "h-5 w-5" }), _jsx("span", { children: translations?.profile?.personalInformation ||
                                                    "Personal Information" })] }) }), _jsxs(CardContent, { className: "space-y-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-xl font-semibold", children: user.fullName }), user.ward && (_jsxs("p", { className: "text-sm text-muted-foreground flex items-center", children: [_jsx(MapPin, { className: "h-4 w-4 mr-1" }), user.ward.name] })), user.department && (_jsxs("p", { className: "text-sm text-muted-foreground flex items-center", children: [_jsx(Shield, { className: "h-4 w-4 mr-1" }), user.department] }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "fullName", children: "Full Name" }), _jsx(Input, { id: "fullName", value: formData.fullName, onChange: (e) => handleInputChange("fullName", e.target.value), disabled: !isEditing })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" }), _jsx(Input, { id: "email", type: "email", value: formData.email, onChange: (e) => handleInputChange("email", e.target.value), disabled: !isEditing, className: "pl-10" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "phoneNumber", children: "Phone Number" }), _jsxs("div", { className: "relative", children: [_jsx(Phone, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" }), _jsx(Input, { id: "phoneNumber", value: formData.phoneNumber, onChange: (e) => handleInputChange("phoneNumber", e.target.value), disabled: !isEditing, className: "pl-10" })] })] }), user.ward && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "ward", children: "Ward Assignment" }), _jsx(Input, { id: "ward", value: formData.ward, onChange: (e) => handleInputChange("ward", e.target.value), disabled: !isEditing || user.role !== "ward-officer" })] })), user.department && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "department", children: "Department" }), _jsx(Input, { id: "department", value: formData.department, onChange: (e) => handleInputChange("department", e.target.value), disabled: !isEditing || user.role !== "maintenance" })] }))] }), _jsx("div", { className: "flex justify-end space-x-2", children: isEditing ? (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", onClick: () => {
                                                            setIsEditing(false);
                                                            setFormData({
                                                                fullName: user.fullName,
                                                                email: user.email,
                                                                phoneNumber: user.phoneNumber || "",
                                                                language: user.language || "en",
                                                                ward: user.ward?.name || "",
                                                                department: user.department || "",
                                                            });
                                                        }, children: translations?.common?.cancel || "Cancel" }), _jsxs(Button, { onClick: handleSaveProfile, disabled: isLoading, children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), translations?.common?.save || "Save"] })] })) : (_jsxs(Button, { onClick: () => setIsEditing(true), children: [translations?.common?.edit || "Edit", " Profile"] })) })] })] }) }), _jsx(TabsContent, { value: "security", className: "space-y-6", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-2", children: [_jsx(Lock, { className: "h-5 w-5" }), _jsx("span", { children: !user?.hasPassword
                                                    ? "Set Up Password"
                                                    : translations?.profile?.changePassword ||
                                                        "Change Password" })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [!user?.hasPassword && (_jsxs("div", { className: "space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "font-medium text-blue-900", children: "Password Setup Required" }), _jsx("p", { className: "text-sm text-blue-700", children: "We'll send you a secure link to set up your password." })] }), emailStep === "none" && (_jsxs(Button, { onClick: handleSendPasswordSetupEmail, className: "w-full bg-blue-600 hover:bg-blue-700", children: ["Send Setup Link to ", user?.email] })), emailStep === "sent" && (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center space-x-2 text-green-700", children: [_jsx("div", { className: "h-2 w-2 bg-green-500 rounded-full" }), _jsx("span", { className: "text-sm font-medium", children: "Setup link sent! Check your email." })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "setupToken", children: "Setup Token (from email)" }), _jsx(Input, { id: "setupToken", value: setupToken, onChange: (e) => setSetupToken(e.target.value), placeholder: "Enter token from email link", className: "w-full" }), _jsx("p", { className: "text-xs text-gray-500", children: "You can either click the link in your email to go to the setup page, or copy the token from the link and paste it here." }), _jsx(Button, { variant: "outline", size: "sm", onClick: handleSendPasswordSetupEmail, className: "mt-2", children: "Resend Email" })] })] }))] })), user?.hasPassword && (_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "currentPassword", children: translations?.profile?.currentPassword ||
                                                        "Current Password" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { id: "currentPassword", type: showPasswords.current ? "text" : "password", value: passwordData.currentPassword, onChange: (e) => handlePasswordChange("currentPassword", e.target.value), placeholder: "Enter current password" }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "absolute right-2 top-1/2 transform -translate-y-1/2", onClick: () => setShowPasswords((prev) => ({
                                                                ...prev,
                                                                current: !prev.current,
                                                            })), children: showPasswords.current ? (_jsx(EyeOff, { className: "h-4 w-4" })) : (_jsx(Eye, { className: "h-4 w-4" })) })] })] })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "newPassword", children: translations?.profile?.newPassword || "New Password" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { id: "newPassword", type: showPasswords.new ? "text" : "password", value: passwordData.newPassword, onChange: (e) => handlePasswordChange("newPassword", e.target.value), placeholder: "Enter new password", disabled: !user?.hasPassword && !setupToken }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "absolute right-2 top-1/2 transform -translate-y-1/2", onClick: () => setShowPasswords((prev) => ({ ...prev, new: !prev.new })), children: showPasswords.new ? (_jsx(EyeOff, { className: "h-4 w-4" })) : (_jsx(Eye, { className: "h-4 w-4" })) })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "confirmPassword", children: translations?.profile?.confirmPassword || "Confirm Password" }), _jsxs("div", { className: "relative", children: [_jsx(Input, { id: "confirmPassword", type: showPasswords.confirm ? "text" : "password", value: passwordData.confirmPassword, onChange: (e) => handlePasswordChange("confirmPassword", e.target.value), placeholder: "Confirm new password", disabled: !user?.hasPassword && !setupToken }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "absolute right-2 top-1/2 transform -translate-y-1/2", onClick: () => setShowPasswords((prev) => ({
                                                                ...prev,
                                                                confirm: !prev.confirm,
                                                            })), children: showPasswords.confirm ? (_jsx(EyeOff, { className: "h-4 w-4" })) : (_jsx(Eye, { className: "h-4 w-4" })) })] })] }), _jsxs("div", { className: "text-sm text-gray-600 space-y-1", children: [_jsx("p", { className: "font-medium", children: "Password Requirements:" }), _jsxs("ul", { className: "list-disc list-inside space-y-1 text-xs", children: [_jsx("li", { children: "At least 6 characters long" }), _jsx("li", { children: "Contains at least one uppercase letter (A-Z)" }), _jsx("li", { children: "Contains at least one lowercase letter (a-z)" }), _jsx("li", { children: "Contains at least one number (0-9)" })] })] }), _jsx(Button, { onClick: handleChangePassword, className: "w-full", disabled: isChangingPassword ||
                                                (!user?.hasPassword && !setupToken) ||
                                                (user?.hasPassword && !passwordData.currentPassword) ||
                                                !passwordData.newPassword ||
                                                !passwordData.confirmPassword, children: isChangingPassword ? (_jsxs("div", { className: "flex items-center", children: [_jsx(RefreshCw, { className: "h-4 w-4 mr-2 animate-spin" }), !user?.hasPassword ? "Setting Up..." : "Changing..."] })) : !user?.hasPassword ? ("Set Up Password") : (translations?.profile?.changePassword || "Change Password") })] })] }) })] })] }));
};
export default Profile;
