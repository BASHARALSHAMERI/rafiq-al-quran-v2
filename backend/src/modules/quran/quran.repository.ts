import { prisma } from "../../shared/db/prisma";

export const quranRepository = {
  findAyahIndex(input: { surahNumber: number; ayahNumber: number }) {
    return prisma.quranAyahIndex.findUnique({
      where: {
        surahNumber_ayahNumber: {
          surahNumber: input.surahNumber,
          ayahNumber: input.ayahNumber
        }
      },
      select: {
        surahNumber: true,
        ayahNumber: true,
        pageNumber: true,
        juzNumber: true,
        hizbQuarter: true,
        provider: true,
        providerVersion: true,
        fetchedAt: true
      }
    });
  },

  findLastAyahOnPage(pageNumber: number) {
    return prisma.quranAyahIndex.findFirst({
      where: { pageNumber },
      orderBy: [{ surahNumber: "desc" }, { ayahNumber: "desc" }],
      select: {
        surahNumber: true,
        ayahNumber: true,
        pageNumber: true,
        juzNumber: true,
        hizbQuarter: true,
        provider: true,
        providerVersion: true,
        fetchedAt: true
      }
    });
  },

  upsertAyahIndex(input: {
    surahNumber: number;
    ayahNumber: number;
    pageNumber: number;
    juzNumber: number;
    hizbQuarter?: number | null;
    provider: string;
    providerVersion?: string | null;
  }) {
    return prisma.quranAyahIndex.upsert({
      where: {
        surahNumber_ayahNumber: {
          surahNumber: input.surahNumber,
          ayahNumber: input.ayahNumber
        }
      },
      create: {
        surahNumber: input.surahNumber,
        ayahNumber: input.ayahNumber,
        pageNumber: input.pageNumber,
        juzNumber: input.juzNumber,
        hizbQuarter: input.hizbQuarter ?? null,
        provider: input.provider,
        providerVersion: input.providerVersion ?? null,
        fetchedAt: new Date()
      },
      update: {
        pageNumber: input.pageNumber,
        juzNumber: input.juzNumber,
        hizbQuarter: input.hizbQuarter ?? null,
        provider: input.provider,
        providerVersion: input.providerVersion ?? null,
        fetchedAt: new Date()
      }
    });
  },

  async upsertManyAyahIndex(
    items: Array<{
      surahNumber: number;
      ayahNumber: number;
      pageNumber: number;
      juzNumber: number;
      hizbQuarter?: number | null;
      provider: string;
      providerVersion?: string | null;
    }>
  ) {
    await Promise.all(
      items.map((item) =>
        this.upsertAyahIndex({
          surahNumber: item.surahNumber,
          ayahNumber: item.ayahNumber,
          pageNumber: item.pageNumber,
          juzNumber: item.juzNumber,
          hizbQuarter: item.hizbQuarter ?? null,
          provider: item.provider,
          providerVersion: item.providerVersion ?? null
        })
      )
    );
  }
};
