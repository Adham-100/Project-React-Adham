import { useEffect, useState } from 'react'
import { MdClose } from 'react-icons/md'
import { ToastContext } from './storeContexts'

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  function notify(message, type = 'success') {
    setToast({ id: Date.now(), message, type })
  }

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {toast && (
        <div
          className={`app-toast ${toast.type}`}
          role={toast.type === 'error' ? 'alert' : 'status'}
          aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
          key={toast.id}
        >
          <span>{toast.message}</span>
          <button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)}>
            <MdClose aria-hidden="true" />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  )
}