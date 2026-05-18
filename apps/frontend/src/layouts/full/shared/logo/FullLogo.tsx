import { Link } from 'react-router'
import Logo from '/src/assets/images/logos/logo.svg'

interface FullLogoProps {
  hideOnMobile?: boolean
}

const FullLogo = ({ hideOnMobile = true }: FullLogoProps) => {
  return (
    <Link to={'/'} className={hideOnMobile ? 'hide-menu hidden lg:block' : ''}>
      <img src={Logo} alt="logo" className="block" width={135} height={40} />
    </Link>
  )
}

export default FullLogo
