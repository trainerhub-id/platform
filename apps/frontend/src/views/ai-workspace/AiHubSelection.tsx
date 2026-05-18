import { Icon } from '@iconify/react'
import { useNavigate } from 'react-router'
import AiMentorLogo from 'src/assets/images/logos/logo-ai-mentor.png'
import CardBox from 'src/components/shared/CardBox'

type AiCategory = {
  id: string
  title: string
  description: string
  icon: string
  color: string
  route: string
}

const categories: AiCategory[] = [
  {
    id: 'trainer',
    title: 'AI for Trainer',
    description:
      'Bantu buat lesson plan, design assessment, dan generate materi training dengan AI',
    icon: 'solar:presentation-graph-bold-duotone',
    color: 'var(--color-primary)',
    route: '/user/ai-hub/trainer-workspace',
  },
  {
    id: 'master',
    title: 'AI for Master',
    description:
      'Analisis performa peserta, feedback otomatis, dan coaching tips untuk trainer master',
    icon: 'solar:diploma-verified-bold-duotone',
    color: 'var(--color-gold)',
    route: '/user/ai-hub/master-workspace',
  },
  {
    id: 'branding',
    title: 'AI for Branding',
    description:
      'Personal branding ToT dan promosi training dengan gaya hangat & membimbing. Support LinkedIn, Instagram, Email, Website.',
    icon: 'solar:star-bold-duotone',
    color: '#10B981',
    route: '/user/ai-hub/branding',
  },
]

export default function AiHubSelection() {
  const navigate = useNavigate()

  const handleCardClick = (category: AiCategory) => {
    navigate(category.route)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-8">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <img src={AiMentorLogo} alt="AI Mentor" className="mb-2 h-10 w-auto" />
            <p className="mb-2 text-base text-bodytext">
              Pilih AI Assistant yang sesuai dengan kebutuhan Anda. Setiap AI memiliki keahlian
              khusus untuk membantu pekerjaan Anda.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="col-span-12 md:col-span-6 lg:col-span-4">
            <CardBox
              className="group cursor-pointer rounded-2xl p-6 transition-all duration-300 !border !border-ld hover:!border-primary/50 hover:shadow-xl"
              onClick={() => handleCardClick(category)}
            >
              <div className="space-y-4">
                <div className="relative">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${category.color}15` }}
                  >
                    <Icon icon={category.icon} height={32} style={{ color: category.color }} />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-dark transition-colors group-hover:text-primary">
                  {category.title}
                </h3>

                <p className="text-sm leading-relaxed text-bodytext">{category.description}</p>

                <div className="flex items-center gap-2 text-sm font-semibold text-primary transition-all group-hover:gap-3">
                  <span>Lanjutkan</span>
                  <Icon icon="solar:arrow-right-outline" height={18} />
                </div>
              </div>
            </CardBox>
          </div>
        ))}
      </div>
    </div>
  )
}
