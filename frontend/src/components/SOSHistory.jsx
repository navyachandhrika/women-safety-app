import {
  useEffect,
  useState,
} from 'react'

import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Siren,
  Clock,
  Navigation,
  CheckCircle2,
} from 'lucide-react'

import AppAlert from './AppAlert'
import ConfirmModal from './ConfirmModal'

const API_URL =
  import.meta.env.VITE_API_BASE_URL

const GEOAPIFY_KEY =
  import.meta.env.VITE_GEOAPIFY_API_KEY

function SOSHistory({
  goBack,
  onLogout,
}) {
  const [alerts, setAlerts] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [
    locationNames,
    setLocationNames,
  ] = useState({})

  const [appAlert, setAppAlert] =
    useState({
      message: '',
      type: 'info',
    })

  const [
    confirmModal,
    setConfirmModal,
  ] = useState(null)

  const token =
    sessionStorage.getItem('token')

  useEffect(() => {
    fetchHistory()
  }, [])

  useEffect(() => {
    if (
      alerts.length > 0
    ) {
      loadReadableLocations(
        alerts
      )
    }
  }, [alerts])

  function showAlert(
    message,
    type = 'info'
  ) {
    setAppAlert({
      message,
      type,
    })

    setTimeout(() => {
      setAppAlert({
        message: '',
        type: 'info',
      })
    }, 4000)
  }

  /* =====================================================
     FETCH SOS HISTORY
  ===================================================== */

  async function fetchHistory() {
    try {
      setLoading(true)

      const response =
        await fetch(
          `${API_URL}/api/sos`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        )

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        showAlert(
          'Your session has expired. Please login again.',
          'error'
        )

        setTimeout(() => {
          onLogout()
        }, 1500)

        return
      }

      if (!response.ok) {
        showAlert(
          'Unable to load SOS history.',
          'error'
        )

        return
      }

      const data =
        await response.json()

      setAlerts(data)

    } catch (error) {
      console.error(error)

      showAlert(
        'Unable to connect to the server.',
        'error'
      )

    } finally {
      setLoading(false)
    }
  }

  /* =====================================================
     REVERSE GEOCODING
  ===================================================== */

  function getLocationKey(
    latitude,
    longitude
  ) {
    return (
      `${Number(latitude).toFixed(5)},` +
      `${Number(longitude).toFixed(5)}`
    )
  }

  async function reverseGeocode(
    latitude,
    longitude
  ) {
    if (
      latitude === null ||
      latitude === undefined ||
      longitude === null ||
      longitude === undefined
    ) {
      return 'Location unavailable'
    }

    if (!GEOAPIFY_KEY) {
      return 'Location name unavailable'
    }

    try {
      const params =
        new URLSearchParams({
          lat:
            String(latitude),

          lon:
            String(longitude),

          format:
            'json',

          lang:
            'en',

          apiKey:
            GEOAPIFY_KEY,
        })

      const response =
        await fetch(
          `https://api.geoapify.com/v1/geocode/reverse?${params.toString()}`
        )

      if (!response.ok) {
        throw new Error(
          'Reverse geocoding failed'
        )
      }

      const data =
        await response.json()

      const place =
        data.results?.[0]

      if (!place) {
        return 'Location name unavailable'
      }

      return (
        place.formatted ||
        place.address_line1 ||
        place.name ||
        place.city ||
        place.locality ||
        'Location name unavailable'
      )

    } catch (error) {
      console.error(
        'Reverse geocoding error:',
        error
      )

      return 'Location name unavailable'
    }
  }

  async function loadReadableLocations(
    sosAlerts
  ) {
    const newLocations = {}

    for (
      const alert of sosAlerts
    ) {
      if (
        alert.latitude === null ||
        alert.latitude === undefined ||
        alert.longitude === null ||
        alert.longitude === undefined
      ) {
        continue
      }

      const key =
        getLocationKey(
          alert.latitude,
          alert.longitude
        )

      if (
        locationNames[key]
      ) {
        continue
      }

      const readableLocation =
        await reverseGeocode(
          alert.latitude,
          alert.longitude
        )

      newLocations[key] =
        readableLocation
    }

    if (
      Object.keys(
        newLocations
      ).length > 0
    ) {
      setLocationNames(
        (current) => ({
          ...current,
          ...newLocations,
        })
      )
    }
  }

  /* =====================================================
     RESOLVE SOS
  ===================================================== */

  function askToResolve(alert) {
    setConfirmModal({
      alertId:
        alert.id,

      title:
        'Mark SOS as Resolved?',

      message:
        'Confirm that you are safe. This SOS alert will be marked as resolved.',

      confirmText:
        'Yes, I am Safe',

      type:
        'safe',
    })
  }

  async function resolveSOS(id) {
    setConfirmModal(null)

    try {
      const response =
        await fetch(
          `${API_URL}/api/sos/${id}/resolve`,
          {
            method:
              'PUT',

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        )

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        onLogout()
        return
      }

      if (!response.ok) {
        showAlert(
          'Unable to resolve SOS.',
          'error'
        )

        return
      }

      showAlert(
        'SOS resolved successfully.',
        'success'
      )

      fetchHistory()

    } catch (error) {
      console.error(error)

      showAlert(
        'Unable to connect to the server.',
        'error'
      )
    }
  }

  function handleConfirm() {
    if (
      confirmModal?.alertId
    ) {
      resolveSOS(
        confirmModal.alertId
      )
    }
  }

  /* =====================================================
     HELPER METHODS
  ===================================================== */

  function getReadableLocation(
    alert
  ) {
    if (
      alert.latitude === null ||
      alert.latitude === undefined ||
      alert.longitude === null ||
      alert.longitude === undefined
    ) {
      return 'Location unavailable'
    }

    const key =
      getLocationKey(
        alert.latitude,
        alert.longitude
      )

    return (
      locationNames[key] ||
      'Loading location...'
    )
  }

  function getCoordinates(
    alert
  ) {
    if (
      alert.latitude === null ||
      alert.latitude === undefined ||
      alert.longitude === null ||
      alert.longitude === undefined
    ) {
      return ''
    }

    return (
      `${Number(
        alert.latitude
      ).toFixed(5)}, ` +
      `${Number(
        alert.longitude
      ).toFixed(5)}`
    )
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="history-page">

      <div className="alert-container">
        <AppAlert
          message={
            appAlert.message
          }
          type={
            appAlert.type
          }
          onClose={() =>
            setAppAlert({
              message: '',
              type: 'info',
            })
          }
        />
      </div>

      {confirmModal && (
        <ConfirmModal
          title={
            confirmModal.title
          }
          message={
            confirmModal.message
          }
          confirmText={
            confirmModal.confirmText
          }
          cancelText="Cancel"
          type={
            confirmModal.type
          }
          onConfirm={
            handleConfirm
          }
          onCancel={() =>
            setConfirmModal(null)
          }
        />
      )}

      <header className="dashboard-header">

        <div>
          <h1>
            SOS History
          </h1>

          <p>
            View and manage your emergency alerts
          </p>
        </div>

        <button
          type="button"
          onClick={goBack}
        >
          <ArrowLeft size={16} />
          Back
        </button>

      </header>

      <main className="history-content">

        <div className="history-title-section">

          <div className="history-title-icon">
            <Siren size={22} />
          </div>

          <div>
            <h2>
              Emergency History
            </h2>

            <p>
              Review your previous and active SOS alerts.
            </p>
          </div>

        </div>

        {loading ? (

          <div className="empty-message">
            Loading SOS history...
          </div>

        ) : alerts.length === 0 ? (

          <div className="empty-message">

            <ShieldCheck size={36} />

            <h3>
              No SOS alerts
            </h3>

            <p>
              Your emergency history
              will appear here.
            </p>

          </div>

        ) : (

          <div className="history-list">

            {alerts.map((alert) => {

              const isActive =
                alert.status ===
                  'ACTIVE'

              const readableLocation =
                getReadableLocation(
                  alert
                )

              const coordinates =
                getCoordinates(
                  alert
                )

              return (

                <div
                  className={
                    `history-card ${
                      isActive
                        ? 'history-card-active'
                        : ''
                    }`
                  }
                  key={alert.id}
                >

                  <div className="history-card-header">

                    <div className="history-card-title">

                      <div
                        className={
                          `history-card-icon ${
                            isActive
                              ? 'active'
                              : 'resolved'
                          }`
                        }
                      >

                        {isActive ? (
                          <Siren size={20} />
                        ) : (
                          <CheckCircle2
                            size={20}
                          />
                        )}

                      </div>

                      <div>
                        <h3>
                          SOS Alert #{alert.id}
                        </h3>

                        <p>
                          Emergency alert record
                        </p>
                      </div>

                    </div>

                    <span
                      className={
                        `history-status ${
                          isActive
                            ? 'active'
                            : 'resolved'
                        }`
                      }
                    >
                      {alert.status}
                    </span>

                  </div>

                  <div className="history-info-grid">

                    {/* LOCATION */}

                    <div className="history-info-item">

                      <div className="history-info-icon">
                        <MapPin size={18} />
                      </div>

                      <div className="history-location-content">

                        <span>
                          Location
                        </span>

                        <strong>
                          {readableLocation}
                        </strong>

                        {coordinates && (
                          <small className="history-coordinates">
                            {coordinates}
                          </small>
                        )}

                      </div>

                    </div>

                    {/* CREATED TIME */}

                    <div className="history-info-item">

                      <div className="history-info-icon">
                        <Clock size={18} />
                      </div>

                      <div>
                        <span>
                          Created
                        </span>

                        <strong>
                          {new Date(
                            alert.createdAt
                          ).toLocaleString()}
                        </strong>
                      </div>

                    </div>

                  </div>

                  <div className="history-card-footer">

                    {alert.latitude !== null &&
                      alert.latitude !== undefined &&
                      alert.longitude !== null &&
                      alert.longitude !== undefined && (

                      <a
                        className="history-map-button"
                        href={
                          `https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation size={16} />

                        View on Map
                      </a>
                    )}

                    {isActive && (

                      <button
                        type="button"
                        className="history-safe-button"
                        onClick={() =>
                          askToResolve(
                            alert
                          )
                        }
                      >
                        <ShieldCheck size={16} />

                        I'm Safe
                      </button>

                    )}

                  </div>

                </div>
              )
            })}

          </div>

        )}

      </main>

    </div>
  )
}

export default SOSHistory