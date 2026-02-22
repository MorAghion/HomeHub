/**
 * Hebrew Icon Mapping
 *
 * Maps Hebrew keywords to the same LucideIcon values as iconMapping.ts.
 * Hebrew keyword keys → same icon values.
 */

import {
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
  Map,
  Sparkles,
  Receipt,
  Flame,
  LayoutList,
  type LucideIcon
} from 'lucide-react';

const heIconMap: Record<string, LucideIcon> = {
  // Global priority
  'חופשה': Map,
  'מסיבה': Sparkles,
  'קניות': ShoppingBag,
  'חשבונות': Receipt,
  'בית': Home,
  'דחוף': Flame,

  // Shopping contexts
  'קניות שבועיות': ShoppingBag,
  'מכולת': ShoppingBag,
  'סופרמרקט': Store,
  'שוק': Store,
  'מלאי': Package,
  'מחסן': Package,
  'אוכל': Apple,
  'מסעדה': UtensilsCrossed,
  'תרופות': Pill,
  'בית מרקחת': Pill,

  // Home & DIY
  'דירה': Home,
  'שיפוץ': Hammer,
  'DIY': Hammer,
  'כלי עבודה': Hammer,
  'צביעה': PaintBucket,
  'עיצוב': Lightbulb,
  'ריהוט': Home,
  'גינה': Trees,
  'גינון': Trees,

  // Family & Lifestyle
  'תינוק': Baby,
  'ילדים': Baby,
  'כלב': Dog,
  'חיות מחמד': Dog,
  'חתול': Cat,
  'אפייה': Cake,
  'חגיגה': Sparkles,

  // Vouchers & Gifts
  'מתנה': Gift,
  'שובר': Ticket,
  'כרטיס': CreditCard,
  'קולנוע': Film,
  'סרט': Film,

  // Travel
  'טיסה': Plane,
  'טיול': Plane,
  'נסיעה': Plane,
  'חו"ל': Plane,
  'קמפינג': Tent,
  'הרים': Mountain,
  'חוף': Palmtree,
  'מלון': Hotel,
  'רכב': Car,
  'אוטובוס': Bus,
  'רכבת': Train,

  // Tasks
  'משימה': CheckSquare,
  'משימות': ListTodo,
  'רשימת מטלות': ListTodo,
  'רשימה': ClipboardList,
  'לוח שנה': Calendar,
  'לוח זמנים': Clock,
  'מהיר': Zap,

  // Default fallback
  'כללי': LayoutList,
  'אחר': LayoutList,
};

/**
 * Get icon based on Hebrew context name.
 * Returns null if no match found (caller should fall back to English map).
 */
export const getContextIconHe = (name: string): LucideIcon | null => {
  const trimmed = name.trim();

  // Check for exact match first
  if (heIconMap[trimmed]) {
    return heIconMap[trimmed];
  }

  // Check for partial matches (keyword contained in name)
  for (const [keyword, icon] of Object.entries(heIconMap)) {
    if (trimmed.includes(keyword)) {
      return icon;
    }
  }

  return null;
};

export { heIconMap };
