import type { RequestHandler } from "express";
import type { LocalizedMessage } from "./messages";

export type Lang = "ar" | "en";

export const DEFAULT_LANG: Lang = "ar";

const SUPPORTED_LANGS: string[] = ["ar", "en"];

export const parseAcceptLanguage = (header?: string): Lang => {
  if (!header) return DEFAULT_LANG;

  const raw = header.slice(0, 10).toLowerCase().trim();

  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("ar")) return "ar";

  return DEFAULT_LANG;
};

export const t = (msg: LocalizedMessage, lang: Lang): string => {
  return msg[lang] || msg[DEFAULT_LANG];
};

export const localeMiddleware: RequestHandler = (req, _res, next) => {
  const acceptLang = req.headers["accept-language"] as string | undefined;
  req.lang = parseAcceptLanguage(acceptLang);
  next();
};

declare global {
  namespace Express {
    interface Request {
      lang: Lang;
    }
  }
}
