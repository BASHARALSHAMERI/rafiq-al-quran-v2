import { FixedAssetStatus } from "@prisma/client";
import type { Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
import { assetsService } from "../services/assets.service";

const parseId = (value: string | string[] | undefined) => {
  const id = Number(Array.isArray(value) ? value[0] : value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError("Invalid ID", 400);
  }
  return id;
};

const parseStatus = (value: unknown) => {
  if (!value) return undefined;
  if (typeof value !== "string" || !(value in FixedAssetStatus)) {
    throw new AppError("Invalid asset status", 400);
  }
  return value as FixedAssetStatus;
};

export const assetsController = {
  // ─── Asset Categories ─────────────────────────────────────────────────────

  async listAssetCategories(req: Request, res: Response) {
    const categories = await assetsService.listAssetCategories(req.scope!);
    res.json({ data: categories });
  },

  async createAssetCategory(req: Request, res: Response) {
    const category = await assetsService.createAssetCategory(req.scope!, req.body);
    res.status(201).json({ data: category });
  },

  async updateAssetCategory(req: Request, res: Response) {
    const categoryId = parseId(req.params.id);
    const category = await assetsService.updateAssetCategory(req.scope!, categoryId, req.body);
    res.json({ data: category });
  },

  async deactivateAssetCategory(req: Request, res: Response) {
    const categoryId = parseId(req.params.id);
    const category = await assetsService.deactivateAssetCategory(req.scope!, categoryId);
    res.json({ data: category });
  },

  // ─── Fixed Assets ─────────────────────────────────────────────────────────

  async listFixedAssets(req: Request, res: Response) {
    const assets = await assetsService.listFixedAssets(req.scope!, {
      centerId: req.query.centerId ? Number(req.query.centerId) : undefined,
      categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
      status: parseStatus(req.query.status)
    });
    res.json({ data: assets });
  },

  async getFixedAsset(req: Request, res: Response) {
    const assetId = parseId(req.params.id);
    const asset = await assetsService.getFixedAsset(req.scope!, assetId);
    res.json({ data: asset });
  },

  async createFixedAsset(req: Request, res: Response) {
    const asset = await assetsService.createFixedAsset(req.scope!, req.body);
    res.status(201).json({ data: asset });
  },

  async updateFixedAsset(req: Request, res: Response) {
    const assetId = parseId(req.params.id);
    const asset = await assetsService.updateFixedAsset(req.scope!, assetId, req.body);
    res.json({ data: asset });
  },

  async deactivateFixedAsset(req: Request, res: Response) {
    const assetId = parseId(req.params.id);
    const asset = await assetsService.deactivateFixedAsset(req.scope!, assetId);
    res.json({ data: asset });
  },

  async reactivateFixedAsset(req: Request, res: Response) {
    const assetId = parseId(req.params.id);
    const asset = await assetsService.reactivateFixedAsset(req.scope!, assetId);
    res.json({ data: asset });
  },

  // ─── Custody Logs ─────────────────────────────────────────────────────────

  async listCustodyLogs(req: Request, res: Response) {
    const logs = await assetsService.listCustodyLogs(req.scope!, {
      assetId: req.query.assetId ? Number(req.query.assetId) : undefined
    });
    res.json({ data: logs });
  },

  async assignCustody(req: Request, res: Response) {
    const assetId = parseId(req.params.id);
    const custody = await assetsService.assignCustody(req.scope!, assetId, req.body);
    res.status(201).json({ data: custody });
  },

  async releaseCustody(req: Request, res: Response) {
    const custodyId = parseId(req.params.id);
    const custody = await assetsService.releaseCustody(req.scope!, custodyId, req.body);
    res.json({ data: custody });
  },

  async updateCustodyLog(req: Request, res: Response) {
    const custodyId = parseId(req.params.id);
    const custody = await assetsService.updateCustodyLog(req.scope!, custodyId, req.body);
    res.json({ data: custody });
  },

  async deleteCustodyLog(req: Request, res: Response) {
    const custodyId = parseId(req.params.id);
    await assetsService.deleteCustodyLog(req.scope!, custodyId);
    res.json({ success: true });
  },

  // ─── Acquisition & Depreciation ───────────────────────────────────────────

  async postAssetAcquisition(req: Request, res: Response) {
    const assetId = parseId(req.params.id);
    const result = await assetsService.postAssetAcquisition(req.scope!, assetId, req.body);
    res.status(201).json({ data: result });
  },

  async postAssetDepreciation(req: Request, res: Response) {
    const assetId = parseId(req.params.id);
    const result = await assetsService.postAssetDepreciation(req.scope!, assetId, req.body);
    res.status(201).json({ data: result });
  }
};
