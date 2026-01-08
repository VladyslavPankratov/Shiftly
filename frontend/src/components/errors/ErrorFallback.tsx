import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '../ui/Button';
import { env } from '../../config/env';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  variant?: 'page' | 'section' | 'component';
  title?: string;
  showDetails?: boolean;
}

export function ErrorFallback({
  error,
  resetError,
  variant = 'page',
  title,
  showDetails = false,
}: ErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReportBug = () => {
    const subject = encodeURIComponent(`Bug Report: ${error.name}`);
    const body = encodeURIComponent(
      `Error: ${error.message}\n\nStack trace:\n${error.stack}\n\nURL: ${window.location.href}\nTimestamp: ${new Date().toISOString()}`
    );
    window.open(`mailto:${env.VITE_SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  };

  if (variant === 'component') {
    return (
      <div className="flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center">
          <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-700 mb-2">
            {title || 'Помилка завантаження'}
          </p>
          <button
            onClick={resetError}
            className="text-sm text-red-600 hover:text-red-800 underline flex items-center gap-1 mx-auto"
          >
            <RefreshCw className="h-3 w-3" />
            Спробувати знову
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'section') {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title || 'Щось пішло не так'}
          </h3>
          <p className="text-gray-600 mb-6">
            Виникла помилка при завантаженні цього розділу. Спробуйте оновити або поверніться пізніше.
          </p>
          {showDetails && (
            <details className="w-full mb-4 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                Технічні деталі
              </summary>
              <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 overflow-auto max-h-32">
                {error.message}
              </pre>
            </details>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={resetError}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Спробувати знову
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Full page error (default)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12">
          <div className="text-center">
            {/* Animated error icon */}
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 left-[58%] w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center mx-auto border-4 border-white">
                <span className="text-white text-sm font-bold">!</span>
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              {title || 'Ой! Щось пішло не так'}
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Виникла неочікувана помилка. Наша команда вже працює над її виправленням. 
              Спробуйте оновити сторінку або поверніться на головну.
            </p>

            {/* Error details (collapsible) */}
            {showDetails && (
              <details className="mb-6 text-left bg-gray-50 rounded-lg">
                <summary className="p-4 text-sm text-gray-600 cursor-pointer hover:text-gray-800 font-medium">
                  🔍 Показати технічні деталі
                </summary>
                <div className="px-4 pb-4">
                  <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-40">
                    <code className="text-xs text-green-400 font-mono">
                      <span className="text-red-400">{error.name}:</span> {error.message}
                      {error.stack && (
                        <>
                          {'\n\n'}
                          <span className="text-gray-500">{error.stack.split('\n').slice(1, 4).join('\n')}</span>
                        </>
                      )}
                    </code>
                  </div>
                </div>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="primary" onClick={resetError} className="flex-1 sm:flex-none">
                <RefreshCw className="h-4 w-4 mr-2" />
                Спробувати знову
              </Button>
              <Button variant="secondary" onClick={handleGoHome} className="flex-1 sm:flex-none">
                <Home className="h-4 w-4 mr-2" />
                На головну
              </Button>
            </div>

            {/* Report bug link */}
            <button
              onClick={handleReportBug}
              className="mt-6 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mx-auto transition-colors"
            >
              <Bug className="h-4 w-4" />
              Повідомити про помилку
            </button>
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Код помилки: {error.name} • {new Date().toLocaleString('uk-UA')}
        </p>
      </div>
    </div>
  );
}


