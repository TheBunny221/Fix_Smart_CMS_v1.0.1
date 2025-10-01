import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Navigation from "../Navigation";
import SimplifiedSidebarNav from "../ui/simplified-sidebar-nav";
import { useAppSelector } from "../../store/hooks";
import { cn } from "../../lib/utils";
export const UnifiedLayout = ({ children, className, }) => {
    const { isSidebarCollapsed } = useAppSelector((state) => state.ui);
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(Navigation, {}), _jsxs("div", { className: "pt-16", children: [isAuthenticated && (_jsx("div", { className: cn("hidden md:block fixed top-16 bottom-0 left-0 z-30", isSidebarCollapsed ? "w-16" : "w-64"), children: _jsx(SimplifiedSidebarNav, { className: "h-full" }) })), _jsx("main", { className: cn("overflow-auto", "p-4 md:p-6", "min-h-[calc(100vh-4rem)]", isAuthenticated
                            ? isSidebarCollapsed
                                ? "md:ml-16"
                                : "md:ml-64"
                            : "", className), children: children })] })] }));
};
export default UnifiedLayout;
