import {
  CheckCircle2,
  AlertCircle,
  Info,
  X,
} from 'lucide-react'

function AppAlert({
  message,
  type = 'info',
  onClose,
}) {
  if (!message) {
    return null
  }

  const icons = {
    success: <CheckCircle2 size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />,
  }

  return (
    <div className={`app-alert ${type}`}>
      <div className="app-alert-icon">
        {icons[type]}
      </div>

      <div className="app-alert-content">
        <p>{message}</p>
      </div>

      <button
        className="app-alert-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        <X size={17} />
      </button>
    </div>
  )
}

export default AppAlert