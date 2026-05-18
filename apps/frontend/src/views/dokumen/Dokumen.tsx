import { Icon } from '@iconify/react'
import { Alert, AlertDescription, AlertTitle } from 'src/components/ui/alert'
import { Loading } from 'src/components/ui/loading'
import { DocumentCategoryList } from './components/DocumentCategoryList'
import { useDokumen } from './hooks/useDokumen'

const Dokumen = () => {
  const { categories, statuses, loading, error, fetchStatuses } = useDokumen()

  const handleUpdate = () => {
    fetchStatuses()
  }

  return (
    <>
      <div className="space-y-6">
        {/* Info Card */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="p-3 bg-white rounded-full border border-primary/20 text-primary shadow-sm shrink-0">
            <Icon icon="solar:folder-with-files-line-duotone" width="32" height="32" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-900">Kelengkapan Administrasi</h3>
            <p className="text-gray-600">
              Silakan lengkapi seluruh dokumen yang diperlukan untuk administrasi pelatihan dan
              sertifikasi. Pastikan dokumen yang diunggah valid dan terbaca dengan jelas.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <Icon icon="solar:danger-triangle-bold-duotone" className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && categories.length === 0 ? (
          <Loading fullPage text="Memuat data dokumen..." />
        ) : (
          <DocumentCategoryList
            categories={categories}
            statuses={statuses}
            onUpdate={handleUpdate}
          />
        )}
      </div>
    </>
  )
}

export default Dokumen
