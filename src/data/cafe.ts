// Fictional business details for the Morrow Coffee portfolio project.
// Edit values here; components read everything from this file.

export const cafe = {
  name: 'Morrow Coffee',
  tagline: 'Спеціальна кав’ярня з теплим світлом і свіжою випічкою',
  address: 'вул. Ранкова, 14, м. Київ',
  phone: '+380 (00) 000-00-00',
  phoneHref: 'tel:+380000000000',
  // General Instagram link. Replace with the profile URL once the owner provides it.
  instagramUrl: 'https://www.instagram.com/',
  openingHours: [
    { days: 'Понеділок – п’ятниця', hours: '08:00 – 21:00' },
    { days: 'Субота – неділя', hours: '09:00 – 22:00' },
  ],
  // Time grid for the table availability view (demo data).
  reservationFirstSlot: '08:00',
  reservationLastSlot: '20:00',
  reservationSlotMinutes: 30,
} as const;
