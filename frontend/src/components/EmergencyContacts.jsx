import {
  useEffect,
  useState,
} from 'react'

import {
  ArrowLeft,
  UserPlus,
  Pencil,
  Trash2,
  Phone,
  User,
  Users,
} from 'lucide-react'

import AppAlert from './AppAlert'
import ConfirmModal from './ConfirmModal'

const API_URL =
  import.meta.env.VITE_API_BASE_URL

function EmergencyContacts({
  goBack,
  onLogout,
}) {
  const [contacts, setContacts] =
    useState([])

  const [name, setName] =
    useState('')

  const [phone, setPhone] =
    useState('')

  const [
    editingId,
    setEditingId,
  ] = useState(null)

  const [loading, setLoading] =
    useState(false)

  const [
    contactsLoading,
    setContactsLoading,
  ] = useState(true)

  const [
    appAlert,
    setAppAlert,
  ] = useState({
    message: '',
    type: 'info',
  })

  /*
   * IMPORTANT:
   * null means no confirmation
   * modal should be displayed.
   */
  const [
    confirmModal,
    setConfirmModal,
  ] = useState(null)

  const token =
    sessionStorage.getItem('token')

  useEffect(() => {
    fetchContacts()
  }, [])

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

  /*
   * GET CONTACTS
   */
  async function fetchContacts() {
    try {
      setContactsLoading(true)

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
        showAlert(
          'Your session has expired. Please login again.',
          'error'
        )

        setTimeout(() => {
          onLogout()
        }, 1200)

        return
      }

      if (!response.ok) {
        showAlert(
          'Unable to load emergency contacts.',
          'error'
        )

        return
      }

      const data =
        await response.json()

      setContacts(data)

    } catch (error) {
      console.error(
        'Fetch contacts error:',
        error
      )

      showAlert(
        'Unable to connect to the server.',
        'error'
      )

    } finally {
      setContactsLoading(false)
    }
  }

  /*
   * ADD / UPDATE CONTACT
   */
  async function handleSubmit(
    event
  ) {
    event.preventDefault()

    const cleanName =
      name.trim()

    const cleanPhone =
      phone.trim()

    if (!cleanName) {
      showAlert(
        'Please enter the contact name.',
        'error'
      )

      return
    }

    if (!cleanPhone) {
      showAlert(
        'Please enter the phone number.',
        'error'
      )

      return
    }

    setLoading(true)

    try {
      const isEditing =
        editingId !== null

      const url =
        isEditing
          ? `${API_URL}/api/contacts/${editingId}`
          : `${API_URL}/api/contacts`

      const response =
        await fetch(
          url,
          {
            method:
              isEditing
                ? 'PUT'
                : 'POST',

            headers: {
              'Content-Type':
                'application/json',

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                name:
                  cleanName,

                phone:
                  cleanPhone,
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
        const errorMessage =
          data?.name ||
          data?.phone ||
          data?.message ||
          'Unable to save contact.'

        showAlert(
          errorMessage,
          'error'
        )

        return
      }

      showAlert(
        isEditing
          ? 'Emergency contact updated successfully.'
          : 'Emergency contact added successfully.',
        'success'
      )

      clearForm()

      await fetchContacts()

    } catch (error) {
      console.error(
        'Save contact error:',
        error
      )

      showAlert(
        'Unable to connect to the server.',
        'error'
      )

    } finally {
      setLoading(false)
    }
  }

  /*
   * START EDITING
   */
  function handleEdit(contact) {
    setEditingId(
      contact.id
    )

    setName(
      contact.name
    )

    setPhone(
      contact.phone
    )

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  /*
   * CANCEL EDITING
   */
  function clearForm() {
    setEditingId(null)

    setName('')

    setPhone('')
  }

  /*
   * ASK BEFORE DELETE
   */
  function askToDelete(contact) {
    setConfirmModal({
      action:
        'delete',

      contactId:
        contact.id,

      title:
        'Delete Emergency Contact?',

      message:
        `Are you sure you want to remove ${contact.name} from your emergency contacts?`,

      confirmText:
        'Delete',

      type:
        'danger',
    })
  }

  /*
   * ACTUAL DELETE
   */
  async function deleteContact(id) {
    /*
     * Close modal immediately.
     */
    setConfirmModal(null)

    try {
      const response =
        await fetch(
          `${API_URL}/api/contacts/${id}`,
          {
            method:
              'DELETE',

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
          'Unable to delete emergency contact.',
          'error'
        )

        return
      }

      /*
       * If the deleted contact
       * was currently being edited,
       * clear the form.
       */
      if (
        editingId === id
      ) {
        clearForm()
      }

      showAlert(
        'Emergency contact deleted successfully.',
        'success'
      )

      await fetchContacts()

    } catch (error) {
      console.error(
        'Delete contact error:',
        error
      )

      showAlert(
        'Unable to connect to the server.',
        'error'
      )
    }
  }

  /*
   * CONFIRM MODAL ACTION
   */
  function handleConfirm() {
    if (
      confirmModal?.action ===
        'delete' &&
      confirmModal?.contactId
    ) {
      deleteContact(
        confirmModal.contactId
      )
    }
  }

  return (
    <div className="contacts-page">

      {/* APP ALERT */}

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

      {/*
       * VERY IMPORTANT:
       *
       * ConfirmModal exists ONLY
       * when confirmModal contains
       * data.
       *
       * This fixes the blank modal
       * appearing when Contacts opens.
       */}

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

      {/* HEADER */}

      <header className="dashboard-header">

        <div>

          <h1>
            Emergency Contacts
          </h1>

          <p>
            Manage the people who
            should be contacted during
            an emergency
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

      <main className="contacts-content">

        {/* ADD / EDIT CONTACT */}

        <section className="contact-form-card">

          <div className="contact-section-title">

            <div className="contact-title-icon">
              <UserPlus size={22} />
            </div>

            <div>

              <h2>
                {editingId
                  ? 'Edit Emergency Contact'
                  : 'Add Emergency Contact'}
              </h2>

              <p>
                {editingId
                  ? 'Update the contact information below.'
                  : 'Add someone you trust as an emergency contact.'}
              </p>

            </div>

          </div>

          <form
            onSubmit={
              handleSubmit
            }
            className="contact-form"
          >

            <div className="form-group">

              <label>
                Contact Name
              </label>

              <div className="input-with-icon">

                <User size={18} />

                <input
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  placeholder="Enter contact name"
                />

              </div>

            </div>

            <div className="form-group">

              <label>
                Phone Number
              </label>

              <div className="input-with-icon">

                <Phone size={18} />

                <input
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                  placeholder="Enter phone number"
                />

              </div>

            </div>

            <div className="contact-form-actions">

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >

                <UserPlus size={17} />

                {loading
                  ? 'Saving...'
                  : editingId
                    ? 'Update Contact'
                    : 'Add Contact'}

              </button>

              {editingId && (

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    clearForm
                  }
                >
                  Cancel
                </button>

              )}

            </div>

          </form>

        </section>

        {/* CONTACT LIST */}

        <section className="contacts-list-section">

          <div className="contact-section-title">

            <div className="contact-title-icon">
              <Users size={22} />
            </div>

            <div>

              <h2>
                Saved Contacts
              </h2>

              <p>
                {contacts.length}
                {' '}
                emergency
                {contacts.length === 1
                  ? ' contact'
                  : ' contacts'}
              </p>

            </div>

          </div>

          {contactsLoading ? (

            <div className="empty-message">
              Loading emergency
              contacts...
            </div>

          ) : contacts.length === 0 ? (

            <div className="empty-message">

              <Users size={36} />

              <h3>
                No emergency contacts
              </h3>

              <p>
                Add your first trusted
                contact using the form
                above.
              </p>

            </div>

          ) : (

            <div className="contacts-list">

              {contacts.map(
                (contact) => (

                  <div
                    className="contact-card"
                    key={
                      contact.id
                    }
                  >

                    <div className="contact-avatar">

                      {contact.name
                        ?.charAt(0)
                        .toUpperCase()}

                    </div>

                    <div className="contact-details">

                      <h3>
                        {contact.name}
                      </h3>

                      <div className="contact-phone">

                        <Phone
                          size={14}
                        />

                        <span>
                          {contact.phone}
                        </span>

                      </div>

                    </div>

                    <div className="contact-actions">

                      <button
                        type="button"
                        className="contact-edit-button"
                        onClick={() =>
                          handleEdit(
                            contact
                          )
                        }
                        aria-label={
                          `Edit ${contact.name}`
                        }
                      >
                        <Pencil
                          size={17}
                        />
                      </button>

                      <button
                        type="button"
                        className="contact-delete-button"
                        onClick={() =>
                          askToDelete(
                            contact
                          )
                        }
                        aria-label={
                          `Delete ${contact.name}`
                        }
                      >
                        <Trash2
                          size={17}
                        />
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </main>

    </div>
  )
}

export default EmergencyContacts