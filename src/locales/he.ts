// Hebrew is the base language: its shape defines the keys every locale must provide.
const he = {
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
