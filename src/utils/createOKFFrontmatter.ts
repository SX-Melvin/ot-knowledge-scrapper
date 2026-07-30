export function createOKFFrontmatter({
  name,
  profile,
  title,
  description = ''
}: {
  name: string
  profile: string,
  title: string
  description: string
}) {
  if (!name || !title) {
    throw new Error('OKF Data Package requires at least a "name" and "title".');
  }

  // Format machine-readable name (lowercase, hyphens/underscores only)
  const formattedName = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-');

  return {
    profile, // OKF Frictionless profile type
    name: formattedName,
    title: title.trim(),
    description: description.trim(),
    created: new Date().toISOString(),
  };
}