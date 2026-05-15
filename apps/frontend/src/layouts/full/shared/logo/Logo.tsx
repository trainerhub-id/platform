
import { Link } from 'react-router'
import LogoIcon from 'src/assets/images/logos/logo.svg'

const Logo = () => {
    return (
        <Link to={'/'}>
            <img src={LogoIcon} alt="logo" className="h-12" />
        </Link>
    )
}

export default Logo
