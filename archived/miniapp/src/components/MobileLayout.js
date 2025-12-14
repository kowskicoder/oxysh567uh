import { jsx as _jsx } from "react/jsx-runtime";
function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}
export default function MobileLayout({ children, className, showPadding = true, noCard = false }) {
    return (_jsx("div", { className: cn("min-h-screen bg-slate-50 dark:bg-slate-900", "md:bg-slate-100 md:dark:bg-slate-800", className), children: _jsx("div", { className: cn("mx-auto max-w-md md:max-w-none", "md:px-8 md:py-6", showPadding && "px-3 pt-2 md:px-6"), children: _jsx("div", { className: cn(!noCard && "md:bg-white md:dark:bg-slate-900 md:rounded-xl md:shadow-lg md:border md:border-slate-200 md:dark:border-slate-800", !noCard && "md:min-h-[calc(100vh-3rem)]"), children: children }) }) }));
}
// Mobile-optimized card component
export function MobileCard({ children, className, ...props }) {
    return (_jsx("div", { className: cn("bg-white dark:bg-slate-800", "rounded-3xl md:rounded-lg", "shadow-sm border border-slate-200 dark:border-slate-700", "p-3 md:p-6", className), ...props, children: children }));
}
