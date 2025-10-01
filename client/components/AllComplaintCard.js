import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchWardDashboardStats } from "@/store/slices/complaintsSlice";
const AllComplaintCard = ({ wardId }) => {
    const dispatch = useDispatch();
    const { wardDashboardStats, loading } = useSelector((state) => state.complaints);
    useEffect(() => {
        dispatch(fetchWardDashboardStats(wardId));
    }, [dispatch, wardId]);
    if (loading) {
        return (_jsx(Card, { children: _jsx(CardHeader, { children: _jsx("h3", { className: "text-lg font-semibold", children: "Loading..." }) }) }));
    }
    const totalComplaints = wardDashboardStats?.totalComplaints || 0;
    return (_jsxs(Card, { className: "col-span-1", children: [_jsx(CardHeader, { children: _jsx("h3", { className: "text-lg font-semibold", children: "Total Complaints" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "text-2xl font-bold", children: totalComplaints }), _jsx("p", { className: "text-sm text-muted-foreground", children: "All complaints in your ward" })] })] }));
};
export default AllComplaintCard;
