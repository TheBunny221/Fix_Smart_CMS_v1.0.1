import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Plus, Edit, Trash2, Globe, Save, Upload, Download, Languages, } from "lucide-react";
import { showSuccessToast, showErrorToast } from "../store/slices/uiSlice";
const AdminLanguages = () => {
    const dispatch = useAppDispatch();
    const { translations } = useAppSelector((state) => state.language);
    const [languages, setLanguages] = useState([
        {
            id: "1",
            code: "en",
            name: "English",
            nativeName: "English",
            isActive: true,
            isDefault: true,
            direction: "ltr",
            completionPercentage: 100,
        },
        {
            id: "2",
            code: "hi",
            name: "Hindi",
            nativeName: "हिन्दी",
            isActive: true,
            isDefault: false,
            direction: "ltr",
            completionPercentage: 95,
        },
        {
            id: "3",
            code: "ml",
            name: "Malayalam",
            nativeName: "മലയാളം",
            isActive: true,
            isDefault: false,
            direction: "ltr",
            completionPercentage: 90,
        },
    ]);
    const [translationKeys, setTranslationKeys] = useState([
        {
            key: "common.submit",
            category: "common",
            en: "Submit",
            hi: "जमा करना",
            ml: "സമർപ്പിക്കുക",
        },
        {
            key: "common.cancel",
            category: "common",
            en: "Cancel",
            hi: "रद्द करना",
            ml: "റദ്ദാക്കുക",
        },
        {
            key: "nav.home",
            category: "navigation",
            en: "Home",
            hi: "होम",
            ml: "ഹോം",
        },
    ]);
    const [isAddingLanguage, setIsAddingLanguage] = useState(false);
    const [isEditingTranslation, setIsEditingTranslation] = useState(false);
    const [selectedTranslation, setSelectedTranslation] = useState(null);
    const [newLanguage, setNewLanguage] = useState({
        code: "",
        name: "",
        nativeName: "",
        direction: "ltr",
    });
    const [newTranslationKey, setNewTranslationKey] = useState({
        key: "",
        category: "",
        en: "",
    });
    const handleAddLanguage = () => {
        if (!newLanguage.code || !newLanguage.name || !newLanguage.nativeName) {
            dispatch(showErrorToast("Validation Error", "All fields are required"));
            return;
        }
        const language = {
            id: Date.now().toString(),
            code: newLanguage.code.toLowerCase(),
            name: newLanguage.name,
            nativeName: newLanguage.nativeName,
            isActive: false,
            isDefault: false,
            direction: newLanguage.direction,
            completionPercentage: 0,
        };
        setLanguages([...languages, language]);
        setNewLanguage({ code: "", name: "", nativeName: "", direction: "ltr" });
        setIsAddingLanguage(false);
        dispatch(showSuccessToast("Success", "Language added successfully"));
    };
    const handleToggleLanguage = (id) => {
        setLanguages(languages.map((lang) => lang.id === id ? { ...lang, isActive: !lang.isActive } : lang));
    };
    const handleSetDefault = (id) => {
        setLanguages(languages.map((lang) => ({
            ...lang,
            isDefault: lang.id === id,
            isActive: lang.id === id ? true : lang.isActive,
        })));
        dispatch(showSuccessToast("Success", "Default language updated"));
    };
    const handleDeleteLanguage = (id) => {
        const language = languages.find((l) => l.id === id);
        if (language?.isDefault) {
            dispatch(showErrorToast("Error", "Cannot delete default language"));
            return;
        }
        setLanguages(languages.filter((lang) => lang.id !== id));
        dispatch(showSuccessToast("Success", "Language deleted successfully"));
    };
    const handleAddTranslationKey = () => {
        if (!newTranslationKey.key ||
            !newTranslationKey.category ||
            !newTranslationKey.en) {
            dispatch(showErrorToast("Validation Error", "All fields are required"));
            return;
        }
        const translationKey = {
            key: newTranslationKey.key,
            category: newTranslationKey.category,
            en: newTranslationKey.en,
        };
        setTranslationKeys([...translationKeys, translationKey]);
        setNewTranslationKey({ key: "", category: "", en: "" });
        dispatch(showSuccessToast("Success", "Translation key added successfully"));
    };
    const handleUpdateTranslation = (updatedKey) => {
        setTranslationKeys(translationKeys.map((key) => key.key === updatedKey.key ? updatedKey : key));
        setIsEditingTranslation(false);
        setSelectedTranslation(null);
        dispatch(showSuccessToast("Success", "Translation updated successfully"));
    };
    const exportTranslations = () => {
        const data = {
            languages,
            translations: translationKeys,
            exportedAt: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "translations-export.json";
        a.click();
        URL.revokeObjectURL(url);
        dispatch(showSuccessToast("Success", "Translations exported successfully"));
    };
    const categories = Array.from(new Set(translationKeys.map((t) => t.category)));
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold tracking-tight", children: translations?.admin?.languageManagement || "Language Management" }), _jsx("p", { className: "text-muted-foreground", children: "Configure available languages and manage translations" })] }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs(Button, { onClick: exportTranslations, variant: "outline", children: [_jsx(Download, { className: "mr-2 h-4 w-4" }), "Export"] }), _jsxs(Button, { children: [_jsx(Upload, { className: "mr-2 h-4 w-4" }), "Import"] })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Globe, { className: "mr-2 h-5 w-5" }), "Available Languages"] }), _jsxs(Dialog, { open: isAddingLanguage, onOpenChange: setIsAddingLanguage, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Add Language"] }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Add New Language" }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "code", children: "Language Code" }), _jsx(Input, { id: "code", placeholder: "e.g., fr, de, es", value: newLanguage.code, onChange: (e) => setNewLanguage({ ...newLanguage, code: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "name", children: "English Name" }), _jsx(Input, { id: "name", placeholder: "e.g., French, German, Spanish", value: newLanguage.name, onChange: (e) => setNewLanguage({ ...newLanguage, name: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "nativeName", children: "Native Name" }), _jsx(Input, { id: "nativeName", placeholder: "e.g., Fran\u00E7ais, Deutsch, Espa\u00F1ol", value: newLanguage.nativeName, onChange: (e) => setNewLanguage({
                                                                        ...newLanguage,
                                                                        nativeName: e.target.value,
                                                                    }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "direction", children: "Text Direction" }), _jsxs(Select, { value: newLanguage.direction, onValueChange: (value) => setNewLanguage({ ...newLanguage, direction: value }), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "ltr", children: "Left to Right" }), _jsx(SelectItem, { value: "rtl", children: "Right to Left" })] })] })] }), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx(Button, { variant: "outline", onClick: () => setIsAddingLanguage(false), children: "Cancel" }), _jsx(Button, { onClick: handleAddLanguage, children: "Add Language" })] })] })] })] })] }) }), _jsx(CardContent, { children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Language" }), _jsx(TableHead, { children: "Code" }), _jsx(TableHead, { children: "Direction" }), _jsx(TableHead, { children: "Completion" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { children: "Default" }), _jsx(TableHead, { children: "Actions" })] }) }), _jsx(TableBody, { children: languages.map((language) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: _jsxs("div", { children: [_jsx("div", { className: "font-medium", children: language.name }), _jsx("div", { className: "text-sm text-muted-foreground", children: language.nativeName })] }) }), _jsx(TableCell, { children: _jsx(Badge, { variant: "outline", children: language.code }) }), _jsx(TableCell, { children: language.direction.toUpperCase() }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("div", { className: "w-20 bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-primary h-2 rounded-full", style: { width: `${language.completionPercentage}%` } }) }), _jsxs("span", { className: "text-sm", children: [language.completionPercentage, "%"] })] }) }), _jsx(TableCell, { children: _jsx(Switch, { checked: language.isActive, onCheckedChange: () => handleToggleLanguage(language.id) }) }), _jsx(TableCell, { children: language.isDefault ? (_jsx(Badge, { children: "Default" })) : (_jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleSetDefault(language.id), children: "Set Default" })) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex space-x-2", children: [_jsx(Button, { variant: "ghost", size: "sm", children: _jsx(Edit, { className: "h-4 w-4" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleDeleteLanguage(language.id), disabled: language.isDefault, children: _jsx(Trash2, { className: "h-4 w-4" }) })] }) })] }, language.id))) })] }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "flex items-center", children: [_jsx(Languages, { className: "mr-2 h-5 w-5" }), "Translation Keys"] }), _jsx("div", { className: "flex space-x-2", children: _jsxs(Select, { children: [_jsx(SelectTrigger, { className: "w-40", children: _jsx(SelectValue, { placeholder: "Filter by category" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Categories" }), categories.map((category) => (_jsx(SelectItem, { value: category, children: category }, category)))] })] }) })] }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "mb-6 p-4 border rounded-lg bg-muted/50", children: [_jsx("h3", { className: "font-medium mb-3", children: "Add New Translation Key" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx(Input, { placeholder: "Translation key (e.g., common.submit)", value: newTranslationKey.key, onChange: (e) => setNewTranslationKey({
                                                    ...newTranslationKey,
                                                    key: e.target.value,
                                                }) }), _jsx(Input, { placeholder: "Category", value: newTranslationKey.category, onChange: (e) => setNewTranslationKey({
                                                    ...newTranslationKey,
                                                    category: e.target.value,
                                                }) }), _jsx(Input, { placeholder: "English translation", value: newTranslationKey.en, onChange: (e) => setNewTranslationKey({
                                                    ...newTranslationKey,
                                                    en: e.target.value,
                                                }) }), _jsxs(Button, { onClick: handleAddTranslationKey, children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Add Key"] })] })] }), _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Key" }), _jsx(TableHead, { children: "Category" }), _jsx(TableHead, { children: "English" }), _jsx(TableHead, { children: "Hindi" }), _jsx(TableHead, { children: "Malayalam" }), _jsx(TableHead, { children: "Actions" })] }) }), _jsx(TableBody, { children: translationKeys.map((translationKey) => (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-mono text-sm", children: translationKey.key }), _jsx(TableCell, { children: _jsx(Badge, { variant: "secondary", children: translationKey.category }) }), _jsx(TableCell, { children: translationKey.en }), _jsx(TableCell, { children: translationKey.hi || (_jsx("span", { className: "text-muted-foreground", children: "Not translated" })) }), _jsx(TableCell, { children: translationKey.ml || (_jsx("span", { className: "text-muted-foreground", children: "Not translated" })) }), _jsx(TableCell, { children: _jsx(Button, { variant: "ghost", size: "sm", onClick: () => {
                                                            setSelectedTranslation(translationKey);
                                                            setIsEditingTranslation(true);
                                                        }, children: _jsx(Edit, { className: "h-4 w-4" }) }) })] }, translationKey.key))) })] })] })] }), _jsx(Dialog, { open: isEditingTranslation, onOpenChange: setIsEditingTranslation, children: _jsxs(DialogContent, { className: "max-w-2xl", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Edit Translation" }) }), selectedTranslation && (_jsx(EditTranslationForm, { translation: selectedTranslation, languages: languages.filter((l) => l.isActive), onSave: handleUpdateTranslation, onCancel: () => {
                                setIsEditingTranslation(false);
                                setSelectedTranslation(null);
                            } }))] }) })] }));
};
const EditTranslationForm = ({ translation, languages, onSave, onCancel, }) => {
    const [formData, setFormData] = useState(translation);
    const handleSave = () => {
        onSave(formData);
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: "key", children: "Translation Key" }), _jsx(Input, { id: "key", value: formData.key, onChange: (e) => setFormData({ ...formData, key: e.target.value }) })] }), _jsxs("div", { children: [_jsx(Label, { htmlFor: "category", children: "Category" }), _jsx(Input, { id: "category", value: formData.category, onChange: (e) => setFormData({ ...formData, category: e.target.value }) })] }), languages.map((language) => (_jsxs("div", { children: [_jsxs(Label, { htmlFor: language.code, children: [language.name, " (", language.nativeName, ")"] }), _jsx(Textarea, { id: language.code, value: formData[language.code] || "", onChange: (e) => setFormData({ ...formData, [language.code]: e.target.value }), placeholder: `Enter ${language.name} translation...`, rows: 2 })] }, language.code))), _jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx(Button, { variant: "outline", onClick: onCancel, children: "Cancel" }), _jsxs(Button, { onClick: handleSave, children: [_jsx(Save, { className: "mr-2 h-4 w-4" }), "Save Changes"] })] })] }));
};
export default AdminLanguages;
