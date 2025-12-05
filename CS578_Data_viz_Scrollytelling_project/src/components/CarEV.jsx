/* EV top-down silhouette */
export default function CarEV(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 60 110"
      xmlns="http://www.w3.org/2000/svg"
      className={`car-svg ${props.className || ""}`}
    >
      <rect x="10" y="10" width="40" height="90" rx="12" fill="#38F6C8" />
      <rect x="18" y="35" width="24" height="40" rx="8" fill="rgba(255,255,255,0.26)" />
      <rect x="6" y="30" width="12" height="24" rx="6" fill="#000" />
      <rect x="42" y="30" width="12" height="24" rx="6" fill="#000" />
      <rect x="6" y="65" width="12" height="24" rx="6" fill="#000" />
      <rect x="42" y="65" width="12" height="24" rx="6" fill="#000" />
    </svg>
  );
}
