import React, { useState } from "react";
import { useAppDispatch } from "../store/hooks";
import { showSuccessToast, showErrorToast } from "../store/slices/uiSlice";
import {
  useGetAllWardsForManagementQuery,
  useCreateWardMutation,
  useUpdateWardMutation,
  useDeleteWardMutation,
  useCreateSubZoneMutation,
  useUpdateSubZoneMutation,
  useDeleteSubZoneMutation,
} from "../store/api/adminApi";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Users,
  RefreshCw,
  Search,
} from "lucide-react";

interface Ward {
  id: string;
  name: string;
  description?: string;
  isActive: boolean; // Required since admin API returns this field
  subZones?: SubZone[];
}

interface SubZone {
  id: string;
  name: string;
  wardId?: string; // Optional since admin API might not return this in nested structure
  description?: string;
  isActive: boolean; // Required since admin API returns this field
  centerLat?: number;
  centerLng?: number;
}

interface WardFormData {
  name: string;
  description: string;
  isActive: boolean;
}

interface SubZoneFormData {
  name: string;
  description: string;
  isActive: boolean;
}

const WardManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [isWardDialogOpen, setIsWardDialogOpen] = useState(false);
  const [isSubZoneDialogOpen, setIsSubZoneDialogOpen] = useState(false);
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [editingSubZone, setEditingSubZone] = useState<SubZone | null>(null);
  const [wardFormData, setWardFormData] = useState<WardFormData>({
    name: "",
    description: "",
    isActive: true,
  });
  const [subZoneFormData, setSubZoneFormData] = useState<SubZoneFormData>({
    name: "",
    description: "",
    isActive: true,
  });

  const {
    data: wardsResponse,
    isLoading,
    error,
    refetch,
  } = useGetAllWardsForManagementQuery();

  // Admin API mutations for CRUD operations
  const [createWard] = useCreateWardMutation();
  const [updateWard] = useUpdateWardMutation();
  const [deleteWard] = useDeleteWardMutation();
  const [createSubZone] = useCreateSubZoneMutation();
  const [updateSubZone] = useUpdateSubZoneMutation();
  const [deleteSubZone] = useDeleteSubZoneMutation();

  const wards = wardsResponse?.data?.wards || [];

  // Filter wards based on search term and active status
  const filteredWards = wards.filter(ward => {
    const matchesSearch = ward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ward.description && ward.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = showInactive || ward.isActive;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateWard = async () => {
    try {
      await createWard({
        name: wardFormData.name,
        description: wardFormData.description,
      }).unwrap();
      dispatch(showSuccessToast("Ward Created", `Ward "${wardFormData.name}" created successfully`));
      setIsWardDialogOpen(false);
      resetWardForm();
      refetch();
    } catch (error: any) {
      dispatch(showErrorToast("Creation Failed", error.data?.message || "Failed to create ward"));
    }
  };

  const handleUpdateWard = async () => {
    if (!editingWard) return;
    
    try {
      await updateWard({
        id: editingWard.id,
        data: {
          name: wardFormData.name,
          description: wardFormData.description,
          isActive: wardFormData.isActive,
        },
      }).unwrap();
      dispatch(showSuccessToast("Ward Updated", `Ward "${wardFormData.name}" updated successfully`));
      setIsWardDialogOpen(false);
      resetWardForm();
      setEditingWard(null);
      refetch();
    } catch (error: any) {
      dispatch(showErrorToast("Update Failed", error.data?.message || "Failed to update ward"));
    }
  };

  const handleDeleteWard = async (ward: Ward) => {
    if (!confirm(`Are you sure you want to delete ward "${ward.name}"?`)) return;
    
    try {
      await deleteWard(ward.id).unwrap();
      dispatch(showSuccessToast("Ward Deleted", `Ward "${ward.name}" deleted successfully`));
      refetch();
    } catch (error: any) {
      dispatch(showErrorToast("Deletion Failed", error.data?.message || "Failed to delete ward"));
    }
  };

  const handleCreateSubZone = async () => {
    if (!selectedWard) return;
    
    try {
      await createSubZone({
        wardId: selectedWard.id,
        data: {
          name: subZoneFormData.name,
          description: subZoneFormData.description,
          isActive: subZoneFormData.isActive,
        },
      }).unwrap();
      dispatch(showSuccessToast("SubZone Created", `SubZone "${subZoneFormData.name}" created successfully`));
      setIsSubZoneDialogOpen(false);
      resetSubZoneForm();
      refetch();
    } catch (error: any) {
      dispatch(showErrorToast("Creation Failed", error.data?.message || "Failed to create subzone"));
    }
  };

  const handleUpdateSubZone = async () => {
    if (!editingSubZone || !selectedWard) return;
    
    try {
      await updateSubZone({
        wardId: selectedWard.id,
        id: editingSubZone.id,
        data: {
          name: subZoneFormData.name,
          description: subZoneFormData.description,
          isActive: subZoneFormData.isActive,
        },
      }).unwrap();
      dispatch(showSuccessToast("SubZone Updated", `SubZone "${subZoneFormData.name}" updated successfully`));
      setIsSubZoneDialogOpen(false);
      resetSubZoneForm();
      setEditingSubZone(null);
      refetch();
    } catch (error: any) {
      dispatch(showErrorToast("Update Failed", error.data?.message || "Failed to update subzone"));
    }
  };

  const handleDeleteSubZone = async (subZone: SubZone) => {
    if (!confirm(`Are you sure you want to delete subzone "${subZone.name}"?`)) return;
    
    try {
      // Find the ward that contains this subzone
      const parentWard = wards.find(ward => 
        ward.subZones?.some(sz => sz.id === subZone.id)
      );
      
      if (!parentWard) {
        dispatch(showErrorToast("Error", "Could not find parent ward for this subzone"));
        return;
      }

      await deleteSubZone({
        wardId: parentWard.id,
        id: subZone.id,
      }).unwrap();
      dispatch(showSuccessToast("SubZone Deleted", `SubZone "${subZone.name}" deleted successfully`));
      refetch();
    } catch (error: any) {
      dispatch(showErrorToast("Deletion Failed", error.data?.message || "Failed to delete subzone"));
    }
  };

  const resetWardForm = () => {
    setWardFormData({
      name: "",
      description: "",
      isActive: true,
    });
  };

  const resetSubZoneForm = () => {
    setSubZoneFormData({
      name: "",
      description: "",
      isActive: true,
    });
  };

  const openWardDialog = (ward?: Ward) => {
    if (ward) {
      setEditingWard(ward);
      setWardFormData({
        name: ward.name,
        description: ward.description || "",
        isActive: ward.isActive,
      });
    } else {
      setEditingWard(null);
      resetWardForm();
    }
    setIsWardDialogOpen(true);
  };

  const openSubZoneDialog = (ward: Ward, subZone?: SubZone) => {
    setSelectedWard(ward);
    if (subZone) {
      setEditingSubZone(subZone);
      setSubZoneFormData({
        name: subZone.name,
        description: subZone.description || "",
        isActive: subZone.isActive,
      });
    } else {
      setEditingSubZone(null);
      resetSubZoneForm();
    }
    setIsSubZoneDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading wards...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Wards</h2>
          <p className="text-gray-600 mb-4">
            Failed to load ward data: {error && 'data' in error ? JSON.stringify(error.data) : 'Unknown error'}
          </p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  // Debug: Show what data we're getting (including inactive wards)
  console.log('Ward management data:', { wardsResponse, wards, isLoading, error });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Ward & SubZone Management</h2>
          <p className="text-gray-600">
            Manage wards and their subzones ({wards.filter(w => w.isActive).length} active, {wards.filter(w => !w.isActive).length} inactive)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => openWardDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Ward
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search wards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={setShowInactive}
          />
          <Label htmlFor="show-inactive" className="text-sm">
            Show inactive wards
          </Label>
        </div>
      </div>

      {/* Wards List */}
      <div className="space-y-4">
        {filteredWards.map((ward) => (
          <Card key={ward.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5" />
                  <div>
                    <CardTitle className="text-lg">{ward.name}</CardTitle>
                    <p className="text-sm text-gray-600">{ward.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    ward.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {ward.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openSubZoneDialog(ward)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add SubZone
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openWardDialog(ward)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteWard(ward)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            {ward.subZones && ward.subZones.length > 0 && (
              <CardContent>
                <h4 className="font-medium mb-3">SubZones ({ward.subZones.length})</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ward.subZones.map((subZone) => (
                      <TableRow key={subZone.id}>
                        <TableCell className="font-medium">{subZone.name}</TableCell>
                        <TableCell>{subZone.description}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            subZone.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {subZone.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openSubZoneDialog(ward, subZone)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSubZone(subZone)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {filteredWards.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No wards found</h3>
          <p className="text-gray-600">Try adjusting your search terms</p>
        </div>
      )}

      {wards.length === 0 && !searchTerm && (
        <div className="text-center py-8">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No wards available</h3>
          <p className="text-gray-600">No ward data found in the system. Please check if wards have been seeded in the database.</p>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      )}

      {/* Ward Dialog */}
      <Dialog open={isWardDialogOpen} onOpenChange={setIsWardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWard ? 'Edit Ward' : 'Create New Ward'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ward-name">Name</Label>
              <Input
                id="ward-name"
                value={wardFormData.name}
                onChange={(e) => setWardFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter ward name"
              />
            </div>
            <div>
              <Label htmlFor="ward-description">Description</Label>
              <Textarea
                id="ward-description"
                value={wardFormData.description}
                onChange={(e) => setWardFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter ward description"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="ward-active"
                checked={wardFormData.isActive}
                onCheckedChange={(checked) => setWardFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="ward-active">Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsWardDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={editingWard ? handleUpdateWard : handleCreateWard}>
                {editingWard ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SubZone Dialog */}
      <Dialog open={isSubZoneDialogOpen} onOpenChange={setIsSubZoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubZone ? 'Edit SubZone' : 'Create New SubZone'}
              {selectedWard && ` in ${selectedWard.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subzone-name">Name</Label>
              <Input
                id="subzone-name"
                value={subZoneFormData.name}
                onChange={(e) => setSubZoneFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter subzone name"
              />
            </div>
            <div>
              <Label htmlFor="subzone-description">Description</Label>
              <Textarea
                id="subzone-description"
                value={subZoneFormData.description}
                onChange={(e) => setSubZoneFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter subzone description"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="subzone-active"
                checked={subZoneFormData.isActive}
                onCheckedChange={(checked) => setSubZoneFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="subzone-active">Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsSubZoneDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={editingSubZone ? handleUpdateSubZone : handleCreateSubZone}>
                {editingSubZone ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WardManagement;