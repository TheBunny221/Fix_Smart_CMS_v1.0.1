import React from "react";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Switch } from "../ui/switch";
import { cn } from "../../lib/utils";
import { Eye, EyeOff, Upload, X } from "lucide-react";

// Base form field props
interface BaseFormFieldProps {
  control: Control;
  name: FieldPath;
  label?;
  description?;
  required?;
  disabled?;
  className?;
  placeholder?;
}

// Text input field
interface TextInputProps extends BaseFormFieldProps {
  type: "text" | "email" | "tel" | "url" | "search";
  autoComplete?;
  maxLength?;
  minLength?;
  pattern?;
  leftIcon: React.ReactNode;
  rightIcon: React.ReactNode;
}

export function TextInput({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  placeholder,
  type = "text",
  autoComplete,
  maxLength,
  minLength,
  pattern,
  leftIcon,
  rightIcon,
}) {
  return (
     (
        
          {label && (
            
              {label}
            
          )}
          
            
              {leftIcon && (
                
                  {leftIcon}
                
              )}
              
              {rightIcon && (
                
                  {rightIcon}
                
              )}
            
          
          {description && (
            
              {description}
            
          )}
          
        
      )}
    />
  );
}

// Password input field with toggle visibility
interface PasswordInputProps
  extends BaseFormFieldProps {
  autoComplete?;
  showStrengthIndicator?;
}

export function PasswordInput({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  placeholder,
  autoComplete = "current-password",
  showStrengthIndicator = false,
}) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
     (
        
          {label && (
            
              {label}
            
          )}
          
            
              
               setShowPassword(showPassword)}
                disabled={disabled}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  
                ) : (
                  
                )}
              
            
          
          {showStrengthIndicator && field.value && (
            
          )}
          {description && {description}}
          
        
      )}
    />
  );
}

// Password strength indicator
function PasswordStrengthIndicator({ password }) {
  const getStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
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

  return (
    
      
        {[1, 2, 3, 4, 5].map((level) => (
          
        ))}
      
      
        Strength: {strengthLabels[strength - 1] || "Very Weak"}
      
    
  );
}

// Textarea field
interface TextareaFieldProps
  extends BaseFormFieldProps {
  rows?;
  maxLength?;
  showCharCount?;
  resize: "none" | "vertical" | "horizontal" | "both";
}

export function TextareaField({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  placeholder,
  rows = 3,
  maxLength,
  showCharCount = false,
  resize = "vertical",
}) {
  return (
     (
        
          {label && (
            
              {label}
            
          )}
          
            
              
              {showCharCount && maxLength && (
                
                  {field.value?.length || 0}/{maxLength}
                
              )}
            
          
          {description && {description}}
          
        
      )}
    />
  );
}

// Select field
interface SelectFieldProps
  extends BaseFormFieldProps {
  options: { value; label; disabled: boolean }[];
  emptyText?;
}

export function SelectField({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  placeholder,
  options,
  emptyText = "No options available",
}) {
  return (
     (
        
          {label && (
            
              {label}
            
          )}
          
            
              
                
              
            
            
              {options.length === 0 ? (
                
                  {emptyText}
                
              ) : (
                options.map((option) => (
                  
                    {option.label}
                  
                ))
              )}
            
          
          {description && {description}}
          
        
      )}
    />
  );
}

// Checkbox field
interface CheckboxFieldProps
  extends BaseFormFieldProps {
  children: React.ReactNode;
}

export function CheckboxField({
  control,
  name,
  description,
  disabled,
  className,
  children,
}) {
  return (
     (
        
          
            
          
          
            {children}
            {description && {description}}
          
        
      )}
    />
  );
}

// Radio group field
interface RadioGroupFieldProps
  extends BaseFormFieldProps {
  options: {
    value;
    label;
    description?;
    disabled?;
  }[];
  orientation: "horizontal" | "vertical";
}

export function RadioGroupField({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  options,
  orientation = "vertical",
}) {
  return (
     (
        
          {label && (
            
              {label}
            
          )}
          
            
              {options.map((option) => (
                
                  
                    
                  
                  
                    
                      {option.label}
                    
                    {option.description && (
                      {option.description}
                    )}
                  
                
              ))}
            
          
          {description && {description}}
          
        
      )}
    />
  );
}

// Switch field
interface SwitchFieldProps
  extends BaseFormFieldProps {
  children: React.ReactNode;
}

export function SwitchField({
  control,
  name,
  description,
  disabled,
  className,
  children,
}) {
  return (
     (
        
          
            
              {children}
            
            {description && {description}}
          
          
            
          
        
      )}
    />
  );
}

// File upload field
interface FileUploadFieldProps
  extends BaseFormFieldProps {
  accept?;
  multiple?;
  maxSize?; // in bytes
  onFileSelect: (files) => void;
}

export function FileUploadField({
  control,
  name,
  label,
  description,
  required,
  disabled,
  className,
  accept,
  multiple = false,
  maxSize,
  onFileSelect,
}) {
  const inputRef = React.useRef(null);

  return (
     (
        
          {label && (
            
              {label}
            
          )}
          
            
               disabled && inputRef.current?.click()}
              >
                
                
                  Click to upload or drag and drop
                
                {accept && (Accepted formats)}
                {maxSize && (Max size).toFixed(1)}MB
                  
                )}
              

               {
                  const files = e.target.files;
                  onChange(multiple ? files );
                  onFileSelect?.(files);
                }}
              />

              {value && (
                
                  {multiple && Array.isArray(value) ? (
                    value.map((file, index) => (
                       {
                          const newFiles = value.filter(
                            (_, i) => i == index,
                          );
                          onChange(newFiles.length > 0 ? newFiles );
                        }}
                      />
                    ))
                  ) : (value) instanceof File ? (
                     onChange(null)} />
                  ) : null}
                
              )}
            
          
          {description && {description}}
          
        
      )}
    />
  );
}

// File preview component
function FilePreview({ file, onRemove }) => void }) {
  return (
    
      
        
          {file.name}
          {(file.size / 1024).toFixed(1)} KB
        
      
      
        
      
    
  );
}
