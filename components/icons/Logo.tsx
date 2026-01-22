const Logo = ({ ...props }) => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect width="32" height="32" rx="6" fill="#10b981" />
    {/* FileCheck icon: document with checkmark */}
    <path
      d="M14.5 9.5H10C9.44772 9.5 9 9.94772 9 10.5V21.5C9 22.0523 9.44772 22.5 10 22.5H18C18.5523 22.5 19 22.0523 19 21.5V13.5L14.5 9.5Z"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M14.5 9.5V13.5H19"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M12 17L13.5 18.5L16 16"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default Logo;
