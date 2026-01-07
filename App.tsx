import React, { useState } from 'react';
import Layout from './components/Layout';
import TTSGenerator from './components/TTSGenerator';
import LiveConversation from './components/LiveConversation';
import { VoiceSettings, Country, COUNTRY_DIALECTS, Gender, Tone, VoiceName, Language } from './types';
import { translations } from './utils/translations';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tts' | 'live'>('tts');
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [settings, setSettings] = useState<VoiceSettings>({
    country: Country.SAUDI_ARABIA,
    dialect: COUNTRY_DIALECTS[Country.SAUDI_ARABIA][0],
    gender: Gender.MALE,
    tone: Tone.NEWS,
    voiceName: VoiceName.FENRIR
  });

  const t = translations[language];

  return (
    <Layout 
      settings={settings} 
      onSettingsChange={setSettings}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      language={language}
      onLanguageChange={setLanguage}
    >
      <div className="space-y-6 fade-in">
        <header className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
                {activeTab === 'tts' ? t.headerTitleTTS : t.headerTitleLive}
            </h2>
            <p className="text-slate-400">
                {activeTab === 'tts' ? t.headerDescTTS : t.headerDescLive}
            </p>
        </header>

        {activeTab === 'tts' ? (
            <TTSGenerator settings={settings} language={language} />
        ) : (
            <LiveConversation settings={settings} language={language} />
        )}
      </div>
    </Layout>
  );
};

export default App;