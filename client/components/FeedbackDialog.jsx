import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Alert, AlertDescription } from "./ui/alert";
import { Star, MessageSquare, Send, Loader2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const FeedbackDialog = ({
  complaintId,
  complaintTitle,
  isResolved,
  existingFeedback,
  children,
}) => {
  const { toast } = useToast();
  const [addFeedback] = useAddComplaintFeedbackMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [comment, setComment] = useState(existingFeedback?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rating) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating before submitting feedback.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await addFeedback({
        complaintId,
        rating,
        comment: comment.trim(),
      }).unwrap();

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! It helps us improve our service.",
      });

      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      return (
        <button
          key={starValue}
          type="button"
          className={`text-2xl transition-colors ${
            starValue <= rating
              ? "text-yellow-400 hover:text-yellow-500"
              : "text-gray-300 hover:text-yellow-300"
          }`}
          onClick={() => setRating(starValue)}
        >
          <Star
            className={`w-6 h-6 ${
              starValue <= rating ? "fill-current" : ""
            }`}
          />
        </button>
      );
    });
  };

  if (!isResolved) {
    return null; // Only show feedback option for resolved complaints
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Star className="w-4 h-4 mr-2" />
            {existingFeedback ? "Update Feedback" : "Rate & Review"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Feedback for Complaint
          </DialogTitle>
          <DialogDescription>
            How was your experience with the resolution of this complaint?
            {complaintTitle && (
              <span className="block mt-1 font-medium text-foreground">
                "{complaintTitle}"
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label htmlFor="rating">Rating *</Label>
            <div className="flex items-center gap-1">
              {renderStars()}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating} out of 5 stars
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comments (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience or suggestions for improvement..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-muted-foreground text-right">
              {comment.length}/500 characters
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !rating} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </form>

        {existingFeedback && (
          <Alert>
            <AlertDescription>
              You previously rated this complaint {existingFeedback.rating} stars.
              Submitting new feedback will update your previous rating.
            </AlertDescription>
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
