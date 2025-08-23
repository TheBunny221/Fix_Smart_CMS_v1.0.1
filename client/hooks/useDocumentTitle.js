import { useEffect } from "react";
import { useSystemConfig } from "../contexts/SystemConfigContext";

export const useDocumentTitle = (pageTitle?) => {
  const { appName } = useSystemConfig();

  useEffect(() => {
    const title = pageTitle ? `${pageTitle} - ${appName}` ;
    document.title = title;
  }, [appName, pageTitle]);
};
