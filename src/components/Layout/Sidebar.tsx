import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Image, Settings, Languages } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
    { path: '/creation', icon: PlusCircle, labelKey: 'nav.creation' },
    { path: '/gallery', icon: Image, labelKey: 'nav.gallery' },
    { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

export const Sidebar: React.FC = () => {
    const { t, i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'zh' ? 'en' : 'zh';
        i18n.changeLanguage(newLang);
    };

    const currentLangLabel = i18n.language === 'zh' ? '中文' : 'EN';

    return (
        <div className="w-64 h-screen bg-black border-r border-white/10 flex flex-col p-4">
            <div className="mb-8 px-4">
                <h1 className="text-2xl font-bold text-white tracking-tighter">SORA GEN</h1>
            </div>
            <nav className="flex-1 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                                isActive
                                    ? 'bg-white text-black font-medium'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            )
                        }
                    >
                        <item.icon size={20} />
                        <span>{t(item.labelKey)}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Language Toggle Button */}
            <div className="mt-4 px-2">
                <button
                    onClick={toggleLanguage}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                    title={t('common.language')}
                >
                    <Languages size={20} />
                    <span className="text-sm font-medium">{currentLangLabel}</span>
                </button>
            </div>
        </div>
    );
};
