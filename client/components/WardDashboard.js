import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import AllComplaintCard from "./AllComplaintCard";
const WardDashboard = ({ wardId }) => {
    return (_jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-6", children: "Ward Dashboard" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6", children: _jsx(AllComplaintCard, { wardId: wardId }) })] }));
};
export default WardDashboard;
