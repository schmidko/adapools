const AdapoolsLogo = () => (
  <svg
    className="brand-logo"
    viewBox="0 0 246 58"
    role="img"
    aria-label="adapools.xyz"
  >
    <defs>
      <linearGradient id="adapoolsLogoMark" x1="8" x2="50" y1="50" y2="8" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0E5FD8" />
        <stop offset="0.48" stopColor="#1677FF" />
        <stop offset="1" stopColor="#18C7D4" />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <rect width="50" height="50" x="4" y="4" fill="url(#adapoolsLogoMark)" rx="12" />
      <circle cx="29" cy="29" r="10" fill="#fff" fillOpacity="0.94" />
      <circle cx="29" cy="12.5" r="3.1" fill="#fff" fillOpacity="0.95" />
      <circle cx="29" cy="45.5" r="3.1" fill="#fff" fillOpacity="0.95" />
      <circle cx="12.5" cy="29" r="3.1" fill="#fff" fillOpacity="0.95" />
      <circle cx="45.5" cy="29" r="3.1" fill="#fff" fillOpacity="0.95" />
      <circle cx="17.3" cy="17.3" r="2.35" fill="#fff" fillOpacity="0.78" />
      <circle cx="40.7" cy="17.3" r="2.35" fill="#fff" fillOpacity="0.78" />
      <circle cx="17.3" cy="40.7" r="2.35" fill="#fff" fillOpacity="0.78" />
      <circle cx="40.7" cy="40.7" r="2.35" fill="#fff" fillOpacity="0.78" />
      <path
        d="M18 33.6c5.2-4.4 16.6-4.4 22 0M20.5 37.6c4-2.9 13-2.9 17 0"
        stroke="#0E5FD8"
        strokeLinecap="round"
        strokeWidth="2.8"
      />
      <text
        x="68"
        y="34"
        fill="currentColor"
        fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
        fontSize="25"
        fontWeight="800"
        letterSpacing="0"
      >
        adapools
      </text>
      <text
        x="177"
        y="34"
        fill="#1677FF"
        fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
        fontSize="25"
        fontWeight="800"
        letterSpacing="0"
      >
        .xyz
      </text>
      <path d="M69 43h139" stroke="#1677FF" strokeLinecap="round" strokeOpacity="0.22" strokeWidth="3" />
    </g>
  </svg>
);

export default AdapoolsLogo;
