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

@Injectable({
    providedIn: 'root'
})
export class TelegramMiniAppService {
    private readonly isBrowser: boolean;
    private initialized = false;
    private inTelegramMiniApp = false;

    constructor(@Inject(PLATFORM_ID) platformId: object) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    initialize(): void {
        if (!this.isBrowser || this.initialized) {
            return;
        }

        const telegram = (window as Window & {
            Telegram?: {
                WebApp?: unknown;
            };
        }).Telegram;

        this.inTelegramMiniApp = Boolean(telegram?.WebApp);

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

    selectionChanged(): void {
        if (hapticFeedback.selectionChanged.isAvailable()) {
            hapticFeedback.selectionChanged();
        }
    }

    impact(style: ImpactStyle = 'light'): void {
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
