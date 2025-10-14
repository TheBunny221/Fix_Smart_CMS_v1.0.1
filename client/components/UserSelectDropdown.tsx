import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search, User, Settings, Users, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "../lib/utils";

interface UserOption {
  id: string;
  fullName: string;
  email: string;
  role: string;
  ward?: { name: string } | null;
  department?: string;
}

interface UserSelectDropdownProps {
  users: UserOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  isLoading?: boolean;
  error?: string | undefined;
  allowNone?: boolean;
  className?: string;
}

const UserSelectDropdown: React.FC<UserSelectDropdownProps> = ({
  users,
  value,
  onValueChange,
  placeholder = "Select user",
  label,
  disabled = false,
  isLoading = false,
  error,
  allowNone = true,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.ward?.name && user.ward.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Get selected user
  const selectedUser = users.find((user) => user.id === value);

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "WARD_OFFICER":
        return <User className="h-4 w-4" />;
      case "MAINTENANCE_TEAM":
        return <Settings className="h-4 w-4" />;
      case "ADMINISTRATOR":
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "WARD_OFFICER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "MAINTENANCE_TEAM":
        return "bg-green-100 text-green-800 border-green-200";
      case "ADMINISTRATOR":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setSearchTerm("");
    } else if (event.key === "Enter" && !isOpen) {
      setIsOpen(true);
    }
  };

  const handleSelect = (userId: string) => {
    onValueChange(userId);
    setIsOpen(false);
    setSearchTerm("");
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange("none");
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {error && (
        <div className="text-xs text-red-600 mb-1">{error}</div>
      )}

      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className={cn(
          "w-full justify-between h-auto min-h-[2.5rem] p-3",
          error && "border-red-300 focus:border-red-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      >
        <div className="flex items-center flex-1 min-w-0">
          {selectedUser ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center text-left min-w-0 flex-1">
                <div className="flex-shrink-0 mr-3">
                  {getRoleIcon(selectedUser.role)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">
                    {selectedUser.fullName}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {selectedUser.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                <Badge
                  variant="outline"
                  className={cn("text-xs", getRoleBadgeColor(selectedUser.role))}
                >
                  {selectedUser.role.replace("_", " ")}
                </Badge>
                {allowNone && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-gray-200"
                    onClick={clearSelection}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ) : value === "none" && allowNone ? (
            <div className="flex items-center text-gray-500">
              <User className="h-4 w-4 mr-2" />
              <span>No Assignment</span>
            </div>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 flex-shrink-0 transition-transform",
          isOpen && "transform rotate-180"
        )} />
      </Button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading users...
              </div>
            ) : (
              <>
                {/* No Assignment Option */}
                {allowNone && (
                  <button
                    type="button"
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors",
                      value === "none" && "bg-blue-50"
                    )}
                    onClick={() => handleSelect("none")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-3 text-gray-400" />
                        <span className="text-gray-600">No Assignment</span>
                      </div>
                      {value === "none" && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </button>
                )}

                {/* User Options */}
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors",
                        value === user.id && "bg-blue-50"
                      )}
                      onClick={() => handleSelect(user.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0 flex-1">
                          <div className="flex-shrink-0 mr-3">
                            {getRoleIcon(user.role)}
                          </div>
                          <div className="min-w-0 flex-1 text-left">
                            <div className="font-medium text-sm  text-left text-gray-900 truncate">
                              {user.fullName}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {user.email}
                            </div>
                            {(user.ward?.name || user.department) && (
                              <div className="text-xs text-blue-600 truncate mt-1">
                                {user.ward?.name || user.department}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getRoleBadgeColor(user.role))}
                          >
                            {user.role.replace("_", " ")}
                          </Badge>
                          {value === user.id && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? "No users found matching your search" : "No users available"}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelectDropdown;