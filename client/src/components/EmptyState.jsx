function EmptyState({ message = 'Nothing here yet' }) {
  return (
    <div className="state-message empty-state">
      <span>{message}</span>
    </div>
  );
}

export default EmptyState;
