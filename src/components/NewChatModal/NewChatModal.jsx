import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import './NewChatModal.scss';

const MIN_PHONE_LENGTH = 11; // Minimum digits including country code

function NewChatModal({ onClose }) {
  const { createChat } = useChat();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const modalRef = useRef(null);
  const phoneInputRef = useRef(null);

  // Focus trap and Escape key handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Focus trap - Tab key
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus the input on mount
    if (phoneInputRef.current) {
      phoneInputRef.current.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Basic validation - createChat() will sanitize the number
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (!cleanPhone) {
      setError('Please enter a phone number');
      return;
    }

    if (cleanPhone.length < MIN_PHONE_LENGTH) {
      setError(`Phone number must include country code (at least ${MIN_PHONE_LENGTH} digits)`);
      return;
    }

    // Pass unsanitized - createChat handles sanitization
    createChat(phoneNumber);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div
        ref={modalRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
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
              ref={phoneInputRef}
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => { setPhoneNumber(e.target.value); setError(''); }}
              placeholder="e.g. 79001234567"
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
