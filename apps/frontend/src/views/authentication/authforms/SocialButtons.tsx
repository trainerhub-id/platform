import React from 'react'
import Google from 'src/assets/images/svgs/google-icon.svg'

interface MyAppProps {
  title?: string
}

const SocialButtons: React.FC<MyAppProps> = ({ title }) => {
  return (
    <>
      <div className="my-6">
        <button
          type="button"
          disabled
          className="px-4 py-2.5 border border-ld flex gap-2 items-center w-full rounded-md text-center justify-center text-ld text-primary-ld hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img src={Google} alt="google" height={18} width={18} /> Google
        </button>
      </div>
      {/* Divider */}
      <div className="flex items-center justify-center gap-2">
        <hr className="grow border-ld" />
        <p className="text-base text-ld font-medium">{title}</p>
        <hr className="grow border-ld" />
      </div>
    </>
  )
}

export default SocialButtons
