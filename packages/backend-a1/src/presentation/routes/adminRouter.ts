import { Router }          from 'express';
import { adminController } from '../controllers/AdminController';

export const adminRouter = Router();

// ── Salon Info ───────────────────────────────────────
// PUT /api/admin/salon-info
adminRouter.put(
  '/salon-info',
  (req, res) => adminController.updateSalonInfo(req, res),
);

// ── Kategorije ───────────────────────────────────────
// GET /api/admin/categories
adminRouter.get(
  '/categories',
  (req, res) => adminController.getCategories(req, res),
);

// POST /api/admin/categories
adminRouter.post(
  '/categories',
  (req, res) => adminController.createCategory(req, res),
);

// PUT /api/admin/categories/:id
adminRouter.put(
  '/categories/:id',
  (req, res) => adminController.updateCategory(req, res),
);

// DELETE /api/admin/categories/:id  (soft-delete)
adminRouter.delete(
  '/categories/:id',
  (req, res) => adminController.deleteCategory(req, res),
);

// ── Usluge ───────────────────────────────────────────
// GET /api/admin/services
adminRouter.get(
  '/services',
  (req, res) => adminController.getServices(req, res),
);

// POST /api/admin/services
adminRouter.post(
  '/services',
  (req, res) => adminController.createService(req, res),
);

// PUT /api/admin/services/:id
adminRouter.put(
  '/services/:id',
  (req, res) => adminController.updateService(req, res),
);

// DELETE /api/admin/services/:id  (soft-delete)
adminRouter.delete(
  '/services/:id',
  (req, res) => adminController.deleteService(req, res),
);

// ── Valute ───────────────────────────────────────────
// GET /api/admin/currencies
adminRouter.get(
  '/currencies',
  (req, res) => adminController.getCurrencies(req, res),
);

// POST /api/admin/currencies  (create or update)
adminRouter.post(
  '/currencies',
  (req, res) => adminController.upsertCurrency(req, res),
);

// PATCH /api/admin/currencies/:code/toggle
adminRouter.patch(
  '/currencies/:code/toggle',
  (req, res) => adminController.toggleCurrency(req, res),
);

// ── Popust ───────────────────────────────────────────
// GET /api/admin/discount-config
adminRouter.get(
  '/discount-config',
  (req, res) => adminController.getDiscountConfig(req, res),
);

// PUT /api/admin/discount-config
adminRouter.put(
  '/discount-config',
  (req, res) => adminController.updateDiscountConfig(req, res),
);
