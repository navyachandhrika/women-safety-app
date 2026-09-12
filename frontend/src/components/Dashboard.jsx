import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  Users,
  Siren,
  MapPin,
  LogOut,
  ShieldCheck,
  Copy,
  Share2,
  MessageCircle,
  MessageSquare,
  Navigation,
  History,
} from 'lucide-react'

import AppAlert from './AppAlert'
import ConfirmModal from './ConfirmModal'
import './Dashboard.css'

const API_URL =
  import.meta.env.VITE_API_BASE_URL

const GEOAPIFY_KEY =
  import.meta.env.VITE_GEOAPIFY_API_KEY

function Dashboard({
  onLogout,
  onManageContacts,
  onViewHistory,
  onStartJourney,
}) {
  const [contacts, setContacts] =
    useState([])

  const [activeSOS, setActiveSOS] =
    useState(null)

  const [
    readableLocation,
    setReadableLocation,
  ] = useState('')

  const [alert, setAlert] =
    useState(null)

  const [
    confirmModal,
    setConfirmModal,
  ] = useState(null)

  const watchIdRef =
    useRef(null)

  const reverseTimerRef =
    useRef(null)

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadContacts()
    loadSOSHistory()

    return () => {
      stopLocationTracking()

      if (
        reverseTimerRef.current
      ) {
        clearTimeout(
          reverseTimerRef.current
        )
      }
    }
  }, [])

  /* =====================================================
     ACTIVE SOS CHANGES
  ===================================================== */

  useEffect(() => {
    if (
      activeSOS &&
      activeSOS.status === 'ACTIVE'
    ) {
      startLocationTracking(
        activeSOS.id
      )
    } else {
      stopLocationTracking()
    }
  }, [activeSOS?.id])

  /* =====================================================
     READABLE LOCATION
  ===================================================== */

  useEffect(() => {
    if (
      !activeSOS ||
      activeSOS.latitude === null ||
      activeSOS.latitude === undefined ||
      activeSOS.longitude === null ||
      activeSOS.longitude === undefined
    ) {
      setReadableLocation('')
      return
    }

    if (
      reverseTimerRef.current
    ) {
      clearTimeout(
        reverseTimerRef.current
      )
    }

    reverseTimerRef.current =
      setTimeout(() => {
        reverseGeocode(
          activeSOS.latitude,
          activeSOS.longitude
        )
      }, 700)

    return () => {
      if (
        reverseTimerRef.current
      ) {
        clearTimeout(
          reverseTimerRef.current
        )
      }
    }
  }, [
    activeSOS?.latitude,
    activeSOS?.longitude,
  ])

  /* =====================================================
     TOKEN
  ===================================================== */

  function getToken() {
    return sessionStorage.getItem(
      'token'
    )
  }

  function handleUnauthorized() {
    sessionStorage.removeItem(
      'token'
    )

    onLogout()
  }

  /* =====================================================
     ALERT
  ===================================================== */

  function showAlert(
    message,
    type = 'info'
  ) {
    setAlert({
      message,
      type,
    })
  }

  /* =====================================================
     LOAD CONTACTS
  ===================================================== */

  async function loadContacts() {
    const token = getToken()

    if (!token) {
      handleUnauthorized()
      return
    }

    try {
      const response =
        await fetch(
          `${API_URL}/api/contacts`,
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
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        return
      }

      const data =
        await response.json()

      setContacts(
        Array.isArray(data)
          ? data
          : []
      )

    } catch (error) {
      console.error(
        'Unable to load contacts:',
        error
      )
    }
  }

  /* =====================================================
     LOAD SOS HISTORY
  ===================================================== */

  async function loadSOSHistory() {
    const token = getToken()

    if (!token) {
      handleUnauthorized()
      return
    }

    try {
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
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        return
      }

      const data =
        await response.json()

      const sosList =
        Array.isArray(data)
          ? data
          : []

      const active =
        sosList.find(
          (sos) =>
            sos.status === 'ACTIVE'
        )

      setActiveSOS(
        active || null
      )

    } catch (error) {
      console.error(
        'Unable to load SOS history:',
        error
      )
    }
  }

  /* =====================================================
     CREATE SOS
  ===================================================== */

  function triggerSOS() {
    if (
      !navigator.geolocation
    ) {
      showAlert(
        'Your browser does not support location access.',
        'error'
      )

      return
    }

    navigator.geolocation
      .getCurrentPosition(
        (position) => {
          createSOS(
            position.coords.latitude,
            position.coords.longitude
          )
        },

        (error) => {
          console.error(error)

          showAlert(
            'Unable to access your location. Please allow location permission and try again.',
            'error'
          )
        },

        {
          enableHighAccuracy:
            true,

          timeout:
            15000,

          maximumAge:
            0,
        }
      )
  }

  async function createSOS(
    latitude,
    longitude
  ) {
    const token = getToken()

    if (!token) {
      handleUnauthorized()
      return
    }

    try {
      const response =
        await fetch(
          `${API_URL}/api/sos`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                latitude,
                longitude,
              }),
          }
        )

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized()
        return
      }

      let data = null

      try {
        data =
          await response.json()
      } catch {
        data = null
      }

      if (!response.ok) {
        showAlert(
          data?.message ||
            'Unable to create SOS alert.',
          'error'
        )

        return
      }

      setActiveSOS(data)

      showAlert(
        'Emergency SOS activated. Your location is now being tracked while this page has location access.',
        'success'
      )

    } catch (error) {
      console.error(error)

      showAlert(
        'Unable to connect to the server.',
        'error'
      )
    }
  }

  /* =====================================================
     LIVE LOCATION TRACKING
  ===================================================== */

  function startLocationTracking(
    sosId
  ) {
    if (
      !navigator.geolocation ||
      watchIdRef.current !== null
    ) {
      return
    }

    watchIdRef.current =
      navigator.geolocation
        .watchPosition(
          (position) => {
            updateSOSLocation(
              sosId,
              position.coords.latitude,
              position.coords.longitude
            )
          },

          (error) => {
            console.error(
              'Live location error:',
              error
            )
          },

          {
            enableHighAccuracy:
              true,

            maximumAge:
              5000,

            timeout:
              15000,
          }
        )
  }

  function stopLocationTracking() {
    if (
      watchIdRef.current !== null
    ) {
      navigator.geolocation
        .clearWatch(
          watchIdRef.current
        )

      watchIdRef.current =
        null
    }
  }

  async function updateSOSLocation(
    sosId,
    latitude,
    longitude
  ) {
    const token = getToken()

    if (!token) {
      return
    }

    try {
      const response =
        await fetch(
          `${API_URL}/api/sos/${sosId}/location`,
          {
            method: 'PUT',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                latitude,
                longitude,
              }),
          }
        )

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        return
      }

      const data =
        await response.json()

      setActiveSOS(
        (currentSOS) => {
          if (
            !currentSOS ||
            currentSOS.id !==
              data.id
          ) {
            return currentSOS
          }

          return {
            ...currentSOS,
            ...data,
          }
        }
      )

    } catch (error) {
      console.error(
        'Unable to update SOS location:',
        error
      )
    }
  }

  /* =====================================================
     REVERSE GEOCODING
  ===================================================== */

  async function reverseGeocode(
    latitude,
    longitude
  ) {
    if (!GEOAPIFY_KEY) {
      setReadableLocation(
        `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`
      )

      return
    }

    try {
      const params =
        new URLSearchParams({
          lat: String(latitude),
          lon: String(longitude),
          format: 'json',
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

      const location =
        data.results?.[0]

      if (location) {
        setReadableLocation(
          location.formatted ||
            location.address_line1 ||
            `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`
        )
      } else {
        setReadableLocation(
          `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`
        )
      }

    } catch (error) {
      console.error(
        'Reverse geocoding error:',
        error
      )

      setReadableLocation(
        `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`
      )
    }
  }

  /* =====================================================
     RESOLVE SOS
  ===================================================== */

  function requestResolveSOS() {
    if (!activeSOS) {
      return
    }

    setConfirmModal({
      title:
        "Confirm You're Safe",

      message:
        'This will resolve your active SOS alert and stop live location tracking.',

      confirmText:
        "Yes, I'm Safe",

      type:
        'safe',
    })
  }

  async function resolveSOS() {
    if (!activeSOS) {
      return
    }

    setConfirmModal(null)

    const token = getToken()

    if (!token) {
      handleUnauthorized()
      return
    }

    try {
      const response =
        await fetch(
          `${API_URL}/api/sos/${activeSOS.id}/resolve`,
          {
            method: 'PUT',

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
        handleUnauthorized()
        return
      }

      if (!response.ok) {
        showAlert(
          'Unable to resolve the SOS alert.',
          'error'
        )

        return
      }

      stopLocationTracking()

      setActiveSOS(null)

      setReadableLocation('')

      showAlert(
        'You have been marked safe. The SOS alert has been resolved.',
        'success'
      )

    } catch (error) {
      console.error(error)

      showAlert(
        'Unable to connect to the server.',
        'error'
      )
    }
  }

  /* =====================================================
     MAP URL
  ===================================================== */

  function getMapUrl() {
    if (
      !activeSOS ||
      activeSOS.latitude === null ||
      activeSOS.latitude ===
        undefined ||
      activeSOS.longitude === null ||
      activeSOS.longitude ===
        undefined
    ) {
      return ''
    }

    return (
      'https://www.google.com/maps?q=' +
      `${activeSOS.latitude},` +
      `${activeSOS.longitude}`
    )
  }

  /* =====================================================
     SOS MESSAGE
  ===================================================== */

  function getSOSMessage() {
    if (!activeSOS) {
      return ''
    }

    const mapUrl =
      getMapUrl()

    return (
      'Emergency! I need help. ' +
      'My current location: ' +
      mapUrl
    )
  }

  /* =====================================================
     COPY
  ===================================================== */

  async function copySOSMessage() {
    const message =
      getSOSMessage()

    if (!message) {
      return
    }

    try {
      await navigator.clipboard
        .writeText(message)

      showAlert(
        'Emergency message copied.',
        'success'
      )

    } catch (error) {
      console.error(error)

      showAlert(
        'Unable to copy the emergency message.',
        'error'
      )
    }
  }

  /* =====================================================
     SHARE
  ===================================================== */

  async function shareSOS() {
    const message =
      getSOSMessage()

    if (!message) {
      return
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title:
            'Emergency SOS',

          text:
            message,
        })

        return

      } catch (error) {
        if (
          error.name ===
          'AbortError'
        ) {
          return
        }

        console.error(error)
      }
    }

    await copySOSMessage()
  }

  /* =====================================================
     WHATSAPP
  ===================================================== */

  function shareWhatsApp() {
    const message =
      getSOSMessage()

    if (!message) {
      return
    }

    const url =
      'https://wa.me/?text=' +
      encodeURIComponent(
        message
      )

    window.open(
      url,
      '_blank',
      'noopener,noreferrer'
    )
  }

  /* =====================================================
     SMS
  ===================================================== */

  function shareSMS() {
    const message =
      getSOSMessage()

    if (!message) {
      return
    }

    window.location.href =
      'sms:?body=' +
      encodeURIComponent(
        message
      )
  }

  /* =====================================================
     LOGOUT
  ===================================================== */

  function handleLogoutClick() {
    stopLocationTracking()

    sessionStorage.removeItem(
      'token'
    )

    onLogout()
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="dashboard-page">

      {alert && (
        <AppAlert
          message={alert.message}
          type={alert.type}
          onClose={() =>
            setAlert(null)
          }
        />
      )}

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
            resolveSOS
          }
          onCancel={() =>
            setConfirmModal(null)
          }
        />
      )}

      {/* HEADER */}

      <header className="dashboard-header">

        <div>
          <h1>
            <ShieldCheck
              size={25}
            />

            Women Safety
          </h1>

          <p>
            Emergency Assistance
            System
          </p>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={
            handleLogoutClick
          }
        >
          <LogOut size={17} />

          Logout
        </button>

      </header>

      {/* CONTENT */}

      <main className="dashboard-content">

        {/* WELCOME */}

        <section className="welcome-section">

          <div>
            <span className="eyebrow">
              Safety Dashboard
            </span>

            <h2>
              Stay safe. Stay
              connected.
            </h2>

            <p>
              Quickly trigger an
              emergency alert, monitor a
              journey, manage trusted
              contacts and review your
              previous SOS alerts.
            </p>
          </div>

          <div className="welcome-icon">
            <ShieldCheck
              size={38}
            />
          </div>

        </section>

        {/* DASHBOARD CARDS */}

        <section className="dashboard-grid">

          {/* SOS */}

          <button
            type="button"
            className="dashboard-card emergency-card"
            onClick={triggerSOS}
            disabled={
              activeSOS !== null
            }
          >
            <div className="dashboard-card-icon">
              <Siren size={25} />
            </div>

            <div>
              <h3>
                Emergency SOS
              </h3>

              <p>
                Immediately create an
                emergency alert using
                your current location.
              </p>
            </div>
          </button>

          {/* JOURNEY */}

          <button
            type="button"
            className="dashboard-card"
            onClick={
              onStartJourney
            }
          >
            <div className="dashboard-card-icon">
              <Navigation
                size={25}
              />
            </div>

            <div>
              <h3>
                Journey Guardian
              </h3>

              <p>
                Track your journey and
                automatically trigger
                an SOS if you miss your
                safety check.
              </p>
            </div>
          </button>

          {/* CONTACTS */}

          <button
            type="button"
            className="dashboard-card"
            onClick={
              onManageContacts
            }
          >
            <div className="dashboard-card-icon">
              <Users size={25} />
            </div>

            <div>
              <h3>
                Emergency Contacts
              </h3>

              <p>
                Add and manage the
                people you trust during
                an emergency.
              </p>
            </div>
          </button>

          {/* HISTORY */}

          <button
            type="button"
            className="dashboard-card"
            onClick={
              onViewHistory
            }
          >
            <div className="dashboard-card-icon">
              <History size={25} />
            </div>

            <div>
              <h3>
                SOS History
              </h3>

              <p>
                Review previous
                emergency alerts,
                locations and their
                status.
              </p>
            </div>
          </button>

        </section>

        {/* ACTIVE SOS */}

        {activeSOS && (
          <section className="active-sos-panel">

            <div className="active-sos-heading">

              <div>
                <span className="sos-live-badge">
                  LIVE
                </span>

                <h2>
                  Emergency SOS Active
                </h2>
              </div>

              <Siren size={28} />

            </div>

            <p>
              Your emergency alert is
              active. Your latest
              location is being updated
              while this page can access
              your browser location.
            </p>

            <div className="active-location">

              <MapPin size={21} />

              <span>
                {readableLocation ||
                  'Finding your current location...'}
              </span>

            </div>

            {/* SHARE BUTTONS */}

            <div className="sos-actions">

              <button
                type="button"
                onClick={
                  copySOSMessage
                }
              >
                <Copy size={17} />

                Copy
              </button>

              <button
                type="button"
                onClick={
                  shareSOS
                }
              >
                <Share2 size={17} />

                Share
              </button>

              <button
                type="button"
                onClick={
                  shareWhatsApp
                }
              >
                <MessageCircle
                  size={17}
                />

                WhatsApp
              </button>

              <button
                type="button"
                onClick={
                  shareSMS
                }
              >
                <MessageSquare
                  size={17}
                />

                SMS
              </button>

            </div>

            {/* CONTACT COUNT */}

            <div className="contact-summary">

              <Users size={17} />

              <span>
                {contacts.length}{' '}
                {contacts.length === 1
                  ? 'emergency contact saved'
                  : 'emergency contacts saved'}
              </span>

            </div>

            {/* SAFE BUTTON */}

            <button
              type="button"
              className="safe-button"
              onClick={
                requestResolveSOS
              }
            >
              <ShieldCheck
                size={18}
              />

              I'm Safe
            </button>

          </section>
        )}

      </main>

    </div>
  )
}

export default Dashboard