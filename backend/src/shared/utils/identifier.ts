export type ParsedLoginIdentifier =
  | {
      kind: "email";
      normalized: string;
    }
  | {
      kind: "phone";
      normalized: string;
    }
  | {
      kind: "invalid";
      normalized: "";
    };

const arabicIndicDigitsMap: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9"
};

const arabicIndicDigitsPattern = /[٠-٩۰-۹]/g;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeArabicIndicDigits = (value: string): string => {
  return value.replace(arabicIndicDigitsPattern, (digit) => arabicIndicDigitsMap[digit] ?? digit);
};

export const normalizePhoneForStorage = (value?: string | null): string | null => {
  if (value === undefined || value === null) {
    return null;
  }

  const digitsOnly = normalizeArabicIndicDigits(value).replace(/\D/g, "");
  return digitsOnly.length ? digitsOnly : null;
};

export const parseLoginIdentifier = (rawValue: string): ParsedLoginIdentifier => {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return {
      kind: "invalid",
      normalized: ""
    };
  }

  const normalizedDigits = normalizeArabicIndicDigits(trimmed);
  const normalizedEmail = normalizedDigits.toLowerCase();

  if (normalizedEmail.includes("@")) {
    if (!emailPattern.test(normalizedEmail)) {
      return {
        kind: "invalid",
        normalized: ""
      };
    }

    return {
      kind: "email",
      normalized: normalizedEmail
    };
  }

  const normalizedPhone = normalizePhoneForStorage(trimmed);
  if (!normalizedPhone || normalizedPhone.length < 6 || normalizedPhone.length > 32) {
    return {
      kind: "invalid",
      normalized: ""
    };
  }

  return {
    kind: "phone",
    normalized: normalizedPhone
  };
};
