import { Icon } from '@iconify/react'
import { Card } from '../ui/card'

interface AdminStatsCardProps {
  title: string
  subtitle: string
  value: string
  icon: string
  colors: {
    bg: string
    iconBg: string
    text: string
  }
}

const AdminStatsCard = ({ title, subtitle, value, icon, colors }: AdminStatsCardProps) => {
  return (
    <Card className={`${colors.bg} relative overflow-hidden h-full border-none shadow-none`}>
      <div className="relative z-10">
        <div
          className={`w-10 h-10 ${colors.iconBg} rounded-lg flex items-center justify-center text-white mb-4`}
        >
          <Icon icon={icon} height={20} />
        </div>
        <h3 className={`${colors.text} font-bold text-lg leading-tight mb-2 whitespace-pre-line`}>
          {title}
        </h3>
        <p className="text-bodytext text-xs mb-1">{subtitle}</p>
        <div className={`${colors.text} text-3xl font-bold`}>{value}</div>
      </div>
    </Card>
  )
}

export default AdminStatsCard
