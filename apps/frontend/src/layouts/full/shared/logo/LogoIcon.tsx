import { Link } from 'react-router'
import LogoImg from 'src/assets/images/logos/logo-icon.svg'

const LogoIcon = () => {
  return (
    <Link to={'/'} className="hide-icon flex justify-center">
      <img src={LogoImg} alt="logo" width={40} height={40} />
    </Link>
  )
}

export default LogoIcon
