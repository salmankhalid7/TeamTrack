// Classname utility - combines Tailwind classes conditionally
// Why: Clean conditional styling without template literal complexity
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Format date with relative time if recent
export function formatDate(date, relative = false) {
  const d = new Date(date);
  
  if (relative) {
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
  }
  
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

// Truncate text with ellipsis
export function truncate(text, length = 100) {
  if (!text || text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

// Get initials from name
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}