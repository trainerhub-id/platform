import { IconChevronRight } from '@tabler/icons-react'
import { useContext } from 'react'
import { Link } from 'react-router'
import CalendarIcon from '/src/assets/images/home/calender icon.png'
import FileIcon from '/src/assets/images/home/file icon.png'
import LoveIcon from '/src/assets/images/home/love icon.png'
import ProfileIcon from '/src/assets/images/home/profile icon.png'
import SertifikatIcon from '/src/assets/images/home/sertifikat icon.png'
import { CustomizerContext } from '../../../context/CustomizerContext'
import { Button } from '../../ui/button'

const QuickAccess = () => {
  const { isBorderRadius } = useContext(CustomizerContext)
  const accessItems = [
    {
      id: 1,
      title: 'Profile Peserta',
      description: 'Isi dan Informasi Tentang Saya',
      icon: ProfileIcon,
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      titleColor: 'text-purple-700 dark:text-purple-300',
      btnClass:
        'border-purple-700 text-purple-700 dark:border-purple-300 dark:text-purple-300 hover:bg-purple-700 hover:text-white dark:hover:bg-purple-300 dark:hover:text-purple-900',
      buttonText: 'Lihat Detail',
      buttonVariant: 'outline' as const,
      url: '/user/profile',
    },
    {
      id: 2,
      title: 'Informasi Training',
      description: 'Jadwal dan Lokasi Pelatihan Lengkap',
      icon: CalendarIcon,
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      titleColor: 'text-blue-700 dark:text-blue-300',
      btnClass:
        'border-blue-700 text-blue-700 dark:border-blue-300 dark:text-blue-300 hover:bg-blue-700 hover:text-white dark:hover:bg-blue-300 dark:hover:text-blue-900',
      buttonText: 'Lihat Detail',
      buttonVariant: 'outline' as const,
      url: '/user/training/info',
    },
    {
      id: 3,
      title: 'Kelas Bonus',
      description: 'Akses Evaluasi Kelas Tambahan Gratis!',
      icon: LoveIcon,
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      titleColor: 'text-green-700 dark:text-green-300',
      btnClass:
        'border-green-700 text-green-700 dark:border-green-300 dark:text-green-300 hover:bg-green-700 hover:text-white dark:hover:bg-green-300 dark:hover:text-green-900',
      buttonText: 'Lihat Detail',
      buttonVariant: 'outline' as const,
      url: '/user/kelas',
    },
    {
      id: 4,
      title: 'Dokumen',
      description: 'Dokumen Training dan Sertifikasi',
      icon: FileIcon,
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      titleColor: 'text-orange-700 dark:text-orange-300',
      btnClass:
        'border-orange-700 text-orange-700 dark:border-orange-300 dark:text-orange-300 hover:bg-orange-700 hover:text-white dark:hover:bg-orange-300 dark:hover:text-orange-900',
      buttonText: 'Lihat Detail',
      buttonVariant: 'outline' as const,
      url: '/user/dokumen',
    },
    {
      id: 5,
      title: 'Sertifikat',
      description: 'Kirim Sertifikat Digital Resmi Anda',
      icon: SertifikatIcon,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      titleColor: 'text-yellow-700 dark:text-yellow-300',
      btnClass:
        'border-yellow-700 text-yellow-700 dark:border-yellow-300 dark:text-yellow-300 hover:bg-yellow-700 hover:text-white dark:hover:bg-yellow-300 dark:hover:text-yellow-900',
      buttonText: 'Lihat Detail',
      buttonVariant: 'outline' as const,
      url: '/user/sertifikat',
    },
  ]

  const renderCard = (item: (typeof accessItems)[0]) => (
    <div
      key={item.id}
      className={`${item.bgColor} p-5 flex flex-col justify-between min-h-[180px]`}
      style={{ borderRadius: `${isBorderRadius}px` }}
    >
      <div>
        <div className="mb-4">
          <img src={item.icon} alt={item.title} className="h-12 w-12 object-contain" />
        </div>
        <h5 className={`text-base font-bold mb-1 ${item.titleColor}`}>{item.title}</h5>
        <p className="text-xs text-bodytext">{item.description}</p>
      </div>

      <Button
        variant={item.buttonVariant}
        size="sm"
        asChild
        className={`mt-4 w-full ${item.btnClass} flex items-center justify-center gap-1`}
      >
        <Link to={item.url}>
          {item.buttonText}
          <IconChevronRight size={14} stroke={2.5} />
        </Link>
      </Button>
    </div>
  )

  return (
    <div className="py-2">
      <h4 className="text-lg font-bold text-dark mb-6">Akses Cepat</h4>

      {/* Top row: Profile Peserta and Informasi Training (larger) */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Profile Peserta - 1 col */}
        <div className="col-span-1">{renderCard(accessItems[0])}</div>

        {/* Informasi Training - 2 cols (larger) */}
        <div className="col-span-2">{renderCard(accessItems[1])}</div>
      </div>

      {/* Bottom row: Kelas Bonus, Dokumen, Sertifikat - each 1 col */}
      <div className="grid grid-cols-3 gap-4">
        {renderCard(accessItems[2])}
        {renderCard(accessItems[3])}
        {renderCard(accessItems[4])}
      </div>
    </div>
  )
}

export default QuickAccess
