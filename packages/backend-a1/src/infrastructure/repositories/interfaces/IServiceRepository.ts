import { Service, ServiceCategory } from '../../../generated/prisma';

export type ServiceWithCategory = Service & {
  category: ServiceCategory;
};

export type CategoryWithServices = ServiceCategory & {
  services: Service[];
};

export interface IServiceRepository {
  findAll(): Promise<ServiceWithCategory[]>;

  findById(id: number): Promise<ServiceWithCategory | null>;

  findAllByCategory(): Promise<CategoryWithServices[]>;

  findByIds(ids: number[]): Promise<ServiceWithCategory[]>;
}
