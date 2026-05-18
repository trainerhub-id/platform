import React, { useContext } from 'react'
import { CustomizerContext } from 'src/context/CustomizerContext'
import { Card } from '../ui/card'

interface MyAppProps {
  children: React.ReactNode
  className?: string
}
const OutlineCard: React.FC<MyAppProps> = ({ children, className }) => {
  const { isCardShadow } = useContext(CustomizerContext)
  return (
    <Card
      className={`card ${className} ${isCardShadow ? ' border border-ld' : ' border border-ld'} `}
    >
      {children}
    </Card>
  )
}

export default OutlineCard
