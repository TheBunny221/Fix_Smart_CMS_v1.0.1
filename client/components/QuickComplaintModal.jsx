import React from "react";
import { useAppSelector } from "../store/hooks";
// ComplaintForm component not available
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

const QuickComplaintModal = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { translations } = useAppSelector((state) => state.language);

  const handleSuccess = (complaintId) => {
    onSuccess?.(complaintId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit New Complaint</DialogTitle>
        </DialogHeader>
        <div className="p-4 text-center">
          <p className="text-gray-600">Complaint form component not available.</p>
          <p className="text-sm text-gray-500 mt-2">Please implement the ComplaintForm component.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickComplaintModal;
