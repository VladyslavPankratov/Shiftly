import { Calendar, Users, Settings, LogOut, FileText } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';

export function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Calendar className="h-8 w-8 text-primary-500" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Shiftly
              </span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a
                href="/schedule"
                className="border-primary-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Розклад
              </a>
<a
                href="/employees"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <Users className="h-4 w-4 mr-2" />
                Працівники
              </a>
              <a
                href="/templates"
                className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                <FileText className="h-4 w-4 mr-2" />
                Шаблони
              </a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{user?.name}</span>
            <Button variant="ghost" size="sm" onClick={() => {}}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
