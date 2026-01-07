import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfWeek, addDays } from 'date-fns';
import { uk } from 'date-fns/locale';
import api from '../services/api';
import type { Shift } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useScheduleStore } from '../store/scheduleStore';

export default function SchedulePage() {
  const { selectedDate, navigateNext, navigatePrevious } = useScheduleStore();
  const [viewType, setViewType] = useState<'day' | 'week' | 'month'>('week');

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: shifts, isLoading } = useQuery<Shift[]>({
    queryKey: ['shifts', weekStart],
    queryFn: async () => {
      const startDate = weekStart.toISOString();
      const endDate = addDays(weekStart, 7).toISOString();
      const { data } = await api.get(`/shifts?startDate=${startDate}&endDate=${endDate}`);
      return data;
    },
  });

  const getShiftsForDay = (date: Date) => {
    if (!shifts) return [];
    return shifts.filter((shift) => {
      const shiftDate = new Date(shift.startTime);
      return format(shiftDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Розклад</h1>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              Експорт
            </Button>
            <Button variant="primary" size="sm">
              Автоплан
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={navigatePrevious}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <span className="text-lg font-medium">
                {format(weekStart, 'd MMMM', { locale: uk })} -{' '}
                {format(addDays(weekStart, 6), 'd MMMM yyyy', { locale: uk })}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={navigateNext}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewType === 'day' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewType('day')}
            >
              День
            </Button>
            <Button
              variant={viewType === 'week' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewType('week')}
            >
              Тиждень
            </Button>
            <Button
              variant={viewType === 'month' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setViewType('month')}
            >
              Місяць
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Завантаження...</div>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dayShifts = getShiftsForDay(day);
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

            return (
              <Card
                key={day.toISOString()}
                className={isToday ? 'border-2 border-primary-500' : ''}
              >
                <div className="mb-3">
                  <div className="text-sm text-gray-500">
                    {format(day, 'EEEE', { locale: uk })}
                  </div>
                  <div className={`text-2xl font-bold ${isToday ? 'text-primary-500' : 'text-gray-900'}`}>
                    {format(day, 'd')}
                  </div>
                </div>

                <div className="space-y-2">
                  {dayShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="p-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: shift.employee?.color + '20',
                        borderLeft: `3px solid ${shift.employee?.color}`,
                      }}
                    >
                      <div className="font-medium text-gray-900">
                        {shift.employee?.name}
                      </div>
                      <div className="text-gray-600">
                        {format(new Date(shift.startTime), 'HH:mm')} -{' '}
                        {format(new Date(shift.endTime), 'HH:mm')}
                      </div>
                      <div className="text-gray-500">{shift.position}</div>
                    </div>
                  ))}

                  {dayShifts.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-4">
                      Немає змін
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
