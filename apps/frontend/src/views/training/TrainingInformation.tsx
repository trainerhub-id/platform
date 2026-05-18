import { Icon } from '@iconify/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs'
import 'src/views/training/training-map.css'

import TrainingDetailTab from 'src/components/training/TrainingDetailTab'
import TrainingMap from 'src/components/training/TrainingMap'
import TrainingRundownTab from 'src/components/training/TrainingRundownTab'
import TrainingSummaryCard from 'src/components/training/TrainingSummaryCard'
import { Loading } from 'src/components/ui/loading'
import { useTrainingInfo } from './hooks/useTrainingInfo'

const TrainingInformation = () => {
  const { selectedTraining, loading } = useTrainingInfo()

  if (loading) {
    return <Loading fullPage />
  }

  if (!selectedTraining) {
    return (
      <div
        className="rounded-[18px] border border-[#E8E2D8] bg-white p-12 text-center"
        style={{ boxShadow: '0 8px 24px rgba(31,41,55,0.04)' }}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="h-20 w-20 rounded-full bg-[#F5EBDD] flex items-center justify-center mb-4">
            <Icon icon="solar:calendar-minimalistic-linear" className="text-[#B8863B]" height={40} />
          </div>
          <h3 className="text-lg font-semibold text-[#1F2937] mb-2">Belum Ada Training</h3>
          <p className="text-sm text-[#6B7280]">
            Saat ini belum ada training yang tersedia untuk Anda.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Section: 2 columns — Summary + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.25fr] gap-6">
        {/* Card 1: Ringkasan Training */}
        <TrainingSummaryCard selectedTraining={selectedTraining} />

        {/* Card 2: Lokasi Training */}
        <div
          className="bg-white rounded-[18px] border border-[#E8E2D8] p-5"
          style={{ boxShadow: '0 8px 24px rgba(31,41,55,0.04)' }}
        >
          {/* Card Header */}
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="solar:map-point-bold" className="text-[#B8863B]" height={18} />
            <span className="text-[16px] font-bold text-[#B8863B]">Lokasi Training</span>
          </div>

          {/* Map */}
          <div className="rounded-[14px] overflow-hidden border border-[#E8E2D8]" style={{ height: '280px' }}>
            <TrainingMap selectedTraining={selectedTraining} />
          </div>
        </div>
      </div>

      {/* Bottom Section: Detail Training full-width card */}
      <div
        className="bg-white rounded-[18px] border border-[#E8E2D8] p-7"
        style={{ boxShadow: '0 8px 24px rgba(31,41,55,0.04)' }}
      >
        {/* Card Header */}
        <div className="flex items-center gap-2 mb-6">
          <Icon icon="solar:folder-with-files-bold" className="text-[#B8863B]" height={20} />
          <span className="text-[22px] font-bold text-[#1F2937]">Detail Training</span>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="detail" className="w-full">
          <TabsList className="bg-transparent h-auto p-0 gap-2 mb-7 w-full justify-start overflow-x-auto pb-1">
            <TabsTrigger
              value="detail"
              className="data-[state=active]:bg-[#B8863B] data-[state=active]:text-white data-[state=active]:shadow-none bg-[#F3F4F6] text-[#6B7280] border border-[#E8E2D8] data-[state=active]:border-[#B8863B] rounded-[10px] px-[18px] h-[42px] text-sm font-semibold transition-all flex items-center gap-2"
            >
              <Icon icon="solar:folder-with-files-bold" height={18} />
              Detail Training
            </TabsTrigger>
            <TabsTrigger
              value="rundown"
              className="data-[state=active]:bg-[#B8863B] data-[state=active]:text-white data-[state=active]:shadow-none bg-[#F3F4F6] text-[#6B7280] border border-[#E8E2D8] data-[state=active]:border-[#B8863B] rounded-[10px] px-[18px] h-[42px] text-sm font-semibold transition-all flex items-center gap-2"
            >
              <Icon icon="solar:checklist-minimalistic-bold" height={18} />
              Rundown Acara
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detail" className="mt-0 outline-none">
            <TrainingDetailTab selectedTraining={selectedTraining} />
          </TabsContent>

          <TabsContent value="rundown" className="mt-0 outline-none">
            <TrainingRundownTab rundown={selectedTraining.rundown} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default TrainingInformation
