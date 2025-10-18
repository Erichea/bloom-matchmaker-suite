import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Smartphone,
  ChevronDown,
  Share,
  Home,
  MoreVertical,
  X
} from "lucide-react";

interface PWAInstallPromptProps {
  onDismiss?: () => void;
}

export function PWAInstallPrompt({ onDismiss }: PWAInstallPromptProps) {
  const { t } = useTranslation();
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if app is running in standalone mode (PWA installed)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone ||
                      document.referrer.includes('android-app://');

    setIsStandalone(standalone);

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else if (/windows|macintosh|linux/.test(userAgent)) {
      setPlatform('desktop');
    }
  }, []);

  // Don't show if already installed as PWA
  if (isStandalone) {
    return null;
  }

  const getInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          title: t('pwa.installBloomIos'),
          steps: [
            {
              icon: <Share className="h-5 w-5" />,
              text: t('pwa.tapShareButton')
            },
            {
              icon: <Home className="h-5 w-5" />,
              text: t('pwa.addToHomeScreen')
            },
            {
              icon: <Smartphone className="h-5 w-5" />,
              text: t('pwa.tapAdd')
            }
          ],
          note: t('pwa.useSafariIos')
        };
      case 'android':
        return {
          title: t('pwa.installBloomAndroid'),
          steps: [
            {
              icon: <MoreVertical className="h-5 w-5" />,
              text: t('pwa.tapMenu')
            },
            {
              icon: <Home className="h-5 w-5" />,
              text: t('pwa.addToHomeScreenAndroid')
            },
            {
              icon: <Smartphone className="h-5 w-5" />,
              text: t('pwa.confirmInstall')
            }
          ],
          note: t('pwa.useChromeAndroid')
        };
      case 'desktop':
        return {
          title: t('pwa.installBloomDesktop'),
          steps: [
            {
              icon: <MoreVertical className="h-5 w-5" />,
              text: t('pwa.clickInstallIcon')
            },
            {
              icon: <Smartphone className="h-5 w-5" />,
              text: t('pwa.browserMenu')
            }
          ],
          note: t('pwa.chromiumBrowsers')
        };
      default:
        return null;
    }
  };

  const instructions = getInstructions();

  if (!instructions) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <CardTitle>{t('pwa.installBloomApp')}</CardTitle>
          </div>
          {onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          {t('pwa.bestExperienceDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showInstructions ? (
          <Button
            className="w-full"
            onClick={() => setShowInstructions(true)}
          >
            <Smartphone className="mr-2 h-4 w-4" />
            {t('pwa.showGuide')}
          </Button>
        ) : (
          <div className="space-y-4">
            <h3 className="font-semibold">{instructions.title}</h3>
            <div className="space-y-3">
              {instructions.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {step.icon}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-sm">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Alert>
              <AlertDescription className="text-sm">
                {instructions.note}
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowInstructions(false)}
            >
              <ChevronDown className="mr-2 h-4 w-4" />
              {t('pwa.hideInstructions')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
