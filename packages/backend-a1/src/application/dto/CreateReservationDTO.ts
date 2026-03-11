import { z } from 'zod';

export const ServiceSelectionSchema = z.object({
  serviceId:    z.number().int().positive('Service ID mora biti pozitivan broj'),
  slotDatetime: z
    .string()
    .datetime({ message: 'Neispravan format datuma termina (ISO 8601)' })
    .refine(
      (dt) => new Date(dt) > new Date(),
      'Termin mora biti u budućnosti',
    ),
});

export const PersonalDataSchema = z.object({
  ime:           z.string().min(2, 'Ime mora imati bar 2 karaktera').max(100),
  prezime:       z.string().min(2, 'Prezime mora imati bar 2 karaktera').max(100),
  email:         z.string().email('Neispravan format email adrese'),
  adresa:        z.string().min(3, 'Adresa je obavezna').max(255),
  postanskiBroj: z.string().min(4, 'Poštanski broj mora imati bar 4 karaktera').max(20),
  mesto:         z.string().min(2, 'Mesto je obavezno').max(100),
  drzava:        z.string().min(2, 'Država je obavezna').max(100),
});

export const CreateReservationSchema = z.object({
  personalData: PersonalDataSchema,
  services:     z
    .array(ServiceSelectionSchema)
    .min(1, 'Morate odabrati bar jednu uslugu')
    .max(10, 'Ne možete rezervisati više od 10 usluga odjednom'),
  currency:     z
    .string()
    .length(3, 'Valuta mora biti ISO 4217 kod (3 karaktera)')
    .toUpperCase(),
  promoCode:    z
    .string()
    .optional()
    .transform((v) => v?.toUpperCase().trim()),
});

export const CalculatePriceSchema = z.object({
  serviceIds: z
    .array(z.number().int().positive())
    .min(1, 'Morate odabrati bar jednu uslugu'),
  currency:   z.string().length(3).toUpperCase(),
  promoCode:  z.string().optional().transform((v) => v?.toUpperCase().trim()),
});

export const AvailableSlotsQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum mora biti u formatu YYYY-MM-DD')
    .refine((d) => {
      const date = new Date(d);
      return !isNaN(date.getTime());
    }, 'Neispravan datum'),
});

export const ModifyReservationSchema = z.object({
  sifra: z.string().min(1, 'Šifra je obavezna'),
  email: z.string().email('Neispravan email'),
});

export const AddServiceSchema = z.object({
  sifra:        z.string().min(1),
  email:        z.string().email(),
  serviceId:    z.number().int().positive(),
  slotDatetime: z
    .string()
    .datetime()
    .refine(
      (dt) => new Date(dt) > new Date(),
      'Termin mora biti u budućnosti',
    ),
});

export const RemoveServiceSchema = z.object({
  sifra:        z.string().min(1),
  email:        z.string().email(),
  serviceId:    z.number().int().positive(),
  slotDatetime: z.string().datetime(),
});

export const CancelReservationSchema = z.object({
  sifra: z.string().min(1, 'Šifra je obavezna'),
  email: z.string().email('Neispravan email'),
});

export type CreateReservationInput  = z.infer<typeof CreateReservationSchema>;
export type CalculatePriceInput     = z.infer<typeof CalculatePriceSchema>;
export type AddServiceInput         = z.infer<typeof AddServiceSchema>;
export type RemoveServiceInput      = z.infer<typeof RemoveServiceSchema>;
export type CancelReservationInput  = z.infer<typeof CancelReservationSchema>;
