import { discountConfigRepository } from '../../infrastructure/repositories';
import { promoCodeRepository }      from '../../infrastructure/repositories';
import { serviceRepository }        from '../../infrastructure/repositories';
import { exchangeRateService }      from './ExchangeRateService';
import { PriceBreakdown }           from '../../domain/types';

export interface CalculatePriceInput {
  serviceIds: number[];
  currency:   string;
  promoCode?: string;
}

export class PriceCalculationService {

  async calculate(input: CalculatePriceInput): Promise<PriceBreakdown> {
    const { serviceIds, currency, promoCode } = input;

    const services = await serviceRepository.findByIds(serviceIds);
    if (services.length !== serviceIds.length) {
      throw new Error('One or more services not found or inactive');
    }

    const basePriceRsd = services.reduce(
      (sum, svc) => sum + Number(svc.cenaRsd),
      0,
    );

    const discountConfig = await discountConfigRepository.getActive();
    const today          = new Date();
    today.setHours(0, 0, 0, 0);

    let dateBased = false;
    let dateDiscountPct = 0;

    if (
      discountConfig &&
      discountConfig.isActive &&
      new Date(discountConfig.validUntil) >= today
    ) {
      dateBased       = true;
      dateDiscountPct = Number(discountConfig.discountPercentage);
    }

    let promoApplied    = false;
    let promoDiscountPct = 0;
    let promoMessage    = '';

    if (promoCode) {
      const promo = await promoCodeRepository.findByCode(promoCode.toUpperCase());

      if (!promo) {
        promoMessage = 'Promo-kod ne postoji';
      } else if (promo.status !== 'ACTIVE') {
        promoMessage = promo.status === 'USED'
          ? 'Promo-kod je već iskorišćen'
          : 'Promo-kod nije aktivan';
      } else {
        promoApplied    = true;
        promoDiscountPct = Number(promo.discountPercentage);
        promoMessage    = `Promo-kod primenjen (${promoDiscountPct}% popusta)`;
      }
    }

    let discountAmountRsd = 0;
    let discountType: PriceBreakdown['discountType'] = 'NONE';

    if (dateBased && promoApplied) {
      const afterDate  = basePriceRsd * (1 - dateDiscountPct / 100);
      const afterPromo = afterDate    * (1 - promoDiscountPct / 100);
      discountAmountRsd = basePriceRsd - afterPromo;
      discountType      = 'BOTH';
    } else if (dateBased) {
      discountAmountRsd = basePriceRsd * (dateDiscountPct / 100);
      discountType      = 'DATE_BASED';
    } else if (promoApplied) {
      discountAmountRsd = basePriceRsd * (promoDiscountPct / 100);
      discountType      = 'PROMO_CODE';
    }

    discountAmountRsd = Math.round(discountAmountRsd * 100) / 100;
    const finalPriceRsd = Math.round((basePriceRsd - discountAmountRsd) * 100) / 100;

    const rateResult = await exchangeRateService.getRate('RSD', currency);
    const finalPriceForeign = Math.round(finalPriceRsd * rateResult.rate * 100) / 100;

    return {
      basePriceRsd,
      discountPercentage: dateBased
        ? dateDiscountPct + (promoApplied ? promoDiscountPct : 0)
        : promoDiscountPct,
      discountAmountRsd,
      discountType,
      finalPriceRsd,
      exchangeRate:      rateResult.rate,
      finalPriceForeign,
      currency:          currency.toUpperCase(),
      promoCodeApplied:  promoApplied,
      promoCodeMessage:  promoMessage || undefined,
      isStaleRate:       rateResult.isStale,
    };
  }

  async recalculate(
    existingServiceIds: number[],
    newServiceIds:      number[],
    currency:           string,
    originalPromoCode?: string,
  ): Promise<PriceBreakdown> {
    const allServiceIds = [...new Set([...existingServiceIds, ...newServiceIds])];
    return this.calculate({
      serviceIds: allServiceIds,
      currency,
      promoCode:  originalPromoCode,
    });
  }
}

export const priceCalculationService = new PriceCalculationService();
