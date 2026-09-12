import {
  ShieldCheck,
  TriangleAlert,
  X,
} from 'lucide-react'

function ConfirmModal({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  onConfirm,
  onCancel,
}) {
  return (
    <div className="modal-overlay">

      <div className="confirm-modal">

        <button
          type="button"
          className="modal-close-button"
          onClick={onCancel}
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div
          className={`modal-icon ${
            type === 'safe'
              ? 'safe'
              : 'danger'
          }`}
        >
          {type === 'safe' ? (
            <ShieldCheck size={30} />
          ) : (
            <TriangleAlert size={30} />
          )}
        </div>

        <h2>
          {title}
        </h2>

        <p>
          {message}
        </p>

        <div className="modal-actions">

          <button
            type="button"
            className="modal-cancel-button"
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`modal-confirm-button ${
              type === 'safe'
                ? 'safe'
                : 'danger'
            }`}
            onClick={onConfirm}
          >
            {type === 'safe' && (
              <ShieldCheck size={17} />
            )}

            {confirmText}
          </button>

        </div>

      </div>

    </div>
  )
}

export default ConfirmModal