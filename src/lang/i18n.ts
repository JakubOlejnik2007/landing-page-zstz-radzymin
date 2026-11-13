import i18n from "i18next";
import HttpBackend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

export interface LanguageConfig {
    defaultLanguage: string;
    fallbackLanguage: string;
    defaultNamespace: string;
    namespaces: string[];
    languages: {
        code: string;
        name: string;
        nativeName: string;
        enabled: boolean;
    }[];
}

async function initializeI18n() {
    const response = await fetch("/locales/languages.json");

    if (!response.ok) {
        throw new Error("Failed to load language configuration");
    }

    const config: LanguageConfig = await response.json();

    const languages = config.languages
        .filter(language => language.enabled)
        .map(language => language.code);

    await i18n
        .use(HttpBackend)
        .use(initReactI18next)
        .init({
            lng: config.defaultLanguage,
            fallbackLng: config.fallbackLanguage,
            supportedLngs: languages,
            ns: config.namespaces,
            defaultNS: config.defaultNamespace,
            backend: {
                loadPath: "/locales/{{lng}}/{{ns}}.json"
            },
            interpolation: {
                escapeValue: false
            }
        });

    return config;
}

export default initializeI18n;