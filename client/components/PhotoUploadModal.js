import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Camera, Upload, X, FileImage, AlertCircle, Loader2, } from "lucide-react";
import { useUploadComplaintPhotosMutation } from "../store/api/complaintsApi";
const MAX_FILES = 10;
const PhotoUploadModal = ({ isOpen, onClose, complaintId, onSuccess, }) => {
    const [photos, setPhotos] = useState([]);
    const [description, setDescription] = useState("");
    const [uploadError, setUploadError] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [availableCameras, setAvailableCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState(null);
    const [cameraSupported, setCameraSupported] = useState(true);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [uploadPhotos, { isLoading: isUploading }] = useUploadComplaintPhotosMutation();
    // Validate file type and size
    const validateFile = (file) => {
        const allowedTypes = ["image/jpeg", "image/png"];
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (!allowedTypes.includes(file.type)) {
            return "Only JPEG and PNG images are allowed";
        }
        if (file.size > maxSize) {
            return "File size must be less than 5MB";
        }
        return null;
    };
    // Handle file selection
    const handleFileSelect = useCallback((selectedFiles) => {
        if (!selectedFiles)
            return;
        const validFiles = [];
        const errors = [];
        const remaining = Math.max(0, MAX_FILES - photos.length);
        const incoming = Array.from(selectedFiles).slice(0, remaining);
        if (selectedFiles.length > remaining) {
            errors.push(`You can upload up to ${MAX_FILES} photos. ${selectedFiles.length - remaining} file(s) were ignored.`);
        }
        incoming.forEach((file) => {
            const error = validateFile(file);
            if (error) {
                errors.push(`${file.name}: ${error}`);
            }
            else {
                const photoFile = {
                    file,
                    preview: URL.createObjectURL(file),
                    id: Math.random().toString(36).substr(2, 9),
                };
                validFiles.push(photoFile);
            }
        });
        setUploadError(errors.length > 0 ? errors.join(", ") : null);
        if (validFiles.length > 0) {
            setPhotos((prev) => [...prev, ...validFiles]);
        }
    }, [photos.length]);
    // Discover cameras when modal opens
    useEffect(() => {
        if (!isOpen)
            return;
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            setCameraSupported(false);
            setCameraError("Camera not supported in this browser.");
            return;
        }
        (async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videos = devices.filter((d) => d.kind === "videoinput");
                setAvailableCameras(videos);
                setSelectedCameraId(videos[0]?.deviceId || null);
                setCameraSupported(videos.length > 0);
                if (videos.length === 0) {
                    setCameraError("No camera device found. Please use file upload instead.");
                }
                else {
                    setCameraError(null);
                }
            }
            catch (err) {
                setCameraSupported(false);
                setCameraError("Unable to list cameras. Check permissions.");
            }
        })();
    }, [isOpen]);
    // Start camera with fallbacks
    const startCamera = async () => {
        setCameraError(null);
        if (!window.isSecureContext) {
            setCameraError("Camera requires HTTPS or localhost.");
            return;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError("Camera API not available.");
            return;
        }
        try {
            const constraints = selectedCameraId
                ? {
                    video: {
                        deviceId: { exact: selectedCameraId },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                }
                : {
                    video: {
                        facingMode: { ideal: "environment" },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                };
            let stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
            }
        }
        catch (error) {
            console.warn("Primary camera open failed:", error?.name || error);
            // Fallback to user-facing camera
            try {
                const fallback = await navigator.mediaDevices.getUserMedia({
                    video: true,
                });
                streamRef.current = fallback;
                if (videoRef.current) {
                    videoRef.current.srcObject = fallback;
                    setIsCameraActive(true);
                }
            }
            catch (err2) {
                console.error("Error accessing camera:", err2);
                const name = err2?.name || "";
                if (name === "NotFoundError" || name === "OverconstrainedError") {
                    setCameraError("Requested device not found. Please select a different camera or use file upload.");
                }
                else if (name === "NotAllowedError" || name === "SecurityError") {
                    setCameraError("Camera permission denied. Please allow access or use file upload.");
                }
                else {
                    setCameraError("Unable to access camera. Please check permissions or use file upload instead.");
                }
            }
        }
    };
    // Stop camera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setIsCameraActive(false);
        setCameraError(null);
    };
    // Capture photo from camera
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current)
            return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        if (!context)
            return;
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        // Draw video frame to canvas
        context.drawImage(video, 0, 0);
        // Convert canvas to blob and create file
        canvas.toBlob((blob) => {
            if (blob) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
                const file = new File([blob], `camera-capture-${timestamp}.jpg`, {
                    type: "image/jpeg",
                });
                const photoFile = {
                    file,
                    preview: URL.createObjectURL(file),
                    id: Math.random().toString(36).substr(2, 9),
                };
                setPhotos((prev) => [...prev, photoFile]);
                stopCamera();
            }
        }, "image/jpeg", 0.8);
    };
    // Remove photo
    const removePhoto = (id) => {
        setPhotos((prev) => {
            const updated = prev.filter((photo) => photo.id !== id);
            // Revoke URL to prevent memory leaks
            const removed = prev.find((photo) => photo.id === id);
            if (removed) {
                URL.revokeObjectURL(removed.preview);
            }
            return updated;
        });
    };
    // Handle upload
    const handleUpload = async () => {
        if (photos.length === 0) {
            setUploadError("Please select at least one photo to upload");
            return;
        }
        try {
            setUploadError(null);
            const payload = {
                complaintId,
                photos: photos.map((p) => p.file),
            };
            const trimmed = description.trim();
            if (trimmed)
                payload.description = trimmed;
            await uploadPhotos(payload).unwrap();
            // Clean up and close
            photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
            setPhotos([]);
            setDescription("");
            onSuccess?.();
            onClose();
        }
        catch (error) {
            console.error("Upload error:", error);
            // Normalize various error shapes returned by RTK Query / fetch
            const extractMessage = (err) => {
                if (!err)
                    return "Failed to upload photos. Please try again.";
                // fetch base query error with data.message or data
                if (typeof err === "string")
                    return err;
                if (err.data) {
                    if (typeof err.data === "string")
                        return err.data;
                    if (typeof err.data.message === "string")
                        return err.data.message;
                    if (err.data.message)
                        return String(err.data.message);
                    // Some APIs return { success:false, message: { ... } }
                    if (typeof err.data === "object") {
                        try {
                            return JSON.stringify(err.data);
                        }
                        catch {
                            return "Failed to upload photos. Please try again.";
                        }
                    }
                }
                if (err.message)
                    return String(err.message);
                if (err.error)
                    return String(err.error);
                try {
                    return JSON.stringify(err);
                }
                catch {
                    return "Failed to upload photos. Please try again.";
                }
            };
            const msg = extractMessage(error);
            setUploadError(msg);
        }
    };
    // Handle modal close
    const handleClose = () => {
        // Clean up previews
        photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
        setPhotos([]);
        setDescription("");
        setUploadError(null);
        stopCamera();
        onClose();
    };
    return (_jsx(Dialog, { open: isOpen, onOpenChange: handleClose, children: _jsxs(DialogContent, { className: "max-w-2xl max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Upload Photos" }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx(Label, { children: "Upload from Files" }), _jsxs(Button, { variant: "outline", className: "w-full justify-start mt-1", onClick: () => fileInputRef.current?.click(), disabled: isUploading, children: [_jsx(Upload, { className: "h-4 w-4 mr-2" }), "Choose Files"] }), _jsx(Input, { ref: fileInputRef, type: "file", multiple: true, accept: "image/jpeg,image/png", capture: "environment", onChange: (e) => handleFileSelect(e.target.files), className: "hidden" })] }), _jsxs("div", { children: [_jsx(Label, { children: "Use Camera" }), !isCameraActive ? (_jsxs("div", { className: "flex gap-2 mt-1", children: [_jsxs(Button, { variant: "outline", className: "flex-1 justify-start", onClick: startCamera, disabled: isUploading || !cameraSupported, children: [_jsx(Camera, { className: "h-4 w-4 mr-2" }), "Open Camera"] }), photos.length > 0 && cameraSupported && (_jsx(Button, { variant: "outline", className: "justify-start", onClick: startCamera, disabled: isUploading, "aria-label": "Retake with Camera", children: "Retake" }))] })) : (_jsxs(Button, { variant: "outline", className: "w-full justify-start mt-1", onClick: stopCamera, disabled: isUploading, children: [_jsx(X, { className: "h-4 w-4 mr-2" }), "Close Camera"] }))] })] }), availableCameras.length > 1 && (_jsxs("div", { children: [_jsx(Label, { children: "Select Camera" }), _jsx("select", { className: "mt-1 w-full border rounded-md p-2 text-sm", value: selectedCameraId || "", onChange: (e) => setSelectedCameraId(e.target.value || null), disabled: isCameraActive, children: availableCameras.map((d) => (_jsx("option", { value: d.deviceId, children: d.label || `Camera ${d.deviceId.slice(-4)}` }, d.deviceId))) })] })), isCameraActive && (_jsxs("div", { className: "space-y-2", children: [_jsx("video", { ref: videoRef, autoPlay: true, playsInline: true, className: "w-full rounded-lg", style: { maxHeight: "300px" } }), _jsx("div", { className: "flex justify-center", children: _jsxs(Button, { onClick: capturePhoto, disabled: isUploading, children: [_jsx(Camera, { className: "h-4 w-4 mr-2" }), "Capture Photo"] }) }), _jsx("canvas", { ref: canvasRef, className: "hidden" })] })), cameraError && (_jsxs("div", { className: "flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg", role: "alert", "aria-live": "assertive", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx("span", { className: "text-sm", children: cameraError })] })), photos.length > 0 && (_jsxs("div", { children: [_jsxs(Label, { children: ["Selected Photos (", photos.length, "/", MAX_FILES, ")"] }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3 mt-2", children: photos.map((photo) => (_jsxs("div", { className: "relative group", children: [_jsx("img", { src: photo.preview, alt: "Preview", className: "w-full h-24 object-cover rounded-lg" }), _jsx(Button, { variant: "destructive", size: "sm", className: "absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity", onClick: () => removePhoto(photo.id), "aria-label": "Remove photo", children: _jsx(X, { className: "h-3 w-3" }) }), _jsxs(Badge, { className: "absolute bottom-1 left-1 text-xs bg-black/70 text-white", children: [(photo.file.size / 1024 / 1024).toFixed(1), "MB"] })] }, photo.id))) })] })), _jsxs("div", { children: [_jsx(Label, { htmlFor: "description", children: "Description (Optional)" }), _jsx(Textarea, { id: "description", value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Add a description of what these photos show...", rows: 3, disabled: isUploading })] }), uploadError && (_jsxs("div", { className: "flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg", role: "alert", "aria-live": "assertive", children: [_jsx(AlertCircle, { className: "h-4 w-4" }), _jsx("span", { className: "text-sm", children: uploadError })] })), _jsxs("div", { className: "text-sm text-gray-600 bg-gray-50 p-3 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-1", children: [_jsx(FileImage, { className: "h-4 w-4" }), _jsx("span", { className: "font-medium", children: "Requirements:" })] }), _jsxs("ul", { className: "list-disc list-inside space-y-1 text-xs", children: [_jsx("li", { children: "Supported formats: JPEG, PNG" }), _jsx("li", { children: "Maximum file size: 5MB per image" }), _jsxs("li", { children: ["Maximum ", MAX_FILES, " photos at once"] })] })] }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx(Button, { variant: "outline", onClick: handleClose, disabled: isUploading, children: "Cancel" }), _jsx(Button, { onClick: handleUpload, disabled: photos.length === 0 || isUploading, children: isUploading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 mr-2 animate-spin" }), "Uploading..."] })) : (_jsxs(_Fragment, { children: [_jsx(Upload, { className: "h-4 w-4 mr-2" }), "Upload ", photos.length, " Photo", photos.length !== 1 ? "s" : ""] })) })] })] })] }) }));
};
export default PhotoUploadModal;
