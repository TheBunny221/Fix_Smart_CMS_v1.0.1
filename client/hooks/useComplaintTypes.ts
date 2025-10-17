import { useMemo } from "react";
import { useAppSelector } from "../store/hooks";
import { 
  selectComplaintTypes, 
  selectSystemConfigLoading, 
  selectSystemConfigError 
} from "../store/slices/systemConfigSlice";

export interface ComplaintTypeOption {
  value: string;
  label: string;
  description?: string;
  priority?: string;
  slaHours?: number;
}

export const useComplaintTypes = () => {
  const complaintTypes = useAppSelector(selectComplaintTypes);
  const isLoading = useAppSelector(selectSystemConfigLoading);
  const error = useAppSelector(selectSystemConfigError);

  const complaintTypeOptions = useMemo(() => {
    return complaintTypes.map((type) => ({
      value: type.id,
      label: type.name,
      description: type.description,
      priority: type.priority,
      slaHours: type.slaHours,
    }));
  }, [complaintTypes]);

  const getComplaintTypeById = (id: string) => {
    return complaintTypes.find((type) => type.id === id);
  };

  const getComplaintTypeByName = (name: string) => {
    return complaintTypes.find((type) => type.name === name);
  };

  return {
    complaintTypes,
    complaintTypeOptions,
    isLoading,
    error,
    getComplaintTypeById,
    getComplaintTypeByName,
  };
};
