import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  FileText,
  Phone,
  Mail,
  User,
  Clock,
  BarChart3,
  Shield,
  MapPin,
  CheckCircle,
} from "lucide-react";
import QuickComplaintForm from "../components/QuickComplaintForm";

const Index: React.FC = () => {
  const { translations, currentLanguage } = useAppSelector(
    (state) => state.language,
  );
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { appName, getConfig } = useSystemConfig();
  const navigate = useNavigate();

  // Form state
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard", { replace);
    }
  }, [isAuthenticated, user, navigate]);

  // Show loading if translations not ready
  if (translations) {
    return (
      
        
          
          
            {translations?.common?.loading || "Loading..."}
          
        
      
    );
  }

  return (
    
      {/* Hero Section */}
      
        
          
            
              
              
                {translations?.nav?.home || `${appName} Portal`}
              
            
            
              {translations?.guest?.guestSubmissionDescription ||
                `Welcome to the ${appName} Complaint Management System. Submit civic issues, track progress, and help build a better city together.`}
            

            
              {/**  setIsFormExpanded(isFormExpanded)}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                 
                  
                  {translations?.complaints?.registerComplaint ||
                    "Register Complaint"}
                
              **/}

               setIsFormExpanded(isFormExpanded)}
                size="lg"
                className="bg-primary hover:bg-primary/90"
                variant="outline"
              >
                
                {translations?.complaints?.registerComplaint ||
                  "Register Complaint"}
              

              {isAuthenticated ? (
                
                  
                    
                      
                      {translations?.nav?.login ||
                        translations?.auth?.login ||
                        "Login"}
                    
                  
                  
                    
                      
                      {translations?.nav?.trackStatus || "Track Complaint"}
                    
                  
                
              ) : (
                
                  
                    
                      
                      {translations?.nav?.dashboard || "Dashboard"}
                    
                  
                  
                    
                      
                      {translations?.nav?.myComplaints || "My Complaints"}
                    
                  
                
              )}
            
          
        
      

      {/* Complaint Registration Form */}
      {isFormExpanded && (
        
           {
              setIsFormExpanded(false);
            }}
            onClose={() => setIsFormExpanded(false)}
          />
        
      )}

      {/* Main Content */}
      
        
          {/* Contact Information */}
          
            
              
                
                
                  {translations?.guest?.supportContact ||
                    "Need Help? Contact Us"}
                
              
            
            
              
                
                  
                  
                    
                      {translations?.guest?.supportContact || "Helpline"}
                    
                    
                      {getConfig("CONTACT_HELPLINE", "1800-XXX-XXXX")}
                    
                  
                
                
                  
                  
                    
                      {translations?.auth?.email || "Email Support"}
                    
                    
                      {getConfig("CONTACT_EMAIL", "support@cochinsmartcity.in")}
                    
                  
                
                
                  
                  
                    
                      {translations?.common?.time || "Office Hours"}
                    
                    
                      {getConfig("CONTACT_OFFICE_HOURS",
                        "Monday - Friday,
                      )}
                    
                  
                
                
                  
                  
                    
                      {translations?.complaints?.location || "Office Location"}
                    
                    
                      {getConfig(
                        "CONTACT_OFFICE_ADDRESS",
                        "Cochin Corporation Office",
                      )}
                    
                  
                
              
            
          

          {/* Service Features */}
          
            
              
                
                
                  {translations?.features?.keyFeatures || "Key Features"}
                
              
            
            
              
                
                  
                  
                    
                      {translations?.complaints?.trackStatus || "Track Status"}
                    
                    
                      {currentLanguage === "hi"
                        ? "वास्���विक समय में तुरंत अपडेट के साथ शिकायत ���ी प्रगति की निगरानी करें"
                         === "ml"
                          ? "തൽക്ഷണ അപ്‌ഡേറ്റുകൾക്കൊപ്പം പരാതി പുരോഗതി തത്സമയം നിരീക്ഷിക��കുക"
                          : "Monitor complaint progress in real time with instant updates"}
                    
                  
                
                
                  
                  
                    
                      {translations?.complaints?.registerComplaint ||
                        "Quick Complaint Registration"}
                    
                    
                      {currentLanguage === "hi"
                        ? "प्रकार, फोटो और स्थान के साथ एक मिनट से भी कम समय में मुद्दे ल��ग करें"
                         === "ml"
                          ? "ടൈപ്പ്, ഫോട്ടോ, ലൊക്കേഷൻ എന്നിവ ഉപയോഗിച്ച് ഒരു മിനിറ���റിനുള്ളിൽ പ്രശ്നങ്ങൾ ��േഖപ്പെടുത്തുക"
                          : "Log issues in under a minute with type, photo, and location"}
                    
                  
                
                
                  
                  
                    
                      {currentLanguage === "hi"
                        ? "ईमेल अलर्���"
                         === "ml"
                          ? "ഇമെയി��� അലേർട്ടുക���"
                          : "Email Alerts"}
                    
                    
                      {currentLanguage === "hi"
                        ? "पंजीकरण से समाधान तक प्रत्येक चरण में सूचना प्राप्त करें"
                         === "ml"
                          ? "രജി��്ട്രേഷൻ മുതൽ പരിഹാരം വരെ ഓരോ ഘട്ടത്തിലും അറിയിപ്പ് ലഭിക്കുക"
                          : "Get notified at each stage — from registration to resolution"}
                    
                  
                
                
                  
                  
                    
                      {currentLanguage === "hi"
                        ? "बहुभाषी सहायता"
                         === "ml"
                          ? "ബഹുഭ��ഷാ പിന്തുണ"
                          : "Multilingual Support"}
                    
                    
                      {currentLanguage === "hi"
                        ? "अंग्रेजी, मलयालम और हिंदी में उपलब्ध"
                         === "ml"
                          ? "ഇംഗ്ലീഷ്, മലയാളം, ഹിന്ദി എന്നിവയിൽ ലഭ്യമാണ്"
                          : "Available in English, Malayalam, and Hindi"}
                    
                  
                
              
            
          
        
      
    
  );
};

export default Index;
