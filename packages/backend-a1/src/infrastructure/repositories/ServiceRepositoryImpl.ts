import { prisma } from '../database/prismaClient';
import {
  IServiceRepository,
  ServiceWithCategory,
  CategoryWithServices,
} from './interfaces/IServiceRepository';

export class ServiceRepositoryImpl implements IServiceRepository {

  async findAll(): Promise<ServiceWithCategory[]> {
    return prisma.service.findMany({
      where:   { isActive: true },
      include: { category: true },
      orderBy: [
        { category: { naziv: 'asc' } },
        { naziv: 'asc' },
      ],
    }) as Promise<ServiceWithCategory[]>;
  }

  async findById(id: number): Promise<ServiceWithCategory | null> {
    return prisma.service.findFirst({
      where:   { id, isActive: true },
      include: { category: true },
    }) as Promise<ServiceWithCategory | null>;
  }

  async findAllByCategory(): Promise<CategoryWithServices[]> {
    return prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        services: {
          where:   { isActive: true },
          orderBy: { naziv: 'asc' },
        },
      },
      orderBy: { naziv: 'asc' },
    }) as Promise<CategoryWithServices[]>;
  }

  async findByIds(ids: number[]): Promise<ServiceWithCategory[]> {
    return prisma.service.findMany({
      where:   { id: { in: ids }, isActive: true },
      include: { category: true },
    }) as Promise<ServiceWithCategory[]>;
  }
}
