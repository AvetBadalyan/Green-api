import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import './NewChatModal.scss';

const MIN_PHONE_LENGTH = 11; // digits incl. country code

function NewChatModal({ onClose }) {
  const { createChat } = useChat();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  const modalRef = useRef(null);
  const phoneInputRef = useRef(null);

  // Focus trap + Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    phoneInputRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const isValid = cleanPhone.length >= MIN_PHONE_LENGTH;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!cleanPhone) {
      setError('Please enter a phone number');
      return;
    }
    if (!isValid) {
      setError(`Include country code — at least ${MIN_PHONE_LENGTH} digits`);
      return;
    }
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
          <h2 id="modal-title">Search by number</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          <div className="phone-field">
            <span className="phone-prefix" aria-hidden="true">+</span>
            <input
              ref={phoneInputRef}
              type="tel"
              inputMode="numeric"
              value={phoneNumber}
              onChange={(e) => { setPhoneNumber(e.target.value); setError(''); }}
              placeholder="79001234567"
              autoComplete="tel"
              aria-label="Phone number with country code"
            />
          </div>

          <p className="phone-hint">Enter the full number including country code</p>

          {error && <p className="error-message" role="alert">{error}</p>}

          <button
            type="submit"
            className="find-btn"
            disabled={!isValid}
          >
            Find in MAX
          </button>
        </form>
      </div>
    </div>
  );
}

export default NewChatModal;
