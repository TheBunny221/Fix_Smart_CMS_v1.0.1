import React, { useState } from 'react';
import { TemplateRegistry } from '../utils/templateEngine';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  FileText, 
  BarChart3, 
  List, 
  Download,
  Eye,
  Loader2
} from 'lucide-react';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (templateId: string, format: 'pdf' | 'excel' | 'html') => Promise<void>;
  isExporting?: boolean;
}

const templateIcons = {
  'unified': BarChart3,
  'analytics': BarChart3,
  'complaints-list': List,
  'default': FileText
};

const formatLabels = {
  pdf: 'PDF',
  excel: 'Excel',
  html: 'HTML'
};

const formatDescriptions = {
  pdf: 'Formatted document with charts and styling',
  excel: 'Spreadsheet with data tables and metadata',
  html: 'Web page that can be viewed in any browser'
};

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  isOpen,
  onClose,
  onExport,
  isExporting = false
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('unified');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'html'>('pdf');
  const [previewMode, setPreviewMode] = useState(false);

  const templates = TemplateRegistry.getAllTemplates();

  const handleExport = async () => {
    if (selectedTemplate && selectedFormat) {
      await onExport(selectedTemplate, selectedFormat);
    }
  };

  const handlePreview = () => {
    setPreviewMode(true);
    // In a real implementation, this would show a preview of the template
    // For now, we'll just show a placeholder
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Report
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Template Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Choose Template</h3>
            <div className="space-y-3">
              {templates.map((template) => {
                const IconComponent = templateIcons[template.id as keyof typeof templateIcons] || templateIcons.default;
                const isSelected = selectedTemplate === template.id;
                
                return (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <IconComponent className="h-4 w-4" />
                        {template.name}
                        {isSelected && (
                          <Badge variant="default" className="ml-auto">
                            Selected
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">{template.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Export Format</h3>
            <div className="space-y-3">
              {Object.entries(formatLabels).map(([format, label]) => {
                const isSelected = selectedFormat === format;
                
                return (
                  <Card 
                    key={format}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-green-500 bg-green-50' : ''
                    }`}
                    onClick={() => setSelectedFormat(format as 'pdf' | 'excel' | 'html')}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4" />
                        {label}
                        {isSelected && (
                          <Badge variant="secondary" className="ml-auto">
                            Selected
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        {formatDescriptions[format as keyof typeof formatDescriptions]}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Preview Section */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Preview</h4>
              <p className="text-sm text-gray-600 mb-3">
                Preview how your report will look before exporting.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                className="w-full"
                disabled={!selectedTemplate}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Template
              </Button>
            </div>
          </div>
        </div>

        {/* Export Summary */}
        {selectedTemplate && selectedFormat && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Export Summary</h4>
            <div className="text-sm text-blue-800">
              <p>
                <strong>Template:</strong> {templates.find(t => t.id === selectedTemplate)?.name}
              </p>
              <p>
                <strong>Format:</strong> {formatLabels[selectedFormat]}
              </p>
              <p className="mt-2 text-xs">
                The report will be generated using the selected template and downloaded as a {formatLabels[selectedFormat]} file.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!selectedTemplate || !selectedFormat || isExporting}
            className="min-w-[120px]"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};