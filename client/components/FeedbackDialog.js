import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useAddComplaintFeedbackMutation } from "../store/api/complaintsApi";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Star, MessageSquare, Send, Loader2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";
const FeedbackDialog = ({ complaintId, complaintTitle, isResolved, existingFeedback, children, }) => {
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
                title: "Rating Required",
                description: "Please provide a rating before submitting feedback.",
                variant: "destructive",
            });
            return;
        }
        setIsSubmitting(true);
        try {
            await addFeedback({
                id: complaintId,
                feedback: comment.trim(),
                rating,
            }).unwrap();
            toast({
                title: "Feedback Submitted",
                description: "Thank you for your feedback! It helps us improve our services.",
            });
            setOpen(false);
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to submit feedback",
                variant: "destructive",
            });
        }
        finally {
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
    if (!isResolved) {
        return null; // Don't render feedback option for unresolved complaints
    }
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: children }), _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center gap-2", children: [_jsx(MessageSquare, { className: "h-5 w-5" }), existingFeedback ? "Update Feedback" : "Provide Feedback"] }), _jsxs(DialogDescription, { children: ["How would you rate the resolution of your complaint \"", complaintTitle, "\"?"] })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [_jsxs("div", { className: "space-y-3", children: [_jsx(Label, { className: "text-base font-medium", children: "Rating *" }), _jsx("div", { className: "flex items-center gap-1", children: [1, 2, 3, 4, 5].map((star) => (_jsx("button", { type: "button", className: "p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded", onClick: () => handleRatingClick(star), onMouseEnter: () => handleRatingHover(star), onMouseLeave: handleRatingLeave, children: _jsx(Star, { className: `h-8 w-8 transition-colors ${star <= (hoveredRating || rating)
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-gray-300"}` }) }, star))) }), _jsx("p", { className: `text-sm font-medium ${getRatingColor(hoveredRating || rating)}`, children: getRatingText(hoveredRating || rating) })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "comment", children: "Additional Comments (Optional)" }), _jsx(Textarea, { id: "comment", placeholder: "Share your experience, suggestions for improvement, or any other feedback...", value: comment, onChange: (e) => setComment(e.target.value), rows: 4, maxLength: 500, className: "resize-none" }), _jsxs("p", { className: "text-xs text-gray-500 text-right", children: [comment.length, "/500 characters"] })] }), _jsxs("div", { className: "bg-gray-50 p-3 rounded-lg", children: [_jsx("p", { className: "text-sm font-medium text-gray-700 mb-2", children: "Rating Guidelines:" }), _jsxs("div", { className: "space-y-1 text-xs text-gray-600", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Star, { className: "h-3 w-3 fill-yellow-400 text-yellow-400" }), _jsx("span", { children: "5 - Excellent: Issue resolved quickly and efficiently" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Star, { className: "h-3 w-3 fill-yellow-400 text-yellow-400" }), _jsx("span", { children: "4 - Good: Issue resolved satisfactorily" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Star, { className: "h-3 w-3 fill-yellow-400 text-yellow-400" }), _jsx("span", { children: "3 - Average: Issue resolved but could be better" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Star, { className: "h-3 w-3 fill-yellow-400 text-yellow-400" }), _jsx("span", { children: "2 - Poor: Issue resolved but with significant delays" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Star, { className: "h-3 w-3 fill-yellow-400 text-yellow-400" }), _jsx("span", { children: "1 - Very Poor: Issue not properly resolved" })] })] })] }), _jsxs("div", { className: "flex gap-3", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), className: "flex-1", children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isSubmitting || rating === 0, className: "flex-1", children: isSubmitting ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Submitting..."] })) : (_jsxs(_Fragment, { children: [_jsx(Send, { className: "mr-2 h-4 w-4" }), existingFeedback ? "Update" : "Submit", " Feedback"] })) })] })] })] })] }));
};
export default FeedbackDialog;
