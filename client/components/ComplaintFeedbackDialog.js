import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";
import { useAddComplaintFeedbackMutation } from "../store/api/complaintsApi";
import { Star, MessageSquare } from "lucide-react";
const ComplaintFeedbackDialog = ({ complaintId, isOpen, onClose, onSuccess, }) => {
    const { toast } = useToast();
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [hoveredRating, setHoveredRating] = useState(0);
    const [addFeedback, { isLoading }] = useAddComplaintFeedbackMutation();
    const handleSubmit = async () => {
        if (rating === 0) {
            toast({
                title: "Rating Required",
                description: "Please provide a rating for the service.",
                variant: "destructive",
            });
            return;
        }
        if (!feedback.trim()) {
            toast({
                title: "Feedback Required",
                description: "Please provide your feedback.",
                variant: "destructive",
            });
            return;
        }
        try {
            await addFeedback({
                id: complaintId,
                rating,
                feedback: feedback.trim(),
            }).unwrap();
            toast({
                title: "Feedback Submitted",
                description: "Thank you for your feedback!",
            });
            // Reset form
            setRating(0);
            setFeedback("");
            if (onSuccess) {
                onSuccess();
            }
            onClose();
        }
        catch (error) {
            toast({
                title: "Submission Failed",
                description: error.message || "Failed to submit feedback. Please try again.",
                variant: "destructive",
            });
        }
    };
    const handleClose = () => {
        setRating(0);
        setFeedback("");
        onClose();
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: handleClose, children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { className: "flex items-center", children: [_jsx(MessageSquare, { className: "h-5 w-5 mr-2" }), "Provide Feedback"] }), _jsx(DialogDescription, { children: "Please rate our service and share your experience with the complaint resolution." })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx(Label, { children: "Service Rating *" }), _jsxs("div", { className: "flex items-center space-x-1 mt-2", children: [[1, 2, 3, 4, 5].map((star) => (_jsx("button", { type: "button", className: `p-1 transition-colors ${star <= (hoveredRating || rating)
                                                ? "text-yellow-400"
                                                : "text-gray-300"}`, onMouseEnter: () => setHoveredRating(star), onMouseLeave: () => setHoveredRating(0), onClick: () => setRating(star), children: _jsx(Star, { className: "h-8 w-8 fill-current" }) }, star))), _jsx("span", { className: "ml-2 text-sm text-gray-600", children: rating > 0 && (_jsxs(_Fragment, { children: [rating, " star", rating !== 1 ? "s" : "", " -", " ", rating === 1 && "Poor", rating === 2 && "Fair", rating === 3 && "Good", rating === 4 && "Very Good", rating === 5 && "Excellent"] })) })] })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "feedback", children: "Your Feedback *" }), _jsx(Textarea, { id: "feedback", value: feedback, onChange: (e) => setFeedback(e.target.value), placeholder: "Please share your experience with the complaint resolution process...", rows: 4, className: "mt-2" }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Your feedback helps us improve our services." })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", onClick: handleClose, disabled: isLoading, children: "Cancel" }), _jsx(Button, { onClick: handleSubmit, disabled: isLoading, children: isLoading ? "Submitting..." : "Submit Feedback" })] })] }) }));
};
export default ComplaintFeedbackDialog;
