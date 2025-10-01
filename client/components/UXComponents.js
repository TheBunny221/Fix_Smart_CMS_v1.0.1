import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Loader2, Search, AlertCircle, Upload, Inbox, Clock, CheckCircle, XCircle, AlertTriangle, } from "lucide-react";
// Loading Skeleton Components
export const CardSkeleton = ({ className, }) => (_jsxs(Card, { className: cn("p-6", className), children: [_jsxs(CardHeader, { className: "space-y-2", children: [_jsx(Skeleton, { className: "h-4 w-3/4" }), _jsx(Skeleton, { className: "h-3 w-1/2" })] }), _jsxs(CardContent, { className: "space-y-3", children: [_jsx(Skeleton, { className: "h-3 w-full" }), _jsx(Skeleton, { className: "h-3 w-5/6" }), _jsx(Skeleton, { className: "h-3 w-4/6" })] })] }));
export const TableSkeleton = ({ rows = 5, columns = 4, className }) => (_jsxs("div", { className: cn("space-y-4", className), children: [_jsx("div", { className: "flex space-x-4", children: Array.from({ length: columns }).map((_, i) => (_jsx(Skeleton, { className: "h-4 flex-1" }, i))) }), Array.from({ length: rows }).map((_, rowIndex) => (_jsx("div", { className: "flex space-x-4", children: Array.from({ length: columns }).map((_, colIndex) => (_jsx(Skeleton, { className: "h-8 flex-1" }, colIndex))) }, rowIndex)))] }));
export const ListSkeleton = ({ items = 3, showAvatar = false, className }) => (_jsx("div", { className: cn("space-y-4", className), children: Array.from({ length: items }).map((_, i) => (_jsxs("div", { className: "flex items-center space-x-4", children: [showAvatar && _jsx(Skeleton, { className: "h-10 w-10 rounded-full" }), _jsxs("div", { className: "space-y-2 flex-1", children: [_jsx(Skeleton, { className: "h-4 w-3/4" }), _jsx(Skeleton, { className: "h-3 w-1/2" })] })] }, i))) }));
export const FormSkeleton = ({ fields = 4, className }) => (_jsxs("div", { className: cn("space-y-6", className), children: [Array.from({ length: fields }).map((_, i) => (_jsxs("div", { className: "space-y-2", children: [_jsx(Skeleton, { className: "h-4 w-24" }), _jsx(Skeleton, { className: "h-10 w-full" })] }, i))), _jsxs("div", { className: "flex space-x-4 pt-4", children: [_jsx(Skeleton, { className: "h-10 w-24" }), _jsx(Skeleton, { className: "h-10 w-24" })] })] }));
export const DashboardSkeleton = ({ className, }) => (_jsxs("div", { className: cn("space-y-6", className), children: [_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: Array.from({ length: 4 }).map((_, i) => (_jsx(Card, { className: "p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Skeleton, { className: "h-4 w-20" }), _jsx(Skeleton, { className: "h-8 w-16" })] }), _jsx(Skeleton, { className: "h-8 w-8" })] }) }, i))) }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-6 w-48" }), _jsx(Skeleton, { className: "h-64 w-full" })] }) }), _jsx(Card, { className: "p-6", children: _jsxs("div", { className: "space-y-4", children: [_jsx(Skeleton, { className: "h-6 w-32" }), _jsx(ListSkeleton, { items: 5, showAvatar: true })] }) })] }));
export const LoadingSpinner = ({ size = "default", text, className, }) => {
    const sizeClasses = {
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8",
    };
    return (_jsxs("div", { className: cn("flex items-center justify-center space-x-2", className), children: [_jsx(Loader2, { className: cn("animate-spin", sizeClasses[size]) }), text && _jsx("span", { className: "text-sm text-muted-foreground", children: text })] }));
};
export const LoadingOverlay = ({ isLoading, text = "Loading...", children, className, }) => (_jsxs("div", { className: cn("relative", className), children: [children, isLoading && (_jsx("div", { className: "absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10", children: _jsx(LoadingSpinner, { text: text }) }))] }));
export const EmptyState = ({ icon, title, description, action, className, }) => (_jsxs("div", { className: cn("flex flex-col items-center justify-center text-center p-8", className), children: [icon && (_jsx("div", { className: "mb-4 p-3 bg-muted rounded-full", children: React.cloneElement(icon, {
                className: "h-8 w-8 text-muted-foreground",
            }) })), _jsx("h3", { className: "text-lg font-semibold mb-2", children: title }), _jsx("p", { className: "text-muted-foreground mb-6 max-w-sm", children: description }), action && (_jsx(Button, { onClick: action.onClick, variant: action.variant || "default", children: action.label }))] }));
// Specific Empty States
export const NoDataEmpty = ({ entityName, onAdd, className }) => (_jsx(EmptyState, { icon: _jsx(Inbox, {}), title: `No ${entityName} Found`, description: `You haven't created any ${entityName.toLowerCase()} yet. Get started by creating your first one.`, action: onAdd
        ? {
            label: `Create ${entityName}`,
            onClick: onAdd,
        }
        : undefined, className: className }));
export const NoSearchResultsEmpty = ({ searchTerm, onClear, className }) => (_jsx(EmptyState, { icon: _jsx(Search, {}), title: "No Results Found", description: `No results found for "${searchTerm}". Try adjusting your search terms or filters.`, action: {
        label: "Clear Search",
        onClick: onClear,
        variant: "outline",
    }, className: className }));
export const ErrorEmpty = ({ title = "Something went wrong", description = "We encountered an error while loading this data. Please try again.", onRetry, className, }) => (_jsx(EmptyState, { icon: _jsx(AlertCircle, {}), title: title, description: description, action: onRetry
        ? {
            label: "Try Again",
            onClick: onRetry,
            variant: "outline",
        }
        : undefined, className: className }));
export const NoPermissionEmpty = ({ className, }) => (_jsx(EmptyState, { icon: _jsx(XCircle, {}), title: "Access Denied", description: "You don't have permission to view this content. Contact your administrator if you believe this is an error.", className: className }));
export const StatusIndicator = ({ status, text, size = "default", showIcon = true, className, }) => {
    const configs = {
        success: {
            icon: CheckCircle,
            className: "bg-green-100 text-green-800 border-green-200",
            iconClassName: "text-green-500",
        },
        error: {
            icon: XCircle,
            className: "bg-red-100 text-red-800 border-red-200",
            iconClassName: "text-red-500",
        },
        warning: {
            icon: AlertTriangle,
            className: "bg-yellow-100 text-yellow-800 border-yellow-200",
            iconClassName: "text-yellow-500",
        },
        info: {
            icon: AlertCircle,
            className: "bg-blue-100 text-blue-800 border-blue-200",
            iconClassName: "text-blue-500",
        },
        pending: {
            icon: Clock,
            className: "bg-gray-100 text-gray-800 border-gray-200",
            iconClassName: "text-gray-500",
        },
    };
    const config = configs[status];
    const Icon = config.icon;
    const sizeClasses = {
        sm: "text-xs px-2 py-1",
        default: "text-sm px-2.5 py-1.5",
        lg: "text-base px-3 py-2",
    };
    const iconSizes = {
        sm: "h-3 w-3",
        default: "h-4 w-4",
        lg: "h-5 w-5",
    };
    return (_jsxs("div", { className: cn("inline-flex items-center rounded-full border font-medium", config.className, sizeClasses[size], className), children: [showIcon && (_jsx(Icon, { className: cn("mr-1.5", iconSizes[size], config.iconClassName) })), text] }));
};
export const ProgressStepper = ({ steps, className, }) => (_jsx("div", { className: cn("space-y-4", className), children: steps.map((step, index) => (_jsxs("div", { className: "flex items-start", children: [_jsxs("div", { className: "flex-shrink-0 relative", children: [_jsx("div", { className: cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium", step.status === "completed" && "bg-green-100 text-green-800", step.status === "current" && "bg-blue-100 text-blue-800", step.status === "pending" && "bg-gray-100 text-gray-500", step.status === "error" && "bg-red-100 text-red-800"), children: step.status === "completed" ? (_jsx(CheckCircle, { className: "w-5 h-5" })) : step.status === "error" ? (_jsx(XCircle, { className: "w-5 h-5" })) : (index + 1) }), index < steps.length - 1 && (_jsx("div", { className: cn("absolute top-8 left-4 w-0.5 h-6 -ml-px", step.status === "completed" ? "bg-green-200" : "bg-gray-200") }))] }), _jsxs("div", { className: "ml-4 flex-1", children: [_jsx("h4", { className: cn("text-sm font-medium", step.status === "current" && "text-blue-600", step.status === "pending" && "text-gray-500"), children: step.title }), step.description && (_jsx("p", { className: "text-sm text-gray-500 mt-1", children: step.description }))] })] }, step.id))) }));
export const DataDisplay = ({ label, value, icon, className, }) => (_jsxs("div", { className: cn("space-y-1", className), children: [_jsxs("div", { className: "flex items-center space-x-2", children: [icon && _jsx("span", { className: "text-muted-foreground", children: icon }), _jsx("span", { className: "text-sm font-medium text-muted-foreground", children: label })] }), _jsx("div", { className: "text-sm", children: value })] }));
export const QuickActionButton = ({ icon, label, onClick, variant = "outline", size = "default", className, }) => (_jsxs(Button, { variant: variant, size: size, onClick: onClick, className: cn("flex flex-col items-center space-y-2 h-auto py-4", className), children: [React.cloneElement(icon, { className: "h-6 w-6" }), _jsx("span", { className: "text-xs", children: label })] }));
export const FileDropzone = ({ onDrop, accept, multiple = false, maxSize, className, children, }) => {
    const [isDragOver, setIsDragOver] = React.useState(false);
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };
    const handleDragLeave = () => {
        setIsDragOver(false);
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            onDrop(files);
        }
    };
    return (_jsx("div", { onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, className: cn("border-2 border-dashed rounded-lg p-8 text-center transition-colors", isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25", "hover:border-primary hover:bg-primary/5 cursor-pointer", className), children: children || (_jsxs("div", { className: "space-y-4", children: [_jsx(Upload, { className: "h-10 w-10 mx-auto text-muted-foreground" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium", children: "Drop files here or click to upload" }), _jsxs("p", { className: "text-xs text-muted-foreground mt-1", children: [accept && `Supported formats: ${accept}`, maxSize && ` • Max size: ${maxSize}MB`] })] })] })) }));
};
