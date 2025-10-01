import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
const PlaceholderPage = ({ title, description, icon = _jsx(Construction, { className: "h-12 w-12" }), backPath = '/' }) => {
    return (_jsx("div", { className: "max-w-2xl mx-auto mt-16", children: _jsxs(Card, { children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx("div", { className: "flex justify-center mb-4 text-muted-foreground", children: icon }), _jsx(CardTitle, { className: "text-2xl mb-2", children: title }), _jsx("p", { className: "text-muted-foreground", children: description })] }), _jsxs(CardContent, { className: "text-center space-y-4", children: [_jsx("p", { className: "text-sm text-muted-foreground", children: "This feature is currently under development. Continue prompting to help build out this functionality." }), _jsxs("div", { className: "flex justify-center space-x-4", children: [_jsx(Button, { asChild: true, variant: "outline", children: _jsxs(Link, { to: backPath, children: [_jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }), "Go Back"] }) }), _jsx(Button, { asChild: true, children: _jsx(Link, { to: "/", children: "Return Home" }) })] })] })] }) }));
};
export default PlaceholderPage;
