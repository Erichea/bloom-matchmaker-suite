import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Save, Download, Upload } from 'lucide-react';

interface TranslationEntry {
  key: string;
  en: string;
  fr: string;
}

export default function TranslationEditor() {
  const { t, i18n } = useTranslation();
  const [translations, setTranslations] = useState<TranslationEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTranslations();
  }, []);

  const loadTranslations = () => {
    const enTranslations = i18n.getResourceBundle('en', 'translation');
    const frTranslations = i18n.getResourceBundle('fr', 'translation');

    const flattenObject = (obj: any, prefix = ''): { [key: string]: string } => {
      return Object.keys(obj).reduce((acc: { [key: string]: string }, key: string) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          Object.assign(acc, flattenObject(obj[key], fullKey));
        } else {
          acc[fullKey] = obj[key];
        }
        return acc;
      }, {});
    };

    const flatEn = flattenObject(enTranslations);
    const flatFr = flattenObject(frTranslations);

    const entries: TranslationEntry[] = Object.keys(flatEn).map((key) => ({
      key,
      en: flatEn[key] || '',
      fr: flatFr[key] || '',
    }));

    setTranslations(entries);
  };

  const handleUpdateTranslation = (key: string, lang: 'en' | 'fr', value: string) => {
    setTranslations((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, [lang]: value } : item
      )
    );
  };

  const handleSave = () => {
    const enData: any = {};
    const frData: any = {};

    translations.forEach(({ key, en, fr }) => {
      const keys = key.split('.');
      let enCurrent = enData;
      let frCurrent = frData;

      keys.forEach((k, index) => {
        if (index === keys.length - 1) {
          enCurrent[k] = en;
          frCurrent[k] = fr;
        } else {
          enCurrent[k] = enCurrent[k] || {};
          frCurrent[k] = frCurrent[k] || {};
          enCurrent = enCurrent[k];
          frCurrent = frCurrent[k];
        }
      });
    });

    // Update i18next resources
    i18n.addResourceBundle('en', 'translation', enData, true, true);
    i18n.addResourceBundle('fr', 'translation', frData, true, true);

    toast.success('Translations saved successfully');
  };

  const handleExport = () => {
    const enData: any = {};
    const frData: any = {};

    translations.forEach(({ key, en, fr }) => {
      const keys = key.split('.');
      let enCurrent = enData;
      let frCurrent = frData;

      keys.forEach((k, index) => {
        if (index === keys.length - 1) {
          enCurrent[k] = en;
          frCurrent[k] = fr;
        } else {
          enCurrent[k] = enCurrent[k] || {};
          frCurrent[k] = frCurrent[k] || {};
          enCurrent = enCurrent[k];
          frCurrent = frCurrent[k];
        }
      });
    });

    const enBlob = new Blob([JSON.stringify(enData, null, 2)], { type: 'application/json' });
    const frBlob = new Blob([JSON.stringify(frData, null, 2)], { type: 'application/json' });

    const enUrl = URL.createObjectURL(enBlob);
    const frUrl = URL.createObjectURL(frBlob);

    const enLink = document.createElement('a');
    enLink.href = enUrl;
    enLink.download = 'en.json';
    enLink.click();

    const frLink = document.createElement('a');
    frLink.href = frUrl;
    frLink.download = 'fr.json';
    frLink.click();

    toast.success('Translation files exported');
  };

  const filteredTranslations = translations.filter(
    (item) =>
      item.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.fr.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Translation Editor</CardTitle>
          <CardDescription>
            Edit and manage translations for all languages. Changes are saved in browser storage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search translations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="border rounded-lg max-h-[600px] overflow-y-auto">
            <div className="space-y-4 p-4">
              {filteredTranslations.map((item) => (
                <Card key={item.key}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-mono">{item.key}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`${item.key}-en`}>English</Label>
                      <Input
                        id={`${item.key}-en`}
                        value={item.en}
                        onChange={(e) => handleUpdateTranslation(item.key, 'en', e.target.value)}
                        placeholder="English translation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${item.key}-fr`}>Français</Label>
                      <Input
                        id={`${item.key}-fr`}
                        value={item.fr}
                        onChange={(e) => handleUpdateTranslation(item.key, 'fr', e.target.value)}
                        placeholder="French translation"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
