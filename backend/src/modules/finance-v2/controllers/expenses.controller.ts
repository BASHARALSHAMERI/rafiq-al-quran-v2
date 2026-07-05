import { ExpenseInvoiceStatus } from "@prisma/client";
import { Request, Response } from "express";
import { expensesService } from "../services/expenses.service";

export const expensesController = {
  async listSuppliers(req: Request, res: Response) {
    const suppliers = await expensesService.listSuppliers(req.scope!);
    res.json({ data: suppliers });
  },

  async createSupplier(req: Request, res: Response) {
    const supplier = await expensesService.createSupplier(req.scope!, req.body);
    res.status(201).json({ data: supplier });
  },

  async updateSupplier(req: Request, res: Response) {
    const { id } = res.locals.validatedParams as { id: number };
    const supplier = await expensesService.updateSupplier(req.scope!, id, req.body);
    res.json({ data: supplier });
  },

  async listExpenseCategories(req: Request, res: Response) {
    const categories = await expensesService.listExpenseCategories(req.scope!);
    res.json({ data: categories });
  },

  async createExpenseCategory(req: Request, res: Response) {
    const category = await expensesService.createExpenseCategory(req.scope!, req.body);
    res.status(201).json({ data: category });
  },

  async updateExpenseCategory(req: Request, res: Response) {
    const { id } = res.locals.validatedParams as { id: number };
    const category = await expensesService.updateExpenseCategory(req.scope!, id, req.body);
    res.json({ data: category });
  },

  async listExpenseInvoices(req: Request, res: Response) {
    const query = res.locals.validatedQuery as {
      centerId?: number;
      supplierId?: number;
      status?: ExpenseInvoiceStatus;
    };
    const invoices = await expensesService.listExpenseInvoices(req.scope!, query);
    res.json({ data: invoices });
  },

  async createExpenseInvoice(req: Request, res: Response) {
    const invoice = await expensesService.createExpenseInvoice(req.scope!, req.body);
    res.status(201).json({ data: invoice });
  },

  async approveExpenseInvoice(req: Request, res: Response) {
    const { id } = res.locals.validatedParams as { id: number };
    const invoice = await expensesService.approveExpenseInvoice(req.scope!, id);
    res.json({ data: invoice });
  },

  async payExpenseInvoice(req: Request, res: Response) {
    const { id } = res.locals.validatedParams as { id: number };
    const payment = await expensesService.payExpenseInvoice(req.scope!, id, req.body);
    res.status(201).json({ data: payment });
  },

  async cancelExpenseInvoice(req: Request, res: Response) {
    const { id } = res.locals.validatedParams as { id: number };
    const { reason } = res.locals.validatedBody as { reason?: string };
    const invoice = await expensesService.cancelExpenseInvoice(req.scope!, id, reason);
    res.json({ data: invoice });
  }
};
