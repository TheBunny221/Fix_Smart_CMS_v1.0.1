import { jsx as _jsx } from "react/jsx-runtime";
import PlaceholderPage from "../components/PlaceholderPage";
import { AlertTriangle } from "lucide-react";
const NotFound = () => {
    return (_jsx(PlaceholderPage, { title: "Page Not Found", description: "The page you're looking for doesn't exist or has been moved.", icon: _jsx(AlertTriangle, { className: "h-12 w-12" }) }));
};
export default NotFound;
