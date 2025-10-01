export const mergeWithFallback = (value, fallback) => {
    if (Array.isArray(fallback)) {
        const valueArray = Array.isArray(value) ? value : [];
        return fallback.map((item, index) => mergeWithFallback(valueArray[index], item));
    }
    if (fallback && typeof fallback === "object") {
        const result = {};
        const valueObject = value && typeof value === "object" ? value : {};
        const keys = new Set([
            ...Object.keys(fallback),
            ...Object.keys(valueObject),
        ]);
        keys.forEach((key) => {
            result[key] = mergeWithFallback(valueObject[key], fallback[key]);
        });
        return result;
    }
    if (typeof value === "string") {
        return (value.trim().length > 0 ? value : fallback);
    }
    return (value ?? fallback);
};
