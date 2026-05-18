import { Icon } from '@iconify/react'
import {} from 'react'
import CardBox from 'src/components/shared/CardBox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs'
import 'src/views/training/training-map.css'

import TrainingDetailTab from 'src/components/training/TrainingDetailTab'
// New Components
import TrainingList from 'src/components/training/TrainingList'
import TrainingMap from 'src/components/training/TrainingMap'
import TrainingRundownTab from 'src/components/training/TrainingRundownTab'
import { Loading } from 'src/components/ui/loading'
import { useTrainingInfo } from './hooks/useTrainingInfo'

const TrainingInformation = () => {
  const { trainings, selectedTraining, setSelectedTraining, loading } = useTrainingInfo()

  if (loading) {
    return <Loading fullPage />
  }

  if (!selectedTraining) {
    return (
      <CardBox className="p-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Icon icon="solar:calendar-minimalistic-linear" className="text-gray-400" height={40} />
          </div>
          <h3 className="text-lg font-semibold text-dark mb-2">Belum Ada Training</h3>
          <p className="text-sm text-bodytext">
            Saat ini belum ada training yang tersedia untuk Anda.
          </p>
        </div>
      </CardBox>
    )
  }

  return (
    <div>
      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6 relative">
        {/* Left Sidebar - Training List */}
        <div className="lg:col-span-4 col-span-12 lg:sticky lg:top-[100px] lg:self-start">
          <TrainingList
            trainings={trainings}
            selectedId={selectedTraining.id}
            onSelect={setSelectedTraining}
          />
        </div>

        {/* Right Side - Details */}
        <div className="lg:col-span-8 col-span-12 space-y-6 pt-4">
          {/* Map Section */}
          <CardBox className="p-0 overflow-hidden">
            <TrainingMap selectedTraining={selectedTraining} />
          </CardBox>

          {/* Details Content */}
          <CardBox className="p-8">
            {/* Header with Batch Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <h3 className="text-2xl font-bold text-dark">Detail Training</h3>
              <Select
                value={selectedTraining.id}
                onValueChange={(val) => {
                  const selected = trainings.find((t) => t.id === val)
                  if (selected) setSelectedTraining(selected)
                }}
              >
                <SelectTrigger className="w-full sm:w-[220px] rounded-xl border-gray-200">
                  <SelectValue placeholder="Pilih Batch" />
                </SelectTrigger>
                <SelectContent>
                  {trainings.map((training) => (
                    <SelectItem key={training.id} value={training.id}>
                      {training.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tabs (Detail Training / Rundown) */}
            <Tabs defaultValue="detail" className="w-full">
              <TabsList className="bg-transparent h-auto p-0 gap-3 mb-8 w-full justify-start overflow-x-auto custom-scrollbar pb-2">
                <TabsTrigger
                  value="detail"
                  className="data-[state=active]:bg-[var(--color-gold)] data-[state=active]:text-white bg-lightgray text-bodytext rounded-xl px-4 py-2 h-auto text-sm font-semibold transition-all border-none flex items-center gap-2"
                >
                  <Icon icon="solar:folder-with-files-bold" height={18} />
                  Detail Training
                </TabsTrigger>
                <TabsTrigger
                  value="rundown"
                  className="data-[state=active]:bg-[var(--color-gold)] data-[state=active]:text-white bg-lightgray text-bodytext rounded-xl px-4 py-2 h-auto text-sm font-semibold transition-all border-none flex items-center gap-2"
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
          </CardBox>
        </div>
      </div>
    </div>
  )
}

export default TrainingInformation
