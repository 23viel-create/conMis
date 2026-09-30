// Hebrew is the base language: its shape defines the keys every locale must provide.
const he = {
  notes: {
    title: 'הערות',
    empty: 'עדיין אין הערות. אפשר לכתוב תוכניות, רשימות [ ] או מחשבות למטה.',
    placeholder: 'הוספת הערה…  (- [ ] ליצירת רשימת משימות)',
    add: 'הוספת הערה',
    pin: 'הצמדת הערה',
    unpin: 'ביטול הצמדה',
    pinned: 'מוצמדת',
    newest: 'החדשות ביותר',
    oldest: 'הישנות ביותר',
    sortLabel: 'סדר הערות',
    rescheduledTag: 'נדחתה',
    rescheduled: 'נדחתה מ־{{from}}',
    rescheduledWithReason: 'נדחתה מ־{{from}} — סיבה: {{reason}}',
  },
  taskDetail: {
    back: 'חזרה',
    heading: 'משימה',
    titleLabel: 'כותרת המשימה',
    size: 'גודל',
    category: 'קטגוריה',
    date: 'תאריך',
    unscheduled: 'ללא תאריך (מוצגת היום)',
    previousDay: 'יום קודם',
    nextDay: 'יום הבא',
    today: 'היום',
    tomorrow: 'מחר',
    nextWeek: 'בעוד שבוע',
    reasonLabel: 'למה לדחות? (לא חובה)',
    reasonPlaceholder: 'למשל: מחכה לתשובה',
    confirmReschedule: 'דחייה',
    confirmMove: 'העברה',
    cancel: 'ביטול',
    notFound: 'המשימה לא נמצאה.',
  },
  tasks: {
    empty: {
      yesterday: 'לא היו משימות אתמול.',
      today: 'אין משימות להיום. הוסיפו משימה למעלה.',
      tomorrow: 'עדיין אין משימות למחר.',
      week: 'אין משימות השבוע.',
    },
  },
  timeline: {
    label: 'טווח תאריכים',
    yesterday: 'אתמול',
    today: 'היום',
    tomorrow: 'מחר',
    week: 'השבוע',
  },
};

export type TranslationResources = typeof he;
export default he;
