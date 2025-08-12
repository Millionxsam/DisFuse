export default function LoadingAnim({ onlySpinner = false }) {
  return (
    <div className="loadingAnim">
      <div className="spinner"></div>
      {onlySpinner ? null : <div>Loading...</div>}
    </div>
  );
}
