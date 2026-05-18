import { useLocation } from 'react-router'
import { Button } from 'src/components/ui/button'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from 'src/components/ui/carousel'
import AuthSlide from '/src/assets/images/backgrounds/login-side.png'

const SliderData = [
  {
    title: 'Feature Rich 3D Charts',
    desc: 'Donec justo tortor, malesuada vitae faucibus ac, tristique sit amet massa. Aliquam dignissim nec felis quis imperdiet.',
  },
  {
    title: 'Feature Rich 2D Charts',
    desc: 'Donec justo tortor, malesuada vitae faucibus ac, tristique sit amet massa. Aliquam dignissim nec felis quis imperdiet.',
  },
  {
    title: 'Feature Rich 1D Charts',
    desc: 'Donec justo tortor, malesuada vitae faucibus ac, tristique sit amet massa. Aliquam dignissim nec felis quis imperdiet.',
  },
]

const BoxedAuthSlider = () => {
  const location = useLocation()
  const pathname = location.pathname

  const isSmall = pathname === '/auth/auth2/forgot-password' || pathname === '/auth/auth2/two-steps'

  return (
    <div className="max-w-md mx-auto h-full flex flex-col gap-10 justify-center items-center boxed-auth">
      {/* IMAGE */}
      <img src={AuthSlide} alt="auth" className={isSmall ? 'max-w-[200px]' : 'max-w-[300px]'} />

      {/* SHADCN CAROUSEL */}
      <Carousel className={isSmall ? '!h-[150px] w-full' : '-mt-8 w-full'} opts={{ loop: true }}>
        <CarouselContent>
          {SliderData.map((item, index) => (
            <CarouselItem key={index}>
              <div className="text-center px-6">
                <h5 className="text-2xl my-6">{item.title}</h5>

                {!isSmall && <p className="text-15 my-6 mt-3 leading-6">{item.desc}</p>}

                <Button className="w-fit mx-auto">Learn More</Button>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* OPTIONAL NAV BUTTONS */}
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )
}

export default BoxedAuthSlider
