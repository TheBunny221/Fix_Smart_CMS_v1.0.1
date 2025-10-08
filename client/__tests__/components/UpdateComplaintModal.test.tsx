import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import UpdateComplaintModal from '../../components/UpdateComplaintModal';
import { complaintsApi } from '../../store/api/complaintsApi';

// Mock the API
jest.mock('../../store/api/complaintsApi', () => ({
  useUpdateComplaintMutation: () => [
    jest.fn().mockResolvedValue({ unwrap: () => Promise.resolve({ data: {} }) }),
    { isLoading: false }
  ],
  useReopenComplaintMutation: () => [
    jest.fn().mockResolvedValue({ unwrap: () => Promise.resolve({ data: {} }) }),
    { isLoading: false }
  ],
  useGetWardUsersQuery: () => ({
    data: { data: { users: [] } },
    isLoading: false,
    error: null
  })
}));

// Mock toast
jest.mock('../../components/ui/use-toast', () => ({
  toast: jest.fn()
}));

const mockStore = configureStore({
  reducer: {
    auth: (state = { user: { role: 'ADMINISTRATOR', id: 'admin1' } }) => state,
    api: () => ({})
  }
});

const mockComplaint = {
  id: 'complaint1',
  complaintId: 'KSC0001',
  status: 'CLOSED',
  priority: 'MEDIUM',
  type: 'STREET_LIGHTING',
  description: 'Test complaint',
  area: 'Test Area',
  wardOfficer: null,
  maintenanceTeam: null,
  needsTeamAssignment: true
};

describe('UpdateComplaintModal', () => {
  const defaultProps = {
    complaint: mockComplaint,
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show REOPENED to ASSIGNED transition warning for admin', () => {
    render(
      <Provider store={mockStore}>
        <UpdateComplaintModal {...defaultProps} />
      </Provider>
    );

    // Select REOPENED status
    const statusSelect = screen.getByRole('combobox');
    fireEvent.click(statusSelect);
    
    const reopenedOption = screen.getByText('Reopened');
    fireEvent.click(reopenedOption);

    // Should show transition warning
    expect(screen.getByText('Status Transition Notice')).toBeInTheDocument();
    expect(screen.getByText(/automatically transition to/)).toBeInTheDocument();
  });

  it('should validate maintenance team assignment for ASSIGNED status', async () => {
    render(
      <Provider store={mockStore}>
        <UpdateComplaintModal {...defaultProps} />
      </Provider>
    );

    // Select ASSIGNED status
    const statusSelect = screen.getByRole('combobox');
    fireEvent.click(statusSelect);
    
    const assignedOption = screen.getByText('Assigned');
    fireEvent.click(assignedOption);

    // Try to submit without selecting maintenance team
    const submitButton = screen.getByRole('button', { name: /update complaint/i });
    fireEvent.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/Please assign a maintenance team member/)).toBeInTheDocument();
    });
  });

  it('should show validation errors in a dedicated section', async () => {
    render(
      <Provider store={mockStore}>
        <UpdateComplaintModal {...defaultProps} />
      </Provider>
    );

    // Select ASSIGNED status without team assignment
    const statusSelect = screen.getByRole('combobox');
    fireEvent.click(statusSelect);
    fireEvent.click(screen.getByText('Assigned'));

    // Submit to trigger validation
    const submitButton = screen.getByRole('button', { name: /update complaint/i });
    fireEvent.click(submitButton);

    // Should show validation errors section
    await waitFor(() => {
      expect(screen.getByText('Please fix the following issues:')).toBeInTheDocument();
    });
  });

  it('should change button text for REOPENED status', () => {
    render(
      <Provider store={mockStore}>
        <UpdateComplaintModal {...defaultProps} />
      </Provider>
    );

    // Select REOPENED status
    const statusSelect = screen.getByRole('combobox');
    fireEvent.click(statusSelect);
    fireEvent.click(screen.getByText('Reopened'));

    // Button text should change
    expect(screen.getByRole('button', { name: /reopen complaint/i })).toBeInTheDocument();
  });
});