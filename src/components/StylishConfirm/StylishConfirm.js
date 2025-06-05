import './StylishConfirm.css';
import ReactDOM from 'react-dom';

export default function StylishConfirm({ message, onConfirm, onCancel }) {
  return ReactDOM.createPortal(
    <div className="confirm-overlay">
      <div className="confirm-box">
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-btn confirm" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
