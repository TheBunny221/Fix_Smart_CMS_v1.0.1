import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { FileText, User, Clock, BarChart3, Shield, CheckCircle, } from "lucide-react";
import QuickComplaintForm from "../components/QuickComplaintForm";
import QuickTrackForm from "../components/QuickTrackForm";
import ContactInfoCard from "../components/ContactInfoCard";
const Index = () => {
    const { translations, currentLanguage } = useAppSelector((state) => state.language);
    const { user, isAuthenticated } = useAppSelector((state) => state.auth);
    const { appName, getConfig } = useSystemConfig();
    const navigate = useNavigate();
    // Form state
    const [isFormExpanded, setIsFormExpanded] = useState(false);
    const [isTrackExpanded, setIsTrackExpanded] = useState(false);
    // Redirect authenticated users to dashboard
    useEffect(() => {
        if (isAuthenticated && user) {
            navigate("/dashboard", { replace: true });
        }
    }, [isAuthenticated, user, navigate]);
    // Show loading if translations not ready
    if (!translations) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" }), _jsx("p", { className: "mt-2", children: translations?.common?.loading || "Loading..." })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100", children: [_jsx("div", { className: "bg-white shadow-sm", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12", children: _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "flex items-center justify-center mb-4", children: [_jsx(Shield, { className: "h-12 w-12 text-primary mr-3" }), _jsx("h1", { className: "text-4xl font-bold text-gray-900", children: translations?.nav?.home || `${appName} Portal` })] }), _jsx("p", { className: "text-lg text-gray-600 mb-8 max-w-3xl mx-auto", children: translations?.guest?.guestSubmissionDescription ||
                                    `Welcome to the ${appName} Complaint Management System. Submit civic issues, track progress, and help build a better city together.` }), _jsxs("div", { className: "flex justify-center space-x-4 flex-wrap gap-4 mb-8", children: [_jsxs(Button, { onClick: () => {
                                            setIsFormExpanded((v) => !v);
                                            setIsTrackExpanded(false);
                                        }, size: "lg", variant: "default", className: "transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg", children: [_jsx(FileText, { className: "mr-2 h-5 w-5" }), translations?.complaints?.registerComplaint ||
                                                "Register Complaint"] }), !isAuthenticated ? (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", size: "lg", asChild: true, children: _jsxs(Link, { to: "/login", children: [_jsx(User, { className: "mr-2 h-5 w-5" }), translations?.nav?.login ||
                                                            translations?.auth?.login ||
                                                            "Login"] }) }), _jsxs(Button, { variant: "outline", size: "lg", onClick: () => {
                                                    setIsTrackExpanded((v) => !v);
                                                    setIsFormExpanded(false);
                                                }, children: [_jsx(Clock, { className: "mr-2 h-5 w-5" }), translations?.nav?.trackStatus || "Track Complaint"] })] })) : (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "outline", size: "lg", asChild: true, children: _jsxs(Link, { to: "/dashboard", children: [_jsx(BarChart3, { className: "mr-2 h-5 w-5" }), translations?.nav?.dashboard || "Dashboard"] }) }), _jsx(Button, { variant: "outline", size: "lg", asChild: true, children: _jsxs(Link, { to: "/complaints", children: [_jsx(FileText, { className: "mr-2 h-5 w-5" }), translations?.nav?.myComplaints || "My Complaints"] }) })] }))] })] }) }) }), isFormExpanded && (_jsx("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: _jsx(QuickComplaintForm, { onSuccess: (complaintId) => {
                        setIsFormExpanded(false);
                        setIsTrackExpanded(false);
                    }, onClose: () => {
                        setIsFormExpanded(false);
                    } }) })), isTrackExpanded && !isFormExpanded && (_jsx("div", { className: "max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6", children: _jsx(QuickTrackForm, { onClose: () => setIsTrackExpanded(false) }) })), _jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-8", children: [_jsx(ContactInfoCard, {}), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-lg flex items-center space-x-2", children: [_jsx(CheckCircle, { className: "h-5 w-5 text-primary" }), _jsx("span", { children: translations?.features?.keyFeatures || "Key Features" })] }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-start space-x-3", children: [_jsx(CheckCircle, { className: "h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: translations?.complaints?.trackStatus || "Track Status" }), _jsx("div", { className: "text-sm text-gray-600", children: currentLanguage === "hi"
                                                                    ? "वास्���विक समय में तुरंत अपडेट के साथ शिकायत ���ी प्रगति की निगरानी करें"
                                                                    : currentLanguage === "ml"
                                                                        ? "തൽക്ഷണ അപ്‌ഡേറ്റുകൾക്കൊപ്പം പരാതി പുരോഗതി തത്സമയം നിരീക്ഷിക��കുക"
                                                                        : "Monitor complaint progress in real time with instant updates" })] })] }), _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx(CheckCircle, { className: "h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: translations?.complaints?.registerComplaint ||
                                                                    "Quick Complaint Registration" }), _jsx("div", { className: "text-sm text-gray-600", children: currentLanguage === "hi"
                                                                    ? "प्रकार, फोटो और स्थान के साथ एक मिनट से भी कम समय में मुद्दे ल��ग करें"
                                                                    : currentLanguage === "ml"
                                                                        ? "ടൈപ്പ്, ഫോട്ടോ, ലൊക്കേഷൻ എന്നിവ ��പയോഗിച്ച് ഒരു മിനിറ���റിനുള്ളിൽ പ്രശ്നങ്ങൾ ��േഖപ്പെടുത്തുക"
                                                                        : "Log issues in under a minute with type, photo, and location" })] })] }), _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx(CheckCircle, { className: "h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: currentLanguage === "hi"
                                                                    ? "ईमेल अलर्���"
                                                                    : currentLanguage === "ml"
                                                                        ? "ഇമെയി��� അലേർട്ടുക���"
                                                                        : "Email Alerts" }), _jsx("div", { className: "text-sm text-gray-600", children: currentLanguage === "hi"
                                                                    ? "पंजीकरण से समाधान तक प्रत्येक चरण में सूचना प्राप���त करें"
                                                                    : currentLanguage === "ml"
                                                                        ? "രജി��്ട്രേഷൻ മ���തൽ പരിഹാരം വരെ ഓരോ ഘട്ടത്തിലും അറിയിപ്പ് ലഭിക്കുക"
                                                                        : "Get notified at each stage — from registration to resolution" })] })] }), _jsxs("div", { className: "flex items-start space-x-3", children: [_jsx(CheckCircle, { className: "h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" }), _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: currentLanguage === "hi"
                                                                    ? "बहुभाषी ���हायता"
                                                                    : currentLanguage === "ml"
                                                                        ? "ബഹുഭ��ഷാ പിന്തുണ"
                                                                        : "Multilingual Support" }), _jsx("div", { className: "text-sm text-gray-600", children: currentLanguage === "hi"
                                                                    ? "अंग्रेजी, मलयालम और हिंदी में उपलब्ध"
                                                                    : currentLanguage === "ml"
                                                                        ? "ഇംഗ്ലീഷ്, മലയാളം, ഹിന്ദി എന്നിവയിൽ ലഭ്യമാണ്"
                                                                        : "Available in English, Malayalam, and Hindi" })] })] })] }) })] })] }) })] }));
};
export default Index;
