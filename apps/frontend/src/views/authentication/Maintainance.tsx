import { Icon } from '@iconify/react'
import { Link } from 'react-router'
import { Button } from 'src/components/ui/button'

const Maintainance = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-darkgray">
      <div className="mx-auto max-w-xl px-6 text-center">
        <div className="mx-auto mb-8 flex size-28 items-center justify-center rounded-full bg-lightprimary text-primary dark:bg-primary/15">
          <Icon icon="solar:settings-line-duotone" className="size-14" />
        </div>
        <h1 className="mb-4 text-4xl font-semibold text-dark dark:text-white">Maintenance Mode</h1>
        <p className="mx-auto max-w-md text-lg text-muted-foreground">
          Website is under construction. Check back later.
        </p>
        <Button asChild className="mx-auto mt-8">
          <Link to="/">Go Back to Home</Link>
        </Button>
      </div>
    </div>
  )
}

export default Maintainance
