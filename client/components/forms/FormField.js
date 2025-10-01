import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { FormControl, FormDescription, FormField as ShadcnFormField, FormItem, FormLabel, FormMessage, } from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Switch } from "../ui/switch";
import { cn } from "../../lib/utils";
import { Eye, EyeOff, Upload, X } from "lucide-react";
export function TextInput({ control, name, label, description, required, disabled, className, placeholder, type = "text", autoComplete, maxLength, minLength, pattern, leftIcon, rightIcon, }) {
    return (_jsx(ShadcnFormField, { control: control, name: name, render: ({ field, fieldState }) => (_jsxs(FormItem, { className: className, children: [label && (_jsx(FormLabel, { className: cn(required &&
                        "after:content-['*'] after:ml-0.5 after:text-red-500"), children: label })), _jsx(FormControl, { children: _jsxs("div", { className: "relative", children: [leftIcon && (_jsx("div", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400", children: leftIcon })), _jsx(Input, { ...field, type: type, placeholder: placeholder, disabled: disabled, autoComplete: autoComplete, maxLength: maxLength, minLength: minLength, pattern: pattern, className: cn(leftIcon && "pl-10", rightIcon && "pr-10", fieldState.error && "border-red-500 focus:border-red-500"), "aria-invalid": fieldState.error ? "true" : "false", "aria-describedby": fieldState.error
                                    ? `${name}-error`
                                    : description
                                        ? `${name}-description`
                                        : undefined }), rightIcon && (_jsx("div", { className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400", children: rightIcon }))] }) }), description && (_jsx(FormDescription, { id: `${name}-description`, children: description })), _jsx(FormMessage, { id: `${name}-error` })] })) }));
}
export function PasswordInput({ control, name, label, description, required, disabled, className, placeholder, autoComplete = "current-password", showStrengthIndicator = false, }) {
    const [showPassword, setShowPassword] = React.useState(false);
    return (_jsx(ShadcnFormField, { control: control, name: name, render: ({ field, fieldState }) => (_jsxs(FormItem, { className: className, children: [label && (_jsx(FormLabel, { className: cn(required &&
                        "after:content-['*'] after:ml-0.5 after:text-red-500"), children: label })), _jsx(FormControl, { children: _jsxs("div", { className: "relative", children: [_jsx(Input, { ...field, type: showPassword ? "text" : "password", placeholder: placeholder, disabled: disabled, autoComplete: autoComplete, className: cn("pr-10", fieldState.error && "border-red-500 focus:border-red-500"), "aria-invalid": fieldState.error ? "true" : "false" }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent", onClick: () => setShowPassword(!showPassword), disabled: disabled, "aria-label": showPassword ? "Hide password" : "Show password", children: showPassword ? (_jsx(EyeOff, { className: "h-4 w-4" })) : (_jsx(Eye, { className: "h-4 w-4" })) })] }) }), showStrengthIndicator && field.value && (_jsx(PasswordStrengthIndicator, { password: field.value })), description && _jsx(FormDescription, { children: description }), _jsx(FormMessage, {})] })) }));
}
// Password strength indicator
function PasswordStrengthIndicator({ password }) {
    const getStrength = (password) => {
        let score = 0;
        if (password.length >= 8)
            score++;
        if (/[A-Z]/.test(password))
            score++;
        if (/[a-z]/.test(password))
            score++;
        if (/[0-9]/.test(password))
            score++;
        if (/[^A-Za-z0-9]/.test(password))
            score++;
        return score;
    };
    const strength = getStrength(password);
    const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    const strengthColors = [
        "bg-red-500",
        "bg-orange-500",
        "bg-yellow-500",
        "bg-blue-500",
        "bg-green-500",
    ];
    return (_jsxs("div", { className: "mt-2", children: [_jsx("div", { className: "flex space-x-1", children: [1, 2, 3, 4, 5].map((level) => (_jsx("div", { className: cn("h-2 w-full rounded", level <= strength ? strengthColors[strength - 1] : "bg-gray-200") }, level))) }), _jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["Strength: ", strengthLabels[strength - 1] || "Very Weak"] })] }));
}
export function TextareaField({ control, name, label, description, required, disabled, className, placeholder, rows = 3, maxLength, showCharCount = false, resize = "vertical", }) {
    return (_jsx(ShadcnFormField, { control: control, name: name, render: ({ field, fieldState }) => (_jsxs(FormItem, { className: className, children: [label && (_jsx(FormLabel, { className: cn(required &&
                        "after:content-['*'] after:ml-0.5 after:text-red-500"), children: label })), _jsx(FormControl, { children: _jsxs("div", { className: "relative", children: [_jsx(Textarea, { ...field, placeholder: placeholder, disabled: disabled, rows: rows, maxLength: maxLength, className: cn(fieldState.error && "border-red-500 focus:border-red-500", resize === "none" && "resize-none", resize === "vertical" && "resize-y", resize === "horizontal" && "resize-x"), style: { resize }, "aria-invalid": fieldState.error ? "true" : "false" }), showCharCount && maxLength && (_jsxs("div", { className: "absolute bottom-2 right-2 text-xs text-gray-500", children: [field.value?.length || 0, "/", maxLength] }))] }) }), description && _jsx(FormDescription, { children: description }), _jsx(FormMessage, {})] })) }));
}
export function SelectField({ control, name, label, description, required, disabled, className, placeholder, options, emptyText = "No options available", }) {
    return (_jsx(ShadcnFormField, { control: control, name: name, render: ({ field, fieldState }) => (_jsxs(FormItem, { className: className, children: [label && (_jsx(FormLabel, { className: cn(required &&
                        "after:content-['*'] after:ml-0.5 after:text-red-500"), children: label })), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, disabled: !!disabled, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { className: cn(fieldState.error && "border-red-500 focus:border-red-500"), "aria-invalid": fieldState.error ? "true" : "false", children: _jsx(SelectValue, { placeholder: placeholder }) }) }), _jsx(SelectContent, { children: options.length === 0 ? (_jsx(SelectItem, { value: "no-options", disabled: true, children: emptyText })) : (options.map((option) => (_jsx(SelectItem, { value: option.value, disabled: !!option.disabled, children: option.label }, option.value)))) })] }), description && _jsx(FormDescription, { children: description }), _jsx(FormMessage, {})] })) }));
}
export function CheckboxField({ control, name, description, disabled, className, children, }) {
    return (_jsx(ShadcnFormField, { control: control, name: name, render: ({ field }) => (_jsxs(FormItem, { className: cn("flex flex-row items-start space-x-3 space-y-0", className), children: [_jsx(FormControl, { children: _jsx(Checkbox, { checked: field.value, onCheckedChange: field.onChange, disabled: disabled }) }), _jsxs("div", { className: "space-y-1 leading-none", children: [_jsx(FormLabel, { className: "cursor-pointer", children: children }), description && _jsx(FormDescription, { children: description })] })] })) }));
}
export function RadioGroupField({ control, name, label, description, required, disabled, className, options, orientation = "vertical", }) {
    return (_jsx(ShadcnFormField, { control: control, name: name, render: ({ field }) => (_jsxs(FormItem, { className: className, children: [label && (_jsx(FormLabel, { className: cn(required &&
                        "after:content-['*'] after:ml-0.5 after:text-red-500"), children: label })), _jsx(FormControl, { children: _jsx(RadioGroup, { onValueChange: field.onChange, defaultValue: field.value, className: cn(orientation === "horizontal"
                            ? "flex flex-row space-x-4"
                            : "flex flex-col space-y-2"), disabled: disabled, children: options.map((option) => (_jsxs(FormItem, { className: "flex items-center space-x-3 space-y-0", children: [_jsx(FormControl, { children: _jsx(RadioGroupItem, { value: option.value, disabled: option.disabled || disabled }) }), _jsxs("div", { className: "space-y-1 leading-none", children: [_jsx(FormLabel, { className: "cursor-pointer font-normal", children: option.label }), option.description && (_jsx(FormDescription, { children: option.description }))] })] }, option.value))) }) }), description && _jsx(FormDescription, { children: description }), _jsx(FormMessage, {})] })) }));
}
export function SwitchField({ control, name, description, disabled, className, children, }) {
    return (_jsx(ShadcnFormField, { control: control, name: name, render: ({ field }) => (_jsxs(FormItem, { className: cn("flex flex-row items-center justify-between rounded-lg border p-4", className), children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx(FormLabel, { className: "text-base cursor-pointer", children: children }), description && _jsx(FormDescription, { children: description })] }), _jsx(FormControl, { children: _jsx(Switch, { checked: field.value, onCheckedChange: field.onChange, disabled: disabled }) })] })) }));
}
export function FileUploadField({ control, name, label, description, required, disabled, className, accept, multiple = false, maxSize, onFileSelect, }) {
    const inputRef = React.useRef(null);
    return (_jsx(ShadcnFormField, { control: control, name: name, render: ({ field: { onChange, value, ...field }, fieldState }) => (_jsxs(FormItem, { className: className, children: [label && (_jsx(FormLabel, { className: cn(required &&
                        "after:content-['*'] after:ml-0.5 after:text-red-500"), children: label })), _jsx(FormControl, { children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: cn("border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors", fieldState.error
                                    ? "border-red-500 hover:border-red-600"
                                    : "border-gray-300 hover:border-gray-400", disabled && "opacity-50 cursor-not-allowed"), onClick: () => !disabled && inputRef.current?.click(), children: [_jsx(Upload, { className: "mx-auto h-8 w-8 text-gray-400" }), _jsx("p", { className: "mt-2 text-sm text-gray-600", children: "Click to upload or drag and drop" }), accept && (_jsxs("p", { className: "text-xs text-gray-500", children: ["Accepted formats: ", accept] })), maxSize && (_jsxs("p", { className: "text-xs text-gray-500", children: ["Max size: ", (maxSize / 1024 / 1024).toFixed(1), "MB"] }))] }), _jsx("input", { ...field, ref: inputRef, type: "file", accept: accept, multiple: multiple, disabled: disabled, className: "hidden", onChange: (e) => {
                                    const files = e.target.files;
                                    onChange(multiple ? files : files?.[0] || null);
                                    onFileSelect?.(files);
                                } }), value && (_jsx("div", { className: "space-y-2", children: multiple && Array.isArray(value) ? (value.map((file, index) => (_jsx(FilePreview, { file: file, onRemove: () => {
                                        const newFiles = value.filter((_, i) => i !== index);
                                        onChange(newFiles.length > 0 ? newFiles : null);
                                    } }, index)))) : value instanceof File ? (_jsx(FilePreview, { file: value, onRemove: () => onChange(null) })) : null }))] }) }), description && _jsx(FormDescription, { children: description }), _jsx(FormMessage, {})] })) }));
}
// File preview component
function FilePreview({ file, onRemove }) {
    return (_jsxs("div", { className: "flex items-center justify-between p-2 bg-gray-50 rounded", children: [_jsx("div", { className: "flex items-center space-x-2", children: _jsxs("div", { className: "text-sm", children: [_jsx("p", { className: "font-medium", children: file.name }), _jsxs("p", { className: "text-gray-500", children: [(file.size / 1024).toFixed(1), " KB"] })] }) }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: onRemove, className: "text-red-500 hover:text-red-700", children: _jsx(X, { className: "h-4 w-4" }) })] }));
}
