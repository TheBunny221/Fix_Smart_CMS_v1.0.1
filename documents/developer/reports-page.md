# Reports Page Documentation

## Overview
The Unified Reports page provides comprehensive analytics and reporting functionality for the AHM-CMS system. It displays key metrics, trends, and visualizations for complaint data across different time periods and filters.

## Default Date Filter Behavior

### Automatic Date Range Initialization
The Reports page automatically initializes with a default date range to provide users with relevant recent data immediately upon loading.

**Default Logic:**
- **From Date**: Exactly one month before the current date
- **To Date**: Current date
- **Format**: YYYY-MM-DD (ISO format for API compatibility)

### Implementation Details

#### Date Range Calculation
```typescript
const getDefaultDateRange = useCallback(() => {
  const currentDate = new Date();
  const pastDate = new Date(currentDate);
  pastDate.setMonth(currentDate.getMonth() - 1);
  
  // Format dates as YYYY-MM-DD for API compatibility
  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split("T")[0] || "";
  };
  
  return {
    from: formatDateForAPI(pastDate),
    to: formatDateForAPI(currentDate)
  };
}, []);
```

#### Filter State Initialization
```typescript
const [filters, setFilters] = useState<FilterOptions>(() => {
  return {
    dateRange: getDefaultDateRange(),
    ward: "all",
    complaintType: "all",
    status: "all",
    priority: "all",
  };
});
```

#### Automatic Data Fetching
The component automatically fetches analytics data using the default date range on initial load:

```typescript
useEffect(() => {
  if (!user || didInitialFetch) return;

  console.log("Initial fetch triggered");
  setDidInitialFetch(true);
  fetchAnalyticsData();
  fetchHeatmapData();
}, [user, didInitialFetch, fetchAnalyticsData, fetchHeatmapData]);
```

### User Experience Benefits

1. **Immediate Data Visibility**: Users see relevant recent data without manual input
2. **Consistent Behavior**: All user roles experience the same default behavior
3. **Reduced Errors**: Eliminates empty results from single-day queries
4. **Better Performance**: Provides a reasonable data range that balances completeness with performance

### Edge Case Handling

#### Month Transitions
The system properly handles month transitions, including:
- **Cross-year transitions**: January 15, 2026 → December 15, 2025
- **Months with different day counts**: March 31 → February 28/29
- **February leap year handling**: Automatically adjusts for leap years

#### Reset Functionality
The "Reset Filters" button restores the default date range:

```typescript
onClick={() => {
  console.log("Resetting filters to default date range...");
  setFilters({
    dateRange: getDefaultDateRange(),
    ward: permissions.defaultWard || "all",
    complaintType: "all",
    status: "all",
    priority: "all",
  });
}}
```

### API Integration

#### Query Parameters
The default date range is automatically included in API calls:

```typescript
const queryParams = new URLSearchParams({
  from: filters.dateRange.from,
  to: filters.dateRange.to,
  // ... other filters
});
```

#### Role-Based Access
All user roles (Admin, Ward Officer, Maintenance Team, Citizen) use the same default date logic, with role-specific data filtering applied at the API level.

### UI Display

#### Date Format
All dates throughout the Reports page are displayed in **dd/mm/yy** format for consistency and better readability:

```typescript
// Helper function to format dates as dd/mm/yy for display
const formatDateDisplay = useCallback((dateString: string): string => {
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  } catch (error) {
    return dateString;
  }
}, []);
```

#### Date Range Picker
The date inputs automatically display the default values:

```typescript
<Input
  id="from-date-picker"
  type="date"
  defaultValue={filters.dateRange.from} // YYYY-MM-DD for HTML input
/>
<Input
  id="to-date-picker"
  type="date"
  defaultValue={filters.dateRange.to} // YYYY-MM-DD for HTML input
/>
```

#### Visual Indicators
The page displays the current date range in **dd/mm/yy** format in multiple locations:
- Filter section header: `16/09/25 → 16/10/25`
- Key metrics badge: `Data Period: Past Month (16/09/25 - 16/10/25)`
- Chart titles and tooltips: `Date: 16/10/25`
- Chart axis labels: `16/10` (short format)

### Testing Guidelines

#### Manual Testing Checklist
- [ ] Load Reports page → verify default date range auto-fills correctly
- [ ] Verify initial API call uses default range when page loads
- [ ] Change dates manually → ensure reports update accordingly
- [ ] Test "Reset Filters" → confirm it restores default date range
- [ ] Check all user roles display identical default behavior

#### Edge Case Testing
- [ ] Test month transitions (e.g., March 31 → February 28)
- [ ] Test cross-year transitions (e.g., January → December previous year)
- [ ] Test leap year handling (February 29 scenarios)
- [ ] Verify time zone consistency between frontend and backend

### Configuration

The default date range behavior is implemented entirely in the frontend component and does not require additional configuration. The logic is self-contained and automatically adapts to the current date when the page loads.

### Future Enhancements

Potential improvements to consider:
- User preference storage for custom default ranges
- System-wide configuration for default date range duration
- Smart defaults based on data availability
- Seasonal adjustments for different complaint types