import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAppSelector } from "../store/hooks";
import AdminDashboard from "../pages/AdminDashboard";
import CitizenDashboard from "../pages/CitizenDashboard";
import WardOfficerDashboard from "../pages/WardOfficerDashboard";
import MaintenanceTasks from "../pages/MaintenanceTasks";
import Unauthorized from "../pages/Unauthorized";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { AlertTriangle } from "lucide-react";
const RoleBasedDashboard = () => {
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const { translations } = useAppSelector((state) => state.language);
    if (!isAuthenticated || !user) {
        return _jsx(Unauthorized, {});
    }
    // Route to appropriate dashboard based on user role
    switch (user.role) {
        case "ADMINISTRATOR":
            return _jsx(AdminDashboard, {});
        case "CITIZEN":
            return _jsx(CitizenDashboard, {});
        case "WARD_OFFICER":
            return _jsx(WardOfficerDashboard, {});
        case "MAINTENANCE_TEAM":
            return _jsx(MaintenanceTasks, {});
        default:
            return (_jsx("div", { className: "flex items-center justify-center min-h-screen p-4", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4", children: _jsx(AlertTriangle, { className: "h-6 w-6 text-yellow-600" }) }), _jsx(CardTitle, { className: "text-xl", children: translations?.messages?.unauthorizedAccess || "Unknown Role" })] }), _jsxs(CardContent, { className: "text-center space-y-4", children: [_jsxs("p", { className: "text-gray-600", children: [translations?.auth?.role || "Role", ":", _jsx(Badge, { variant: "outline", className: "ml-2", children: user.role })] }), _jsx("p", { className: "text-sm text-gray-500", children: translations?.messages?.unauthorizedAccess ||
                                        "Your role is not recognized. Please contact system administrator." })] })] }) }));
    }
};
export default RoleBasedDashboard;
