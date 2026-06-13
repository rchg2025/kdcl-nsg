export function getDirectImageUrl(url: string | undefined | null) {
  if (!url) return '';
  // Convert https://drive.google.com/file/d/ID/view -> https://drive.google.com/uc?export=view&id=ID
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
}
