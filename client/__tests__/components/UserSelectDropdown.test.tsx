/**
 * UserSelectDropdown Component Tests
 * 
 * This file contains comprehensive tests for the UserSelectDropdown component.
 * To run these tests, ensure you have the following dependencies installed:
 * 
 * npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
 * npm install --save-dev @types/jest jest-environment-jsdom
 */

import React from 'react';
// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
// import '@testing-library/jest-dom';
import UserSelectDropdown from '../../components/UserSelectDropdown';

const mockUsers = [
  {
    id: '1',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    role: 'WARD_OFFICER',
    ward: { name: 'Ward 1' },
  },
  {
    id: '2',
    fullName: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'MAINTENANCE_TEAM',
    department: 'Electrical',
  },
  {
    id: '3',
    fullName: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    role: 'ADMINISTRATOR',
  },
];

const defaultProps = {
  users: mockUsers,
  value: '',
  onValueChange: () => {}, // jest.fn(),
  placeholder: 'Select user',
};

// Uncomment the following when running with Jest
/*
describe('UserSelectDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with placeholder text', () => {
    render(<UserSelectDropdown {...defaultProps} />);
    expect(screen.getByText('Select user')).toBeInTheDocument();
  });

  it('displays label when provided', () => {
    render(<UserSelectDropdown {...defaultProps} label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('shows error message when error prop is provided', () => {
    const errorMessage = 'This field is required';
    render(<UserSelectDropdown {...defaultProps} error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    const user = userEvent.setup();
    render(<UserSelectDropdown {...defaultProps} />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
  });

  it('displays all users in dropdown', async () => {
    const user = userEvent.setup();
    render(<UserSelectDropdown {...defaultProps} />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('filters users based on search term', async () => {
    const user = userEvent.setup();
    render(<UserSelectDropdown {...defaultProps} />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const searchInput = screen.getByPlaceholderText('Search users...');
    await user.type(searchInput, 'John');
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
  });

  it('filters users by email', async () => {
    const user = userEvent.setup();
    render(<UserSelectDropdown {...defaultProps} />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const searchInput = screen.getByPlaceholderText('Search users...');
    await user.type(searchInput, 'jane.smith');
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('calls onValueChange when user is selected', async () => {
    const mockOnValueChange = jest.fn();
    const user = userEvent.setup();
    
    render(<UserSelectDropdown {...defaultProps} onValueChange={mockOnValueChange} />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const johnOption = screen.getByText('John Doe');
    await user.click(johnOption);
    
    expect(mockOnValueChange).toHaveBeenCalledWith('1');
  });

  it('displays selected user information', () => {
    render(<UserSelectDropdown {...defaultProps} value="1" />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('WARD OFFICER')).toBeInTheDocument();
  });

  it('shows "No Assignment" option when allowNone is true', async () => {
    const user = userEvent.setup();
    render(<UserSelectDropdown {...defaultProps} allowNone={true} />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    expect(screen.getByText('No Assignment')).toBeInTheDocument();
  });

  it('does not show "No Assignment" option when allowNone is false', async () => {
    const user = userEvent.setup();
    render(<UserSelectDropdown {...defaultProps} allowNone={false} />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    expect(screen.queryByText('No Assignment')).not.toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(<UserSelectDropdown {...defaultProps} isLoading={true} />);
    
    const trigger = screen.getByRole('combobox');
    fireEvent.click(trigger);
    
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(<UserSelectDropdown {...defaultProps} disabled={true} />);
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <UserSelectDropdown {...defaultProps} />
        <div data-testid="outside">Outside element</div>
      </div>
    );
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    
    const outsideElement = screen.getByTestId('outside');
    await user.click(outsideElement);
    
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search users...')).not.toBeInTheDocument();
    });
  });

  it('closes dropdown when Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(<UserSelectDropdown {...defaultProps} />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
    
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search users...')).not.toBeInTheDocument();
    });
  });

  it('opens dropdown when Enter key is pressed on trigger', async () => {
    const user = userEvent.setup();
    render(<UserSelectDropdown {...defaultProps} />);
    
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    await user.keyboard('{Enter}');
    
    expect(screen.getByPlaceholderText('Search users...')).toBeInTheDocument();
  });

  it('displays role badges with correct colors', async () => {
    const user = userEvent.setup();
    render(<UserSelectDropdown {...defaultProps} />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const wardOfficerBadge = screen.getByText('WARD OFFICER');
    const maintenanceBadge = screen.getByText('MAINTENANCE TEAM');
    const adminBadge = screen.getByText('ADMINISTRATOR');
    
    expect(wardOfficerBadge).toHaveClass('bg-blue-100', 'text-blue-800');
    expect(maintenanceBadge).toHaveClass('bg-green-100', 'text-green-800');
    expect(adminBadge).toHaveClass('bg-purple-100', 'text-purple-800');
  });

  it('shows check icon for selected user', async () => {
    const user = userEvent.setup();
    render(<UserSelectDropdown {...defaultProps} value="1" />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    // The selected user should have a check icon (we can test for the presence of the check)
    const selectedOption = screen.getByText('John Doe').closest('button');
    expect(selectedOption).toHaveClass('bg-blue-50');
  });

  it('clears selection when clear button is clicked', async () => {
    const mockOnValueChange = jest.fn();
    const user = userEvent.setup();
    
    render(
      <UserSelectDropdown 
        {...defaultProps} 
        value="1" 
        onValueChange={mockOnValueChange}
        allowNone={true}
      />
    );
    
    // Find and click the clear button (X icon)
    const clearButton = screen.getByRole('button', { name: '' });
    await user.click(clearButton);
    
    expect(mockOnValueChange).toHaveBeenCalledWith('none');
  });

  it('displays ward information for users with ward assignment', async () => {
    const user = userEvent.setup();
    render(<UserSelectDropdown {...defaultProps} />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    expect(screen.getByText('Ward 1')).toBeInTheDocument();
  });

  it('displays department information for users with department', async () => {
    const user = userEvent.setup();
    render(<UserSelectDropdown {...defaultProps} />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    expect(screen.getByText('Electrical')).toBeInTheDocument();
  });

  it('shows "No users found" message when search returns no results', async () => {
    const user = userEvent.setup();
    render(<UserSelectDropdown {...defaultProps} />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const searchInput = screen.getByPlaceholderText('Search users...');
    await user.type(searchInput, 'nonexistent');
    
    expect(screen.getByText('No users found matching your search')).toBeInTheDocument();
  });

  it('shows "No users available" message when users array is empty', async () => {
    const user = userEvent.setup();
    render(<UserSelectDropdown {...defaultProps} users={[]} />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    expect(screen.getByText('No users available')).toBeInTheDocument();
  });

  it('applies error styling when error is present', () => {
    render(<UserSelectDropdown {...defaultProps} error="Required field" />);
    
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass('border-red-300');
  });

  it('focuses search input when dropdown opens', async () => {
    const user = userEvent.setup();
    render(<UserSelectDropdown {...defaultProps} />);
    
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    
    const searchInput = screen.getByPlaceholderText('Search users...');
    expect(searchInput).toHaveFocus();
  });
});
*/

// Export for potential use in other test files
export { mockUsers, defaultProps };