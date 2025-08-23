import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { getDashboardRouteForRole } from "../store/slices/authSlice";
import QuickComplaintForm from "../components/QuickComplaintForm";

const QuickComplaintPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  const handleSuccess = (complaintId) => {
    if (isAuthenticated && user) {
      // Navigate to role-based dashboard
      navigate(getDashboardRouteForRole(user.role));
    } else {
      // For guest users, navigate to home page
      navigate("/");
    }
  };

  const handleClose = () => {
    // Go back to previous page, or home if no history
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return ({/* Header */}
        
          
            {translations?.complaints?.registerComplaint ||
              "Submit a Complaint"}
          
          
            {isAuthenticated
              ? "Report civic issues using your citizen account"
              );
};

export default QuickComplaintPage;
