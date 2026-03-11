import { AllowedCurrency } from '../../generated/prisma';
import { prisma } from '../database/prismaClient';
import { IAllowedCurrencyRepository } from './interfaces/IAllowedCurrencyRepository';

export class AllowedCurrencyRepositoryImpl implements IAllowedCurrencyRepository {

  async findAll(): Promise<AllowedCurrency[]> {
    return prisma.allowedCurrency.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async findActive(): Promise<AllowedCurrency[]> {
    return prisma.allowedCurrency.findMany({
      where:   { isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async findByCode(code: string): Promise<AllowedCurrency | null> {
    return prisma.allowedCurrency.findUnique({
      where: { code: code.toUpperCase() },
    });
  }

  async upsert(code: string, naziv: string): Promise<AllowedCurrency> {
    return prisma.allowedCurrency.upsert({
      where:  { code: code.toUpperCase() },
      update: { naziv },
      create: { code: code.toUpperCase(), naziv, isActive: true },
    });
  }

  async setActive(code: string, isActive: boolean): Promise<AllowedCurrency> {
    return prisma.allowedCurrency.update({
      where: { code: code.toUpperCase() },
      data:  { isActive },
    });
  }
}
