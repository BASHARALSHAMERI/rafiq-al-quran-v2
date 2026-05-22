import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/app-error";
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

  async listExpenseCategories(req: Request, res: Response) {
    const categories = await expensesService.listExpenseCategories(req.scope!);
    res.json({ data: categories });
  },

  async createExpenseCategory(req: Request, res: Response) {
    const category = await expensesService.createExpenseCategory(req.scope!, req.body);
    res.status(201).json({ data: category });
  },

  async listExpenseInvoices(req: Request, res: Response) {
    const centerId = req.query.centerId ? Number(req.query.centerId) : undefined;
    const supplierId = req.query.supplierId ? Number(req.query.supplierId) : undefined;
    const status = req.query.status as any;
    
    const invoices = await expensesService.listExpenseInvoices(req.scope!, { centerId, supplierId, status });
    res.json({ data: invoices });
  },

  async createExpenseInvoice(req: Request, res: Response) {
    const invoice = await expensesService.createExpenseInvoice(req.scope!, req.body);
    res.status(201).json({ data: invoice });
  },

  async approveExpenseInvoice(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError("Invalid ID", 400);

    const invoice = await expensesService.approveExpenseInvoice(req.scope!, id);
    res.json({ data: invoice });
  },

  async payExpenseInvoice(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError("Invalid ID", 400);

    const payment = await expensesService.payExpenseInvoice(req.scope!, id, req.body);
    res.status(201).json({ data: payment });
  }
};
