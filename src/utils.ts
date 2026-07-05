export const getPondokInitials = (name: string) => {
  if (!name) return 'WHI';
  const commonWords = ['pondok', 'pesantren', 'pp', 'pp.', 'yayasan'];
  const words = name.split(' ').filter(word => !commonWords.includes(word.toLowerCase()));
  if (words.length === 0) return 'WHI';
  return words.map(word => word[0]).join('').substring(0, 3).toUpperCase();
};
