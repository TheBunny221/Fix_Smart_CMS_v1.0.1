import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "../ui/tooltip";
import { Badge } from "../ui/badge";
import { Info } from "lucide-react";
function getOpacity(value, min, max) {
    if (max <= min)
        return 0;
    const ratio = (value - min) / (max - min);
    if (value === 0)
        return 0;
    return Math.max(0.12, Math.min(0.95, ratio * 0.9 + 0.05));
}
export const HeatmapGrid = ({ title, description, data, className, }) => {
    const { xLabels, yLabels, matrix, xAxisLabel, yAxisLabel } = data;
    const flat = matrix.flat();
    const min = Math.min(...flat);
    const max = Math.max(...flat);
    return (_jsxs(Card, { className: className, children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "flex items-center gap-2", children: [title, _jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { children: _jsx(Info, { className: "h-4 w-4 text-muted-foreground" }) }), _jsx(TooltipContent, { children: _jsx("div", { className: "max-w-[260px] text-xs", children: "Hover over any cell to see the exact complaint count." }) })] }) })] }), description ? (_jsx("p", { className: "text-sm text-muted-foreground mt-1", children: description })) : null] }), _jsx(CardContent, { children: xLabels.length === 0 || yLabels.length === 0 ? (_jsx("div", { className: "h-[280px] flex items-center justify-center text-muted-foreground", children: "No data available for selected filters" })) : (_jsx("div", { className: "w-full overflow-x-auto", children: _jsxs("div", { className: "inline-block min-w-full", children: [_jsxs("div", { className: "grid items-end", style: {
                                    gridTemplateColumns: `200px repeat(${xLabels.length}, minmax(100px, 1fr))`,
                                }, children: [_jsx("div", { className: "p-3 text-xs font-medium text-right pr-4 flex items-end justify-end", children: _jsx("span", { className: "whitespace-nowrap font-medium", children: yAxisLabel }) }), xLabels.map((x, xi) => (_jsx("div", { className: "p-2 text-[11px] md:text-xs font-medium text-muted-foreground text-center", style: { minHeight: 100, paddingBottom: 12 }, children: _jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("div", { className: "w-full flex items-end justify-center overflow-visible", children: _jsx("span", { className: "max-w-[140px] block text-center whitespace-normal break-words md:inline-block md:max-w-[180px] md:truncate md:-rotate-45", title: x, style: {
                                                                    transformOrigin: "bottom center",
                                                                    display: "inline-block",
                                                                }, children: x }) }) }), _jsx(TooltipContent, { children: _jsx("div", { className: "text-xs max-w-[300px]", children: x }) })] }) }) }, xi)))] }), yLabels.map((y, yi) => (_jsxs("div", { className: "grid", style: {
                                    gridTemplateColumns: `160px repeat(${xLabels.length}, minmax(80px, 1fr))`,
                                }, children: [_jsx("div", { className: "p-2 text-xs text-right pr-3 font-medium text-foreground/80 border-t", children: y }), xLabels.map((_, xi) => {
                                        const v = matrix[yi]?.[xi] ?? 0;
                                        const opacity = getOpacity(v, min, max);
                                        return (_jsx(TooltipProvider, { children: _jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: _jsx("div", { className: "h-10 md:h-12 border-t border-l flex items-center justify-center text-[11px] md:text-xs", style: {
                                                                backgroundColor: `hsl(var(--primary) / ${opacity})`,
                                                            }, "aria-label": `${y} × ${xLabels[xi]}: ${v}`, children: _jsx("span", { className: "text-primary-foreground font-medium", children: v }) }) }), _jsx(TooltipContent, { children: _jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "text-xs font-medium", children: y }), _jsx("div", { className: "text-xs text-muted-foreground", children: xLabels[xi] }), _jsxs(Badge, { variant: "outline", className: "text-[11px]", children: [v, " complaints"] })] }) })] }) }, `${yi}-${xi}`));
                                    })] }, yi))), _jsxs("div", { className: "grid", style: {
                                    gridTemplateColumns: `160px repeat(${xLabels.length}, minmax(80px, 1fr))`,
                                }, children: [_jsx("div", {}), _jsx("div", { className: "col-span-full p-2 text-xs text-center text-muted-foreground mt-2", children: xAxisLabel })] })] }) })) })] }));
};
export default HeatmapGrid;
