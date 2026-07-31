function StatusBadge({ status = "PENDING" }) {
  const normalized = String(status).toLowerCase();

  return (
    <span className={`status-badge status-${normalized}`}>
      {status}
    </span>
  );
}

export default StatusBadge;