import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Users, Shield, MapPin, Wrench } from 'lucide-react';
const RoleSwitcher = () => {
    const roles = [
        {
            title: 'Citizen Portal',
            description: 'Register complaints, track status, and provide feedback',
            icon: _jsx(Users, { className: "h-8 w-8" }),
            links: [
                { path: '/', label: 'Register Complaint' },
                { path: '/my-complaints', label: 'My Complaints' },
                { path: '/reopen-complaint', label: 'Reopen Complaint' },
                { path: '/track-status', label: 'Track Status' },
                { path: '/feedback', label: 'Feedback' },
            ]
        },
        {
            title: 'Admin Dashboard',
            description: 'Manage complaints, users, and generate reports',
            icon: _jsx(Shield, { className: "h-8 w-8" }),
            links: [
                { path: '/admin', label: 'Dashboard' },
                { path: '/admin/complaints', label: 'Complaint Management' },
                { path: '/admin/users', label: 'User Management' },
                { path: '/admin/reports', label: 'Reports' },
            ]
        },
        {
            title: 'Ward Officer',
            description: 'Review and forward complaints for your zone',
            icon: _jsx(MapPin, { className: "h-8 w-8" }),
            links: [
                { path: '/ward', label: 'Zone Dashboard' },
                { path: '/ward/review', label: 'Review Complaints' },
                { path: '/ward/forward', label: 'Forward Panel' },
            ]
        },
        {
            title: 'Maintenance Team',
            description: 'Update complaint status and track SLA',
            icon: _jsx(Wrench, { className: "h-8 w-8" }),
            links: [
                { path: '/maintenance', label: 'Assigned Complaints' },
                { path: '/maintenance/update', label: 'Update Status' },
                { path: '/maintenance/sla', label: 'SLA Tracking' },
            ]
        }
    ];
    return (_jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h1", { className: "text-3xl font-bold text-foreground mb-2", children: "CitizenConnect Portal" }), _jsx("p", { className: "text-muted-foreground", children: "Choose your role to access the relevant features" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: roles.map((role, index) => (_jsxs(Card, { className: "h-full", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center space-x-3", children: [_jsx("div", { className: "text-primary", children: role.icon }), _jsxs("div", { children: [_jsx("h3", { className: "text-xl font-semibold", children: role.title }), _jsx("p", { className: "text-sm text-muted-foreground font-normal", children: role.description })] })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-2", children: role.links.map((link, linkIndex) => (_jsx(Button, { asChild: true, variant: "outline", className: "w-full justify-start", children: _jsx(Link, { to: link.path, children: link.label }) }, linkIndex))) }) })] }, index))) })] }));
};
export default RoleSwitcher;
