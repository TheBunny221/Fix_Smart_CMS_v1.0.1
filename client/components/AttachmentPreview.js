import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, } from "./ui/dialog";
import { Button } from "./ui/button";
import { Download, ZoomIn, ZoomOut, RotateCcw, FileText, ExternalLink, Printer, X, } from "lucide-react";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
// Use self-hosted worker file (public/assets/pdf.worker.min.mjs)
const pdfWorkerSrcUrl = "/assets/pdf.worker.min.mjs";
import { renderAsync as renderDocx } from "docx-preview";
function isImage(mime, url) {
    if (mime && mime.startsWith("image/"))
        return true;
    if (!mime && url) {
        const lower = url.toLowerCase();
        return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"].some((ext) => lower.endsWith(ext));
    }
    return false;
}
function isPdf(mime, url) {
    if (mime === "application/pdf")
        return true;
    if (!mime && url)
        return url.toLowerCase().endsWith(".pdf");
    return false;
}
function isDocx(mime, url) {
    if (mime ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        return true;
    if (!mime && url)
        return url.toLowerCase().endsWith(".docx");
    return false;
}
function isDoc(mime, url) {
    if (mime === "application/msword")
        return true;
    if (!mime && url)
        return url.toLowerCase().endsWith(".doc");
    return false;
}
function PdfViewer({ url }) {
    const scrollRef = useRef(null);
    const containerSizerRef = useRef(null);
    const pageRefs = useRef([]);
    const [numPages, setNumPages] = useState(0);
    const [scale, setScale] = useState(1);
    const [containerWidth, setContainerWidth] = useState(800);
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState(null);
    const pdfRef = useRef(null);
    useEffect(() => {
        GlobalWorkerOptions.workerSrc = pdfWorkerSrcUrl;
    }, []);
    useEffect(() => {
        const resize = () => {
            const el = containerSizerRef.current;
            if (el)
                setContainerWidth(el.clientWidth);
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);
    // Load PDF when URL changes
    useEffect(() => {
        let cancelled = false;
        setError(null);
        setNumPages(0);
        pdfRef.current = null;
        GlobalWorkerOptions.workerSrc = pdfWorkerSrcUrl;
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.withCredentials = true;
        xhr.onload = async () => {
            if (cancelled)
                return;
            if (xhr.status >= 200 && xhr.status < 300 && xhr.response) {
                try {
                    const pdf = await getDocument({ data: xhr.response }).promise;
                    if (cancelled)
                        return;
                    pdfRef.current = pdf;
                    setNumPages(pdf.numPages);
                }
                catch (e) {
                    if (!cancelled)
                        setError("failed");
                }
            }
            else {
                if (!cancelled)
                    setError("failed");
            }
        };
        xhr.onerror = () => {
            if (!cancelled)
                setError("failed");
        };
        xhr.send();
        return () => {
            cancelled = true;
            xhr.abort();
        };
    }, [url]);
    // Render pages when scale or numPages changes
    useEffect(() => {
        let cancelled = false;
        (async () => {
            const pdf = pdfRef.current;
            if (!pdf)
                return;
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                if (cancelled)
                    return;
                const baseViewport = page.getViewport({ scale: 1 });
                const width = (containerSizerRef.current?.clientWidth || 800) * scale;
                const computedScale = Math.max(0.5, Math.min(3, width / baseViewport.width));
                const viewport = page.getViewport({ scale: computedScale });
                const wrapper = pageRefs.current[pageNum - 1];
                if (!wrapper)
                    continue;
                wrapper.innerHTML = "";
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx)
                    continue;
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);
                canvas.style.width = viewport.width + "px";
                canvas.style.height = viewport.height + "px";
                canvas.className = "bg-white shadow rounded";
                wrapper.appendChild(canvas);
                await page.render({ canvasContext: ctx, viewport, canvas }).promise;
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [numPages, scale]);
    useEffect(() => {
        const sc = scrollRef.current;
        if (!sc)
            return;
        const onScroll = () => {
            const top = sc.scrollTop;
            let pageIdx = 0;
            for (let i = 0; i < pageRefs.current.length; i++) {
                const el = pageRefs.current[i];
                if (!el)
                    continue;
                if (el.offsetTop - 16 <= top)
                    pageIdx = i;
                else
                    break;
            }
            setCurrentPage(pageIdx + 1);
        };
        sc.addEventListener("scroll", onScroll);
        return () => sc.removeEventListener("scroll", onScroll);
    }, [numPages]);
    const goToPage = (n) => {
        if (!scrollRef.current)
            return;
        const idx = Math.max(1, Math.min(numPages, n)) - 1;
        const el = pageRefs.current[idx];
        if (el)
            scrollRef.current.scrollTo({ top: el.offsetTop - 8, behavior: "smooth" });
    };
    const zoomIn = () => setScale((s) => Math.min(3, s + 0.1));
    const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.1));
    const resetZoom = () => setScale(1);
    return (_jsxs("div", { className: "w-full h-full flex flex-col", children: [_jsxs("div", { className: "sticky top-0 z-10 bg-background/80 backdrop-blur border-b px-3 py-2 flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-muted-foreground", children: "PDF" }), _jsx(Button, { size: "sm", variant: "outline", onClick: zoomOut, "aria-label": "Zoom out", children: _jsx(ZoomOut, { className: "h-4 w-4" }) }), _jsxs("span", { className: "text-xs w-12 text-center", children: [Math.round(scale * 100), "%"] }), _jsx(Button, { size: "sm", variant: "outline", onClick: zoomIn, "aria-label": "Zoom in", children: _jsx(ZoomIn, { className: "h-4 w-4" }) }), _jsx(Button, { size: "sm", variant: "outline", onClick: resetZoom, "aria-label": "Reset zoom", children: _jsx(RotateCcw, { className: "h-4 w-4" }) }), _jsxs("div", { className: "ml-4 flex items-center gap-2", children: [_jsx(Button, { size: "sm", variant: "outline", onClick: () => goToPage(currentPage - 1), disabled: currentPage <= 1, children: "<" }), _jsxs("span", { className: "text-xs", children: ["Page ", currentPage, " / ", numPages || "-"] }), _jsx(Button, { size: "sm", variant: "outline", onClick: () => goToPage(currentPage + 1), disabled: currentPage >= numPages, children: ">" })] })] }), error && (_jsx("div", { className: "p-4 text-center", children: _jsx("p", { className: "text-sm text-red-600 mb-2", children: "This file cannot be previewed. Please download to view." }) })), _jsx("div", { ref: scrollRef, className: "flex-1 overflow-auto p-4", children: _jsx("div", { ref: containerSizerRef, children: Array.from({ length: numPages }).map((_, index) => (_jsx("div", { ref: (el) => (pageRefs.current[index] = el), className: "mb-4 flex justify-center" }, `pwrap_${index}`))) }) })] }));
}
function DocxViewer({ url }) {
    const ref = useRef(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        const load = async () => {
            try {
                const res = await fetch(url);
                if (!res.ok)
                    throw new Error("Failed to fetch document");
                const buf = await res.arrayBuffer();
                if (cancelled)
                    return;
                if (ref.current) {
                    ref.current.innerHTML = "";
                    await renderDocx(buf, ref.current, undefined, {
                        className: "docx-preview",
                        inWrapper: true,
                        ignoreWidth: false,
                        ignoreHeight: false,
                        useMathMLPolyfill: true,
                    });
                }
                if (!cancelled)
                    setLoading(false);
            }
            catch (e) {
                if (!cancelled) {
                    setError("Failed to load document");
                    setLoading(false);
                }
            }
        };
        load();
        return () => {
            cancelled = true;
            if (ref.current)
                ref.current.innerHTML = "";
        };
    }, [url]);
    return (_jsxs("div", { className: "w-full h-full overflow-auto p-4", children: [loading && (_jsx("div", { className: "text-sm text-muted-foreground px-2 py-1", children: "Loading document\u2026" })), error && _jsx("div", { className: "text-sm text-red-600 px-2 py-1", children: error }), _jsx("div", { ref: ref, className: "prose max-w-none" })] }));
}
export default function AttachmentPreview({ open, onOpenChange, item, canDownload = true, }) {
    const name = item?.name ||
        (item?.url ? item.url.split("/").pop() || "Attachment" : "Attachment");
    const [scale, setScale] = useState(1);
    const contentType = useMemo(() => {
        if (!item)
            return "none";
        if (isImage(item.mimeType, item.url))
            return "image";
        if (isPdf(item.mimeType, item.url))
            return "pdf";
        if (isDocx(item.mimeType, item.url))
            return "docx";
        if (isDoc(item.mimeType, item.url))
            return "doc";
        return "other";
    }, [item]);
    const resetZoom = () => setScale(1);
    const zoomIn = () => setScale((s) => Math.min(4, s + 0.25));
    const zoomOut = () => setScale((s) => Math.max(0.25, s - 0.25));
    const printAttachment = () => {
        if (!item?.url)
            return;
        if (contentType === "image") {
            const printWindow = window.open("", "_blank");
            if (!printWindow)
                return;
            const html = `<!doctype html><html><head><title>${name}</title><style>html,body{margin:0;padding:0}img{max-width:100%;width:100%}</style></head><body><img src="${item.url}" onload="window.focus();window.print();"/></body></html>`;
            printWindow.document.open();
            printWindow.document.write(html);
            printWindow.document.close();
        }
        else {
            const w = window.open(item.url, "_blank");
            if (w)
                w.focus();
        }
    };
    return (_jsx(Dialog, { open: open, onOpenChange: (o) => {
            if (!o)
                setScale(1);
            onOpenChange(o);
        }, children: _jsxs(DialogContent, { className: "max-w-[92vw] w-[92vw] h-[86vh] p-0", children: [_jsx(DialogHeader, { className: "px-4 pt-4 pb-2 border-b bg-background/60", children: _jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx(DialogTitle, { className: "truncate", children: name }), item?.mimeType && (_jsx(DialogDescription, { className: "truncate", children: item.mimeType }))] }), _jsxs("div", { className: "flex items-center gap-2", children: [contentType === "image" && (_jsxs("div", { className: "flex items-center gap-1 mr-2", children: [_jsx(Button, { size: "sm", variant: "outline", onClick: zoomOut, "aria-label": "Zoom out", children: _jsx(ZoomOut, { className: "h-4 w-4" }) }), _jsxs("span", { className: "text-xs w-12 text-center", children: [Math.round(scale * 100), "%"] }), _jsx(Button, { size: "sm", variant: "outline", onClick: zoomIn, "aria-label": "Zoom in", children: _jsx(ZoomIn, { className: "h-4 w-4" }) }), _jsx(Button, { size: "sm", variant: "outline", onClick: resetZoom, "aria-label": "Reset zoom", children: _jsx(RotateCcw, { className: "h-4 w-4" }) })] })), item?.url && (_jsxs(Button, { size: "sm", variant: "outline", onClick: printAttachment, "aria-label": "Print", children: [_jsx(Printer, { className: "h-4 w-4 mr-1" }), " Print"] })), canDownload && item?.url && (_jsx("a", { href: item.url, target: "_blank", rel: "noreferrer", className: "inline-flex", children: _jsxs(Button, { size: "sm", variant: "default", "aria-label": "Download", children: [_jsx(Download, { className: "h-4 w-4 mr-1" }), " Download"] }) })), _jsx(DialogClose, { asChild: true, children: _jsxs(Button, { size: "sm", variant: "destructive", className: "font-bold", children: [_jsx(X, { className: "h-4 w-4 mr-1" }), " Close"] }) })] })] }) }), _jsxs("div", { className: "w-full h-[calc(86vh-72px)] bg-muted/20 flex items-center justify-center overflow-hidden", children: [contentType === "image" && item?.url && (_jsx("div", { className: "w-full h-full overflow-auto flex items-center justify-center p-4", children: _jsx("img", { src: item.url, alt: name || "attachment", style: {
                                    transform: `scale(${scale})`,
                                    transformOrigin: "center center",
                                }, className: "max-w-none select-none rounded shadow", draggable: false }) })), contentType === "pdf" && item?.url && _jsx(PdfViewer, { url: item.url }), contentType === "docx" && item?.url && _jsx(DocxViewer, { url: item.url }), contentType === "doc" && (_jsxs("div", { className: "text-center p-8", children: [_jsx(FileText, { className: "h-10 w-10 mx-auto text-gray-400 mb-3" }), _jsx("p", { className: "text-sm text-gray-600 mb-3", children: "DOC preview is not supported. Please download to view." }), item?.url && (_jsx("a", { href: item.url, target: "_blank", rel: "noreferrer", className: "inline-flex", children: _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(ExternalLink, { className: "h-4 w-4 mr-1" }), " Open / Download"] }) }))] })), contentType === "other" && (_jsxs("div", { className: "text-center p-8", children: [_jsx(FileText, { className: "h-10 w-10 mx-auto text-gray-400 mb-3" }), _jsx("p", { className: "text-sm text-gray-600 mb-2", children: "No inline preview available." }), item?.url && (_jsx("a", { href: item.url, target: "_blank", rel: "noreferrer", className: "inline-flex", children: _jsxs(Button, { variant: "outline", size: "sm", children: [_jsx(ExternalLink, { className: "h-4 w-4 mr-1" }), " Open / Download"] }) }))] }))] })] }) }));
}
