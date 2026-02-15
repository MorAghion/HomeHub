import {
  ShoppingCart,
  ShoppingBag,
  Store,
  Package,
  Apple,
  UtensilsCrossed,
  Pill,
  Home,
  Lightbulb,
  Hammer,
  PaintBucket,
  Trees,
  Baby,
  Dog,
  Cat,
  Cake,
  PartyPopper,
  Gift,
  Ticket,
  CreditCard,
  Film,
  Plane,
  Car,
  Bus,
  Train,
  Hotel,
  Tent,
  Mountain,
  Palmtree,
  CheckSquare,
  ListTodo,
  ClipboardList,
  Calendar,
  Clock,
  Zap,
  AlertCircle,
  type LucideIcon
} from 'lucide-react';

/**
 * Smart Icon Mapping - Automatically assign icons based on context keywords
 */

const iconMap: Record<string, LucideIcon> = {
  // Shopping contexts
  shopping: ShoppingCart,
  groceries: ShoppingBag,
  grocery: ShoppingBag,
  supermarket: Store,
  market: Store,
  stock: Package,
  pantry: Package,
  food: Apple,
  restaurant: UtensilsCrossed,
  pharmacy: Pill,
  drugstore: Pill,

  // Home & DIY
  home: Home,
  house: Home,
  renovation: Hammer,
  diy: Hammer,
  tools: Hammer,
  paint: PaintBucket,
  decor: Lightbulb,
  furniture: Home,
  garden: Trees,
  gardening: Trees,

  // Family & Lifestyle
  baby: Baby,
  kids: Baby,
  pet: Dog,
  pets: Dog,
  dog: Dog,
  cat: Cat,
  baking: Cake,
  party: PartyPopper,
  celebration: PartyPopper,

  // Vouchers & Gifts
  gift: Gift,
  voucher: Ticket,
  ticket: Ticket,
  card: CreditCard,
  buyme: Gift,
  physical: CreditCard,
  movie: Film,
  movies: Film,
  cinema: Film,
  ontopo: UtensilsCrossed,

  // Travel
  travel: Plane,
  vacation: Palmtree,
  trip: Plane,
  flight: Plane,
  abroad: Plane,
  camping: Tent,
  mountain: Mountain,
  beach: Palmtree,
  hotel: Hotel,
  car: Car,
  bus: Bus,
  train: Train,

  // Tasks
  task: CheckSquare,
  tasks: ListTodo,
  todo: ListTodo,
  checklist: ClipboardList,
  urgent: AlertCircle,
  calendar: Calendar,
  schedule: Clock,
  quick: Zap,

  // Default fallback
  general: ShoppingCart,
  other: CheckSquare
};

/**
 * Get icon based on context name
 * Searches for keywords in the name and returns the matching icon
 */
export const getContextIcon = (name: string): LucideIcon => {
  const lowerName = name.toLowerCase();

  // Check for exact match first
  if (iconMap[lowerName]) {
    return iconMap[lowerName];
  }

  // Check for partial matches (keyword in name)
  for (const [keyword, icon] of Object.entries(iconMap)) {
    if (lowerName.includes(keyword)) {
      return icon;
    }
  }

  // Default fallback based on context
  if (lowerName.includes('shop') || lowerName.includes('buy')) {
    return ShoppingCart;
  }
  if (lowerName.includes('task') || lowerName.includes('do')) {
    return ListTodo;
  }
  if (lowerName.includes('voucher') || lowerName.includes('card') || lowerName.includes('gift')) {
    return Gift;
  }

  // Ultimate fallback
  return ShoppingCart;
};

/**
 * Get hub-level icon (for bottom nav and main hubs)
 */
export const getHubIcon = (hubType: 'shopping' | 'tasks' | 'vouchers'): LucideIcon => {
  switch (hubType) {
    case 'shopping':
      return ShoppingCart;
    case 'tasks':
      return ListTodo;
    case 'vouchers':
      return Gift;
    default:
      return ShoppingCart;
  }
};
