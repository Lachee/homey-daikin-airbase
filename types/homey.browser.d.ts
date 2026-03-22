export {};

type HomeyDialogIcon = null | "error" | "warning" | "info";

type HomeyPairDevice = {
    name: string;
    data: Record<string, any>;
    icon?: string;
    class?: string;
    capabilities?: string[];
    capabilitiesOptions?: Record<string, any>;
    store?: Record<string, any>;
    settings?: Record<string, any>;
};

interface HomeyPairingAPI {
    emit<T = any>(event: string, data?: any): Promise<T>;
    on(event: string, callback: (...args: any[]) => void): void;

    setTitle(title: string): void;
    setSubtitle(subtitle: string): void;

    showView(viewId: string): void;
    prevView(): void;
    nextView(): void;
    getCurrentView(): string;

    createDevice(device: HomeyPairDevice): Promise<HomeyPairDevice>;
    getZone(): Promise<string>;
    getOptions<T = Record<string, any>>(viewId?: string): Promise<T>;

    setNavigationClose(): void;
    done(): void;

    alert(message: string, icon?: HomeyDialogIcon): Promise<void>;
    confirm(message: string, icon?: HomeyDialogIcon): Promise<boolean>;
    popup(url: string): void;

    __(key: string, tokens?: Record<string, string | number>): string;

    showLoadingOverlay(): void;
    hideLoadingOverlay(): void;

    getViewStoreValue<T = any>(viewId: string, key: string): Promise<T>;
    setViewStoreValue(viewId: string, key: string, value: any): Promise<void>;
}

declare global {
    const Homey: HomeyPairingAPI;

    namespace Homey {
        namespace Driver {
            interface PairSession {
                showView(viewId: string): Promise<void>;
                nextView(): Promise<void>;
                prevView(): Promise<void>;
                done(): Promise<void>;

                setHandler<TArgs = any, TResult = any>(
                    event: string,
                    callback: (data: TArgs) => TResult | Promise<TResult>
                ): void;

                emit(event: string, data?: any): Promise<any>;
            }
        }
    }
}