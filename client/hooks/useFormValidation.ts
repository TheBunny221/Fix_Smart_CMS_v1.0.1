import { useCallback, useState } from "react";
import {
  useForm,
  UseFormReturn,
  FieldValues,
  DefaultValues,
  Path,
  PathValue,
  Resolver,
} from "react-hook-form";
import { toast } from "./use-toast";
import { useAppSelector } from "../store/hooks";
import { selectTranslations } from "../store/slices/languageSlice";

// Enhanced form configuration
export interface FormConfig<T extends FieldValues> {
  schema?: unknown;
  resolver?: Resolver<T>;
  defaultValues?: DefaultValues<T>;
  mode?: "onChange" | "onBlur" | "onSubmit" | "onTouched" | "all";
  reValidateMode?: "onChange" | "onBlur" | "onSubmit";
  shouldFocusError?: boolean;
  delayError?: number;
}

// Server error handling
export interface ServerError {
  field?: string;
  message: string;
  code?: string;
}

// Form submission state
export interface FormSubmissionState {
  isSubmitting: boolean;
  hasSubmitted: boolean;
  isSuccess: boolean;
  error: string | null;
  serverErrors: ServerError[];
}

interface ApiErrorResponse {
  data?: {
    errors?: ServerError | ServerError[];
    message?: string;
  };
}

interface ApiErrorLike {
  response?: ApiErrorResponse;
  message?: string;
}

const extractMessage = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object" && "message" in value) {
    const message = (value as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }
  return undefined;
};

// Enhanced form hook with comprehensive error handling
export interface UseFormValidationResult<T extends FieldValues> {
  form: UseFormReturn<T>;
  formState: UseFormReturn<T>["formState"];
  submissionState: FormSubmissionState;
  handleSubmit: (onSubmit: (data: T) => Promise<unknown>) => ReturnType<UseFormReturn<T>["handleSubmit"]>;
  resetForm: (values?: DefaultValues<T>) => void;
  clearErrors: () => void;
  register: UseFormReturn<T>["register"];
  control: UseFormReturn<T>["control"];
  watch: UseFormReturn<T>["watch"];
  watchField: (fieldName: Path<T>) => PathValue<T, Path<T>>;
  setValue: UseFormReturn<T>["setValue"];
  getValues: UseFormReturn<T>["getValues"];
  trigger: UseFormReturn<T>["trigger"];
  setServerErrors: (errors: ServerError | ServerError[] | string) => void;
  clearServerError: (fieldName: Path<T>) => void;
  getFieldError: (fieldName: Path<T>) => string | undefined;
  hasFieldError: (fieldName: Path<T>) => boolean;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  hasSubmitted: boolean;
  isSuccess: boolean;
  globalError: string | null;
}

export function useFormValidation<T extends FieldValues>(
  config: FormConfig<T> = {},
): UseFormValidationResult<T> {
  const translations = useAppSelector(selectTranslations);
  const [submissionState, setSubmissionState] = useState<FormSubmissionState>({
    isSubmitting: false,
    hasSubmitted: false,
    isSuccess: false,
    error: null,
    serverErrors: [],
  });

  // Initialize react-hook-form
  const form = useForm<T>({
    ...(config.resolver ? { resolver: config.resolver } : {}),
    ...(config.defaultValues !== undefined
      ? { defaultValues: config.defaultValues }
      : {}),
    mode: config.mode || "onSubmit",
    reValidateMode: config.reValidateMode || "onChange",
    shouldFocusError: config.shouldFocusError !== false,
    delayError: config.delayError || 300,
  });

  // Clear server errors when field changes
  const clearServerError = useCallback((fieldName: Path<T>) => {
    setSubmissionState((prev) => ({
      ...prev,
      serverErrors: prev.serverErrors.filter(
        (error) => error.field !== fieldName,
      ),
    }));
  }, []);

  // Set server errors from API response
  const setServerErrors = useCallback(
    (errors: ServerError | ServerError[] | string) => {
      if (typeof errors === "string") {
        setSubmissionState((prev) => ({
          ...prev,
          error: errors,
          serverErrors: [],
        }));
      } else {
        const serverErrors = Array.isArray(errors) ? errors : [errors];

        // Set field-specific errors
        serverErrors.forEach((error) => {
          const field = error.field as Path<T> | undefined;
          if (field && form.getValues(field) !== undefined) {
            form.setError(field, {
              type: "server",
              message: error.message,
            });
          }
        });

        setSubmissionState((prev) => ({
          ...prev,
          serverErrors,
          error: serverErrors.find((e) => !e.field)?.message || null,
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
      error: null,
      serverErrors: [],
    }));
  }, [form]);

  // Handle form submission with comprehensive error handling
  const handleSubmit = useCallback(
    (onSubmit: (data: T) => Promise<unknown>) => {
      return form.handleSubmit(async (data) => {
        setSubmissionState((prev) => ({
          ...prev,
          isSubmitting: true,
          error: null,
          serverErrors: [],
        }));

        try {
          const result = await onSubmit(data);

          setSubmissionState((prev) => ({
            ...prev,
            isSubmitting: false,
            hasSubmitted: true,
            isSuccess: true,
          }));

          // Show success toast
          toast({
            title: translations?.common?.success || "Success",
            description:
              extractMessage(result) ||
              "Operation completed successfully.",
            variant: "default",
          });

          return result;
        } catch (error: unknown) {
          setSubmissionState((prev) => ({
            ...prev,
            isSubmitting: false,
            hasSubmitted: true,
            isSuccess: false,
          }));

          // Handle different error types
          const apiError = error as ApiErrorLike;

          if (apiError.response?.data) {
            const { data } = apiError.response;

            if (data.errors && Array.isArray(data.errors)) {
              // Validation errors from server
              setServerErrors(data.errors);
            } else if (data.errors && !Array.isArray(data.errors)) {
              setServerErrors(data.errors);
            } else if (data.message) {
              // General error message
              setServerErrors(data.message);
            }
          } else if (apiError.message) {
            setServerErrors(apiError.message);
          } else {
            setServerErrors(
              translations?.messages?.errorOccurred ||
                translations?.common?.error ||
                "An error occurred",
            );
          }

          // Show error toast
          toast({
            title: translations?.common?.error || "Error",
            description:
              apiError.message ||
              translations?.messages?.errorOccurred ||
              translations?.common?.error ||
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
  const resetForm = useCallback(
    (values?: DefaultValues<T>) => {
      form.reset(values);
      setSubmissionState({
        isSubmitting: false,
        hasSubmitted: false,
        isSuccess: false,
        error: null,
        serverErrors: [],
      });
    },
    [form],
  );

  // Get field error (client or server)
  const getFieldError = useCallback(
    (fieldName: Path<T>) => {
      // Check for react-hook-form errors first
      const { error } = form.getFieldState(fieldName, form.formState);
      if (error?.message) {
        return String(error.message);
      }

      // Check for server errors
      const serverError = submissionState.serverErrors.find(
        (error) => error.field === fieldName,
      );
      return serverError?.message;
    },
    [form, submissionState.serverErrors],
  );

  // Check if field has error
  const hasFieldError = useCallback(
    (fieldName: Path<T>) => {
      return !!getFieldError(fieldName);
    },
    [getFieldError],
  );

  // Watch field values with error clearing
  const watchField = useCallback(
    (fieldName: Path<T>) => {
      const value = form.watch(fieldName);

      // Clear server error when field changes
      if (
        submissionState.serverErrors.some((error) => error.field === fieldName)
      ) {
        clearServerError(fieldName);
      }

      return value as PathValue<T, Path<T>>;
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
export function useDynamicValidation<T extends FieldValues>(
  schema: unknown,
  dependencies: unknown[] = [],
): {
  schema: unknown;
  updateSchema: (newSchema: unknown) => void;
} {
  const [currentSchema, setCurrentSchema] = useState(schema);

  const updateSchema = useCallback((newSchema: unknown) => {
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
export function useFormPersistence<T extends FieldValues>(
  key: string,
  form: UseFormReturn<T>,
): {
  saveFormData: () => void;
  loadFormData: () => void;
  clearSavedData: () => void;
} {
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
        const parsedData = JSON.parse(savedData) as Partial<Record<keyof T, unknown>>;
        (Object.keys(parsedData) as Array<keyof T>).forEach((fieldName) => {
          const value = parsedData[fieldName];
          form.setValue(fieldName as Path<T>, value as T[keyof T]);
        });
      }
    } catch (error) {
      console.warn("Failed to load saved form data:", error);
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
