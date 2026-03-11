import { DiscountConfig } from '../../../generated/prisma';

export interface IDiscountConfigRepository {
  getActive(): Promise<DiscountConfig | null>;

  upsert(
    discountPercentage: number,
    validUntil:         Date,
  ): Promise<DiscountConfig>;
}
