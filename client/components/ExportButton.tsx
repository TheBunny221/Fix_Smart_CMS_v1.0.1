/**
 * Unified Export Button Component
 * Provides a clean dropdown interface for PDF, Excel, and CSV exports
 */

import React, { useState } from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  File,
  Loader2 
} from 'lucide-react';
import { exportComplaints } from '../utils/exportUtils';
import { useToast } from '../hooks/use-toast';

interface ExportButtonProps {
  complaints: any[];
  systemConfig: {
    appName: string;
    appLogoUrl?: string;
    complaintIdPrefix: string;
  };
  user: {
    role: string;
    wardId?: string;
  };
  filters?: any;
  disabled?: boolean;
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  complaints,
  systemConfig,
  user,
  filters,
  disabled = false,
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (isExporting) return;

    setIsExporting(true);
    setExportingFormat(format);

    try {
      const options = {
        systemConfig,
        userRole: user.role,
        ...(user.wardId && { userWard: user.wardId }),
        filters
      };

      await exportComplaints(complaints, format, options);

      // Success toast
      toast({
        title: "Export Successful",
        description: `${format.toUpperCase()} export completed successfully!`,
      });

    } catch (error) {
      console.error(`${format} export failed:`, error);
      
      // Error toast
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : `${format.toUpperCase()} export failed`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  const exportOptions = [
    {
      format: 'pdf' as const,
      label: 'Export as PDF',
      icon: FileText,
      description: 'Formatted document with styling'
    },
    {
      format: 'excel' as const,
      label: 'Export as Excel',
      icon: FileSpreadsheet,
      description: 'Spreadsheet with multiple sheets'
    },
    {
      format: 'csv' as const,
      label: 'Export as CSV',
      icon: File,
      description: 'Simple comma-separated values'
    }
  ];

  const isDisabled = disabled || complaints.length === 0 || isExporting;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isDisabled}
          className={`${className} ${isExporting ? 'opacity-75' : ''}`}
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        {exportOptions.map((option) => {
          const IconComponent = option.icon;
          const isCurrentlyExporting = exportingFormat === option.format;
          
          return (
            <DropdownMenuItem
              key={option.format}
              onClick={() => handleExport(option.format)}
              disabled={isExporting}
              className="flex flex-col items-start p-3 cursor-pointer hover:bg-gray-50"
            >
              <div className="flex items-center w-full">
                {isCurrentlyExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <IconComponent className="h-4 w-4 mr-2" />
                )}
                <span className="font-medium">{option.label}</span>
              </div>
              <span className="text-xs text-gray-500 mt-1 ml-6">
                {option.description}
              </span>
            </DropdownMenuItem>
          );
        })}
        
        {complaints.length > 0 && (
          <div className="px-3 py-2 text-xs text-gray-500 border-t">
            {complaints.length} record{complaints.length !== 1 ? 's' : ''} available
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};