import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import english from './languages/en.json'

type SupportedLanguage = 'en' | 'fr' | 'ar' | 'ch' | 'id'

const languageModuleLoaders: Record<
  Exclude<SupportedLanguage, 'en' | 'id'>,
  () => Promise<{ default: Record<string, string> }>
> = {
  fr: () => import('./languages/fr.json'),
  ar: () => import('./languages/ar.json'),
  ch: () => import('./languages/ch.json'),
}

const languageAlias: Record<SupportedLanguage, Exclude<SupportedLanguage, 'id'>> = {
  id: 'en',
  en: 'en',
  fr: 'fr',
  ar: 'ar',
  ch: 'ch',
}

const loadedLanguages = new Set<string>(['en'])

const ensureLanguageLoaded = async (language: string) => {
  const normalized = languageAlias[(language as SupportedLanguage) || 'en'] || 'en'
  if (loadedLanguages.has(normalized)) {
    return normalized
  }

  const loader = languageModuleLoaders[normalized as keyof typeof languageModuleLoaders]
  if (!loader) {
    return 'en'
  }

  const module = await loader()
  i18n.addResourceBundle(normalized, 'translation', module.default, true, true)
  loadedLanguages.add(normalized)
  return normalized
}

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: english,
      },
    },
    lng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  })

i18n.on('languageChanged', async (language) => {
  const normalizedLanguage = await ensureLanguageLoaded(language)
  if (normalizedLanguage !== language) {
    await i18n.changeLanguage(normalizedLanguage)
  }
})

export default i18n
