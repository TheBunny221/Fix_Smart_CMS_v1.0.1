import React, { useState } from "react";
import { useAddComplaintFeedbackMutation } from "../store/api/complaintsApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Star, MessageSquare, Send, Loader2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";

 | null;
  children: React.ReactNode;
}

const FeedbackDialog: React.FC = ({
  complaintId,
  complaintTitle,
  isResolved,
  existingFeedback,
  children,
}) => {
  const { toast } = useToast();
  const [addFeedback] = useAddComplaintFeedbackMutation();

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [comment, setComment] = useState(existingFeedback?.comment || "");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title,
        description: "Please provide a rating before submitting feedback.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addFeedback({
        id,
        feedback),
        rating,
      }).unwrap();

      toast({
        title,
        description:
          "Thank you for your feedback It helps us improve our services.",
      });

      setOpen(false);
    } catch (error) {
      toast({
        title,
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (value) => {
    setRating(value);
  };

  const handleRatingHover = (value) => {
    setHoveredRating(value);
  };

  const handleRatingLeave = () => {
    setHoveredRating(0);
  };

  const getRatingText = (rating) => {
    switch (rating) {
      case 1:
        return "Very Poor";
      case 2:
        return "Poor";
      case 3:
        return "Average";
      case 4:
        return "Good";
      case 5:
        return "Excellent";
      default:
        return "Select a rating";
    }
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case 1:
      case 2:
        return "text-red-500";
      case 3:
        return "text-yellow-500";
      case 4:
      case 5:
        return "text-green-500";
      default:
        return "text-gray-400";
    }
  };

  if (isResolved) {
    return null; // Don't render feedback option for unresolved complaints
  }

  return ({children}
      
        
          
            
            {existingFeedback ? "Update Feedback" , 2, 3, 4, 5].map((star) => (
                 handleRatingClick(star)}
                  onMouseEnter={() => handleRatingHover(star)}
                  onMouseLeave={handleRatingLeave}
                >
                  
                
              ))}
            
            
              {getRatingText(hoveredRating || rating)}
            
          

          {/* Comment */}
          
            Additional Comments (Optional)
             setComment(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            
              {comment.length}/500 characters
            
          

          {/* Rating Guidelines */}
          
            
              Rating Guidelines:
            
            
              
                
                
                  5 - Excellent: Issue resolved quickly and efficiently
                
              
              
                
                4 - Good: Issue resolved satisfactorily
              
              
                
                3 - Average: Issue resolved but could be better
              
              
                
                
                  2 - Poor: Issue resolved but with significant delays
                
              
              
                
                1 - Very Poor: Issue not properly resolved
              
            
          

          {/* Submit Button */}
          
             setOpen(false)}
              className="flex-1"
            >
              Cancel
            
            
              {isSubmitting ? (
                
                  
                  Submitting...
                
              ) : ({existingFeedback ? "Update" )}
            
          
        
      
    
  );
};

export default FeedbackDialog;
