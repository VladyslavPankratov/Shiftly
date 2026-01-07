import { create } from 'zustand';
import type { ScheduleView } from '../types';

interface ScheduleState {
  currentView: ScheduleView;
  selectedDate: Date;
  setView: (view: ScheduleView['viewType']) => void;
  setDate: (date: Date) => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  currentView: {
    date: new Date(),
    viewType: 'week',
  },
  selectedDate: new Date(),

  setView: (viewType) =>
    set((state) => ({
      currentView: { ...state.currentView, viewType },
    })),

  setDate: (date) =>
    set({
      selectedDate: date,
      currentView: { date, viewType: get().currentView.viewType },
    }),

  navigateNext: () => {
    const { currentView, selectedDate } = get();
    const newDate = new Date(selectedDate);

    switch (currentView.viewType) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
    }

    set({
      selectedDate: newDate,
      currentView: { ...currentView, date: newDate },
    });
  },

  navigatePrevious: () => {
    const { currentView, selectedDate } = get();
    const newDate = new Date(selectedDate);

    switch (currentView.viewType) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
    }

    set({
      selectedDate: newDate,
      currentView: { ...currentView, date: newDate },
    });
  },
}));
