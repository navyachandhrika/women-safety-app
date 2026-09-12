import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'

import {
  ArrowLeft,
  Bike,
  Bus,
  Car,
  Clock3,
  Footprints,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
  Siren,
} from 'lucide-react'

const API_URL =
  import.meta.env.VITE_API_BASE_URL

const GEOAPIFY_KEY =
  import.meta.env.VITE_GEOAPIFY_API_KEY

/* =====================================================
   MAP AUTO ZOOM
===================================================== */

function MapBoundsController({
  sourceLatitude,
  sourceLongitude,
  destinationLatitude,
  destinationLongitude,
  routeCoordinates,
}) {
  const map = useMap()

  useEffect(() => {
    if (
      routeCoordinates &&
      routeCoordinates.length > 1
    ) {
      map.fitBounds(
        routeCoordinates,
        {
          padding: [40, 40],
        }
      )

      return
    }

    if (
      sourceLatitude !== null &&
      sourceLongitude !== null &&
      destinationLatitude !== null &&
      destinationLongitude !== null
    ) {
      map.fitBounds(
        [
          [
            sourceLatitude,
            sourceLongitude,
          ],

          [
            destinationLatitude,
            destinationLongitude,
          ],
        ],
        {
          padding: [40, 40],
        }
      )

      return
    }

    if (
      sourceLatitude !== null &&
      sourceLongitude !== null
    ) {
      map.setView(
        [
          sourceLatitude,
          sourceLongitude,
        ],
        15
      )
    }
  }, [
    map,
    sourceLatitude,
    sourceLongitude,
    destinationLatitude,
    destinationLongitude,
    routeCoordinates,
  ])

  return null
}

/* =====================================================
   MAP CLICK HANDLER
===================================================== */

function MapClickHandler({
  selectionMode,
  onMapSelect,
}) {
  useMapEvents({
    click(event) {
      const {
        lat,
        lng,
      } = event.latlng

      onMapSelect(
        lat,
        lng,
        selectionMode
      )
    },
  })

  return null
}

/* =====================================================
   MAIN COMPONENT
===================================================== */

function SafetyJourney({
  goBack,
  onLogout,
}) {
  /* =====================================================
     SOURCE
  ===================================================== */

  const [source, setSource] =
    useState('')

  const [
    sourceLatitude,
    setSourceLatitude,
  ] = useState(null)

  const [
    sourceLongitude,
    setSourceLongitude,
  ] = useState(null)

  const [
    sourceSuggestions,
    setSourceSuggestions,
  ] = useState([])

  const [
    showSourceSuggestions,
    setShowSourceSuggestions,
  ] = useState(false)

  const [
    sourceSearching,
    setSourceSearching,
  ] = useState(false)

  /* =====================================================
     DESTINATION
  ===================================================== */

  const [
    destination,
    setDestination,
  ] = useState('')

  const [
    destinationLatitude,
    setDestinationLatitude,
  ] = useState(null)

  const [
    destinationLongitude,
    setDestinationLongitude,
  ] = useState(null)

  const [
    destinationSuggestions,
    setDestinationSuggestions,
  ] = useState([])

  const [
    showDestinationSuggestions,
    setShowDestinationSuggestions,
  ] = useState(false)

  const [
    destinationSearching,
    setDestinationSearching,
  ] = useState(false)

  /* =====================================================
     MAP SELECTION MODE
  ===================================================== */

  const [
    mapSelectionMode,
    setMapSelectionMode,
  ] = useState('destination')

  const [
    mapSelecting,
    setMapSelecting,
  ] = useState(false)

  /* =====================================================
     TRAVEL
  ===================================================== */

  const [
    travelMode,
    setTravelMode,
  ] = useState('drive')

  const [
    distanceKm,
    setDistanceKm,
  ] = useState(null)

  const [
    durationMinutes,
    setDurationMinutes,
  ] = useState(null)

  const [
    routeLoading,
    setRouteLoading,
  ] = useState(false)

  const [
    routeCoordinates,
    setRouteCoordinates,
  ] = useState([])

  /* =====================================================
     JOURNEY
  ===================================================== */

  const [
    expectedArrivalTime,
    setExpectedArrivalTime,
  ] = useState('')

  const [
    activeJourney,
    setActiveJourney,
  ] = useState(null)

  const [
    message,
    setMessage,
  ] = useState('')

  const [
    error,
    setError,
  ] = useState('')

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    locating,
    setLocating,
  ] = useState(false)

  const [
    countdown,
    setCountdown,
  ] = useState(null)

  const watchIdRef =
    useRef(null)

  const trackedJourneyIdRef =
    useRef(null)

  const sourceTimerRef =
    useRef(null)

  const destinationTimerRef =
    useRef(null)

  const sourceAbortRef =
    useRef(null)

  const destinationAbortRef =
    useRef(null)

  /* =====================================================
     LOAD ACTIVE JOURNEY
  ===================================================== */

  useEffect(() => {
    loadActiveJourney()

    const pollingTimer =
      setInterval(
        loadActiveJourney,
        5000
      )

    return () => {
      clearInterval(
        pollingTimer
      )

      stopLocationTracking()

      if (
        sourceTimerRef.current
      ) {
        clearTimeout(
          sourceTimerRef.current
        )
      }

      if (
        destinationTimerRef.current
      ) {
        clearTimeout(
          destinationTimerRef.current
        )
      }

      sourceAbortRef.current?.abort()

      destinationAbortRef.current?.abort()
    }
  }, [])

  /* =====================================================
     ROUTE RECALCULATION
  ===================================================== */

  useEffect(() => {
    if (
      sourceLatitude !== null &&
      sourceLongitude !== null &&
      destinationLatitude !== null &&
      destinationLongitude !== null
    ) {
      calculateRoute()
    } else {
      setDistanceKm(null)
      setDurationMinutes(null)
      setRouteCoordinates([])
    }
  }, [
    sourceLatitude,
    sourceLongitude,
    destinationLatitude,
    destinationLongitude,
    travelMode,
  ])

  /* =====================================================
     COUNTDOWN
  ===================================================== */

  useEffect(() => {
    if (
      !activeJourney ||
      activeJourney.status !==
        'CHECK_IN_REQUIRED' ||
      !activeJourney.graceDeadline
    ) {
      setCountdown(null)
      return
    }

    function updateCountdown() {
      const deadline =
        new Date(
          activeJourney.graceDeadline
        ).getTime()

      const remaining =
        deadline - Date.now()

      if (remaining <= 0) {
        setCountdown(0)
        return
      }

      setCountdown(
        Math.ceil(
          remaining / 1000
        )
      )
    }

    updateCountdown()

    const timer =
      setInterval(
        updateCountdown,
        1000
      )

    return () => {
      clearInterval(timer)
    }
  }, [activeJourney])

  /* =====================================================
     ACTIVE JOURNEY
  ===================================================== */

  async function loadActiveJourney() {
    const token =
      sessionStorage.getItem(
        'token'
      )

    if (!token) {
      onLogout()
      return
    }

    try {
      const response =
        await fetch(
          `${API_URL}/api/safety-journeys/active`,
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
        onLogout()
        return
      }

      if (
        response.status === 204
      ) {
        setActiveJourney(null)

        stopLocationTracking()

        return
      }

      if (!response.ok) {
        return
      }

      const data =
        await response.json()

      setActiveJourney(data)

      if (
        data.status === 'ACTIVE' ||
        data.status ===
          'CHECK_IN_REQUIRED'
      ) {
        startLocationTracking(
          data.id
        )
      }

    } catch (err) {
      console.error(err)
    }
  }

  /* =====================================================
     SEARCH BIAS
  ===================================================== */

  function getSearchBias(type) {
    if (
      type === 'destination' &&
      sourceLatitude !== null &&
      sourceLongitude !== null
    ) {
      return (
        `proximity:` +
        `${sourceLongitude},` +
        `${sourceLatitude}` +
        `|countrycode:in`
      )
    }

    if (
      type === 'source' &&
      destinationLatitude !== null &&
      destinationLongitude !== null
    ) {
      return (
        `proximity:` +
        `${destinationLongitude},` +
        `${destinationLatitude}` +
        `|countrycode:in`
      )
    }

    return 'countrycode:in'
  }

  /* =====================================================
     GEOAPIFY REQUEST
  ===================================================== */

  async function fetchGeoapify(
    endpoint,
    params,
    signal
  ) {
    const response =
      await fetch(
        `https://api.geoapify.com/v1/geocode/${endpoint}?${params.toString()}`,
        {
          signal,
        }
      )

    if (!response.ok) {
      throw new Error(
        `Geoapify ${endpoint} failed`
      )
    }

    const data =
      await response.json()

    return data.results || []
  }

  /* =====================================================
     REMOVE DUPLICATES
  ===================================================== */

  function mergeLocationResults(
    resultGroups
  ) {
    const allResults =
      resultGroups.flat()

    const unique = []

    const seen =
      new Set()

    for (
      const place of allResults
    ) {
      if (
        place.lat === undefined ||
        place.lon === undefined
      ) {
        continue
      }

      const key =
        place.place_id ||
        `${Number(
          place.lat
        ).toFixed(5)}-${Number(
          place.lon
        ).toFixed(5)}-${
          place.formatted ||
          place.name ||
          ''
        }`

      if (!seen.has(key)) {
        seen.add(key)

        unique.push(place)
      }
    }

    return unique.slice(
      0,
      20
    )
  }

  /* =====================================================
     SEARCH LOCATION
  ===================================================== */

  async function searchLocations(
    text,
    type
  ) {
    const searchText =
      text.trim()

    if (!GEOAPIFY_KEY) {
      setError(
        'Geoapify API key is missing in frontend/.env'
      )

      return
    }

    if (
      searchText.length < 2
    ) {
      if (
        type === 'source'
      ) {
        setSourceSuggestions([])

        setShowSourceSuggestions(
          false
        )
      } else {
        setDestinationSuggestions(
          []
        )

        setShowDestinationSuggestions(
          false
        )
      }

      return
    }

    if (
      type === 'source'
    ) {
      sourceAbortRef.current?.abort()

      sourceAbortRef.current =
        new AbortController()

      setSourceSearching(true)
    } else {
      destinationAbortRef.current
        ?.abort()

      destinationAbortRef.current =
        new AbortController()

      setDestinationSearching(
        true
      )
    }

    const signal =
      type === 'source'
        ? sourceAbortRef.current
            .signal
        : destinationAbortRef.current
            .signal

    try {
      setError('')

      const commonParams = {
        text:
          searchText,

        format:
          'json',

        lang:
          'en',

        limit:
          '12',

        bias:
          getSearchBias(type),

        apiKey:
          GEOAPIFY_KEY,
      }

      const autocompleteParams =
        new URLSearchParams(
          commonParams
        )

      const generalParams =
        new URLSearchParams({
          ...commonParams,
          limit:
            '15',
        })

      const amenityParams =
        new URLSearchParams({
          ...commonParams,
          limit:
            '15',

          type:
            'amenity',
        })

      const results =
        await Promise.allSettled([
          fetchGeoapify(
            'autocomplete',
            autocompleteParams,
            signal
          ),

          fetchGeoapify(
            'search',
            generalParams,
            signal
          ),

          fetchGeoapify(
            'search',
            amenityParams,
            signal
          ),
        ])

      const successfulGroups =
        results
          .filter(
            (result) =>
              result.status ===
              'fulfilled'
          )
          .map(
            (result) =>
              result.value
          )

      const mergedResults =
        mergeLocationResults(
          successfulGroups
        )

      if (
        type === 'source'
      ) {
        setSourceSuggestions(
          mergedResults
        )

        setShowSourceSuggestions(
          true
        )
      } else {
        setDestinationSuggestions(
          mergedResults
        )

        setShowDestinationSuggestions(
          true
        )
      }

    } catch (err) {
      if (
        err.name ===
        'AbortError'
      ) {
        return
      }

      console.error(err)

      setError(
        'Unable to search locations.'
      )

    } finally {
      if (
        type === 'source'
      ) {
        setSourceSearching(false)
      } else {
        setDestinationSearching(
          false
        )
      }
    }
  }

  /* =====================================================
     SEARCH MORE
  ===================================================== */

  async function searchMoreLocations(
    text,
    type
  ) {
    const searchText =
      text.trim()

    if (
      searchText.length < 2
    ) {
      return
    }

    if (!GEOAPIFY_KEY) {
      setError(
        'Geoapify API key is missing.'
      )

      return
    }

    if (
      type === 'source'
    ) {
      setSourceSearching(true)
    } else {
      setDestinationSearching(
        true
      )
    }

    try {
      setError('')

      const generalParams =
        new URLSearchParams({
          text:
            searchText,

          format:
            'json',

          lang:
            'en',

          limit:
            '25',

          bias:
            getSearchBias(type),

          apiKey:
            GEOAPIFY_KEY,
        })

      const amenityParams =
        new URLSearchParams({
          text:
            searchText,

          format:
            'json',

          lang:
            'en',

          limit:
            '25',

          type:
            'amenity',

          bias:
            getSearchBias(type),

          apiKey:
            GEOAPIFY_KEY,
        })

      const results =
        await Promise.allSettled([
          fetchGeoapify(
            'search',
            generalParams
          ),

          fetchGeoapify(
            'search',
            amenityParams
          ),
        ])

      const groups =
        results
          .filter(
            (result) =>
              result.status ===
              'fulfilled'
          )
          .map(
            (result) =>
              result.value
          )

      const merged =
        mergeLocationResults(
          groups
        )

      if (
        type === 'source'
      ) {
        setSourceSuggestions(
          merged
        )

        setShowSourceSuggestions(
          true
        )
      } else {
        setDestinationSuggestions(
          merged
        )

        setShowDestinationSuggestions(
          true
        )
      }

      if (
        merged.length === 0
      ) {
        setError(
          'No matching place was found. Try the full name, nearby area, city or postcode.'
        )
      }

    } catch (err) {
      console.error(err)

      setError(
        'Unable to search for this location.'
      )

    } finally {
      if (
        type === 'source'
      ) {
        setSourceSearching(false)
      } else {
        setDestinationSearching(
          false
        )
      }
    }
  }

  /* =====================================================
     INPUT CHANGES
  ===================================================== */

  function handleSourceChange(
    event
  ) {
    const value =
      event.target.value

    setSource(value)

    setSourceLatitude(null)
    setSourceLongitude(null)

    setDistanceKm(null)
    setDurationMinutes(null)
    setRouteCoordinates([])

    if (
      sourceTimerRef.current
    ) {
      clearTimeout(
        sourceTimerRef.current
      )
    }

    sourceTimerRef.current =
      setTimeout(() => {
        searchLocations(
          value,
          'source'
        )
      }, 400)
  }

  function handleDestinationChange(
    event
  ) {
    const value =
      event.target.value

    setDestination(value)

    setDestinationLatitude(null)

    setDestinationLongitude(null)

    setDistanceKm(null)

    setDurationMinutes(null)

    setRouteCoordinates([])

    if (
      destinationTimerRef.current
    ) {
      clearTimeout(
        destinationTimerRef.current
      )
    }

    destinationTimerRef.current =
      setTimeout(() => {
        searchLocations(
          value,
          'destination'
        )
      }, 400)
  }

  /* =====================================================
     PLACE NAME
  ===================================================== */

  function getPlaceName(
    place
  ) {
    return (
      place.formatted ||
      place.address_line1 ||
      place.name ||
      place.city ||
      place.locality ||
      'Selected Location'
    )
  }

  /* =====================================================
     SELECT SOURCE
  ===================================================== */

  function selectSource(
    place
  ) {
    setSource(
      getPlaceName(place)
    )

    setSourceLatitude(
      Number(place.lat)
    )

    setSourceLongitude(
      Number(place.lon)
    )

    setSourceSuggestions([])

    setShowSourceSuggestions(
      false
    )

    setError('')
  }

  /* =====================================================
     SELECT DESTINATION
  ===================================================== */

  function selectDestination(
    place
  ) {
    setDestination(
      getPlaceName(place)
    )

    setDestinationLatitude(
      Number(place.lat)
    )

    setDestinationLongitude(
      Number(place.lon)
    )

    setDestinationSuggestions(
      []
    )

    setShowDestinationSuggestions(
      false
    )

    setError('')
  }

  /* =====================================================
     CURRENT LOCATION
  ===================================================== */

  function useCurrentLocation() {
    setError('')
    setMessage('')

    if (
      !navigator.geolocation
    ) {
      setError(
        'Geolocation is not supported by this browser.'
      )

      return
    }

    if (!GEOAPIFY_KEY) {
      setError(
        'Geoapify API key is missing.'
      )

      return
    }

    setLocating(true)

    navigator.geolocation
      .getCurrentPosition(
        async (position) => {
          const latitude =
            position.coords.latitude

          const longitude =
            position.coords.longitude

          setSourceLatitude(
            latitude
          )

          setSourceLongitude(
            longitude
          )

          try {
            const params =
              new URLSearchParams({
                lat:
                  String(latitude),

                lon:
                  String(longitude),

                format:
                  'json',

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

            const result =
              data.results?.[0]

            if (result) {
              setSource(
                result.formatted ||
                result.address_line1 ||
                'Current Location'
              )
            } else {
              setSource(
                'Current Location'
              )
            }

            setMessage(
              'Current location selected.'
            )

          } catch (err) {
            console.error(err)

            setSource(
              'Current Location'
            )

            setMessage(
              'Current location selected.'
            )

          } finally {
            setLocating(false)
          }
        },

        (geoError) => {
          console.error(
            geoError
          )

          setError(
            'Unable to access your current location. Please allow location permission.'
          )

          setLocating(false)
        },

        {
          enableHighAccuracy:
            true,

          timeout:
            15000,

          maximumAge:
            5000,
        }
      )
  }

  /* =====================================================
     MAP CLICK SELECTION
  ===================================================== */

  async function handleMapLocationSelect(
    latitude,
    longitude,
    type
  ) {
    setError('')
    setMessage('')
    setMapSelecting(true)

    let locationName =
      `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`

    try {
      if (GEOAPIFY_KEY) {
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

        if (response.ok) {
          const data =
            await response.json()

          const place =
            data.results?.[0]

          if (place) {
            locationName =
              place.formatted ||
              place.address_line1 ||
              place.name ||
              locationName
          }
        }
      }

      if (
        type === 'source'
      ) {
        setSource(
          locationName
        )

        setSourceLatitude(
          latitude
        )

        setSourceLongitude(
          longitude
        )

        setSourceSuggestions([])

        setShowSourceSuggestions(
          false
        )

        setMessage(
          'Starting point selected from the map.'
        )
      } else {
        setDestination(
          locationName
        )

        setDestinationLatitude(
          latitude
        )

        setDestinationLongitude(
          longitude
        )

        setDestinationSuggestions(
          []
        )

        setShowDestinationSuggestions(
          false
        )

        setMessage(
          'Destination selected from the map.'
        )
      }

    } catch (err) {
      console.error(
        'Map reverse geocoding failed:',
        err
      )

      if (
        type === 'source'
      ) {
        setSource(
          locationName
        )

        setSourceLatitude(
          latitude
        )

        setSourceLongitude(
          longitude
        )
      } else {
        setDestination(
          locationName
        )

        setDestinationLatitude(
          latitude
        )

        setDestinationLongitude(
          longitude
        )
      }

    } finally {
      setMapSelecting(false)
    }
  }

  /* =====================================================
     GEOJSON -> LEAFLET ROUTE
  ===================================================== */

  function extractRouteCoordinates(
    geometry
  ) {
    if (!geometry) {
      return []
    }

    if (
      geometry.type ===
      'LineString'
    ) {
      return geometry.coordinates
        .map(
          (coordinate) => [
            coordinate[1],
            coordinate[0],
          ]
        )
    }

    if (
      geometry.type ===
      'MultiLineString'
    ) {
      return geometry.coordinates
        .flatMap(
          (line) =>
            line.map(
              (coordinate) => [
                coordinate[1],
                coordinate[0],
              ]
            )
        )
    }

    return []
  }

  /* =====================================================
     CALCULATE ROUTE
  ===================================================== */

  async function calculateRoute() {
    if (
      sourceLatitude === null ||
      sourceLongitude === null ||
      destinationLatitude === null ||
      destinationLongitude === null
    ) {
      return
    }

    if (!GEOAPIFY_KEY) {
      return
    }

    setRouteLoading(true)

    setError('')

    try {
      const waypoints =
        `${sourceLatitude},${sourceLongitude}` +
        `|` +
        `${destinationLatitude},${destinationLongitude}`

      const params =
        new URLSearchParams({
          waypoints,

          mode:
            travelMode,

          apiKey:
            GEOAPIFY_KEY,
        })

      const response =
        await fetch(
          `https://api.geoapify.com/v1/routing?${params.toString()}`
        )

      if (!response.ok) {
        throw new Error(
          'Unable to calculate route'
        )
      }

      const data =
        await response.json()

      const route =
        data.features?.[0]

      if (!route) {
        setDistanceKm(null)

        setDurationMinutes(null)

        setRouteCoordinates([])

        setError(
          'No route was found between these locations.'
        )

        return
      }

      const properties =
        route.properties

      const distanceMeters =
        properties.distance

      const durationSeconds =
        properties.time

      const km =
        distanceMeters / 1000

      const minutes =
        Math.ceil(
          durationSeconds / 60
        )

      setDistanceKm(
        km.toFixed(1)
      )

      setDurationMinutes(
        minutes
      )

      const coordinates =
        extractRouteCoordinates(
          route.geometry
        )

      setRouteCoordinates(
        coordinates
      )

      setAutomaticArrivalTime(
        minutes
      )

    } catch (err) {
      console.error(err)

      setRouteCoordinates([])

      setError(
        'Unable to calculate travel time for this route.'
      )

    } finally {
      setRouteLoading(false)
    }
  }

  /* =====================================================
     ARRIVAL TIME
  ===================================================== */

  function setAutomaticArrivalTime(
    minutes
  ) {
    const arrival =
      new Date(
        Date.now() +
        minutes *
          60 *
          1000
      )

    const year =
      arrival.getFullYear()

    const month =
      String(
        arrival.getMonth() + 1
      ).padStart(
        2,
        '0'
      )

    const day =
      String(
        arrival.getDate()
      ).padStart(
        2,
        '0'
      )

    const hours =
      String(
        arrival.getHours()
      ).padStart(
        2,
        '0'
      )

    const minutesPart =
      String(
        arrival.getMinutes()
      ).padStart(
        2,
        '0'
      )

    setExpectedArrivalTime(
      `${year}-${month}-${day}T${hours}:${minutesPart}`
    )
  }

  /* =====================================================
     LOCATION TRACKING
  ===================================================== */

  function startLocationTracking(
    journeyId
  ) {
    if (
      !navigator.geolocation
    ) {
      return
    }

    if (
      watchIdRef.current !== null &&
      trackedJourneyIdRef.current ===
        journeyId
    ) {
      return
    }

    stopLocationTracking()

    trackedJourneyIdRef.current =
      journeyId

    watchIdRef.current =
      navigator.geolocation
        .watchPosition(
          (position) => {
            updateJourneyLocation(
              journeyId,
              position.coords.latitude,
              position.coords.longitude
            )
          },

          (geoError) => {
            console.error(
              geoError
            )
          },

          {
            enableHighAccuracy:
              true,

            maximumAge:
              10000,

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

    trackedJourneyIdRef.current =
      null
  }

  async function updateJourneyLocation(
    journeyId,
    latitude,
    longitude
  ) {
    const token =
      sessionStorage.getItem(
        'token'
      )

    if (!token) {
      return
    }

    try {
      const response =
        await fetch(
          `${API_URL}/api/safety-journeys/${journeyId}/location`,
          {
            method:
              'PUT',

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
        onLogout()
        return
      }

      if (
        response.ok
      ) {
        const data =
          await response.json()

        setActiveJourney(
          (current) => {
            if (
              !current ||
              current.id !==
                data.id
            ) {
              return current
            }

            return {
              ...current,

              lastLatitude:
                data.lastLatitude,

              lastLongitude:
                data.lastLongitude,
            }
          }
        )
      }

    } catch (err) {
      console.error(err)
    }
  }

  /* =====================================================
     START JOURNEY
  ===================================================== */

  function handleStartJourney(
    event
  ) {
    event.preventDefault()

    setError('')
    setMessage('')

    if (
      !source.trim() ||
      sourceLatitude === null ||
      sourceLongitude === null
    ) {
      setError(
        'Please select a starting location from the suggestions, map, or use your current location.'
      )

      return
    }

    if (
      !destination.trim() ||
      destinationLatitude === null ||
      destinationLongitude === null
    ) {
      setError(
        'Please select a destination from the suggestions or map.'
      )

      return
    }

    if (
      !expectedArrivalTime
    ) {
      setError(
        'Expected arrival time is required.'
      )

      return
    }

    if (
      new Date(
        expectedArrivalTime
      ) <= new Date()
    ) {
      setError(
        'Expected arrival time must be in the future.'
      )

      return
    }

    setLoading(true)

    createJourney(
      sourceLatitude,
      sourceLongitude
    ).finally(() => {
      setLoading(false)
    })
  }

  async function createJourney(
    latitude,
    longitude
  ) {
    const token =
      sessionStorage.getItem(
        'token'
      )

    if (!token) {
      onLogout()
      return
    }

    try {
      const response =
        await fetch(
          `${API_URL}/api/safety-journeys`,
          {
            method:
              'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                destination:
                  destination.trim(),

                expectedArrivalTime,

                latitude,

                longitude,
              }),
          }
        )

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        onLogout()
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
        setError(
          data?.message ||
          'Unable to start safety journey.'
        )

        return
      }

      setActiveJourney(data)

      setMessage(
        'Safety journey started successfully.'
      )

      startLocationTracking(
        data.id
      )

    } catch (err) {
      console.error(err)

      setError(
        'Unable to connect to the server.'
      )
    }
  }

  /* =====================================================
     MARK SAFE
  ===================================================== */

  async function markSafe() {
    if (!activeJourney) {
      return
    }

    const token =
      sessionStorage.getItem(
        'token'
      )

    try {
      const response =
        await fetch(
          `${API_URL}/api/safety-journeys/${activeJourney.id}/safe`,
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
        setError(
          'Unable to complete journey.'
        )

        return
      }

      stopLocationTracking()

      setActiveJourney(null)

      setMessage(
        'Journey completed. You are marked safe.'
      )

    } catch (err) {
      console.error(err)

      setError(
        'Unable to connect to the server.'
      )
    }
  }

  /* =====================================================
     TRIGGER SOS
  ===================================================== */

  async function triggerSOSNow() {
    if (!activeJourney) {
      return
    }

    const token =
      sessionStorage.getItem(
        'token'
      )

    try {
      const response =
        await fetch(
          `${API_URL}/api/safety-journeys/${activeJourney.id}/sos`,
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
        setError(
          'Unable to trigger SOS.'
        )

        return
      }

      stopLocationTracking()

      setActiveJourney(null)

      setMessage(
        'Emergency SOS has been triggered.'
      )

    } catch (err) {
      console.error(err)

      setError(
        'Unable to connect to the server.'
      )
    }
  }

  /* =====================================================
     COUNTDOWN FORMAT
  ===================================================== */

  function formatCountdown(
    seconds
  ) {
    if (
      seconds === null
    ) {
      return ''
    }

    const safeSeconds =
      Math.max(
        0,
        seconds
      )

    const minutes =
      Math.floor(
        safeSeconds / 60
      )

    const remainingSeconds =
      safeSeconds % 60

    return (
      `${minutes}:` +
      String(
        remainingSeconds
      ).padStart(
        2,
        '0'
      )
    )
  }

  /* =====================================================
     TRANSPORT OPTIONS
  ===================================================== */

  const transportOptions = [
    {
      label:
        'Car',

      mode:
        'drive',

      icon:
        <Car size={21} />,
    },

    {
      label:
        'Auto',

      mode:
        'scooter',

      icon:
        <Navigation size={21} />,
    },

    {
      label:
        'Bike',

      mode:
        'motorcycle',

      icon:
        <Bike size={21} />,
    },

    {
      label:
        'Bus',

      mode:
        'bus',

      icon:
        <Bus size={21} />,
    },

    {
      label:
        'Walking',

      mode:
        'walk',

      icon:
        <Footprints size={21} />,
    },
  ]

  /* =====================================================
     SUGGESTION ITEM
  ===================================================== */

  function renderSuggestion(
    place,
    type,
    index
  ) {
    const title =
      place.name ||
      place.address_line1 ||
      place.city ||
      place.locality ||
      place.postcode ||
      'Location'

    const details =
      place.formatted ||
      place.address_line2 ||
      [
        place.city,
        place.state,
        place.postcode,
      ]
        .filter(Boolean)
        .join(', ')

    return (
      <button
        key={
          place.place_id ||
          `${place.lat}-${place.lon}-${index}`
        }
        type="button"
        className="location-suggestion-item"
        onClick={() => {
          if (
            type === 'source'
          ) {
            selectSource(place)
          } else {
            selectDestination(
              place
            )
          }
        }}
      >
        <MapPin size={17} />

        <div>
          <strong>
            {title}
          </strong>

          <span>
            {details}
          </span>
        </div>
      </button>
    )
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="journey-page">

      <div className="journey-header">

        <button
          type="button"
          className="secondary-button"
          onClick={goBack}
        >
          <ArrowLeft size={18} />

          Back
        </button>

        <div>
          <h1>
            Journey Guardian
          </h1>

          <p>
            Plan and monitor your
            journey safely.
          </p>
        </div>

      </div>

      {message && (
        <div className="form-alert success">
          {message}
        </div>
      )}

      {error && (
        <div className="form-alert error">
          {error}
        </div>
      )}

      {!activeJourney ? (

        <div className="journey-card">

          <div className="journey-icon">
            <Navigation size={34} />
          </div>

          <h2>
            Plan Your Safety Journey
          </h2>

          <p className="journey-description">
            Choose your starting
            location and destination.
            You can search for a place,
            use your current location,
            or select a point directly
            from the map.
          </p>

          <form
            className="journey-form"
            onSubmit={
              handleStartJourney
            }
          >

            {/* FROM */}

            <div className="journey-location-row">

              <div className="route-marker source-marker">

                <div className="route-dot">
                </div>

                <div className="route-line">
                </div>

              </div>

              <div className="journey-location-content">

                <label>
                  From
                </label>

                <div className="location-autocomplete">

                  <div className="input-with-icon">

                    <MapPin size={18} />

                    <input
                      type="text"
                      value={source}
                      onChange={
                        handleSourceChange
                      }
                      onFocus={() => {
                        if (
                          sourceSuggestions.length >
                          0
                        ) {
                          setShowSourceSuggestions(
                            true
                          )
                        }
                      }}
                      placeholder="Enter starting location"
                      autoComplete="off"
                    />

                  </div>

                  {sourceSearching && (
                    <div className="location-searching">
                      Searching locations...
                    </div>
                  )}

                  {showSourceSuggestions &&
                    sourceSuggestions.length >
                      0 && (

                    <div className="location-suggestions">

                      {sourceSuggestions.map(
                        (
                          place,
                          index
                        ) =>
                          renderSuggestion(
                            place,
                            'source',
                            index
                          )
                      )}

                      <button
                        type="button"
                        className="exact-location-search"
                        onClick={() =>
                          searchMoreLocations(
                            source,
                            'source'
                          )
                        }
                      >
                        <Search size={16} />

                        Search more results
                      </button>

                    </div>
                  )}

                </div>

                <button
                  type="button"
                  className="current-location-button"
                  onClick={
                    useCurrentLocation
                  }
                  disabled={
                    locating
                  }
                >
                  <LocateFixed
                    size={17}
                  />

                  {locating
                    ? 'Finding Location...'
                    : 'Use Current Location'}
                </button>

              </div>

            </div>

            {/* DESTINATION */}

            <div className="journey-location-row">

              <div className="route-marker destination-marker">

                <div className="route-dot">
                </div>

              </div>

              <div className="journey-location-content">

                <label>
                  To
                </label>

                <div className="location-autocomplete">

                  <div className="input-with-icon">

                    <Navigation
                      size={18}
                    />

                    <input
                      type="text"
                      value={
                        destination
                      }
                      onChange={
                        handleDestinationChange
                      }
                      onFocus={() => {
                        if (
                          destinationSuggestions.length >
                          0
                        ) {
                          setShowDestinationSuggestions(
                            true
                          )
                        }
                      }}
                      placeholder="Search destination"
                      autoComplete="off"
                    />

                  </div>

                  {destinationSearching && (
                    <div className="location-searching">
                      Searching locations...
                    </div>
                  )}

                  {showDestinationSuggestions &&
                    destinationSuggestions.length >
                      0 && (

                    <div className="location-suggestions">

                      {destinationSuggestions.map(
                        (
                          place,
                          index
                        ) =>
                          renderSuggestion(
                            place,
                            'destination',
                            index
                          )
                      )}

                      <button
                        type="button"
                        className="exact-location-search"
                        onClick={() =>
                          searchMoreLocations(
                            destination,
                            'destination'
                          )
                        }
                      >
                        <Search size={16} />

                        Search more results
                      </button>

                    </div>
                  )}

                </div>

              </div>

            </div>

            {/* TRANSPORT */}

            <div className="travel-mode-section">

              <label>
                How are you travelling?
              </label>

              <div className="travel-mode-grid">

                {transportOptions.map(
                  (option) => (

                    <button
                      key={
                        option.mode
                      }
                      type="button"
                      className={
                        `travel-mode-button ${
                          travelMode ===
                          option.mode
                            ? 'selected'
                            : ''
                        }`
                      }
                      onClick={() =>
                        setTravelMode(
                          option.mode
                        )
                      }
                    >
                      {option.icon}

                      <span>
                        {option.label}
                      </span>

                    </button>

                  )
                )}

              </div>

            </div>

            {/* MAP */}

            {sourceLatitude !== null &&
              sourceLongitude !== null && (

              <div className="journey-map-section">

                <div className="journey-map-heading">

                  <div>
                    <Navigation
                      size={19}
                    />

                    <span>
                      Journey Route
                    </span>
                  </div>

                  {distanceKm !== null &&
                    durationMinutes !== null && (

                    <span className="map-route-info">
                      {distanceKm} km •{' '}
                      {durationMinutes} min
                    </span>
                  )}

                </div>

                {/* MAP SELECTION CONTROLS */}

                <div className="map-selection-controls">

                  <button
                    type="button"
                    className={
                      `map-selection-button ${
                        mapSelectionMode ===
                        'source'
                          ? 'selected'
                          : ''
                      }`
                    }
                    onClick={() =>
                      setMapSelectionMode(
                        'source'
                      )
                    }
                  >
                    <MapPin size={16} />

                    Set From
                  </button>

                  <button
                    type="button"
                    className={
                      `map-selection-button ${
                        mapSelectionMode ===
                        'destination'
                          ? 'selected'
                          : ''
                      }`
                    }
                    onClick={() =>
                      setMapSelectionMode(
                        'destination'
                      )
                    }
                  >
                    <Navigation
                      size={16}
                    />

                    Set To
                  </button>

                </div>

                <div className="map-selection-message">
                  {mapSelecting
                    ? 'Finding selected location...'
                    : mapSelectionMode ===
                      'source'
                    ? 'Click anywhere on the map to change the starting point.'
                    : 'Click anywhere on the map to change the destination.'}
                </div>

                <div className="journey-map-wrapper">

                  <MapContainer
                    center={[
                      sourceLatitude,
                      sourceLongitude,
                    ]}
                    zoom={14}
                    scrollWheelZoom={
                      true
                    }
                    className="journey-map"
                  >

                    <MapClickHandler
                      selectionMode={
                        mapSelectionMode
                      }
                      onMapSelect={
                        handleMapLocationSelect
                      }
                    />

                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* SOURCE */}

                    <CircleMarker
                      center={[
                        sourceLatitude,
                        sourceLongitude,
                      ]}
                      radius={9}
                      pathOptions={{
                        color:
                          '#059669',

                        fillColor:
                          '#10b981',

                        fillOpacity:
                          1,
                      }}
                    >
                      <Popup>
                        <strong>
                          Starting Point
                        </strong>

                        <br />

                        {source}
                      </Popup>
                    </CircleMarker>

                    {/* DESTINATION */}

                    {destinationLatitude !== null &&
                      destinationLongitude !== null && (

                      <CircleMarker
                        center={[
                          destinationLatitude,
                          destinationLongitude,
                        ]}
                        radius={9}
                        pathOptions={{
                          color:
                            '#be123c',

                          fillColor:
                            '#e11d48',

                          fillOpacity:
                            1,
                        }}
                      >
                        <Popup>
                          <strong>
                            Destination
                          </strong>

                          <br />

                          {destination}
                        </Popup>
                      </CircleMarker>
                    )}

                    {/* ROUTE */}

                    {routeCoordinates.length >
                      1 && (

                      <Polyline
                        positions={
                          routeCoordinates
                        }
                        pathOptions={{
                          color:
                            '#7c3aed',

                          weight:
                            5,

                          opacity:
                            0.85,
                        }}
                      />
                    )}

                    <MapBoundsController
                      sourceLatitude={
                        sourceLatitude
                      }
                      sourceLongitude={
                        sourceLongitude
                      }
                      destinationLatitude={
                        destinationLatitude
                      }
                      destinationLongitude={
                        destinationLongitude
                      }
                      routeCoordinates={
                        routeCoordinates
                      }
                    />

                  </MapContainer>

                </div>

                <div className="map-legend">

                  <span>
                    <span className="map-dot start">
                    </span>

                    Start
                  </span>

                  <span>
                    <span className="map-dot destination">
                    </span>

                    Destination
                  </span>

                  <span>
                    <span className="map-route-line">
                    </span>

                    Route
                  </span>

                </div>

              </div>
            )}

            {/* ROUTE LOADING */}

            {routeLoading && (
              <div className="route-summary route-loading">
                Calculating route...
              </div>
            )}

            {/* DISTANCE / ETA */}

            {!routeLoading &&
              distanceKm !== null &&
              durationMinutes !== null && (

              <div className="route-summary">

                <div>
                  <span>
                    Distance
                  </span>

                  <strong>
                    {distanceKm} km
                  </strong>
                </div>

                <div>
                  <span>
                    Estimated Time
                  </span>

                  <strong>
                    {durationMinutes} min
                  </strong>
                </div>

              </div>
            )}

            {/* ARRIVAL */}

            <div className="journey-time-section">

              <label>
                Expected Arrival Time
              </label>

              <div className="input-with-icon">

                <Clock3 size={18} />

                <input
                  type="datetime-local"
                  value={
                    expectedArrivalTime
                  }
                  onChange={(event) =>
                    setExpectedArrivalTime(
                      event.target.value
                    )
                  }
                />

              </div>

              {durationMinutes !== null && (
                <p className="arrival-help">
                  Automatically calculated
                  using the selected route.
                  You can change it manually.
                </p>
              )}

            </div>

            <button
              type="submit"
              className="primary-button journey-start-button"
              disabled={
                loading ||
                routeLoading ||
                mapSelecting
              }
            >
              <Navigation size={18} />

              {loading
                ? 'Starting Journey...'
                : 'Start Safety Journey'}
            </button>

          </form>

        </div>

      ) : (

        /* =================================================
           ACTIVE JOURNEY
        ================================================= */

        <div className="journey-card active-journey-card">

          <div className="journey-status-header">

            <ShieldCheck
              size={32}
            />

            <div>

              <h2>
                Journey Active
              </h2>

              <span
                className={
                  `journey-status ${
                    activeJourney.status
                      .toLowerCase()
                  }`
                }
              >
                {activeJourney.status
                  .replaceAll(
                    '_',
                    ' '
                  )}
              </span>

            </div>

          </div>

          <div className="journey-details">

            <div>

              <span>
                Destination
              </span>

              <strong>
                {
                  activeJourney.destination
                }
              </strong>

            </div>

            <div>

              <span>
                Expected Arrival
              </span>

              <strong>
                {new Date(
                  activeJourney
                    .expectedArrivalTime
                ).toLocaleString()}
              </strong>

            </div>

            <div>

              <span>
                Last Location
              </span>

              <strong>
                {
                  activeJourney
                    .lastLatitude
                    ?.toFixed(5)
                }
                ,
                {' '}
                {
                  activeJourney
                    .lastLongitude
                    ?.toFixed(5)
                }
              </strong>

            </div>

          </div>

          {activeJourney.status ===
            'CHECK_IN_REQUIRED' && (

            <div className="check-in-warning">

              <Clock3 size={30} />

              <h3>
                Safety Check
              </h3>

              <p>
                Your expected arrival
                time has passed. Please
                confirm that you are safe.
              </p>

              <div className="countdown">

                {formatCountdown(
                  countdown
                )}

              </div>

              <p className="countdown-note">
                If you do not respond
                within the two-minute
                safety window, an SOS
                will automatically be
                created using your last
                known location.
              </p>

            </div>
          )}

          <div className="journey-actions">

            <button
              type="button"
              className="safe-button"
              onClick={markSafe}
            >
              <ShieldCheck
                size={18}
              />

              I'm Safe
            </button>

            <button
              type="button"
              className="danger-button"
              onClick={
                triggerSOSNow
              }
            >
              <Siren size={18} />

              Need Help Now
            </button>

          </div>

        </div>
      )}

    </div>
  )
}

export default SafetyJourney