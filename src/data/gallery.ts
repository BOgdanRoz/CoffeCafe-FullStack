// Gallery photos. All images are from Unsplash or Pexels; see CREDITS.md.

export type GalleryItem = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

export const galleryItems: GalleryItem[] = [
  {
    src: '/images/gallery-cozy-interior.jpg',
    alt: 'Затишний зал кав’ярні з темним оксамитовим диваном, кремовими стільцями та великим вікном',
    caption: 'Зал вранці',
    width: 1600,
    height: 2133,
  },
  {
    src: '/images/gallery-latte-art.jpg',
    alt: 'Латте з малюнком серця в коричневій керамічній чашці на дерев’яному столі',
    caption: 'Латте-арт',
    width: 1600,
    height: 1067,
  },
  {
    src: '/images/menu-croissant.jpg',
    alt: 'Золотистий круасан на дерев’яній дошці крупним планом',
    caption: 'Круасан зі свіжої випічки',
    width: 1600,
    height: 1067,
  },
];
