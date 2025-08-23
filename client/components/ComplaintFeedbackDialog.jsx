import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";
import { useAddComplaintFeedbackMutation } from "../store/api/complaintsApi";
import { Star, MessageSquare } from "lucide-react";



const ComplaintFeedbackDialog: React.FC = ({
  complaintId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  const [addFeedback, { isLoading }] = useAddComplaintFeedbackMutation();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title,
        description: "Please provide a rating for the service.",
        variant: "destructive",
      });
      return;
    }

    if (feedback.trim()) {
      toast({
        title,
        description: "Please provide your feedback.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addFeedback({
        id,
        rating,
        feedback),
      }).unwrap();

      toast({
        title,
        description: "Thank you for your feedback",
      });

      // Reset form
      setRating(0);
      setFeedback("");

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      toast({
        title,
        description:
          error.message || "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setRating(0);
    setFeedback("");
    onClose();
  };

  return (
    
      
        
          
            
            Provide Feedback
          
          
            Please rate our service and share your experience with the complaint
            resolution.
          
        

        
          {/* Rating */}
          
            Service Rating *
            
              {[1, 2, 3, 4, 5].map((star) => (
                 setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  
                
              ))}
              
                {rating > 0 && ({rating} star{rating == 1 ? "s" )}
              
            
          

          {/* Feedback Text */}
          
            Your Feedback *
             setFeedback(e.target.value)}
              placeholder="Please share your experience with the complaint resolution process..."
              rows={4}
              className="mt-2"
            />
            
              Your feedback helps us improve our services.
            
          
        

        
          
            Cancel
          
          
            {isLoading ? "Submitting..." : "Submit Feedback"}
          
        
      
    
  );
};

export default ComplaintFeedbackDialog;
