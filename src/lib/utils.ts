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

export function removeVietnameseTones(str: string) {
  if (!str) return "";
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  str = str.replace(/Đ/g, "D");
  // Some system encode vietnamese combining accent as individual utf-8 characters
  // Một vài bộ gõ kiểu cũ dấu kết hợp có thể bị tách rời khỏi ký tự chữ
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
  // Remove extra spaces
  str = str.replace(/ + /g, " ");
  str = str.trim();
  return str;
}

export function smartSearch(target: string | null | undefined, query: string | null | undefined): number {
  if (!query) return 100; // Empty query matches everything
  if (!target) return 0;

  const q = query.trim().toLowerCase();
  const t = target.trim().toLowerCase();

  // 1. Exact match with tones (highest priority)
  if (t === q) return 100;

  const qNoTones = removeVietnameseTones(q);
  const tNoTones = removeVietnameseTones(t);

  // 2. Exact match without tones
  if (tNoTones === qNoTones) return 80;

  // 3. Contains match with tones
  if (t.includes(q)) return 60;

  // 4. Contains match without tones
  if (tNoTones.includes(qNoTones)) return 40;

  // 5. Word boundaries match (e.g. "nd" matches "Nguyễn Du")
  // Too complex for now, fallback to 0
  return 0;
}
