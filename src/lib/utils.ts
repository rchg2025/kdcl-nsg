export function getDirectImageUrl(url: string | undefined | null) {
  if (!url) return '';
  // Convert https://drive.google.com/file/d/ID/view -> https://drive.google.com/uc?export=view&id=ID
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    // Sử dụng lh3.googleusercontent.com thay vì uc?export=view vì Google đã chặn third-party cookies từ 2024
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}
