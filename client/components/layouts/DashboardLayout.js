import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Navigation from "../Navigation";
import SimplifiedSidebarNav from "../ui/simplified-sidebar-nav";
import { cn } from "../../lib/utils";
export const DashboardLayout = ({ children, className, }) => {
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Navigation, {}), _jsxs("div", { className: "flex pt-16", children: [_jsx("div", { className: "sticky top-0 h-[calc(100vh-4rem)] overflow-y-auto", children: _jsx(SimplifiedSidebarNav, {}) }), _jsx("main", { className: cn("flex-1 p-6 overflow-auto", className), children: children })] })] }));
};
export default DashboardLayout;
