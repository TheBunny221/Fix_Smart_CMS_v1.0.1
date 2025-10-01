import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "../components/ui/table";
import { Users, Search, UserCheck, Shield, Settings, Loader2, AlertTriangle, } from "lucide-react";
import { useLazyGetAllUsersQuery, useGetUserStatsQuery, useActivateUserMutation, useDeactivateUserMutation, useDeleteUserMutation, useCreateUserMutation, useUpdateUserMutation, } from "../store/api/adminApi";
import { useGetWardsQuery } from "../store/api/guestApi";
import { toast } from "../components/ui/use-toast";
const AdminUsers = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    // Dialog states
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    // Form states
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phoneNumber: "",
        role: "CITIZEN",
        wardId: "",
        department: "",
    });
    // Initialize filters from URL parameters
    useEffect(() => {
        const roleParam = searchParams.get("role");
        const statusParam = searchParams.get("status");
        if (roleParam) {
            setRoleFilter(roleParam);
        }
        if (statusParam) {
            setStatusFilter(statusParam);
        }
    }, [searchParams]);
    // Check authentication state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    useEffect(() => {
        const token = localStorage.getItem("token");
        setIsAuthenticated(!!token);
    }, []);
    // API queries - use lazy for users to prevent AbortErrors
    const [getAllUsers, { data: usersResponse, isLoading: isLoadingUsers, error: usersError },] = useLazyGetAllUsersQuery();
    // Use regular hook with skip for stats
    const { data: statsResponse, isLoading: isLoadingStats, error: statsError, } = useGetUserStatsQuery(undefined, {
        skip: !isAuthenticated,
    });
    // Trigger users query when authentication and parameters are ready
    useEffect(() => {
        if (isAuthenticated) {
            try {
                getAllUsers({
                    page,
                    limit,
                    role: roleFilter !== "all" ? roleFilter : undefined,
                    status: statusFilter,
                });
            }
            catch (error) {
                // Silently handle any errors from lazy query in Strict Mode
                console.debug("Lazy query error (likely from React Strict Mode):", error);
            }
        }
    }, [page, limit, roleFilter, statusFilter, isAuthenticated, getAllUsers]);
    // Manual refetch function
    const refetchUsers = () => {
        if (isAuthenticated) {
            try {
                getAllUsers({
                    page,
                    limit,
                    role: roleFilter !== "all" ? roleFilter : undefined,
                    status: statusFilter,
                });
            }
            catch (error) {
                // Silently handle any errors from lazy query
                console.debug("Lazy query refetch error:", error);
            }
        }
    };
    // Fetch wards for form dropdowns using RTK Query
    const { data: wardsResponse, isLoading: isLoadingWards, error: wardsError, } = useGetWardsQuery();
    // Extract wards data from the API response
    const wards = wardsResponse?.data || [];
    // Mutations
    const [activateUser] = useActivateUserMutation();
    const [deactivateUser] = useDeactivateUserMutation();
    const [deleteUser] = useDeleteUserMutation();
    const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
    const users = usersResponse?.data?.users || [];
    const pagination = usersResponse?.data?.pagination;
    const stats = statsResponse?.data;
    const getRoleColor = (role) => {
        switch (role) {
            case "ADMINISTRATOR":
                return "bg-red-100 text-red-800";
            case "WARD_OFFICER":
                return "bg-blue-100 text-blue-800";
            case "MAINTENANCE_TEAM":
                return "bg-green-100 text-green-800";
            case "CITIZEN":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };
    const getRoleIcon = (role) => {
        switch (role) {
            case "ADMINISTRATOR":
                return _jsx(Shield, { className: "h-4 w-4" });
            case "WARD_OFFICER":
                return _jsx(UserCheck, { className: "h-4 w-4" });
            case "MAINTENANCE_TEAM":
                return _jsx(Settings, { className: "h-4 w-4" });
            case "CITIZEN":
                return _jsx(Users, { className: "h-4 w-4" });
            default:
                return _jsx(Users, { className: "h-4 w-4" });
        }
    };
    const handleActivateUser = async (userId) => {
        try {
            await activateUser(userId).unwrap();
            toast({
                title: "Success",
                description: "User activated successfully",
            });
            refetchUsers();
        }
        catch (error) {
            toast({
                title: "Error",
                description: error?.data?.message || "Failed to activate user",
                variant: "destructive",
            });
        }
    };
    const handleDeactivateUser = async (userId) => {
        try {
            await deactivateUser(userId).unwrap();
            toast({
                title: "Success",
                description: "User deactivated successfully",
            });
            refetchUsers();
        }
        catch (error) {
            toast({
                title: "Error",
                description: error?.data?.message || "Failed to deactivate user",
                variant: "destructive",
            });
        }
    };
    const handleDeleteUser = async (userId) => {
        if (window.confirm("Are you sure you want to delete this user?")) {
            try {
                await deleteUser(userId).unwrap();
                toast({
                    title: "Success",
                    description: "User deleted successfully",
                });
                refetchUsers();
            }
            catch (error) {
                toast({
                    title: "Error",
                    description: error?.data?.message || "Failed to delete user",
                    variant: "destructive",
                });
            }
        }
    };
    const handleResetFilters = () => {
        setSearchTerm("");
        setRoleFilter("all");
        setStatusFilter("all");
        setPage(1);
        // Update URL parameters
        setSearchParams({});
    };
    // Handle filter changes and update URL
    const handleRoleFilterChange = (role) => {
        setRoleFilter(role);
        const newParams = new URLSearchParams(searchParams);
        if (role !== "all") {
            newParams.set("role", role);
        }
        else {
            newParams.delete("role");
        }
        setSearchParams(newParams);
    };
    const handleStatusFilterChange = (status) => {
        setStatusFilter(status);
        const newParams = new URLSearchParams(searchParams);
        if (status !== "all") {
            newParams.set("status", status);
        }
        else {
            newParams.delete("status");
        }
        setSearchParams(newParams);
    };
    // Form handlers
    const handleOpenAddDialog = () => {
        setFormData({
            fullName: "",
            email: "",
            phoneNumber: "",
            role: "CITIZEN",
            wardId: "",
            department: "",
        });
        setIsAddDialogOpen(true);
    };
    const handleOpenEditDialog = (user) => {
        setEditingUser(user);
        setFormData({
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber || "",
            role: user.role,
            wardId: user.wardId || "",
            department: user.department || "",
        });
        setIsEditDialogOpen(true);
    };
    const [formErrors, setFormErrors] = useState({});
    const handleCloseDialogs = () => {
        setIsAddDialogOpen(false);
        setIsEditDialogOpen(false);
        setEditingUser(null);
        setFormData({
            fullName: "",
            email: "",
            phoneNumber: "",
            role: "CITIZEN",
            wardId: "",
            department: "",
        });
        setFormErrors({});
    };
    const validateForm = () => {
        const errors = {};
        if (!formData.fullName || formData.fullName.trim().length < 3) {
            errors.fullName = "Full name must be at least 3 characters.";
        }
        if (!formData.email) {
            errors.email = "Email is required.";
        }
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "Please enter a valid email address.";
        }
        if (!formData.role) {
            errors.role = "Role is required.";
        }
        // If role is maintenance team, department is required
        if (formData.role === "MAINTENANCE_TEAM" && !formData.department) {
            errors.department = "Department is required for maintenance team users.";
        }
        return errors;
    };
    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            // show a toast as well
            toast({
                title: "Validation errors",
                description: "Please fix the highlighted fields before submitting.",
                variant: "destructive",
            });
            return;
        }
        try {
            if (editingUser) {
                // Update user
                await updateUser({
                    id: editingUser.id,
                    data: formData,
                }).unwrap();
                toast({ title: "Success", description: "User updated successfully" });
            }
            else {
                // Create user
                await createUser(formData).unwrap();
                toast({ title: "Success", description: "User created successfully" });
            }
            handleCloseDialogs();
            refetchUsers();
        }
        catch (error) {
            // If backend returns structured field errors, show them
            const msg = error?.data?.message || error?.message || "Unexpected error";
            if (error?.data?.errors && typeof error.data.errors === "object") {
                setFormErrors(error.data.errors);
            }
            toast({ title: "Error", description: msg, variant: "destructive" });
        }
    };
    // Export users as JSON (respects role/status filters; applies search locally)
    const handleExportUsers = async () => {
        try {
            const params = new URLSearchParams();
            if (roleFilter !== "all")
                params.append("role", roleFilter);
            if (statusFilter)
                params.append("status", statusFilter);
            const token = localStorage.getItem("token");
            const res = await fetch(`/api/admin/users/export?${params.toString()}`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const json = await res.json();
            const allUsers = json?.data?.users || [];
            const searched = searchTerm
                ? allUsers.filter((u) => u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                : allUsers;
            const blob = new Blob([JSON.stringify(searched, null, 2)], {
                type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `users-${new Date().toISOString()}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        }
        catch (e) {
            toast({
                title: "Export failed",
                description: "Could not export users",
                variant: "destructive",
            });
        }
    };
    // Filter users locally based on search term
    const filteredUsers = users.filter((user) => {
        const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });
    if (usersError || statsError) {
        return (_jsx("div", { className: "space-y-6", children: _jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "text-center", children: [_jsx(AlertTriangle, { className: "h-12 w-12 text-red-500 mx-auto mb-4" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Error Loading Data" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Failed to load user data. Please try again." }), _jsx(Button, { onClick: () => refetchUsers(), children: "Retry" })] }) }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "User Management" }), _jsx("p", { className: "text-gray-600", children: "Manage all users in the system" })] }), _jsx(Button, { onClick: handleOpenAddDialog, variant: "default", children: "Add New User" }), _jsx(Button, { onClick: handleExportUsers, variant: "outline", children: "Export Users" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-4", children: [_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Total Users" }), _jsx("p", { className: "text-2xl font-bold", children: isLoadingStats ? (_jsx(Loader2, { className: "h-6 w-6 animate-spin" })) : (stats?.totalUsers || 0) })] }), _jsx(Users, { className: "h-8 w-8 text-blue-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Active Users" }), _jsx("p", { className: "text-2xl font-bold text-green-600", children: isLoadingStats ? (_jsx(Loader2, { className: "h-6 w-6 animate-spin" })) : (stats?.activeUsers || 0) })] }), _jsx(UserCheck, { className: "h-8 w-8 text-green-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Citizens" }), _jsx("p", { className: "text-2xl font-bold", children: isLoadingStats ? (_jsx(Loader2, { className: "h-6 w-6 animate-spin" })) : (stats?.usersByRole?.find((role) => role.role === "CITIZEN")
                                                    ?._count || 0) })] }), _jsx(Users, { className: "h-8 w-8 text-gray-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Ward Officers" }), _jsx("p", { className: "text-2xl font-bold", children: isLoadingStats ? (_jsx(Loader2, { className: "h-6 w-6 animate-spin" })) : (stats?.usersByRole?.find((role) => role.role === "WARD_OFFICER")?._count || 0) })] }), _jsx(UserCheck, { className: "h-8 w-8 text-blue-600" })] }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: "Maintenance" }), _jsx("p", { className: "text-2xl font-bold", children: isLoadingStats ? (_jsx(Loader2, { className: "h-6 w-6 animate-spin" })) : (stats?.usersByRole?.find((role) => role.role === "MAINTENANCE_TEAM")?._count || 0) })] }), _jsx(Settings, { className: "h-8 w-8 text-green-600" })] }) }) })] }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-3 h-4 w-4 text-gray-400" }), _jsx(Input, { placeholder: "Search users...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10" })] }), _jsxs(Select, { value: roleFilter, onValueChange: handleRoleFilterChange, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Filter by role" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Roles" }), _jsx(SelectItem, { value: "CITIZEN", children: "Citizens" }), _jsx(SelectItem, { value: "WARD_OFFICER", children: "Ward Officers" }), _jsx(SelectItem, { value: "MAINTENANCE_TEAM", children: "Maintenance Team" }), _jsx(SelectItem, { value: "ADMINISTRATOR", children: "Administrators" })] })] }), _jsxs(Select, { value: statusFilter, onValueChange: handleStatusFilterChange, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Filter by status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), _jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "inactive", children: "Inactive" })] })] }), _jsx(Button, { variant: "outline", onClick: handleResetFilters, children: "Reset Filters" })] }) }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Users, { className: "h-5 w-5 mr-2" }), "Users (", pagination?.total || 0, ")"] }) }), _jsxs(CardContent, { children: [isLoadingUsers ? (_jsxs("div", { className: "flex justify-center items-center py-8", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin" }), _jsx("span", { className: "ml-2", children: "Loading users..." })] })) : (_jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "User" }), _jsx(TableHead, { children: "Role" }), _jsx(TableHead, { children: "Ward" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Complaints" })] }) }), _jsx(TableBody, { children: filteredUsers.map((user) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: user.fullName }), _jsx("p", { className: "text-sm text-gray-500", children: user.email }), user.phoneNumber && (_jsx("p", { className: "text-sm text-gray-500", children: user.phoneNumber }))] }) }), _jsx(TableCell, { children: _jsx(Badge, { className: getRoleColor(user.role), children: _jsxs("span", { className: "flex items-center", children: [getRoleIcon(user.role), _jsx("span", { className: "ml-1", children: user.role.replace("_", " ") })] }) }) }), _jsx(TableCell, { children: user.ward?.name || "No ward assigned" }), _jsx(TableCell, { children: _jsx(Badge, { className: user.isActive
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800", children: user.isActive ? "Active" : "Inactive" }) }), _jsx(TableCell, { children: _jsxs("div", { className: "text-sm", children: [_jsxs("p", { children: ["Submitted: ", user._count?.submittedComplaints || 0] }), _jsxs("p", { children: ["Assigned: ", user._count?.assignedComplaints || 0] })] }) })] }, user.id))) })] })), pagination && pagination.pages > 1 && (_jsxs("div", { className: "flex items-center justify-between space-x-2 py-4", children: [_jsxs("div", { className: "text-sm text-gray-500", children: ["Showing ", (pagination.page - 1) * pagination.limit + 1, " to", " ", Math.min(pagination.page * pagination.limit, pagination.total), " ", "of ", pagination.total, " entries"] }), _jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(page - 1), disabled: page <= 1, children: "Previous" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setPage(page + 1), disabled: page >= pagination.pages, children: "Next" })] })] }))] })] }), _jsx(Dialog, { open: isAddDialogOpen, onOpenChange: setIsAddDialogOpen, children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Add New User" }), _jsx(DialogDescription, { children: "Create a new user account in the system." })] }), _jsxs("form", { onSubmit: handleFormSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "fullName", children: "Full Name" }), _jsx(Input, { id: "fullName", value: formData.fullName, onChange: (e) => setFormData({ ...formData, fullName: e.target.value }), placeholder: "Enter full name", required: true, "aria-invalid": !!formErrors.fullName }), formErrors.fullName && (_jsx("p", { className: "text-sm text-red-600 mt-1", children: formErrors.fullName }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { id: "email", type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), placeholder: "Enter email address", required: true, "aria-invalid": !!formErrors.email }), formErrors.email && (_jsx("p", { className: "text-sm text-red-600 mt-1", children: formErrors.email }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "phoneNumber", children: "Phone Number" }), _jsx(Input, { id: "phoneNumber", value: formData.phoneNumber, onChange: (e) => setFormData({ ...formData, phoneNumber: e.target.value }), placeholder: "Enter phone number" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "role", children: "Role" }), _jsxs(Select, { value: formData.role, onValueChange: (value) => setFormData({ ...formData, role: value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select role" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "CITIZEN", children: "Citizen" }), _jsx(SelectItem, { value: "WARD_OFFICER", children: "Ward Officer" }), _jsx(SelectItem, { value: "MAINTENANCE_TEAM", children: "Maintenance Team" }), _jsx(SelectItem, { value: "ADMINISTRATOR", children: "Administrator" })] })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "ward", children: "Ward" }), _jsxs(Select, { value: formData.wardId || "none", onValueChange: (value) => setFormData({
                                                ...formData,
                                                wardId: value === "none" ? "" : value,
                                            }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select ward (optional)" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "No ward assigned" }), wards.map((ward) => (_jsx(SelectItem, { value: ward.id, children: ward.name }, ward.id)))] })] })] }), formData.role === "MAINTENANCE_TEAM" && (_jsxs("div", { children: [_jsx(Label, { htmlFor: "department", children: "Department" }), _jsx(Input, { id: "department", value: formData.department, onChange: (e) => setFormData({ ...formData, department: e.target.value }), placeholder: "Enter department", "aria-invalid": !!formErrors.department }), formErrors.department && (_jsx("p", { className: "text-sm text-red-600 mt-1", children: formErrors.department }))] })), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: handleCloseDialogs, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isCreating, children: isCreating ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), "Creating..."] })) : ("Create User") })] })] })] }) }), _jsx(Dialog, { open: isEditDialogOpen, onOpenChange: setIsEditDialogOpen, children: _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Edit User" }), _jsx(DialogDescription, { children: "Update user information." })] }), _jsxs("form", { onSubmit: handleFormSubmit, className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "editFullName", children: "Full Name" }), _jsx(Input, { id: "editFullName", value: formData.fullName, onChange: (e) => setFormData({ ...formData, fullName: e.target.value }), placeholder: "Enter full name", required: true })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "editEmail", children: "Email" }), _jsx(Input, { id: "editEmail", type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), placeholder: "Enter email address", required: true })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "editPhoneNumber", children: "Phone Number" }), _jsx(Input, { id: "editPhoneNumber", value: formData.phoneNumber, onChange: (e) => setFormData({ ...formData, phoneNumber: e.target.value }), placeholder: "Enter phone number" })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "editRole", children: "Role" }), _jsxs(Select, { value: formData.role, onValueChange: (value) => setFormData({ ...formData, role: value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select role" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "CITIZEN", children: "Citizen" }), _jsx(SelectItem, { value: "WARD_OFFICER", children: "Ward Officer" }), _jsx(SelectItem, { value: "MAINTENANCE_TEAM", children: "Maintenance Team" }), _jsx(SelectItem, { value: "ADMINISTRATOR", children: "Administrator" })] })] }), formErrors.role && (_jsx("p", { className: "text-sm text-red-600 mt-1", children: formErrors.role }))] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "editWard", children: "Ward" }), _jsxs(Select, { value: formData.wardId || "none", onValueChange: (value) => setFormData({
                                                ...formData,
                                                wardId: value === "none" ? "" : value,
                                            }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select ward (optional)" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "none", children: "No ward assigned" }), wards.map((ward) => (_jsx(SelectItem, { value: ward.id, children: ward.name }, ward.id)))] })] })] }), formData.role === "MAINTENANCE_TEAM" && (_jsxs("div", { children: [_jsx(Label, { htmlFor: "editDepartment", children: "Department" }), _jsx(Input, { id: "editDepartment", value: formData.department, onChange: (e) => setFormData({ ...formData, department: e.target.value }), placeholder: "Enter department", "aria-invalid": !!formErrors.department }), formErrors.department && (_jsx("p", { className: "text-sm text-red-600 mt-1", children: formErrors.department }))] })), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "outline", onClick: handleCloseDialogs, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isUpdating, children: isUpdating ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), "Updating..."] })) : ("Update User") })] })] })] }) })] }));
};
export default AdminUsers;
