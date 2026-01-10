import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { ShiftTemplate, Department } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Plus, Edit, Trash2, Calendar, Clock, Users } from 'lucide-react';

const dayNames = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота'];

interface TemplateFormData {
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  position: string;
  departmentId: string;
  requiredEmployees: number;
}

interface ApplyFormData {
  templateIds: string[];
  startDate: string;
  endDate: string;
}

interface PreviewResult {
  totalShifts: number;
  byDay: Record<string, number>;
}

const initialFormData: TemplateFormData = {
  name: '',
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '17:00',
  position: '',
  departmentId: '',
  requiredEmployees: 1,
};

const initialApplyData: ApplyFormData = {
  templateIds: [],
  startDate: '',
  endDate: '',
};

export default function ShiftTemplatesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ShiftTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(initialFormData);
  const [applyData, setApplyData] = useState<ApplyFormData>(initialApplyData);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const { data: templates, isLoading } = useQuery<ShiftTemplate[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await api.get('/templates');
      return data;
    },
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data } = await api.get('/departments');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<ShiftTemplate>) => api.post('/templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      closeForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<ShiftTemplate> & { id: string }) =>
      api.put(`/templates/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const applyMutation = useMutation({
    mutationFn: (data: ApplyFormData & { preview?: boolean }) =>
      api.post('/templates/apply', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      closeApplyModal();
    },
  });

  const openForm = (template?: ShiftTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        dayOfWeek: template.dayOfWeek,
        startTime: template.startTime,
        endTime: template.endTime,
        position: template.position,
        departmentId: template.departmentId || '',
        requiredEmployees: template.requiredEmployees,
      });
    } else {
      setEditingTemplate(null);
      setFormData(initialFormData);
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTemplate(null);
    setFormData(initialFormData);
  };

  const closeApplyModal = () => {
    setShowApplyModal(false);
    setApplyData(initialApplyData);
    setPreviewResult(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      departmentId: formData.departmentId || undefined,
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, ...submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Видалити шаблон?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleTemplateToggle = (templateId: string) => {
    setApplyData((prev) => ({
      ...prev,
      templateIds: prev.templateIds.includes(templateId)
        ? prev.templateIds.filter((id) => id !== templateId)
        : [...prev.templateIds, templateId],
    }));
    setPreviewResult(null);
  };

  const handlePreview = async () => {
    if (!applyData.templateIds.length || !applyData.startDate || !applyData.endDate) {
      return;
    }
    setIsPreviewLoading(true);
    try {
      const { data } = await api.post('/templates/apply', {
        ...applyData,
        preview: true,
      });
      setPreviewResult(data);
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleApply = () => {
    if (!applyData.templateIds.length || !applyData.startDate || !applyData.endDate) {
      return;
    }
    applyMutation.mutate(applyData);
  };

  const getDepartmentName = (departmentId?: string) => {
    if (!departmentId || !departments) return null;
    const dept = departments.find((d) => d.id === departmentId);
    return dept?.name || null;
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
        <h1 className="text-3xl font-bold text-gray-900">Шаблони змін</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowApplyModal(true)}>
            <Calendar className="h-4 w-4 mr-2" />
            Застосувати шаблони
          </Button>
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Створити шаблон
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates?.map((template) => (
          <Card key={template.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                  {template.name}
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>{dayNames[template.dayOfWeek]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>
                      {template.startTime} - {template.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span>
                      {template.position} ({template.requiredEmployees} осіб)
                    </span>
                  </div>
                  {getDepartmentName(template.departmentId) && (
                    <div className="pt-1">
                      <Badge variant="info" size="sm">
                        {getDepartmentName(template.departmentId)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1 ml-2 flex-shrink-0">
                <Button variant="ghost" size="sm" onClick={() => openForm(template)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {templates?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Ще немає шаблонів</p>
          <Button onClick={() => openForm()}>
            <Plus className="h-4 w-4 mr-2" />
            Створити перший шаблон
          </Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editingTemplate ? 'Редагувати шаблон' : 'Створити шаблон'}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="py-4 space-y-4">
          <Input
            label="Назва шаблону"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Наприклад: Ранкова зміна"
            required
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              День тижня
            </label>
            <select
              value={formData.dayOfWeek}
              onChange={(e) =>
                setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors bg-white"
              required
            >
              {dayNames.map((day, index) => (
                <option key={index} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Початок"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              required
            />
            <Input
              label="Кінець"
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              required
            />
          </div>

          <Input
            label="Посада"
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            placeholder="Наприклад: Касир"
            required
          />

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Відділ (необов'язково)
            </label>
            <select
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors bg-white"
            >
              <option value="">Без відділу</option>
              {departments?.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Кількість працівників"
            type="number"
            min={1}
            value={formData.requiredEmployees}
            onChange={(e) =>
              setFormData({ ...formData, requiredEmployees: parseInt(e.target.value) || 1 })
            }
            required
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button type="button" variant="ghost" onClick={closeForm}>
              Скасувати
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingTemplate ? 'Зберегти' : 'Створити'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Apply Templates Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={closeApplyModal}
        title="Застосувати шаблони"
        size="lg"
      >
        <div className="py-4 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Оберіть шаблони
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {templates?.length === 0 && (
                <p className="text-gray-500 text-sm">Немає доступних шаблонів</p>
              )}
              {templates?.map((template) => (
                <label
                  key={template.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={applyData.templateIds.includes(template.id)}
                    onChange={() => handleTemplateToggle(template.id)}
                    className="h-4 w-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {template.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {dayNames[template.dayOfWeek]}, {template.startTime} -{' '}
                      {template.endTime}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Дата початку"
              type="date"
              value={applyData.startDate}
              onChange={(e) => {
                setApplyData({ ...applyData, startDate: e.target.value });
                setPreviewResult(null);
              }}
              required
            />
            <Input
              label="Дата закінчення"
              type="date"
              value={applyData.endDate}
              onChange={(e) => {
                setApplyData({ ...applyData, endDate: e.target.value });
                setPreviewResult(null);
              }}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePreview}
              disabled={
                !applyData.templateIds.length ||
                !applyData.startDate ||
                !applyData.endDate
              }
              isLoading={isPreviewLoading}
            >
              Попередній перегляд
            </Button>
          </div>

          {previewResult && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">
                Буде створено змін: {previewResult.totalShifts}
              </h4>
              <div className="space-y-1 text-sm">
                {Object.entries(previewResult.byDay).map(([date, count]) => (
                  <div key={date} className="flex justify-between text-gray-600">
                    <span>{date}</span>
                    <span>{count} змін</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button type="button" variant="ghost" onClick={closeApplyModal}>
              Скасувати
            </Button>
            <Button
              onClick={handleApply}
              disabled={
                !applyData.templateIds.length ||
                !applyData.startDate ||
                !applyData.endDate
              }
              isLoading={applyMutation.isPending}
            >
              Застосувати
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
