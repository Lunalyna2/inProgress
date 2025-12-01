export const validatePassword = (password: string): string | null => {
  const minLength = /.{8,}/;
  const upper = /[A-Z]/;
  const lower = /[a-z]/;
  const number = /[0-9]/;
  const special = /[!@#$%^&*(),.?":{}|<>]/;

  if (!minLength.test(password)) return "Password must be at least 8 characters.";
  if (!upper.test(password)) return "Password must contain an uppercase letter.";
  if (!lower.test(password)) return "Password must contain a lowercase letter.";

  return null; // valid
};
