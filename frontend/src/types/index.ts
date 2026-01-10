export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  organizationId: string;
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  departmentId?: string;
  color: string;
  availability: EmployeeAvailability[];
  weeklyHoursLimit?: number;
  organizationId: string;
  createdAt: Date;
}

export interface EmployeeAvailability {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

export interface Department {
  id: string;
  name: string;
  color: string;
  organizationId: string;
  createdAt: Date;
}

export interface Shift {
  id: string;
  employeeId: string;
  employee?: Employee;
  startTime: Date;
  endTime: Date;
  position: string;
  departmentId?: string;
  department?: Department;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  organizationId: string;
  createdAt: Date;
}

export interface ShiftTemplate {
  id: string;
  name: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  position: string;
  departmentId?: string;
  department?: Department;
  requiredEmployees: number;
  organizationId: string;
}

export interface ScheduleView {
  date: Date;
  viewType: 'day' | 'week' | 'month';
}

export interface DragItem {
  id: string;
  type: 'employee' | 'shift';
  data: Employee | Shift;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  organizationName: string;
}
