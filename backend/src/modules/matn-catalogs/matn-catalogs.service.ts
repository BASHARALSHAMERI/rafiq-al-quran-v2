import { AppError } from "../../shared/errors/app-error";
import type { ScopeContext } from "../../shared/types/auth.types";
import { matnCatalogsRepository } from "./matn-catalogs.repository";
import type { CreateMatnDto, ListMatnQueryDto, UpdateMatnDto } from "./matn-catalogs.validation";

export const matnCatalogsService = {

  async list(scope: ScopeContext, query: ListMatnQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;

    const result = await matnCatalogsRepository.list(scope.organizationId, {
      category: query.category,
      isActive: query.isActive,
      search: query.search,
      page,
      pageSize
    });

    return {
      data: result.data,
      page,
      pageSize,
      total: result.total
    };
  },

  async getById(scope: ScopeContext, id: number) {
    const matn = await matnCatalogsRepository.findById(id, scope.organizationId);
    if (!matn) {
      throw new AppError("المتن غير موجود", 404);
    }
    return matn;
  },

  async create(scope: ScopeContext, input: CreateMatnDto) {
    return matnCatalogsRepository.create({
      organizationId: scope.organizationId,
      code: input.code.trim(),
      titleAr: input.titleAr.trim(),
      titleEn: input.titleEn?.trim() ?? null,
      category: input.category.trim(),
      isActive: input.isActive
    });
  },

  async update(scope: ScopeContext, id: number, input: UpdateMatnDto) {
    const existing = await matnCatalogsRepository.findById(id, scope.organizationId);
    if (!existing) {
      throw new AppError("المتن غير موجود", 404);
    }
    return matnCatalogsRepository.update(id, scope.organizationId, input);
  },

  async remove(scope: ScopeContext, id: number) {
    const existing = await matnCatalogsRepository.findById(id, scope.organizationId);
    if (!existing) {
      throw new AppError("المتن غير موجود", 404);
    }
    return matnCatalogsRepository.remove(id, scope.organizationId);
  }
};
