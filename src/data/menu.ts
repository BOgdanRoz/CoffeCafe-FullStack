// Fictional menu for Morrow Coffee. Prices are in Ukrainian hryvnia (₴).

export type MenuItem = {
  name: string;
  description?: string;
  price: number;
};

export type MenuCategory = {
  id: string;
  title: string;
  items: MenuItem[];
};

export const menuCategories: MenuCategory[] = [
  {
    id: 'coffee',
    title: 'Кава',
    items: [
      { name: 'Еспресо', description: 'Насичений, з карамельною ноткою', price: 55 },
      { name: 'Американо', price: 65 },
      { name: 'Капучино', description: 'Густа молочна піна', price: 85 },
      { name: 'Лате', price: 90 },
      { name: 'Флет вайт', description: 'Подвійний еспресо з оксамитовим молоком', price: 95 },
    ],
  },
  {
    id: 'non-coffee',
    title: 'Без кави',
    items: [
      { name: 'Матча лате', description: 'Японська матча з вівсяним або звичайним молоком', price: 110 },
      { name: 'Гаряче какао', description: 'З маршмелоу', price: 95 },
      { name: 'Чай «Жасмин»', price: 70 },
      { name: 'Лимонад з м’ятою', price: 80 },
      { name: 'Чай «Ромашка»', price: 65 },
    ],
  },
  {
    id: 'pastry',
    title: 'Випічка',
    items: [
      { name: 'Круасан з маслом', description: 'Випікаємо щоранку', price: 75 },
      { name: 'Кавовий чізкейк', price: 120 },
      { name: 'Банановий хліб', price: 65 },
      { name: 'Шоколадний мафін', price: 70 },
    ],
  },
];
