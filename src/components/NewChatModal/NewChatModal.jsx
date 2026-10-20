import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import './NewChatModal.scss';

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

    if (cleanPhone.length < 10) {
      setError('Please enter a valid phone number with country code');
      return;
    }

    createChat(cleanPhone);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal">
        <div className="modal-header">
          <h2>New Chat</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., 79001234567"
              autoFocus
            />
            <span className="hint">Enter phone number with country code (without + or spaces)</span>
          </div>

          {error && <div className="error-message">{error}</div>}

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
