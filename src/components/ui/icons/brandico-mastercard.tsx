import * as React from "react";

export function MastercardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="48" height="32" rx="4" fill="#EB001B" />
      <circle cx="18" cy="16" r="9" fill="#FF5F00" />
      <circle cx="30" cy="16" r="9" fill="#F79E1B" />
      <path
        d="M24 9.5C22.3 11 21.2 13.3 21.2 16C21.2 18.7 22.3 21 24 22.5C25.7 21 26.8 18.7 26.8 16C26.8 13.3 25.7 11 24 9.5Z"
        fill="#FF5F00"
      />
    </svg>
  );
}
