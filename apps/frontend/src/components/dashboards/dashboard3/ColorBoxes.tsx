import { Icon } from '@iconify/react'
import { Link } from 'react-router'
import SimpleBar from 'simplebar-react'
import CardBox from 'src/components/shared/CardBox'
import { Button } from 'src/components/ui/button'

const ColorboxData = [
  {
    bg: 'primary-gradient',
    icon: 'solar:dollar-minimalistic-linear',
    color: 'bg-primary',
    title: 'Total Orders',
    price: '16,689',
    link: '#',
  },
  {
    bg: 'warning-gradient',
    icon: 'solar:recive-twice-square-linear',
    color: 'bg-warning',
    title: 'Return Item',
    price: '148',
    link: '#',
  },
  {
    bg: 'secondary-gradient',
    icon: 'ic:outline-backpack',
    color: 'bg-secondary',
    title: 'Annual Budget',
    price: '$156K',
    link: '#',
  },
  {
    bg: 'error-gradient',
    icon: 'ic:baseline-sync-problem',
    color: 'bg-error',
    title: 'Cancel Orders',
    price: '64',
    link: '#',
  },
  {
    bg: 'success-gradient',
    icon: 'ic:outline-forest',
    color: 'bg-success',
    title: 'Total Income ',
    price: '$36,715',
    link: '#',
  },
]

const ColorBoxes = () => {
  return (
    <>
      <CardBox>
        <div className="overflow-x-auto">
          <SimpleBar>
            <div className="flex gap-7">
              {ColorboxData.map((item, index) => (
                <div
                  className="lg:basis-1/5 md:basis-1/4 basis-full lg:shrink shrink-0"
                  key={index}
                >
                  <div className={`text-center px-5 py-7 rounded-tw ${item.bg}`}>
                    <span
                      className={`h-12 w-12 mx-auto flex items-center justify-center  rounded-tw ${item.color}`}
                    >
                      <Icon icon={item.icon} className="text-white" height={24} />
                    </span>
                    <p className="text-ld font-normal mt-4 mb-2">{item.title}</p>
                    <h4 className="text-2xl">{item.price}</h4>
                    <Button
                      asChild
                      className="w-fit mx-auto mt-5 bg-white hover:bg-dark text-ld font-semibold hover:text-white shadow-sm py-1 px-1 dark:bg-darkgray dark:hover:bg-dark"
                      size="sm"
                    >
                      <Link to={item.link}>View Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </SimpleBar>
        </div>
      </CardBox>
    </>
  )
}

export default ColorBoxes
