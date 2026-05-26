const VIETNAM_MOBILE_PATTERN = /^\+84(3|5|7|8|9)\d{8}$/;

export function normalizeVietnamPhone(phone: string) {
  const cleaned = phone.replace(/[\s.\-()]/g, "").trim();

  if (!cleaned) {
    throw new Error("Vui lòng nhập số điện thoại.");
  }

  let normalized = cleaned;

  if (normalized.startsWith("+84")) {
    normalized = `+84${normalized.slice(3)}`;
  } else if (normalized.startsWith("84")) {
    normalized = `+84${normalized.slice(2)}`;
  } else if (normalized.startsWith("0")) {
    normalized = `+84${normalized.slice(1)}`;
  }

  if (!VIETNAM_MOBILE_PATTERN.test(normalized)) {
    throw new Error("Số điện thoại không hợp lệ. Vui lòng nhập số di động Việt Nam.");
  }

  return normalized;
}

export function phoneToAuthEmail(normalizedPhone: string) {
  if (!VIETNAM_MOBILE_PATTERN.test(normalizedPhone)) {
    throw new Error("Số điện thoại không hợp lệ.");
  }

  return `${normalizedPhone.replace("+", "")}@phone.local`;
}
