import type { RequestHandler } from "express";
import { quranService, type QuranRangeInput } from "./quran.service";

export const quranController = {
  calculateRange: (async (req, res, next) => {
    try {
      const input = req.body as QuranRangeInput;
      const data = await quranService.calculateRange(input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler,

  previewRange: (async (req, res, next) => {
    try {
      const input = req.body as QuranRangeInput;
      const data = await quranService.previewRange(input);
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  }) as RequestHandler
};
