import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { selectModals, selectToasts, hideModal, hideToast, } from "../store/slices/uiSlice";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "./ui/alert-dialog";
import { useToast } from "../hooks/use-toast";
const GlobalMessageHandler = () => {
    const dispatch = useAppDispatch();
    const modals = useAppSelector(selectModals);
    const toasts = useAppSelector(selectToasts);
    const { toast } = useToast();
    // Handle toasts using shadcn/ui toast system
    useEffect(() => {
        toasts.forEach((toastItem) => {
            toast({
                title: toastItem.title,
                description: toastItem.message,
                variant: toastItem.type === "error" ? "destructive" : "default",
                ...(toastItem.duration !== undefined
                    ? { duration: toastItem.duration }
                    : {}),
            });
            // Remove from store after showing
            dispatch(hideToast(toastItem.id));
        });
    }, [toasts, toast, dispatch]);
    return (_jsx(_Fragment, { children: modals.map((modal) => (_jsx(AlertDialog, { open: true, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: modal.title }), _jsx(AlertDialogDescription, { children: typeof modal.content === "string"
                                    ? modal.content
                                    : modal.content })] }), _jsxs(AlertDialogFooter, { children: [modal.type === "confirm" && (_jsxs(_Fragment, { children: [_jsx(AlertDialogCancel, { onClick: () => {
                                            modal.onCancel?.();
                                            dispatch(hideModal(modal.id));
                                        }, children: modal.cancelText || "Cancel" }), _jsx(AlertDialogAction, { onClick: () => {
                                            modal.onConfirm?.();
                                            dispatch(hideModal(modal.id));
                                        }, children: modal.confirmText || "Confirm" })] })), modal.type === "alert" && (_jsx(AlertDialogAction, { onClick: () => {
                                    modal.onConfirm?.();
                                    dispatch(hideModal(modal.id));
                                }, children: modal.confirmText || "OK" }))] })] }) }, modal.id))) }));
};
export default GlobalMessageHandler;
