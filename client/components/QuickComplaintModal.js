import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import QuickComplaintForm from "./QuickComplaintForm";
import { useAppSelector } from "../store/hooks";
const QuickComplaintModal = ({ isOpen, onClose, onSuccess, }) => {
    const { translations } = useAppSelector((state) => state.language);
    const handleSuccess = (complaintId) => {
        onSuccess?.(complaintId);
        onClose();
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: onClose, children: _jsxs(DialogContent, { className: "max-w-6xl max-h-[90vh] overflow-hidden", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: translations?.complaints?.registerComplaint ||
                            "Quick Complaint Form" }) }), _jsx(ScrollArea, { className: "max-h-[calc(90vh-80px)] pr-4", children: _jsx(QuickComplaintForm, { onSuccess: handleSuccess, onClose: onClose }) })] }) }));
};
export default QuickComplaintModal;
