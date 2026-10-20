import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import './NewChatModal.scss';

const MIN_PHONE_LENGTH = 11; // Minimum digits including country code

function NewChatModal({ onClose }) {
  const { createChat } = useChat();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (!cleanPhone) {
      setError('Please enter a phone number');
      return;
    }

    if (cleanPhone.length < MIN_PHONE_LENGTH) {
      setError(`Phone number must include country code (at least ${MIN_PHONE_LENGTH} digits)`);
      return;
    }

    createChat(cleanPhone);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal">
        <div className="modal-header">
          <h2 id="modal-title">New Chat</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => { setPhoneNumber(e.target.value); setError(''); }}
              placeholder="e.g. 79001234567"
              autoFocus
              autoComplete="tel"
            />
            <span className="hint">Include country code, digits only (e.g. 79001234567)</span>
          </div>

          {error && <p className="error-message" role="alert">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Start Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewChatModal;
