import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function LoadingScreen() {
    return (_jsx("div", { className: "flex items-center justify-center h-screen bg-dark-bg", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mb-4 flex justify-center", children: _jsxs("div", { className: "relative w-12 h-12", children: [_jsx("div", { className: "absolute inset-0 rounded-full border-4 border-dark-border" }), _jsx("div", { className: "absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" })] }) }), _jsx("p", { className: "text-gray-400", children: "Initializing Bantah..." })] }) }));
}
