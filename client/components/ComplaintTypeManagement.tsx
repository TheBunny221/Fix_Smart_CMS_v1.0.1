import React, { useState } from "react";
import { useAppDispatch } from "../store/hooks";
import { showSuccessToast, showErrorToast } from "../store/slices/uiSlice";
import {
  useGetComplaintTypesQuery,
  useCreateComplaintTypeMutation,
  useUpdateComplaintTypeMutation,
  useDeleteComplaintTypeMutation,
  useGetComplaintTypeStatsQuery,
  ComplaintType,
  CreateComplaintTypeRequest,
  UpdateComplaintTypeRequest,
} from "../store/api/complaintTypesApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  RefreshCw,
  Search,
  BarChart3,
  Clock,
} from "lucide-react";

interface ComplaintTypeFormData {
  name: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  slaHours: number;
  isActive: boolean;
}

const ComplaintTypeManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ComplaintType | null>(null);
  const [formData, setFormData] = useState<ComplaintTypeFormData>({
    name: "",
    description: "",
    priority: "MEDIUM",
    slaHours: 48,
    isActive: true,
  });

  const {
    data: typesResponse,
    isLoading,
    error,
    refetch,
  } = useGetComplaintTypesQuery();

  const {
    data: statsResponse,
    isLoading: statsLoading,
  } = useGetComplaintTypeStatsQuery();

  const [createComplaintType] = useCreateComplaintTypeMutation();
  const [updateComplaintType] = useUpdateComplaintTypeMutation();
  const [deleteComplaintType] = useDeleteComplaintTypeMutation();

  const complaintTypes = typesResponse?.data || [];
  const stats = statsResponse?.data || [];

  // Filter complaint types based on search term
  const filteredTypes = complaintTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatsForType = (typeName: string) => {
    return stats.find(stat => stat.type === typeName)?.count || 0;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "bg-blue-100 text-blue-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleCreate = async () => {
    try {
      const createData: CreateComplaintTypeRequest = {
        name: formData.name,
        description: formData.description,
        priority: formData.priority,
        slaHours: formData.slaHours,
      };

      await createComplaintType(createData).unwrap();
      dispatch(showSuccessToast("Type Created", `Complaint type "${formData.name}" created successfully`));
      setIsDialogOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      dispatch(showErrorToast("Creation Failed", error.data?.message || "Failed to create complaint type"));
    }
  };

  const handleUpdate = async () => {
    if (!editingType) return;
    
    try {
      const updateData: UpdateComplaintTypeRequest = {
        name: formData.name,
        description: formData.description,
        priority: formData.priority,
        slaHours: formData.slaHours,
        isActive: formData.isActive,
      };

      await updateComplaintType({ id: editingType.id, data: updateData }).unwrap();
      dispatch(showSuccessToast("Type Updated", `Complaint type "${formData.name}" updated successfully`));
      setIsDialogOpen(false);
      resetForm();
      setEditingType(null);
      refetch();
    } catch (error: any) {
      dispatch(showErrorToast("Update Failed", error.data?.message || "Failed to update complaint type"));
    }
  };

  const handleDelete = async (type: ComplaintType) => {
    const complaintsCount = getStatsForType(type.name);
    
    if (complaintsCount > 0) {
      if (!confirm(`This complaint type is used by ${complaintsCount} complaint(s). Are you sure you want to delete it?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to delete complaint type "${type.name}"?`)) {
        return;
      }
    }
    
    try {
      await deleteComplaintType(type.id).unwrap();
      dispatch(showSuccessToast("Type Deleted", `Complaint type "${type.name}" deleted successfully`));
      refetch();
    } catch (error: any) {
      dispatch(showErrorToast("Deletion Failed", error.data?.message || "Failed to delete complaint type"));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      priority: "MEDIUM",
      slaHours: 48,
      isActive: true,
    });
  };

  const openDialog = (type?: ComplaintType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        description: type.description,
        priority: type.priority,
        slaHours: type.slaHours,
        isActive: type.isActive,
      });
    } else {
      setEditingType(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading complaint types...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Complaint Types</h2>
          <p className="text-gray-600 mb-4">Failed to load complaint type data</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Complaint Type Management</h2>
          <p className="text-gray-600">Manage complaint types and their configurations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => openDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Type
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search complaint types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Statistics Summary */}
      {!statsLoading && stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Usage Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.slice(0, 4).map((stat) => (
                <div key={stat.type} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stat.count}</div>
                  <div className="text-sm text-gray-600">{stat.type}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complaint Types Table */}
      <Card>
        <CardHeader>
          <CardTitle>Complaint Types ({filteredTypes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>SLA Hours</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{type.description}</TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(type.priority)}>
                      {type.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-400" />
                      {type.slaHours}h
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1 text-gray-400" />
                      {getStatsForType(type.name)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={type.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {type.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDialog(type)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(type)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredTypes.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No complaint types found</h3>
              <p className="text-gray-600">Try adjusting your search terms</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Edit Complaint Type' : 'Create New Complaint Type'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="type-name">Name</Label>
              <Input
                id="type-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter complaint type name"
              />
            </div>
            <div>
              <Label htmlFor="type-description">Description</Label>
              <Textarea
                id="type-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter complaint type description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="type-priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") => 
                  setFormData(prev => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type-sla">SLA Hours</Label>
              <Input
                id="type-sla"
                type="number"
                min="1"
                value={formData.slaHours}
                onChange={(e) => setFormData(prev => ({ ...prev, slaHours: parseInt(e.target.value) || 48 }))}
                placeholder="Enter SLA hours"
              />
            </div>
            {editingType && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="type-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="type-active">Active</Label>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={editingType ? handleUpdate : handleCreate}>
                {editingType ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComplaintTypeManagement;