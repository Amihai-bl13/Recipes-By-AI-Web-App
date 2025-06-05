// src/components/StylishAlert/StylishAlert.js
import { useEffect } from 'react';
import './StylishAlert.css';
import ReactDOM from 'react-dom';

export default function StylishAlert({ message, onClose, duration = 3000 }) {
  // auto-dismiss after “duration” ms:
  useEffect(() => {
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [onClose, duration]);

  return ReactDOM.createPortal(
    <div className="stylish-alert">
      <span className="stylish-alert-text">{message}</span>
      <button className="stylish-alert-close" onClick={onClose}>×</button>
    </div>,
    document.body
  );
}
