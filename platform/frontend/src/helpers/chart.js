export const getColor = (v, a = 1) => {
  if (typeof window === 'undefined') {
    return v.includes('-rgb') ? `rgba(0,0,0,${a})` : '#000000';
  }
  const val = getComputedStyle(document.documentElement).getPropertyValue(`--ins-${v}`).trim();
  if (!val || val === '') {
    return v.includes('-rgb') ? `rgba(0,0,0,${a})` : '#000000';
  }
  return v.includes('-rgb') ? `rgba(${val}, ${a})` : val;
};
export const getFont = () => {
  if (typeof window === 'undefined') {
    return;
  }
  return getComputedStyle(document.body).fontFamily.trim();
};