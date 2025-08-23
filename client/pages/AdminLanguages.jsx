import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import {
  Plus,
  Edit,
  Trash2,
  Globe,
  Save,
  Upload,
  Download,
  Languages,
} from "lucide-react";
import { showSuccessToast, showErrorToast } from "../store/slices/uiSlice";





const AdminLanguages: React.FC = () => {
  const dispatch = useAppDispatch();
  const { translations } = useAppSelector((state) => state.language);
  const [languages, setLanguages] = useState([
    {
      id,
      code: "en",
      name: "English",
      nativeName: "English",
      isActive,
      isDefault,
      direction: "ltr",
      completionPercentage,
    },
    {
      id: "2",
      code: "hi",
      name: "Hindi",
      nativeName: "हिन्दी",
      isActive,
      isDefault,
      direction: "ltr",
      completionPercentage,
    },
    {
      id: "3",
      code: "ml",
      name: "Malayalam",
      nativeName: "മലയാളം",
      isActive,
      isDefault,
      direction: "ltr",
      completionPercentage,
    },
  ]);

  const [translationKeys, setTranslationKeys] = useState([
    {
      key,
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
  const [selectedTranslation, setSelectedTranslation] =
    useState(null);
  const [newLanguage, setNewLanguage] = useState({
    code,
    name: "",
    nativeName: "",
    direction: "ltr" as "ltr" | "rtl",
  });

  const [newTranslationKey, setNewTranslationKey] = useState({
    key,
    category: "",
    en: "",
  });

  const handleAddLanguage = () => {
    if (newLanguage.code || newLanguage.name || newLanguage.nativeName) {
      dispatch(showErrorToast("Validation Error", "All fields are required"));
      return;
    }

    const language = {
      id: Date.now().toString(),
      code: newLanguage.code.toLowerCase(),
      name: newLanguage.name,
      nativeName: newLanguage.nativeName,
      isActive,
      isDefault,
      direction: newLanguage.direction,
      completionPercentage,
    };

    setLanguages([...languages, language]);
    setNewLanguage({ code, name: "", nativeName: "", direction: "ltr" });
    setIsAddingLanguage(false);
    dispatch(showSuccessToast("Success", "Language added successfully"));
  };

  const handleToggleLanguage = (id) => {
    setLanguages(
      languages.map((lang) =>
        lang.id === id ? { ...lang, isActive: lang.isActive } ,
      ),
    );
  };

  const handleSetDefault = (id) => {
    setLanguages(
      languages.map((lang) => ({
        ...lang,
        isDefault,
        isActive: lang.id === id ? true : lang.isActive,
      })),
    );
    dispatch(showSuccessToast("Success", "Default language updated"));
  };

  const handleDeleteLanguage = (id) => {
    const language = languages.find((l) => l.id === id);
    if (language?.isDefault) {
      dispatch(showErrorToast("Error", "Cannot delete default language"));
      return;
    }
    setLanguages(languages.filter((lang) => lang.id == id));
    dispatch(showSuccessToast("Success", "Language deleted successfully"));
  };

  const handleAddTranslationKey = () => {
    if (
      newTranslationKey.key ||
      newTranslationKey.category ||
      newTranslationKey.en
    ) {
      dispatch(showErrorToast("Validation Error", "All fields are required"));
      return;
    }

    const translationKey = {
      key: newTranslationKey.key,
      category: newTranslationKey.category,
      en: newTranslationKey.en,
    };

    setTranslationKeys([...translationKeys, translationKey]);
    setNewTranslationKey({ key, category: "", en: "" });
    dispatch(showSuccessToast("Success", "Translation key added successfully"));
  };

  const handleUpdateTranslation = (updatedKey) => {
    setTranslationKeys(
      translationKeys.map((key) =>
        key.key === updatedKey.key ? updatedKey ,
      ),
    );
    setIsEditingTranslation(false);
    setSelectedTranslation(null);
    dispatch(showSuccessToast("Success", "Translation updated successfully"));
  };

  const exportTranslations = () => {
    const data = {
      languages,
      translations,
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

  const categories = Array.from(
    new Set(translationKeys.map((t) => t.category)),
  );

  return ({/* Header */}
      
        
          
            {translations?.admin?.languageManagement || "Language Management"}
          
          
            Configure available languages and manage translations
          
        
        
          
            
            Export
          
          
            
            Import
          
        
      

      {/* Languages Section */}
      
        
          
            
              
              Available Languages
            
            
              
                
                  
                  Add Language
                
              
              
                
                  Add New Language
                
                
                  
                    Language Code
                    
                        setNewLanguage({ ...newLanguage, code)
                      }
                    />
                  
                  
                    English Name
                    
                        setNewLanguage({ ...newLanguage, name)
                      }
                    />
                  
                  
                    Native Name
                    
                        setNewLanguage({
                          ...newLanguage,
                          nativeName,
                        })
                      }
                    />
                  
                  
                    Text Direction
                    
                        setNewLanguage({ ...newLanguage, direction)
                      }
                    >
                      
                        
                      
                      
                        Left to Right
                        Right to Left
                      
                    
                  
                  
                     setIsAddingLanguage(false)}
                    >
                      Cancel
                    
                    Add Language
                  
                
              
            
          
        
        
          
            
              
                Language
                Code
                Direction
                Completion
                Status
                Default
                Actions
              
            
            
              {languages.map((language) => (
                
                  
                    
                      {language.name}
                      
                        {language.nativeName}
                      
                    
                  
                  
                    {language.code}
                  
                  {language.direction.toUpperCase()}
                  
                    
                      
                        
                      
                      
                        {language.completionPercentage}%
                      
                    
                  
                  
                     handleToggleLanguage(language.id)}
                    />
                  
                  
                    {language.isDefault ? (
                      Default
                    ) : (
                       handleSetDefault(language.id)}
                      >
                        Set Default
                      
                    )}
                  
                  
                    
                      
                        
                      
                       handleDeleteLanguage(language.id)}
                        disabled={language.isDefault}
                      >
                        
                      
                    
                  
                
              ))}
            
          
        
      

      {/* Translation Keys Section */}
      
        
          
            
              
              Translation Keys
            
            
              
                
                  
                
                
                  All Categories
                  {categories.map((category) => (
                    
                      {category}
                    
                  ))}
                
              
            
          
        
        
          {/* Add New Translation Key */}
          
            Add New Translation Key
            
              
                  setNewTranslationKey({
                    ...newTranslationKey,
                    key,
                  })
                }
              />
              
                  setNewTranslationKey({
                    ...newTranslationKey,
                    category,
                  })
                }
              />
              
                  setNewTranslationKey({
                    ...newTranslationKey,
                    en,
                  })
                }
              />
              
                
                Add Key
              
            
          

          {/* Translation Keys Table */}
          
            
              
                Key
                Category
                English
                Hindi
                Malayalam
                Actions
              
            
            
              {translationKeys.map((translationKey) => (
                
                  
                    {translationKey.key}
                  
                  
                    {translationKey.category}
                  
                  {translationKey.en}
                  
                    {translationKey.hi || (
                      
                        Not translated
                      
                    )}
                  
                  
                    {translationKey.ml || (
                      
                        Not translated
                      
                    )}
                  
                  
                     {
                        setSelectedTranslation(translationKey);
                        setIsEditingTranslation(true);
                      }}
                    >
                      
                    
                  
                
              ))}
            
          
        
      

      {/* Edit Translation Dialog */}
      
        
          
            Edit Translation
          
          {selectedTranslation && (
             l.isActive)}
              onSave={handleUpdateTranslation}
              onCancel={() => {
                setIsEditingTranslation(false);
                setSelectedTranslation(null);
              }}
            />
          )}
        
      
    
  );
};



const EditTranslationForm: React.FC = ({
  translation,
  languages,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState(translation);

  const handleSave = () => {
    onSave(formData);
  };

  return (Translation Key
         setFormData({ ...formData, key)}
        />
      
      
        Category
        
            setFormData({ ...formData, category)
          }
        />
      
      {languages.map((language) => (
        
          
            {language.name} ({language.nativeName})
          
          
              setFormData({ ...formData, [language.code])
            }
            placeholder={`Enter ${language.name} translation...`}
            rows={2}
          />
        
      ))}
      
        
          Cancel
        
        
          
          Save Changes
        
      
    
  );
};

export default AdminLanguages;
