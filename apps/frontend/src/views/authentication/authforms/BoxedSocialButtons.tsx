import React from 'react'
import { Link } from 'react-router'
import { Separator } from 'src/components/ui/separator'
import FB from '/src/assets/images/svgs/facebook-icon.svg'
import Google from '/src/assets/images/svgs/google-icon.svg'

interface MyAppProps {
  title?: string
}

const BoxedSocialButtons: React.FC<MyAppProps> = ({ title }) => {
  return (
    <>
      <div className="flex justify-between gap-8 mb-6 md:mt-10 mt-5">
        <Link
          to={'/'}
          className="px-4 py-3 shadow-tw border border-ld flex gap-2 items-enter w-full rounded-md text-center justify-center text-ld hover:bg-sky hover:text-primary dark:text-white dark:hover:bg-sky dark:hover:text-primary font-semibold"
        >
          <img src={FB} alt="google" height={18} width={18} />
          <span className="lg:flex items-center hidden">Sign in with</span>Facebook
        </Link>
        <Link
          to={'/'}
          className="px-4 py-3 shadow-tw border border-ld flex gap-2 items-enter w-full rounded-md text-center justify-center text-ld hover:bg-sky hover:text-primary dark:text-white dark:hover:bg-sky dark:hover:text-primary font-semibold"
        >
          <img src={Google} alt="google" height={18} width={18} />{' '}
          <span className="lg:flex items-center hidden">Sign in with</span>Google
        </Link>
      </div>
      {/* Divider */}
      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-sm text-bodytext">{title}</span>
        <Separator className="flex-1" />
      </div>
    </>
  )
}

export default BoxedSocialButtons
