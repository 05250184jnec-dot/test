
export const pwRules = (p) => (!p ? 'Password is required' : p.length < 8 ? 'At least 8 characters' : !/[a-z]/.test(p) ? 'Add a lowercase letter' : !/[A-Z]/.test(p) ? 'Add an uppercase letter' : !/\d/.test(p) ? 'Add a number' : null);
export const emailRule = (e) => (/^\S+@\S+\.\S+$/.test(e) ? null : 'Enter a valid e-mail');
