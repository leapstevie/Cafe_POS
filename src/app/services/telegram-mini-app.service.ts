import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
    hapticFeedback,
    init,
    initData,
    miniApp,
    themeParams,
    viewport
} from '@tma.js/sdk';

type ImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type NotificationType = 'error' | 'success' | 'warning';

interface TelegramWebApp {
    initData?: string;
    openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
}

@Injectable({
    providedIn: 'root'
})
export class TelegramMiniAppService {
    private readonly isBrowser: boolean;
    private initialized = false;
    private inTelegramMiniApp = false;
    private rawInitData: string | undefined;

    constructor(@Inject(PLATFORM_ID) platformId: object) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    initialize(): void {
        if (!this.isBrowser || this.initialized) {
            return;
        }

        const telegram = this.getTelegramGlobal();

        // telegram-web-app.js is loaded for every visitor (web and Telegram alike) and always
        // defines window.Telegram.WebApp as an object, even outside Telegram — with every field
        // undefined. Real launch data (non-empty initData) is what actually distinguishes a
        // genuine Telegram Mini App session from a plain web visit.
        this.rawInitData = telegram?.WebApp?.initData || undefined;
        this.inTelegramMiniApp = Boolean(this.rawInitData);

        if (!this.inTelegramMiniApp) {
            return;
        }

        try {
            init();
            if (themeParams.mount.isAvailable()) {
                themeParams.mount();
            }
            if (miniApp.mount.isAvailable()) {
                miniApp.mount();
            }
            if (viewport.mount.isAvailable()) {
                viewport.mount();
            }
            if (themeParams.bindCssVars.isAvailable() && !themeParams.isCssVarsBound()) {
                themeParams.bindCssVars();
            }
            if (miniApp.bindCssVars.isAvailable() && !miniApp.isCssVarsBound()) {
                miniApp.bindCssVars();
            }
            if (viewport.bindCssVars.isAvailable() && !viewport.isCssVarsBound()) {
                viewport.bindCssVars();
            }
            if (miniApp.setBgColor.isAvailable()) {
                miniApp.setBgColor('bg_color');
            }
            if (miniApp.setHeaderColor.isAvailable()) {
                miniApp.setHeaderColor('bg_color');
            }
            if (viewport.expand.isAvailable()) {
                viewport.expand();
            }
            if (miniApp.ready.isAvailable()) {
                miniApp.ready();
            }

            document.body.classList.add('tg-mini-app');
            this.initialized = true;
        } catch (error) {
            console.error('Telegram Mini App initialization failed:', error);
        }
    }

    isInTelegramMiniApp(): boolean {
        return this.inTelegramMiniApp;
    }

    getTelegramUsername(): string | undefined {
        return initData.user()?.username;
    }

    /** Raw, signed initData string — sent to the backend to verify identity server-side. */
    getRawInitData(): string | undefined {
        return this.rawInitData;
    }

    /** Opens a URL in the system browser instead of Telegram's embedded webview. */
    openExternalLink(url: string): void {
        if (!this.isBrowser) {
            return;
        }
        const webApp = this.getTelegramGlobal()?.WebApp;
        if (webApp?.openLink) {
            webApp.openLink(url, { try_instant_view: false });
        } else {
            window.open(url, '_blank');
        }
    }

    private getTelegramGlobal(): { WebApp?: TelegramWebApp } | undefined {
        return (window as Window & { Telegram?: { WebApp?: TelegramWebApp } }).Telegram;
    }

    selectionChanged(): void {
        if (hapticFeedback.selectionChanged.isAvailable()) {
            hapticFeedback.selectionChanged();
        }
        if (hapticFeedback.impactOccurred.isAvailable()) {
            hapticFeedback.impactOccurred('soft');
        }
    }

    impact(style: ImpactStyle = 'medium'): void {
        if (hapticFeedback.impactOccurred.isAvailable()) {
            hapticFeedback.impactOccurred(style);
        }
    }

    notify(type: NotificationType): void {
        if (hapticFeedback.notificationOccurred.isAvailable()) {
            hapticFeedback.notificationOccurred(type);
        }
    }
}
