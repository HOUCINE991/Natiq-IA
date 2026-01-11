import React, { useState } from 'react';
import { Country, COUNTRY_DIALECTS, Gender, Tone, VoiceName, VoiceSettings, Language, ModalType } from '../types';
import { translations } from '../utils/translations';
import Modal from './Modal';
import InfoSection from './InfoSection';
import ContactForm from './ContactForm';

interface LayoutProps {
  children: React.ReactNode;
  settings: VoiceSettings;
  onSettingsChange: (settings: VoiceSettings) => void;
  activeTab: 'tts' | 'live';
  onTabChange: (tab: 'tts' | 'live') => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

const VOICE_METADATA: Record<VoiceName, { gender: Gender; description: string }> = {
  [VoiceName.FENRIR]: { gender: Gender.MALE, description: 'Deep & Authoritative' },
  [VoiceName.CHARON]: { gender: Gender.MALE, description: 'Steady & Professional' },
  [VoiceName.PUCK]: { gender: Gender.MALE, description: 'Playful & Energetic' },
  [VoiceName.KORE]: { gender: Gender.FEMALE, description: 'Clear & Balanced' },
  [VoiceName.ZEPHYR]: { gender: Gender.FEMALE, description: 'Soft & Calm' },
  [VoiceName.AOEDE]: { gender: Gender.FEMALE, description: 'Expressive & Dynamic' },
};

// Reusable Text-Based Language Switcher Component
const LanguageSwitcher = ({ current, onChange }: { current: Language, onChange: (l: Language) => void }) => (
  <div className="flex items-center gap-1 bg-slate-900/50 border border-slate-700/50 rounded-lg p-1">
    <button
      onClick={() => onChange(Language.EN)}
      className={`px-2 py-1.5 rounded-md text-xs font-bold transition-all ${
        current === Language.EN 
          ? 'bg-indigo-600 text-white shadow-sm' 
          : 'text-slate-400 hover:text-slate-200'
      }`}
      aria-label="Switch to English"
    >
      EN
    </button>
    <button
      onClick={() => onChange(Language.AR)}
      className={`px-2 py-1.5 rounded-md text-xs font-bold transition-all ${
        current === Language.AR 
          ? 'bg-indigo-600 text-white shadow-sm' 
          : 'text-slate-400 hover:text-slate-200'
      }`}
      aria-label="Switch to Arabic"
    >
      AR
    </button>
    <button
      onClick={() => onChange(Language.MA)}
      className={`px-2 py-1.5 rounded-md text-xs font-bold transition-all ${
        current === Language.MA 
          ? 'bg-indigo-600 text-white shadow-sm' 
          : 'text-slate-400 hover:text-slate-200'
      }`}
      aria-label="Switch to Moroccan Arabic"
    >
      MA
    </button>
  </div>
);

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  settings, 
  onSettingsChange, 
  activeTab, 
  onTabChange,
  language,
  onLanguageChange
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(ModalType.NONE);
  const t = translations[language];

  // Helper to determine text direction
  const getDir = () => (language === Language.EN ? 'ltr' : 'rtl');

  const updateSetting = (key: keyof VoiceSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value as Country;
    const availableDialects = COUNTRY_DIALECTS[newCountry];
    onSettingsChange({
      ...settings,
      country: newCountry,
      dialect: availableDialects[0]
    });
  };

  const handleGenderChange = (gender: Gender) => {
    const defaultVoice = Object.values(VoiceName).find(
      (v) => VOICE_METADATA[v].gender === gender
    );
    onSettingsChange({
      ...settings,
      gender,
      voiceName: defaultVoice || (gender === Gender.MALE ? VoiceName.FENRIR : VoiceName.KORE)
    });
  };

  const availableVoices = Object.values(VoiceName).filter(
    (v) => VOICE_METADATA[v].gender === settings.gender
  );

  const renderModalContent = () => {
    switch (activeModal) {
      case ModalType.ABOUT:
        return <InfoSection content={t.aboutContent} />;
      case ModalType.USAGE:
        return <InfoSection content={t.usageContent} />;
      case ModalType.TERMS:
        return <InfoSection content={t.termsContent} />;
      case ModalType.CONTACT:
        return <ContactForm t={t} language={language} />;
      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (activeModal) {
      case ModalType.ABOUT: return t.aboutUs;
      case ModalType.USAGE: return t.usagePolicy;
      case ModalType.TERMS: return t.termsOfService;
      case ModalType.CONTACT: return t.contactTitle;
      default: return '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900 text-slate-100 font-sans" dir={getDir()}>
      
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-800/90 backdrop-blur-md p-4 flex justify-between items-center border-b border-slate-700/50 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-lg shadow-indigo-500/20 shadow-lg">
              🎙️
           </div>
           <h1 className="text-lg font-bold tracking-tight text-white">{t.appTitle}</h1>
        </div>
        <LanguageSwitcher current={language} onChange={onLanguageChange} />
      </div>

      {/* Sidebar (Desktop & Mobile Drawer via Settings) */}
      <aside className={`
        fixed inset-y-0 start-0 z-40 w-80 bg-slate-800 border-e border-slate-700 transform transition-transform duration-300 ease-in-out overflow-y-auto flex flex-col shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : (getDir() === 'rtl' ? 'translate-x-full' : '-translate-x-full')}
        md:relative md:translate-x-0 md:shadow-none
      `}>
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
                    🎙️
                </div>
                <h1 className="text-2xl font-bold tracking-tight">{t.appTitle}</h1>
            </div>
             <div className="hidden md:block">
                <LanguageSwitcher current={language} onChange={onLanguageChange} />
             </div>
            
            {/* Mobile Close Sidebar */}
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 p-2 hover:bg-slate-700 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:block mb-8 space-y-1">
            <button
              onClick={() => onTabChange('tts')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'tts' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rtl:ml-3 rtl:mr-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              {t.ttsTab}
            </button>
            <button
              onClick={() => onTabChange('live')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === 'live' 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' 
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rtl:ml-3 rtl:mr-0" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              {t.liveTab}
            </button>
          </nav>

          <div className="h-px bg-slate-700 my-6 hidden md:block"></div>

          {/* Voice Settings */}
          <div className="space-y-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.voiceSettings}</h3>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">{t.country}</label>
              <select
                className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                value={settings.country}
                onChange={handleCountryChange}
              >
                {Object.values(Country).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">{t.dialect}</label>
              <select
                className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                value={settings.dialect}
                onChange={(e) => updateSetting('dialect', e.target.value)}
              >
                {COUNTRY_DIALECTS[settings.country].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">{t.gender}</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(Gender).map((g) => (
                  <button
                    key={g}
                    onClick={() => handleGenderChange(g)}
                    className={`p-3 rounded-xl text-sm font-medium transition-colors border ${
                      settings.gender === g
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-sm'
                        : 'bg-slate-900 border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">{t.voicePersona}</label>
              <select
                className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                value={settings.voiceName}
                onChange={(e) => updateSetting('voiceName', e.target.value)}
              >
                {availableVoices.map((v) => (
                  <option key={v} value={v}>
                    {v} - {VOICE_METADATA[v].description}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">{t.tone}</label>
              <select
                className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                value={settings.tone}
                onChange={(e) => updateSetting('tone', e.target.value)}
              >
                {Object.values(Tone).map((t) => (
                  <option key={t} value={t}>{t.split('(')[0].trim()}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Footer Links (Sidebar) */}
        <div className="p-4 bg-slate-800 border-t border-slate-700/50">
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-400 mb-6">
                <button onClick={() => { setActiveModal(ModalType.ABOUT); setIsSidebarOpen(false); }} className="hover:text-white text-start py-1">{t.aboutUs}</button>
                <button onClick={() => { setActiveModal(ModalType.USAGE); setIsSidebarOpen(false); }} className="hover:text-white text-start py-1">{t.usagePolicy}</button>
                <button onClick={() => { setActiveModal(ModalType.TERMS); setIsSidebarOpen(false); }} className="hover:text-white text-start py-1">{t.termsOfService}</button>
                <button onClick={() => { setActiveModal(ModalType.CONTACT); setIsSidebarOpen(false); }} className="hover:text-white text-start py-1">{t.contactUs}</button>
            </div>
            <p className="text-xs text-slate-600 text-center font-medium">{t.poweredBy}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto mb-24 md:mb-0">
        <div className="max-w-4xl mx-auto h-full">
            {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-slate-800/95 backdrop-blur-lg border-t border-slate-700 z-40 flex justify-around items-center p-2 pb-safe shadow-2xl">
        <button 
            onClick={() => onTabChange('tts')}
            className={`flex flex-col items-center p-2 rounded-xl flex-1 transition-all active:scale-95 ${activeTab === 'tts' ? 'text-indigo-400' : 'text-slate-400'}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wide">{t.ttsTab}</span>
        </button>
        
        <button 
            onClick={() => onTabChange('live')}
            className={`flex flex-col items-center p-2 rounded-xl flex-1 transition-all active:scale-95 ${activeTab === 'live' ? 'text-emerald-400' : 'text-slate-400'}`}
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wide">{t.liveTab}</span>
        </button>

        <button 
            onClick={() => setIsSidebarOpen(true)}
            className="flex flex-col items-center p-2 rounded-xl flex-1 text-slate-400 hover:text-white transition-all active:scale-95"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-wide">{t.settingsTab}</span>
        </button>
      </nav>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/60 z-30 md:hidden animate-fade-in backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Info Modals */}
      <Modal 
        isOpen={activeModal !== ModalType.NONE} 
        onClose={() => setActiveModal(ModalType.NONE)}
        title={getModalTitle()}
      >
        {renderModalContent()}
      </Modal>

    </div>
  );
};

export default Layout;