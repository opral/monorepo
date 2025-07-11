// PollingComponent is no longer needed with the new query-based architecture
// Each hook now manages its own polling interval via useQuery

const PollingComponent = () => {
  // No longer needed - individual hooks handle their own polling
  return null;
};

export default PollingComponent;