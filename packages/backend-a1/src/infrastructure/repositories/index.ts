import { ReservationRepositoryImpl }     from './ReservationRepositoryImpl';
import { ServiceRepositoryImpl }         from './ServiceRepositoryImpl';
import { PromoCodeRepositoryImpl }       from './PromoCodeRepositoryImpl';
import { DiscountConfigRepositoryImpl }  from './DiscountConfigRepositoryImpl';
import { SalonInfoRepositoryImpl }       from './SalonInfoRepositoryImpl';
import { AllowedCurrencyRepositoryImpl } from './AllowedCurrencyRepositoryImpl';

export const reservationRepository     = new ReservationRepositoryImpl();
export const serviceRepository         = new ServiceRepositoryImpl();
export const promoCodeRepository       = new PromoCodeRepositoryImpl();
export const discountConfigRepository  = new DiscountConfigRepositoryImpl();
export const salonInfoRepository       = new SalonInfoRepositoryImpl();
export const allowedCurrencyRepository = new AllowedCurrencyRepositoryImpl();

export type { IReservationRepository }     from './interfaces/IReservationRepository';
export type { IServiceRepository }         from './interfaces/IServiceRepository';
export type { IPromoCodeRepository }       from './interfaces/IPromoCodeRepository';
export type { IDiscountConfigRepository }  from './interfaces/IDiscountConfigRepository';
export type { ISalonInfoRepository }       from './interfaces/ISalonInfoRepository';
export type { IAllowedCurrencyRepository } from './interfaces/IAllowedCurrencyRepository';
