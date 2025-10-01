import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { getDashboardRouteForRole } from "../store/slices/authSlice";
import QuickComplaintForm from "../components/QuickComplaintForm";
const QuickComplaintPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const { translations } = useAppSelector((state) => state.language);
    const handleSuccess = (complaintId) => {
        if (isAuthenticated && user) {
            // Navigate to role-based dashboard
            navigate(getDashboardRouteForRole(user.role));
        }
        else {
            // For guest users, navigate to home page
            navigate("/");
        }
    };
    const handleClose = () => {
        // Go back to previous page, or home if no history
        if (window.history.length > 1) {
            navigate(-1);
        }
        else {
            navigate("/");
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "text-center space-y-2 mb-6", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: translations?.complaints?.registerComplaint ||
                                "Submit a Complaint" }), _jsx("p", { className: "text-gray-600", children: isAuthenticated
                                ? "Report civic issues using your citizen account"
                                : "Report civic issues and get them resolved quickly" })] }), _jsx(QuickComplaintForm, { onSuccess: handleSuccess, onClose: handleClose })] }) }));
};
export default QuickComplaintPage;
