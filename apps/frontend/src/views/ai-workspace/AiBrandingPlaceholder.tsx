import { Icon } from '@iconify/react'
import { Link } from 'react-router'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'

export default function AiBrandingPlaceholder() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-180px)] max-w-3xl flex-col items-center justify-center px-4 py-10 text-center">
      <Badge variant="lightWarning" className="mb-4">
        Segera hadir
      </Badge>
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-lightwarning text-warning">
        <Icon icon="solar:magic-stick-3-bold-duotone" height={34} />
      </div>
      <h1 className="mb-3 text-2xl font-semibold text-ld">AI for Branding</h1>
      <p className="mb-7 max-w-xl text-sm leading-6 text-bodytext">
        Modul branding akan dipakai untuk personal branding, konten promosi, dan komunikasi
        training. Backend flow-nya belum diaktifkan.
      </p>
      <Button asChild variant="outline">
        <Link to="../ai-hub">
          <Icon icon="solar:arrow-left-linear" height={18} />
          Kembali ke pilihan AI
        </Link>
      </Button>
    </div>
  )
}
