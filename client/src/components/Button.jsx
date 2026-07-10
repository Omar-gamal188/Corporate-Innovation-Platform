/** variant: 'primary' | 'secondary' | 'danger' | 'ghost' */
function Button({ variant = 'primary', children, disabled, type = 'button', ...rest }) {
  return (
    <button type={type} className={`btn btn-${variant}`} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}

export default Button;
