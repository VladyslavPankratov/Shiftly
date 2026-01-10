import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Department } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Plus, Edit, Trash2, Users, Palette } from 'lucide-react';

interface DepartmentWithCount extends Department {
  _count?: {
    employees: number;
  };
}

const presetColors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280'];

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', color: '#6B7280' });

  const { data: departments, isLoading } = useQuery<DepartmentWithCount[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await api.get('/departments');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => api.post('/departments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setShowForm(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string; name: string; color: string }) =>
      api.put(`/departments/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setShowForm(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const resetForm = () => {
    setFormData({ name: '', color: '#6B7280' });
    setEditingDepartment(null);
  };

  const openForm = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({ name: department.name, color: department.color });
    } else {
      resetForm();
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDepartment) {
      updateMutation.mutate({ id: editingDepartment.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Видалити департамент? Це може вплинути на пов\'язаних працівників.')) {
      deleteMutation.mutate(id);
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Департаменти</h1>
        <Button onClick={() => openForm()}>
          <Plus className="h-4 w-4 mr-2" />
          Створити департамент
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments?.map((department) => (
          <Card key={department.id}>
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-lg flex-shrink-0 shadow-inner"
                style={{ backgroundColor: department.color }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  {department.name}
                </h3>
                {department._count?.employees !== undefined && (
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>
                      {department._count.employees}{' '}
                      {department._count.employees === 1
                        ? 'працівник'
                        : department._count.employees >= 2 && department._count.employees <= 4
                        ? 'працівники'
                        : 'працівників'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={() => openForm(department)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(department.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {departments?.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Palette className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">Ще немає департаментів</p>
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Створити перший департамент
          </Button>
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        title={editingDepartment ? 'Редагувати департамент' : 'Новий департамент'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Назва <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Введіть назву департаменту"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Колір</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10 w-20 cursor-pointer rounded border border-gray-300"
              />
              <span className="text-sm text-gray-500 font-mono">{formData.color}</span>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs text-gray-500">Швидкий вибір:</span>
              <div className="flex gap-1.5">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      formData.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Збереження...'
                : editingDepartment
                ? 'Зберегти'
                : 'Створити'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
