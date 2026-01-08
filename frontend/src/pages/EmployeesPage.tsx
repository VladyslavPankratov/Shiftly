import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Employee } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  // TODO: implement employee form modal
  const [showForm, setShowForm] = useState(false);
  void showForm; // Used by setShowForm handlers, form UI pending implementation

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await api.get('/employees');
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Працівники</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Додати працівника
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees?.map((employee) => (
          <Card key={employee.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: employee.color }}
                  />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {employee.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-1">{employee.position}</p>
                <p className="text-sm text-gray-500">{employee.email}</p>
                {employee.phone && (
                  <p className="text-sm text-gray-500">{employee.phone}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm('Видалити працівника?')) {
                      deleteMutation.mutate(employee.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {employees?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Ще немає працівників</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Додати першого працівника
          </Button>
        </div>
      )}
    </div>
  );
}
