import React from 'react'
import CardBox from 'src/components/shared/CardBox'

const SamplePage = () => {
  return (
    <CardBox className="flex flex-col gap-3">
      <h5 className="card-title">Sample page 1</h5>
      <p>
        Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has
        been the industry's standard dummy text ever since the 1500s
      </p>
    </CardBox>
  )
}

export default SamplePage
