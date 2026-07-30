function StatusBadge({ status }) {
  const normalizedStatus = status?.toUpperCase() || "PENDING";

  return (
    <span className={`status-badge status-${normalizedStatus.toLowerCase()}`}>
      {normalizedStatus}
    </span>
  );
}

export default StatusBadge;
