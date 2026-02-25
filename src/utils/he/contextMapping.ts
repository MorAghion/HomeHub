/**
 * Hebrew Context Recognition Mapping Engine
 *
 * Mirrors contextMapping.ts with Hebrew keywords and Hebrew item names.
 * listCategory values remain in English — they are internal keys.
 */

import type { ContextItem, ContextDefinition } from '../contextMapping';

export const CONTEXT_RECOGNITION_MAPPING_HE: Record<string, ContextDefinition> = {

  'stock': {
    keywords: [
      'מלאי', 'ציוד בית', 'אחסון', 'עתודות', 'אספקה', 'מחסן',
      'סחורה', 'מוצרי בית', 'הצטיידות', 'רזרבה',
      'ניקיון', 'נקיון', 'ניקוי', 'ניקוי הבית'
    ],
    displayLabel: 'מלאי ביתי',
    items: [
      { name: 'סוללות', listCategory: 'Cleaning' },
      { name: 'נורות', listCategory: 'Cleaning' },
      { name: 'נייר טואלט', listCategory: 'Cleaning' },
      { name: 'סבון', listCategory: 'Cleaning' },
      { name: 'ספוגיות', listCategory: 'Cleaning' },
      { name: 'מגבות נייר', listCategory: 'Cleaning' },
      { name: 'שקיות אשפה', listCategory: 'Cleaning' },
      { name: 'נייר כסף', listCategory: 'Cleaning' },
      { name: 'שקיות ניילון', listCategory: 'Cleaning' },
      { name: 'חומרי ניקוי', listCategory: 'Cleaning' },
      { name: 'טישו', listCategory: 'Cleaning' },
      { name: 'ניילון נצמד', listCategory: 'Cleaning' },
      { name: 'שקיות זיפלוק', listCategory: 'Cleaning' },
      { name: 'סבון כלים', listCategory: 'Cleaning' },
      { name: 'אבקת כביסה', listCategory: 'Cleaning' },
      { name: 'אקונומיקה', listCategory: 'Cleaning' },
      { name: 'מטהר אוויר', listCategory: 'Cleaning' },
      { name: 'מגבונים חיטוי', listCategory: 'Cleaning' },
      { name: 'שקיות שואב אבק', listCategory: 'Cleaning' },
      { name: 'ניילון לזגוגיות', listCategory: 'Cleaning' },
    ]
  },

  'grocery': {
    keywords: [
      'סופרמרקט', 'מכולת', 'קניות', 'אוכל', 'שוק', 'מזון',
      'קניון', 'רמי לוי', 'שופרסל', 'מגה', 'ויקטורי',
      'קאנטרי', 'יינות ביתן', 'קניות שבועיות', 'מזון טרי',
      'מצרכים', 'חנות', 'חנות המכולת', 'ירקות', 'פירות'
    ],
    displayLabel: 'רשימת קניות',
    items: [
      { name: 'חלב', listCategory: 'Dairy' },
      { name: 'גבינה', listCategory: 'Dairy' },
      { name: 'ביצים', listCategory: 'Dairy' },
      { name: 'יוגורט', listCategory: 'Dairy' },
      { name: 'לחם', listCategory: 'Pantry' },
      { name: 'אורז', listCategory: 'Pantry' },
      { name: 'פסטה', listCategory: 'Pantry' },
      { name: 'עוף', listCategory: 'Meat' },
      { name: 'בקר', listCategory: 'Meat' },
      { name: 'סלמון', listCategory: 'Fish' },
      { name: 'עגבניות', listCategory: 'Vegetables' },
      { name: 'ברוקולי', listCategory: 'Vegetables' },
      { name: 'תפוחים', listCategory: 'Fruit' },
      { name: 'בננות', listCategory: 'Fruit' },
      { name: 'חמאה', listCategory: 'Dairy' },
      { name: 'מיץ תפוזים', listCategory: 'Dairy' },
      { name: 'דגני בוקר', listCategory: 'Pantry' },
      { name: 'תפוחי אדמה', listCategory: 'Vegetables' },
      { name: 'גזר', listCategory: 'Vegetables' },
      { name: 'תפוזים', listCategory: 'Fruit' },
    ]
  },

  'pharmacy': {
    keywords: [
      'תרופות', 'בית מרקחת', 'פארמ', 'בריאות', 'ויטמינים',
      'תרופה', 'תרופות מרשם', 'רפואה', 'עזרה ראשונה', 'בריאות ורפואה',
      'היגיינה', 'וויטמינים'
    ],
    displayLabel: 'בית מרקחת',
    items: [
      { name: 'אספירין', listCategory: 'Pharma & Hygiene' },
      { name: 'אדוויל', listCategory: 'Pharma & Hygiene' },
      { name: 'ויטמינים', listCategory: 'Pharma & Hygiene' },
      { name: 'פלסטרים', listCategory: 'Pharma & Hygiene' },
      { name: 'משחת שיניים', listCategory: 'Pharma & Hygiene' },
      { name: 'מברשת שיניים', listCategory: 'Pharma & Hygiene' },
      { name: 'שמפו', listCategory: 'Pharma & Hygiene' },
      { name: 'דאודורנט', listCategory: 'Pharma & Hygiene' },
      { name: 'קרם הגנה', listCategory: 'Pharma & Hygiene' },
      { name: 'ג\'ל חיטוי ידיים', listCategory: 'Pharma & Hygiene' },
      { name: 'סירופ לשיעול', listCategory: 'Pharma & Hygiene' },
      { name: 'תרופה לאלרגיה', listCategory: 'Pharma & Hygiene' },
      { name: 'תרופה לצינון', listCategory: 'Pharma & Hygiene' },
      { name: 'תמיסת עדשות מגע', listCategory: 'Pharma & Hygiene' },
      { name: 'מקלוני אוזניים', listCategory: 'Pharma & Hygiene' },
      { name: 'אלכוהול לחיטוי', listCategory: 'Pharma & Hygiene' },
      { name: 'מד חום', listCategory: 'Pharma & Hygiene' },
      { name: 'גזה', listCategory: 'Pharma & Hygiene' },
      { name: 'כרית חימום', listCategory: 'Pharma & Hygiene' },
      { name: 'טישו פנים', listCategory: 'Pharma & Hygiene' },
    ]
  },

  'camping': {
    keywords: [
      'קמפינג', 'טיול', 'טבע', 'מחנה', 'גן לאומי',
      'טיול רגלי', 'טרק', 'הרים', 'שמורת טבע', 'לילה בטבע',
      'ישיבת שטח', 'קמפ', 'ביצות', 'נחל', 'מדבר',
      'אוהל', 'שטח', 'נאות'
    ],
    displayLabel: 'טיול קמפינג',
    items: [
      { name: 'אוהל', listCategory: 'Camping' },
      { name: 'שק שינה', listCategory: 'Camping' },
      { name: 'תרמיל גב', listCategory: 'Camping' },
      { name: 'פנס', listCategory: 'Camping' },
      { name: 'חבל', listCategory: 'Camping' },
      { name: 'צידנית', listCategory: 'Camping' },
      { name: 'כיריים קמפינג', listCategory: 'Camping' },
      { name: 'בקבוק מים', listCategory: 'Camping' },
      { name: 'מזרן שינה', listCategory: 'Camping' },
      { name: 'פנס יד', listCategory: 'Camping' },
      { name: 'ערכת עזרה ראשונה', listCategory: 'Camping' },
      { name: 'גפרורים / מצית', listCategory: 'Camping' },
      { name: 'כיסא קמפינג', listCategory: 'Camping' },
      { name: 'תרסיס נגד יתושים', listCategory: 'Camping' },
      { name: 'נעלי הליכה', listCategory: 'Camping' },
      { name: 'מפה ומצפן', listCategory: 'Camping' },
      { name: 'עצי הסקה', listCategory: 'Camping' },
      { name: 'סכין קמפינג', listCategory: 'Camping' },
      { name: 'ערסל', listCategory: 'Camping' },
      { name: 'מטען נייד', listCategory: 'Camping' },
    ]
  },

  'abroad': {
    keywords: [
      'חו"ל', 'טיסה', 'נסיעה', 'חופשה', 'תיירות',
      'נסיעה לחו"ל', 'טיול לחו"ל', 'קרוז', 'בית מלון',
      'אטרקציות', 'ויזה', 'דרכון', 'ביטוח נסיעות', 'גולה', 'שהייה בחו"ל'
    ],
    displayLabel: 'טיסה לחו"ל',
    items: [
      { name: 'דרכון', listCategory: 'Documents & Money' },
      { name: 'ביטוח נסיעות', listCategory: 'Documents & Money' },
      { name: 'ויזה', listCategory: 'Documents & Money' },
      { name: 'מתאם חשמל', listCategory: 'Cleaning' },
      { name: 'מזוודה', listCategory: 'Camping' },
      { name: 'תרופות לנסיעה', listCategory: 'Pharma & Hygiene' },
      { name: 'קרם הגנה', listCategory: 'Pharma & Hygiene' },
      { name: 'כרית נסיעה', listCategory: 'Camping' },
      { name: 'ארגונית מסמכים', listCategory: 'Documents & Money' },
      { name: 'המרת מטבע', listCategory: 'Documents & Money' },
      { name: 'מדריך טיולים', listCategory: 'Documents & Money' },
      { name: 'מטען לטלפון', listCategory: 'Cleaning' },
      { name: 'תרחישי טיסה', listCategory: 'Pharma & Hygiene' },
      { name: 'מצלמה', listCategory: 'Cleaning' },
      { name: 'מנעול מזוודה', listCategory: 'Camping' },
      { name: 'נשנושים לטיסה', listCategory: 'Pantry' },
      { name: 'אטמי אוזניים', listCategory: 'Pharma & Hygiene' },
      { name: 'מסכת שינה', listCategory: 'Pharma & Hygiene' },
      { name: 'בקבוק מים לשימוש חוזר', listCategory: 'Camping' },
      { name: 'תרמיל יום', listCategory: 'Camping' },
    ]
  },

  'baby': {
    keywords: [
      'תינוק', 'תינוקת', 'תינוקות', 'עגלה', 'ילד', 'ילדים', 'פעוט',
      'לידה', 'הריון', 'משתלת תינוקות', 'אמא ותינוק',
      'טיפוח תינוק', 'ציוד לתינוק', 'ברית', 'מקלחת לתינוק',
      'גן ילדים', 'בייבי'
    ],
    displayLabel: 'ציוד לתינוק',
    items: [
      { name: 'חיתולים', listCategory: 'Baby' },
      { name: 'מגבוני תינוקות', listCategory: 'Baby' },
      { name: 'תמ"ל', listCategory: 'Dairy' },
      { name: 'מזון לתינוק', listCategory: 'Pantry' },
      { name: 'בקבוקי הנקה', listCategory: 'Baby' },
      { name: 'מוצצים', listCategory: 'Baby' },
      { name: 'שמפו לתינוק', listCategory: 'Pharma & Hygiene' },
      { name: 'קרם חיתולים', listCategory: 'Pharma & Hygiene' },
      { name: 'שמיכת תינוק', listCategory: 'Baby' },
      { name: 'סדיני עריסה', listCategory: 'Baby' },
      { name: 'קרם לתינוק', listCategory: 'Pharma & Hygiene' },
      { name: 'צעצועי בקיעת שיניים', listCategory: 'Baby' },
      { name: 'מטליות לגיהוק', listCategory: 'Baby' },
      { name: 'מוניטור תינוקות', listCategory: 'Baby' },
      { name: 'תיק החתלה', listCategory: 'Baby' },
      { name: 'בגדי תינוק', listCategory: 'Baby' },
      { name: 'כוסות ספיל-פרוף', listCategory: 'Baby' },
      { name: 'גרביים לתינוק', listCategory: 'Baby' },
      { name: 'כריות הנקה', listCategory: 'Baby' },
      { name: 'מד חום לתינוק', listCategory: 'Pharma & Hygiene' },
    ]
  },

  'home-renovation': {
    keywords: [
      'שיפוץ', 'בנייה', 'צביעה', 'צבע', 'תיקון', 'שיפורים',
      'DIY', 'כלי עבודה', 'חומרי בניין', 'אינסטלציה',
      'חשמל', 'ריצוף', 'גבס', 'עיצוב מחדש', 'שדרוג הבית'
    ],
    displayLabel: 'שיפוץ הבית',
    items: [
      { name: 'צבע', listCategory: 'Home Renovation' },
      { name: 'מברשות צבע', listCategory: 'Home Renovation' },
      { name: 'מסמרים', listCategory: 'Home Renovation' },
      { name: 'ברגים', listCategory: 'Home Renovation' },
      { name: 'לוחות גבס', listCategory: 'Home Renovation' },
      { name: 'שמן לעץ', listCategory: 'Home Renovation' },
      { name: 'נייר שמרגל', listCategory: 'Home Renovation' },
      { name: 'משקפי מגן', listCategory: 'Home Renovation' },
      { name: 'כפפות עבודה', listCategory: 'Home Renovation' },
      { name: 'מסטיק אטימה', listCategory: 'Home Renovation' },
      { name: 'גליל צבע', listCategory: 'Home Renovation' },
      { name: 'ניילון כיסוי', listCategory: 'Home Renovation' },
      { name: 'פריימר', listCategory: 'Home Renovation' },
      { name: 'סרט מסקינג', listCategory: 'Home Renovation' },
      { name: 'ראשי מקדח', listCategory: 'Home Renovation' },
      { name: 'פטיש', listCategory: 'Home Renovation' },
      { name: 'פלס', listCategory: 'Home Renovation' },
      { name: 'טיח', listCategory: 'Home Renovation' },
      { name: 'דבק עץ', listCategory: 'Home Renovation' },
      { name: 'קורות עץ', listCategory: 'Home Renovation' },
    ]
  },

  'baking': {
    keywords: [
      'אפייה', 'עוגה', 'לחם', 'קינוח', 'מאפה',
      'עוגיות', 'ממתקים', 'קאפקייק', 'פאי', 'מתכון',
      'אפיית לחם', 'קרואסון', 'בייגל', 'עוגת שוקולד'
    ],
    displayLabel: 'ציוד אפייה',
    items: [
      { name: 'קמח', listCategory: 'Pantry' },
      { name: 'סוכר', listCategory: 'Pantry' },
      { name: 'חמאה', listCategory: 'Dairy' },
      { name: 'ביצים', listCategory: 'Dairy' },
      { name: 'תמצית וניל', listCategory: 'Pantry' },
      { name: 'סודה לשתייה', listCategory: 'Pantry' },
      { name: 'שבבי שוקולד', listCategory: 'Pantry' },
      { name: 'דבש', listCategory: 'Pantry' },
      { name: 'אבקת אפייה', listCategory: 'Pantry' },
      { name: 'שמן קוקוס', listCategory: 'Pantry' },
      { name: 'סוכר חום', listCategory: 'Pantry' },
      { name: 'אבקת קקאו', listCategory: 'Pantry' },
      { name: 'אבקת סוכר', listCategory: 'Pantry' },
      { name: 'שמרים', listCategory: 'Pantry' },
      { name: 'תמצית שקדים', listCategory: 'Pantry' },
      { name: 'גבינת שמנת', listCategory: 'Dairy' },
      { name: 'שמנת מתוקה', listCategory: 'Dairy' },
      { name: 'צבעי מאכל', listCategory: 'Pantry' },
      { name: 'גרגישות', listCategory: 'Pantry' },
      { name: 'נייר אפייה', listCategory: 'Pantry' },
    ]
  },

  'party': {
    keywords: [
      'מסיבה', 'יום הולדת', 'אירוע', 'חגיגה', 'שמחה',
      'חינה', 'ברית', 'בר מצווה', 'חתונה', 'מסיבת גן',
      'אירוח', 'קוקטייל', 'מסיבת פיג\'מות', 'ראש השנה'
    ],
    displayLabel: 'ציוד למסיבה',
    items: [
      { name: 'קישוטים למסיבה', listCategory: 'Party' },
      { name: 'בלונים', listCategory: 'Party' },
      { name: 'צלחות חגיגיות', listCategory: 'Party' },
      { name: 'כוסות חגיגיות', listCategory: 'Party' },
      { name: 'מפיות', listCategory: 'Cleaning' },
      { name: 'נייר טישו צבעוני', listCategory: 'Party' },
      { name: 'כובעי מסיבה', listCategory: 'Party' },
      { name: 'שקיות מתנה', listCategory: 'Party' },
      { name: 'קונפטי', listCategory: 'Party' },
      { name: 'מתנות לאורחים', listCategory: 'Party' },
      { name: 'נרות', listCategory: 'Party' },
      { name: 'מפת שולחן', listCategory: 'Party' },
      { name: 'כלי אוכל חד-פעמי', listCategory: 'Party' },
      { name: 'שלט ברכה', listCategory: 'Party' },
      { name: 'קישוטי מרכז שולחן', listCategory: 'Party' },
      { name: 'קשיות צבעוניות', listCategory: 'Party' },
      { name: 'קישוטי עוגה', listCategory: 'Party' },
      { name: 'משחקי מסיבה', listCategory: 'Party' },
      { name: 'כרטיסי תודה', listCategory: 'Party' },
      { name: 'הזמנות', listCategory: 'Party' },
    ]
  },

  'pets': {
    keywords: [
      'כלב', 'חתול', 'חיות מחמד', 'חיות', 'וטרינר',
      'גור', 'חתלתול', 'אקווריום', 'ציפור', 'ארנב',
      'חמסטר', 'דג', 'כלוב', 'רפואה וטרינרית', 'בית חיות',
      'ציוד לחיות'
    ],
    displayLabel: 'ציוד לחיות מחמד',
    items: [
      { name: 'מזון לכלב', listCategory: 'Pets' },
      { name: 'מזון לחתול', listCategory: 'Pets' },
      { name: 'פינוקים לחיות', listCategory: 'Pets' },
      { name: 'חול לחתול', listCategory: 'Pets' },
      { name: 'צעצועים לחיות', listCategory: 'Pets' },
      { name: 'מברשת לחיות', listCategory: 'Pets' },
      { name: 'צווארון לחיית מחמד', listCategory: 'Pets' },
      { name: 'מיטה לחיית מחמד', listCategory: 'Pets' },
      { name: 'שמפו לחיות', listCategory: 'Pharma & Hygiene' },
      { name: 'שקיות לצרכי כלב', listCategory: 'Pets' },
      { name: 'רצועה', listCategory: 'Pets' },
      { name: 'קערת מים', listCategory: 'Pets' },
      { name: 'קערת אוכל', listCategory: 'Pets' },
      { name: 'תיק נשיאה לחיית מחמד', listCategory: 'Pets' },
      { name: 'טיפול בפרעושים', listCategory: 'Pets' },
      { name: 'מספריים לציפורניים', listCategory: 'Pets' },
      { name: 'תג זיהוי', listCategory: 'Pets' },
      { name: 'עמוד גירוד', listCategory: 'Pets' },
      { name: 'זרעים לציפורים', listCategory: 'Pets' },
      { name: 'פילטר לאקווריום', listCategory: 'Pets' },
    ]
  },

  'gardening': {
    keywords: [
      'גינה', 'גינון', 'צמחים', 'פרחים', 'גן',
      'ירקות', 'עצים', 'דשא', 'גיזום',
      'השקיה', 'עציצים', 'זרעים', 'שתילים', 'גינת ירק', 'מרפסת ירוקה'
    ],
    displayLabel: 'גינון',
    items: [
      { name: 'זרעים', listCategory: 'Gardening' },
      { name: 'אדמה', listCategory: 'Gardening' },
      { name: 'דשן', listCategory: 'Gardening' },
      { name: 'כפפות גינון', listCategory: 'Gardening' },
      { name: 'את', listCategory: 'Gardening' },
      { name: 'מזמרה', listCategory: 'Gardening' },
      { name: 'עציצים', listCategory: 'Gardening' },
      { name: 'מולץ', listCategory: 'Gardening' },
      { name: 'משקה מים', listCategory: 'Gardening' },
      { name: 'קומפוסט', listCategory: 'Gardening' },
      { name: 'צינור גינה', listCategory: 'Gardening' },
      { name: 'כף גינה', listCategory: 'Gardening' },
      { name: 'מגרפה', listCategory: 'Gardening' },
      { name: 'קוטל עשבים', listCategory: 'Gardening' },
      { name: 'יתדות לגינה', listCategory: 'Gardening' },
      { name: 'תערובת שתילה', listCategory: 'Gardening' },
      { name: 'מזון לצמחים', listCategory: 'Gardening' },
      { name: 'מרסס גינה', listCategory: 'Gardening' },
      { name: 'מריצה', listCategory: 'Gardening' },
      { name: 'כרית גינון', listCategory: 'Gardening' },
    ]
  },

  'home-decor': {
    keywords: [
      'עיצוב', 'דקורציה', 'ריהוט', 'אביזרים',
      'אינטריאר', 'עיצוב הבית', 'איקאה', 'מוצרי בית',
      'תאורה', 'וילונות', 'שטיח', 'תמונות', 'אווירה', 'סגנון'
    ],
    displayLabel: 'עיצוב הבית',
    items: [
      { name: 'כריות נוי', listCategory: 'Home Decor' },
      { name: 'וילונות', listCategory: 'Home Decor' },
      { name: 'שטיח', listCategory: 'Home Decor' },
      { name: 'יצירת קיר', listCategory: 'Home Decor' },
      { name: 'מסגרות תמונה', listCategory: 'Home Decor' },
      { name: 'מנורת שולחן', listCategory: 'Home Decor' },
      { name: 'שמיכת טלאים', listCategory: 'Home Decor' },
      { name: 'אגרטל', listCategory: 'Home Decor' },
      { name: 'מראה', listCategory: 'Home Decor' },
      { name: 'עמד לעציץ', listCategory: 'Home Decor' },
      { name: 'מחזיקי נרות', listCategory: 'Home Decor' },
      { name: 'מגש דקורטיבי', listCategory: 'Home Decor' },
      { name: 'שעון קיר', listCategory: 'Home Decor' },
      { name: 'קישוט מדף', listCategory: 'Home Decor' },
      { name: 'תריסים', listCategory: 'Home Decor' },
      { name: 'מנורת עמידה', listCategory: 'Home Decor' },
      { name: 'כורסה', listCategory: 'Home Decor' },
      { name: 'סימניות ספרים', listCategory: 'Home Decor' },
      { name: 'קערות דקורטיביות', listCategory: 'Home Decor' },
      { name: 'מדפי קיר', listCategory: 'Home Decor' },
    ]
  }
};

/**
 * Detects the context of a Hebrew Sub-Hub name by matching keywords
 */
export function detectContextHe(subHubName: string): string | null {
  const name = subHubName.trim().toLowerCase(); // Hebrew has no case, but defensive for mixed input

  const priorityOrder = ['stock', 'pharmacy', 'camping', 'abroad', 'baby', 'home-renovation', 'baking', 'party', 'pets', 'gardening', 'home-decor', 'grocery'];

  for (const contextKey of priorityOrder) {
    const definition = CONTEXT_RECOGNITION_MAPPING_HE[contextKey];
    if (definition) {
      for (const keyword of definition.keywords) {
        if (name.includes(keyword)) {
          return contextKey;
        }
      }
    }
  }

  return null;
}

/**
 * Gets suggested contexts for a Hebrew Sub-Hub name
 */
export function getSuggestedContextsHe(subHubName: string): Array<{
  contextKey: string;
  displayLabel: string;
  itemCount: number;
}> {
  const name = subHubName.trim().toLowerCase(); // Hebrew has no case, but defensive for mixed input
  const suggestedContexts: Set<string> = new Set();

  for (const [contextKey, definition] of Object.entries(CONTEXT_RECOGNITION_MAPPING_HE)) {
    for (const keyword of definition.keywords) {
      if (name.includes(keyword)) {
        suggestedContexts.add(contextKey);
        break;
      }
    }
  }

  return Array.from(suggestedContexts).map(contextKey => {
    const definition = CONTEXT_RECOGNITION_MAPPING_HE[contextKey];
    return {
      contextKey,
      displayLabel: definition.displayLabel,
      itemCount: definition.items.length,
    };
  });
}

/**
 * Gets Hebrew items for a specific context
 */
export function getContextItemsHe(contextKey: string): ContextItem[] {
  const definition = CONTEXT_RECOGNITION_MAPPING_HE[contextKey];
  return definition ? definition.items : [];
}

/**
 * Gets the Hebrew display label for a context
 */
export function getContextLabelHe(contextKey: string): string {
  const definition = CONTEXT_RECOGNITION_MAPPING_HE[contextKey];
  return definition ? definition.displayLabel : '';
}
