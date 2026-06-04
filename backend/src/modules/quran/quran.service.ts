import { AppError } from "../../shared/errors/app-error";
import { getSurahAyahCount } from "../../shared/quran/surah-ayah-counts";
import { quranRepository } from "./quran.repository";

export type QuranRangeInput = {
  fromSurah: number;
  fromAyah: number;
  toSurah: number;
  toAyah: number;
};

type AyahMetadata = {
  surahNumber: number;
  ayahNumber: number;
  pageNumber: number;
  juzNumber: number;
  hizbQuarter: number | null;
  source: "provider" | "cache";
};

type QuranTextAyah = {
  surahNumber: number;
  ayahNumber: number;
  text: string;
};

type QuranPageAyah = Omit<AyahMetadata, "source">;

const PROVIDER_URL = "https://api.alquran.cloud/v1/ayah";
const PROVIDER_SURAH_URL = "https://api.alquran.cloud/v1/surah";
const PROVIDER_QURAN_EDITION = "quran-uthmani";

const parseInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
};

const assertAyahWithinSurah = (surah: number, ayah: number, fieldLabel: string) => {
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    throw new AppError(`${fieldLabel} يجب أن يكون رقم السورة بين 1 و 114`, 422, undefined, "VALIDATION_FAILED");
  }

  const maxAyahs = getSurahAyahCount(surah);
  if (!maxAyahs) {
    throw new AppError(`${fieldLabel} رقم السورة غير صحيح`, 422, undefined, "VALIDATION_FAILED");
  }

  if (!Number.isInteger(ayah) || ayah < 1 || ayah > maxAyahs) {
    throw new AppError(
      `${fieldLabel} يجب أن يكون رقم الآية بين 1 و ${maxAyahs}`,
      422,
      undefined,
      "VALIDATION_FAILED"
    );
  }
};

const assertRangeInOrder = (input: QuranRangeInput) => {
  const inOrder =
    input.fromSurah < input.toSurah ||
    (input.fromSurah === input.toSurah && input.fromAyah <= input.toAyah);

  if (!inOrder) {
    throw new AppError("ترتيب النطاق القرآني غير صحيح", 422, undefined, "VALIDATION_FAILED");
  }
};

const calculateAyahCount = (input: QuranRangeInput): number => {
  if (input.fromSurah === input.toSurah) {
    return input.toAyah - input.fromAyah + 1;
  }

  let total = getSurahAyahCount(input.fromSurah) - input.fromAyah + 1;
  for (let current = input.fromSurah + 1; current < input.toSurah; current += 1) {
    total += getSurahAyahCount(current);
  }
  total += input.toAyah;
  return total;
};

const parseProviderPayload = (payload: unknown): Omit<AyahMetadata, "source"> | null => {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const root = payload as { data?: unknown };
  const data = root.data;
  if (typeof data !== "object" || data === null) {
    return null;
  }

  const item = data as Record<string, unknown>;
  const surah = item.surah;
  const surahNumber =
    typeof surah === "object" && surah !== null ? parseInteger((surah as { number?: unknown }).number) : null;
  const ayahNumber = parseInteger(item.numberInSurah);
  const pageNumber = parseInteger(item.page);
  const juzNumber = parseInteger(item.juz);
  const hizbQuarter = parseInteger(item.hizbQuarter);

  if (!surahNumber || !ayahNumber || !pageNumber || !juzNumber) {
    return null;
  }

  return {
    surahNumber,
    ayahNumber,
    pageNumber,
    juzNumber,
    hizbQuarter
  };
};

const parseAyahTextPayload = (payload: unknown): (Omit<AyahMetadata, "source"> & { text: string }) | null => {
  const metadata = parseProviderPayload(payload);
  if (!metadata) {
    return null;
  }

  const root = payload as { data?: unknown };
  const data = root.data;
  if (typeof data !== "object" || data === null) {
    return null;
  }

  const text = (data as { text?: unknown }).text;
  if (typeof text !== "string" || !text.trim()) {
    return null;
  }

  return {
    ...metadata,
    text: text.trim()
  };
};

const parseSurahPayload = (payload: unknown): { surahNumber: number; ayahs: QuranTextAyah[] } | null => {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const root = payload as { data?: unknown };
  const data = root.data;
  if (typeof data !== "object" || data === null) {
    return null;
  }

  const surahNumber = parseInteger((data as { number?: unknown }).number);
  const ayahs = (data as { ayahs?: unknown }).ayahs;

  if (!surahNumber || !Array.isArray(ayahs)) {
    return null;
  }

  const mapped = ayahs
    .map((ayah) => {
      if (typeof ayah !== "object" || ayah === null) {
        return null;
      }

      const entry = ayah as Record<string, unknown>;
      const ayahNumber = parseInteger(entry.numberInSurah);
      const text = typeof entry.text === "string" ? entry.text.trim() : "";

      if (!ayahNumber || !text) {
        return null;
      }

      return {
        surahNumber,
        ayahNumber,
        text
      } satisfies QuranTextAyah;
    })
    .filter((ayah): ayah is QuranTextAyah => Boolean(ayah));

  return {
    surahNumber,
    ayahs: mapped
  };
};

const parsePagePayload = (payload: unknown): { pageNumber: number; ayahs: QuranPageAyah[] } | null => {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const root = payload as { data?: unknown };
  const data = root.data;
  if (typeof data !== "object" || data === null) {
    return null;
  }

  const pageNumber = parseInteger((data as { number?: unknown }).number);
  const ayahs = (data as { ayahs?: unknown }).ayahs;
  if (!pageNumber || !Array.isArray(ayahs)) {
    return null;
  }

  const mapped = ayahs
    .map((ayah) => {
      if (typeof ayah !== "object" || ayah === null) {
        return null;
      }

      const entry = ayah as Record<string, unknown>;
      const surah = entry.surah;
      const surahNumber =
        typeof surah === "object" && surah !== null
          ? parseInteger((surah as { number?: unknown }).number)
          : null;
      const ayahNumber = parseInteger(entry.numberInSurah);
      const juzNumber = parseInteger(entry.juz);
      const hizbQuarter = parseInteger(entry.hizbQuarter);

      if (!surahNumber || !ayahNumber || !juzNumber) {
        return null;
      }

      return {
        surahNumber,
        ayahNumber,
        pageNumber,
        juzNumber,
        hizbQuarter
      } satisfies QuranPageAyah;
    })
    .filter((ayah): ayah is QuranPageAyah => Boolean(ayah));

  return {
    pageNumber,
    ayahs: mapped
  };
};

const readFromProvider = async (
  surahNumber: number,
  ayahNumber: number
): Promise<Omit<AyahMetadata, "source"> | null> => {
  const response = await fetch(`${PROVIDER_URL}/${surahNumber}:${ayahNumber}/${PROVIDER_QURAN_EDITION}`, {
    method: "GET"
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as unknown;
  return parseProviderPayload(payload);
};

const readAyahTextFromProvider = async (
  surahNumber: number,
  ayahNumber: number
): Promise<(Omit<AyahMetadata, "source"> & { text: string }) | null> => {
  const response = await fetch(`${PROVIDER_URL}/${surahNumber}:${ayahNumber}/${PROVIDER_QURAN_EDITION}`, {
    method: "GET"
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as unknown;
  return parseAyahTextPayload(payload);
};

const readSurahTextFromProvider = async (
  surahNumber: number
): Promise<{ surahNumber: number; ayahs: QuranTextAyah[] } | null> => {
  const response = await fetch(`${PROVIDER_SURAH_URL}/${surahNumber}/${PROVIDER_QURAN_EDITION}`, {
    method: "GET"
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as unknown;
  return parseSurahPayload(payload);
};

const readPageFromProvider = async (
  pageNumber: number
): Promise<{ pageNumber: number; ayahs: QuranPageAyah[] } | null> => {
  const response = await fetch(`${PROVIDER_URL.replace("/ayah", "/page")}/${pageNumber}/${PROVIDER_QURAN_EDITION}`, {
    method: "GET"
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as unknown;
  return parsePagePayload(payload);
};

const resolveAyahMetadata = async (
  surahNumber: number,
  ayahNumber: number
): Promise<AyahMetadata> => {
  try {
    const providerData = await readFromProvider(surahNumber, ayahNumber);
    if (providerData) {
      await quranRepository.upsertAyahIndex({
        surahNumber: providerData.surahNumber,
        ayahNumber: providerData.ayahNumber,
        pageNumber: providerData.pageNumber,
        juzNumber: providerData.juzNumber,
        hizbQuarter: providerData.hizbQuarter,
        provider: "api.alquran.cloud",
        providerVersion: PROVIDER_QURAN_EDITION
      });

      return {
        ...providerData,
        source: "provider"
      };
    }
  } catch {
    // Provider fetch failed; fallback cache is handled below.
  }

  const cached = await quranRepository.findAyahIndex({ surahNumber, ayahNumber });
  if (!cached) {
    throw new AppError(
      "مزود بيانات القرآن غير متاح ولا يوجد مدخل مخبأ احتياطي",
      503,
      { surahNumber, ayahNumber },
      "QURAN_METADATA_UNAVAILABLE"
    );
  }

  return {
    surahNumber: cached.surahNumber,
    ayahNumber: cached.ayahNumber,
    pageNumber: cached.pageNumber,
    juzNumber: cached.juzNumber,
    hizbQuarter: cached.hizbQuarter ?? null,
    source: "cache"
  };
};

const resolveLastAyahOnPage = async (pageNumber: number): Promise<AyahMetadata> => {
  try {
    const providerData = await readPageFromProvider(pageNumber);
    if (providerData && providerData.ayahs.length > 0) {
      await quranRepository.upsertManyAyahIndex(
        providerData.ayahs.map((ayah) => ({
          surahNumber: ayah.surahNumber,
          ayahNumber: ayah.ayahNumber,
          pageNumber: ayah.pageNumber,
          juzNumber: ayah.juzNumber,
          hizbQuarter: ayah.hizbQuarter,
          provider: "api.alquran.cloud",
          providerVersion: PROVIDER_QURAN_EDITION
        }))
      );

      const lastAyah = providerData.ayahs[providerData.ayahs.length - 1]!;
      return {
        ...lastAyah,
        source: "provider"
      };
    }
  } catch {
    // Provider fetch failed; fallback cache is handled below.
  }

  const cached = await quranRepository.findLastAyahOnPage(pageNumber);
  if (!cached) {
    throw new AppError(
      "مزود بيانات القرآن غير متاح ولا يوجد مدخل مخبأ للصفحة احتياطي",
      503,
      { pageNumber },
      "QURAN_METADATA_UNAVAILABLE"
    );
  }

  return {
    surahNumber: cached.surahNumber,
    ayahNumber: cached.ayahNumber,
    pageNumber: cached.pageNumber,
    juzNumber: cached.juzNumber,
    hizbQuarter: cached.hizbQuarter ?? null,
    source: "cache"
  };
};

export const quranService = {
  async calculateRange(input: QuranRangeInput) {
    assertAyahWithinSurah(input.fromSurah, input.fromAyah, "from");
    assertAyahWithinSurah(input.toSurah, input.toAyah, "to");
    assertRangeInOrder(input);

    const ayahCount = calculateAyahCount(input);

    const [fromMeta, toMeta] = await Promise.all([
      resolveAyahMetadata(input.fromSurah, input.fromAyah),
      resolveAyahMetadata(input.toSurah, input.toAyah)
    ]);

    const fromPage = Math.min(fromMeta.pageNumber, toMeta.pageNumber);
    const toPage = Math.max(fromMeta.pageNumber, toMeta.pageNumber);
    const pagesCount = Math.max(1, toPage - fromPage + 1);
    const source = fromMeta.source === "provider" && toMeta.source === "provider" ? "provider" : "cache";

    return {
      fromSurah: input.fromSurah,
      fromAyah: input.fromAyah,
      toSurah: input.toSurah,
      toAyah: input.toAyah,
      ayahCount,
      fromPage,
      toPage,
      pagesCount,
      source
    };
  },

  async resolveRangeByTargetPages(input: {
    fromSurah: number;
    fromAyah: number;
    targetPages: number;
  }) {
    assertAyahWithinSurah(input.fromSurah, input.fromAyah, "from");

    const normalizedTargetPages = Math.max(1, Math.round(input.targetPages));
    const startMeta = await resolveAyahMetadata(input.fromSurah, input.fromAyah);
    const targetEndPage = Math.max(
      startMeta.pageNumber,
      Math.min(604, startMeta.pageNumber + normalizedTargetPages - 1)
    );
    const endMeta = await resolveLastAyahOnPage(targetEndPage);
    const calculated = await this.calculateRange({
      fromSurah: input.fromSurah,
      fromAyah: input.fromAyah,
      toSurah: endMeta.surahNumber,
      toAyah: endMeta.ayahNumber
    });

    return {
      fromSurah: input.fromSurah,
      fromAyah: input.fromAyah,
      toSurah: endMeta.surahNumber,
      toAyah: endMeta.ayahNumber,
      fromPage: calculated.fromPage,
      toPage: calculated.toPage,
      pagesCount: calculated.pagesCount
    };
  },

  async previewRange(input: QuranRangeInput) {
    const range = await this.calculateRange(input);

    const [startAyah, endAyah] = await Promise.all([
      readAyahTextFromProvider(input.fromSurah, input.fromAyah),
      readAyahTextFromProvider(input.toSurah, input.toAyah)
    ]);

    const surahIds = Array.from(
      { length: input.toSurah - input.fromSurah + 1 },
      (_, index) => input.fromSurah + index
    );

    const surahRanges = await Promise.all(
      surahIds.map(async (surahNumber) => {
        const surah = await readSurahTextFromProvider(surahNumber);
        if (!surah) {
          throw new AppError(
            "مزود نص القرآن غير متاح لهذه المعاينة",
            503,
            { surahNumber },
            "QURAN_TEXT_UNAVAILABLE"
          );
        }

        const startIndex = surahNumber === input.fromSurah ? input.fromAyah : 1;
        const endIndex = surahNumber === input.toSurah ? input.toAyah : getSurahAyahCount(surahNumber);

        return {
          surahNumber,
          ayahs: surah.ayahs.filter(
            (ayah) => ayah.ayahNumber >= startIndex && ayah.ayahNumber <= endIndex
          )
        };
      })
    );

    return {
      ...range,
      startAyah:
        startAyah === null
          ? null
          : {
              surahNumber: startAyah.surahNumber,
              ayahNumber: startAyah.ayahNumber,
              text: startAyah.text,
              pageNumber: startAyah.pageNumber
            },
      endAyah:
        endAyah === null
          ? null
          : {
              surahNumber: endAyah.surahNumber,
              ayahNumber: endAyah.ayahNumber,
              text: endAyah.text,
              pageNumber: endAyah.pageNumber
            },
      surahs: surahRanges
    };
  }
};
