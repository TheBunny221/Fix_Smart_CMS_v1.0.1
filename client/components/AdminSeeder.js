import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { toast } from "./ui/use-toast";
const AdminSeeder = () => {
    const [isSeeding, setIsSeeding] = useState(false);
    const [seedResult, setSeedResult] = useState(null);
    const seedAdminUser = async () => {
        setIsSeeding(true);
        try {
            const response = await fetch("/api/test/seed-admin", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const result = await response.json();
            if (result.success) {
                setSeedResult(result);
                toast({
                    title: "Success",
                    description: "Admin user created successfully!",
                });
            }
            else {
                throw new Error(result.message || "Failed to create admin user");
            }
        }
        catch (error) {
            console.error("Failed to seed admin user:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to create admin user",
                variant: "destructive",
            });
        }
        finally {
            setIsSeeding(false);
        }
    };
    return (_jsxs(Card, { className: "w-full max-w-md mx-auto", children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center", children: [_jsx(AlertTriangle, { className: "h-5 w-5 mr-2 text-yellow-500" }), "Development Tools"] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsx("p", { className: "text-sm text-gray-600", children: "This tool creates test users for development and testing purposes." }), _jsx(Button, { onClick: seedAdminUser, disabled: isSeeding, className: "w-full", children: isSeeding ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), "Creating Users..."] })) : (_jsxs(_Fragment, { children: [_jsx(Check, { className: "h-4 w-4 mr-2" }), "Create Test Users"] })) }), seedResult && (_jsxs("div", { className: "mt-4 p-3 bg-green-50 border border-green-200 rounded-md", children: [_jsx("h4", { className: "font-semibold text-green-800 mb-2", children: "Test Users Created:" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "bg-white p-2 rounded border", children: [_jsxs("p", { children: [_jsx("strong", { children: "Admin:" }), " ", seedResult.data.admin.email] }), _jsxs("p", { children: [_jsx("strong", { children: "Password:" }), " ", seedResult.data.admin.password] })] }), seedResult.data.testUsers?.map((user, index) => (_jsxs("div", { className: "bg-white p-2 rounded border", children: [_jsxs("p", { children: [_jsxs("strong", { children: [user.role, ":"] }), " ", user.email] }), _jsxs("p", { children: [_jsx("strong", { children: "Password:" }), " ", user.password] })] }, index)))] })] }))] })] }));
};
export default AdminSeeder;
