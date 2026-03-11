import { AllowedCurrency } from '../../../generated/prisma';

export interface IAllowedCurrencyRepository {
  findAll(): Promise<AllowedCurrency[]>;
  findActive(): Promise<AllowedCurrency[]>;
  findByCode(code: string): Promise<AllowedCurrency | null>;
  upsert(code: string, naziv: string): Promise<AllowedCurrency>;
  setActive(code: string, isActive: boolean): Promise<AllowedCurrency>;
}
