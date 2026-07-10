/** A single toast notification bubble. Rendered in a list by ToastContext. */
function Toast({ message, type }) {
  return <div className={`toast toast-${type}`}>{message}</div>;
}

export default Toast;
