import { useTranslation } from "react-i18next";
import type { LanguageConfig } from "../lang/i18n";
import "../styles/navbar.css";

interface NavbarProps {
    languageConfig: LanguageConfig;
}

const navItems = [
    { id: "home", key: "home" },
    { id: "history", key: "history" },
    { id: "projects", key: "projects" },
    { id: "contact", key: "contact" }
];

export default function Navbar({ languageConfig }: NavbarProps) {
    const { t, i18n } = useTranslation("navigation");

    const languages = languageConfig.languages.filter(
        language => language.enabled
    );

    return (
        <header className="navbar">
            <a href="#home" className="navbar-logo">
                ZSTZ
            </a>

            <nav className="navbar-links">
                {navItems.map(item => (
                    <a
                        key={item.id}
                        href={`#${item.id}`}
                        className="navbar-link"
                    >
                        {t(item.key)}
                    </a>
                ))}
            </nav>

            <div className="navbar-language">
                <select
                    value={i18n.resolvedLanguage ?? i18n.language}
                    onChange={event => i18n.changeLanguage(event.target.value)}
                    aria-label={t("selectLanguage")}
                >
                    {languages.map(language => (
                        <option key={language.code} value={language.code}>
                            {language.nativeName}
                        </option>
                    ))}
                </select>
            </div>
        </header>
    );
}