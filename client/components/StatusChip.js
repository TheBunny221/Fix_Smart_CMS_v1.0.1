import { jsx as _jsx } from "react/jsx-runtime";
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
const statusConfig = {
    registered: {
        label: 'Registered',
        className: 'bg-status-registered text-white',
    },
    assigned: {
        label: 'Assigned',
        className: 'bg-status-assigned text-white',
    },
    'in-progress': {
        label: 'In Progress',
        className: 'bg-status-progress text-white',
    },
    resolved: {
        label: 'Resolved',
        className: 'bg-status-resolved text-white',
    },
    closed: {
        label: 'Closed',
        className: 'bg-status-closed text-white',
    },
    reopened: {
        label: 'Reopened',
        className: 'bg-status-reopened text-white',
    },
};
const StatusChip = ({ status, className }) => {
    const config = statusConfig[status];
    return (_jsx(Badge, { variant: "secondary", className: cn('px-2 py-1 text-xs font-medium rounded-full', config.className, className), children: config.label }));
};
export default StatusChip;
