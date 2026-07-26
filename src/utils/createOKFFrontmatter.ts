export function createOKFFrontmatter({
  name,
  title,
  description = '',
  version = '1.0.0',
  resources = [],
  licenses = [{ name: 'CC-BY-4.0', title: 'Creative Commons Attribution 4.0', path: 'https://creativecommons.org/licenses/by/4.0/' }],
  contributors = []
}: {
  name: string
  title: string
  description: string
  version: string
  resources: {
    name: string,
    path: string,
    format: string,
    mediatype: string,
    schema: any
  }[]
  licenses: { name: string, title: string, path: string }[]
  contributors: string[]
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
    profile: 'tabular-data-package', // OKF Frictionless profile type
    name: formattedName,
    title: title.trim(),
    description: description.trim(),
    version: version,
    created: new Date().toISOString(),
    licenses: licenses,
    contributors,
    resources: resources.map((res) => ({
      name: res.name || res.path.split('/').pop()?.replace(/\.[^/.]+$/, ''),
      path: res.path,
      format: res.format || res.path.split('.').pop() || 'csv',
      mediatype: res.mediatype || 'text/csv',
      schema: res.schema || {}
    }))
  };
}