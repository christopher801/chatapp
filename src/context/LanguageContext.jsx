import { createContext, useContext, useState, useCallback } from 'react'
import ht from '../i18n/ht.json'
import es from '../i18n/es.json'

const translations = { ht, es }

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('chatapp_lang') || 'ht')

  const t = useCallback(
    (key) => translations[lang]?.[key] || key,
    [lang]
  )

  const switchLanguage = useCallback((newLang) => {
    setLang(newLang)
    localStorage.setItem('chatapp_lang', newLang)
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, t, switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
