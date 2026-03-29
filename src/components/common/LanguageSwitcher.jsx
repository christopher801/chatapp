import { useLanguage } from '../../context/LanguageContext'

export default function LanguageSwitcher({ className = '' }) {
  const { lang, switchLanguage } = useLanguage()
  return (
    <div className={`d-flex gap-1 ${className}`}>
      {[['ht','🇭🇹'],['es','🇪🇸']].map(([code, flag]) => (
        <button key={code} onClick={() => switchLanguage(code)}
          title={code === 'ht' ? 'Kreyòl' : 'Español'}
          style={{
            background: lang === code ? 'rgba(255,255,255,0.25)' : 'transparent',
            border: 'none', borderRadius: '6px',
            padding: '3px 7px', cursor: 'pointer', fontSize: 14,
            transition: 'background 0.15s',
          }}>
          {flag}
        </button>
      ))}
    </div>
  )
}
