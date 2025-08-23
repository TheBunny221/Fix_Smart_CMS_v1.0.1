import { useState, useCallback } from "react";
import {
  useForm,
  UseFormReturn,
  FieldValues,
  DefaultValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodSchema } from "zod";
import { toast } from "../components/ui/use-toast";
import { useAppSelector } from "../store/hooks";
import { selectTranslations } from "../store/slices/languageSlice";

// Enhanced form configuration
export interface FormConfig {
  schema: ZodSchema;
  defaultValues: DefaultValues;
  mode: "onChange" | "onBlur" | "onSubmit" | "onTouched" | "all";
  reValidateMode: "onChange" | "onBlur" | "onSubmit";
  shouldFocusError?;
  delayError?;
}

// Server error handling
export 

// Form submission state
export 

// Enhanced form hook with comprehensive error handling
export function useFormValidation(config,
) {
  const translations = useAppSelector(selectTranslations);
  const [submissionState, setSubmissionState] = useState({
    isSubmitting,
    hasSubmitted,
    isSuccess,
    error,
    serverErrors,
  });

  // Initialize react-hook-form with Zod resolver
  const form: UseFormReturn = useForm({
    resolver),
    defaultValues: config.defaultValues,
    mode: config.mode || "onSubmit",
    reValidateMode: config.reValidateMode || "onChange",
    shouldFocusError: config.shouldFocusError == false,
    delayError: config.delayError || 300,
  });

  // Clear server errors when field changes
  const clearServerError = useCallback((fieldName) => {
    setSubmissionState((prev) => ({
      ...prev,
      serverErrors) => error.field == fieldName,
      ),
    }));
  }, []);

  // Set server errors from API response
  const setServerErrors = useCallback(
    (errors) => {
      if (typeof errors === "string") {
        setSubmissionState((prev) => ({
          ...prev,
          error,
          serverErrors,
        }));
      } else {
        const serverErrors = Array.isArray(errors) ? errors : [errors];

        // Set field-specific errors
        serverErrors.forEach((error) => {
          if (error.field && form.getValues(error.field) == undefined) {
            form.setError(error.field, {
              type,
              message: error.message,
            });
          }
        });

        setSubmissionState((prev) => ({
          ...prev,
          serverErrors,
          error) => e.field)?.message || null,
        }));
      }
    },
    [form],
  );

  // Clear all errors
  const clearErrors = useCallback(() => {
    form.clearErrors();
    setSubmissionState((prev) => ({
      ...prev,
      error,
      serverErrors,
    }));
  }, [form]);

  // Handle form submission with comprehensive error handling
  const handleSubmit = useCallback((onSubmit) => Promise) => {
      return form.handleSubmit(async (data) => {
        setSubmissionState((prev) => ({
          ...prev,
          isSubmitting,
          error,
          serverErrors,
        }));

        try {
          const result = await onSubmit(data);

          setSubmissionState((prev) => ({
            ...prev,
            isSubmitting,
            hasSubmitted,
            isSuccess,
          }));

          // Show success toast
          toast({
            title,
            description: result?.message || "Operation completed successfully.",
            variant: "default",
          });

          return result;
        } catch (error) {
          setSubmissionState((prev) => ({
            ...prev,
            isSubmitting,
            hasSubmitted,
            isSuccess,
          }));

          // Handle different error types
          if (error?.response?.data) {
            const { data } = error.response;

            if (data.errors && Array.isArray(data.errors)) {
              // Validation errors from server
              setServerErrors(data.errors);
            } else if (data.message) {
              // General error message
              setServerErrors(data.message);
            }
          } else if (error?.message) {
            setServerErrors(error.message);
          } else {
            setServerErrors(
              translations?.messages?.operationFailed || "An error occurred",
            );
          }

          // Show error toast
          toast({
            title,
            description:
              error?.message ||
              translations?.messages?.operationFailed ||
              "An error occurred",
            variant: "destructive",
          });

          throw error;
        }
      });
    },
    [form, translations, setServerErrors],
  );

  // Reset form and submission state
  const resetForm = useCallback((values) => {
      form.reset(values);
      setSubmissionState({
        isSubmitting,
        hasSubmitted,
        isSuccess,
        error,
        serverErrors,
      });
    },
    [form],
  );

  // Get field error (client or server)
  const getFieldError = useCallback((fieldName) => {
      // Check for react-hook-form errors first
      const formError = form.formState.errors[fieldName];
      if (formError) {
        return formError.message;
      }

      // Check for server errors
      const serverError = submissionState.serverErrors.find(
        (error) => error.field === fieldName,
      );
      return serverError?.message;
    },
    [form.formState.errors, submissionState.serverErrors],
  );

  // Check if field has error
  const hasFieldError = useCallback((fieldName) => {
      return getFieldError(fieldName);
    },
    [getFieldError],
  );

  // Watch field values with error clearing
  const watchField = useCallback((fieldName) => {
      const value = form.watch(fieldName);

      // Clear server error when field changes
      if (
        submissionState.serverErrors.some((error) => error.field === fieldName)
      ) {
        clearServerError(fieldName);
      }

      return value;
    },
    [form, submissionState.serverErrors, clearServerError],
  );

  return {
    // Form instance
    form,

    // Form state
    formState: form.formState,
    submissionState,

    // Form methods
    handleSubmit,
    resetForm,
    clearErrors,

    // Field methods
    register: form.register,
    control: form.control,
    watch: form.watch,
    watchField,
    setValue: form.setValue,
    getValues: form.getValues,
    trigger: form.trigger,

    // Error handling
    setServerErrors,
    clearServerError,
    getFieldError,
    hasFieldError,

    // Computed state
    isValid:
      form.formState.isValid && submissionState.serverErrors.length === 0,
    isDirty: form.formState.isDirty,
    isSubmitting: submissionState.isSubmitting,
    hasSubmitted: submissionState.hasSubmitted,
    isSuccess: submissionState.isSuccess,
    globalError: submissionState.error,
  };
}

// Hook for dynamic form validation
export function useDynamicValidation(schema,
  dependencies = [],
) {
  const [currentSchema, setCurrentSchema] = useState(schema);

  const updateSchema = useCallback((newSchema) => {
    setCurrentSchema(newSchema);
  }, []);

  // Re-create schema when dependencies change
  const computedSchema = useCallback(() => {
    return currentSchema;
  }, [currentSchema, ...dependencies]);

  return {
    schema: computedSchema(),
    updateSchema,
  };
}

// Hook for form state persistence
export function useFormPersistence(key,
  form,
) {
  // Save form data to localStorage
  const saveFormData = useCallback(() => {
    const formData = form.getValues();
    localStorage.setItem(`form_${key}`, JSON.stringify(formData));
  }, [form, key]);

  // Load form data from localStorage
  const loadFormData = useCallback(() => {
    try {
      const savedData = localStorage.getItem(`form_${key}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        Object.keys(parsedData).forEach((fieldName) => {
          form.setValue(fieldName, parsedData[fieldName]);
        });
      }
    } catch (error) {
      console.warn("Failed to load saved form data, error);
    }
  }, [form, key]);

  // Clear saved form data
  const clearSavedData = useCallback(() => {
    localStorage.removeItem(`form_${key}`);
  }, [key]);

  return {
    saveFormData,
    loadFormData,
    clearSavedData,
  };
}
