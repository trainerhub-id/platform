import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from 'src/components/ui/accordion'
import { DocumentCategory, DocumentStatus } from '../hooks/useDokumen'
import { DocumentItem } from './DocumentItem'

interface DocumentCategoryListProps {
  categories: DocumentCategory[]
  statuses: Record<string, DocumentStatus>
  onUpdate: () => void
}

export const DocumentCategoryList = ({
  categories,
  statuses,
  onUpdate,
}: DocumentCategoryListProps) => {
  return (
    <div className="space-y-4">
      <Accordion
        type="multiple"
        defaultValue={categories.map((c) => c.id)}
        className="w-full space-y-4"
      >
        {categories.map((category) => (
          <AccordionItem
            key={category.id}
            value={category.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden px-0"
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gray-50">
              <div className="flex flex-col items-start text-left">
                <span className="text-lg font-bold text-gray-900">{category.nama}</span>
                <span className="text-sm font-normal text-gray-500">
                  {category.types.length} dokumen diperlukan
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              <div className="grid gap-4">
                {category.types.length > 0 ? (
                  category.types.map((type) => (
                    <DocumentItem
                      key={type.id}
                      type={type}
                      status={statuses[type.id]}
                      onUpdate={onUpdate}
                    />
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4 italic">
                    Tidak ada dokumen yang perlu diunggah dalam kategori ini.
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
