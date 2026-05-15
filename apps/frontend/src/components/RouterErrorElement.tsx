import { useRouteError } from 'react-router';
import { Button } from './ui/button';
import { Icon } from '@iconify/react';

const RouterErrorElement = () => {
    const error = useRouteError() as any;
    console.error('RouterErrorElement caught an error:', error);

    const isChunkLoadError =
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes('network error');

    const handleRefresh = () => {
        window.location.reload();
    };

    const handleGoBack = () => {
        window.history.back();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="mb-6">
                    <Icon
                        icon={isChunkLoadError ? "solar:refresh-square-bold-duotone" : "solar:danger-triangle-bold-duotone"}
                        className={`mx-auto ${isChunkLoadError ? 'text-primary' : 'text-error'}`}
                        height={64}
                    />
                </div>

                <h1 className="text-2xl font-bold text-dark mb-2">
                    {isChunkLoadError ? 'Pembaruan Tersedia' : 'Terjadi Kesalahan'}
                </h1>

                <p className="text-bodytext mb-6">
                    {isChunkLoadError
                        ? 'Aplikasi telah diperbarui. Silakan refresh halaman untuk memuat versi terbaru.'
                        : 'Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba refresh atau kembali ke halaman sebelumnya.'}
                </p>

                {error && (
                    <details className="mb-6 text-left">
                        <summary className="cursor-pointer text-sm text-bodytext hover:text-dark">
                            Detail Error
                        </summary>
                        <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                            {error.message || JSON.stringify(error)}
                        </pre>
                    </details>
                )}

                <div className="flex gap-3 justify-center">
                    <Button
                        onClick={handleGoBack}
                        variant="outline"
                        className="gap-2"
                    >
                        <Icon icon="solar:arrow-left-line-duotone" height={18} />
                        Kembali
                    </Button>

                    <Button
                        onClick={handleRefresh}
                        className="gap-2"
                    >
                        <Icon icon="solar:refresh-bold" height={18} />
                        Refresh Halaman
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RouterErrorElement;
