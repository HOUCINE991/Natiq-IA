export enum Country {
  SAUDI_ARABIA = 'Saudi Arabia',
  UAE = 'United Arab Emirates',
  KUWAIT = 'Kuwait',
  QATAR = 'Qatar',
  BAHRAIN = 'Bahrain',
  OMAN = 'Oman',
  MOROCCO = 'Morocco',
  ALGERIA = 'Algeria',
  TUNISIA = 'Tunisia',
  SYRIA = 'Syria',
  LEBANON = 'Lebanon',
  JORDAN = 'Jordan',
  PALESTINE = 'Palestine',
  LIBYA = 'Libya'
}

export const COUNTRY_DIALECTS: Record<Country, string[]> = {
  [Country.SAUDI_ARABIA]: ['Najdi', 'Hijazi', 'Southern Saudi'],
  [Country.UAE]: ['Emirati'],
  [Country.KUWAIT]: ['Kuwaiti'],
  [Country.QATAR]: ['Qatari'],
  [Country.BAHRAIN]: ['Bahraini'],
  [Country.OMAN]: ['Omani'],
  [Country.MOROCCO]: ['Moroccan Darija (Urban)', 'Moroccan Darija (Rural)'],
  [Country.ALGERIA]: ['Algerian Darja'],
  [Country.TUNISIA]: ['Tunisian Arabic'],
  [Country.SYRIA]: ['Syrian (Damascene)', 'Syrian (Coastal)'],
  [Country.LEBANON]: ['Lebanese Arabic'],
  [Country.JORDAN]: ['Jordanian Arabic'],
  [Country.PALESTINE]: ['Palestinian Arabic'],
  [Country.LIBYA]: ['General Libyan (Darja)', 'Tripolitan', 'Cyrenaican', 'Fezzani']
};

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female'
}

export enum Tone {
  NEWS = 'News / Media (formal, professional)',
  ADVERTISING = 'Advertising / Marketing (persuasive, energetic)',
  STORYTELLING = 'Storytelling / Narrative (warm, expressive)',
  COMEDY = 'Comedy / Fun (playful)',
  CALM = 'Calm / Soothing',
  ENERGETIC = 'Energetic / Motivational'
}

export enum VoiceName {
  PUCK = 'Puck',
  CHARON = 'Charon',
  KORE = 'Kore',
  FENRIR = 'Fenrir',
  ZEPHYR = 'Zephyr',
  AOEDE = 'Aoede'
}

export enum Language {
  EN = 'en',
  AR = 'ar'
}

export enum ModalType {
  NONE = 'none',
  ABOUT = 'about',
  USAGE = 'usage',
  TERMS = 'terms',
  CONTACT = 'contact'
}

export interface VoiceSettings {
  country: Country;
  dialect: string;
  gender: Gender;
  tone: Tone;
  voiceName: VoiceName;
}