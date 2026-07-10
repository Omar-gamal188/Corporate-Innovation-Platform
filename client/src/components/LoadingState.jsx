function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="state-message">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}

export default LoadingState;
