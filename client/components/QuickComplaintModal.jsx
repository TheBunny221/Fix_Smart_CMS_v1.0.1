import React from "react";
import { useAppSelector } from "../store/hooks";
import ComplaintForm from "./forms/ComplaintForm";
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
        <ComplaintForm
          onSuccess={handleSuccess}
          onCancel={() => onOpenChange(false)}
          isModal={true}
        />
      </DialogContent>
    </Dialog>
  );
};

export default QuickComplaintModal;
