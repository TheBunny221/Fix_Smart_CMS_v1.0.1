import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import QuickComplaintForm from "./QuickComplaintForm";
import { useAppSelector } from "../store/hooks";



const QuickComplaintModal: React.FC = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { translations } = useAppSelector((state) => state.language);

  const handleSuccess = (complaintId) => {
    onSuccess?.(complaintId);
    onClose();
  };

  return (
    
      
        
          
            {translations?.complaints?.registerComplaint ||
              "Quick Complaint Form"}
          
        
        
          
        
      
    
  );
};

export default QuickComplaintModal;
