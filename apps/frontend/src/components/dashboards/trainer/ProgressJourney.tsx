import { Icon } from '@iconify/react'

interface JourneyStep {
  id: number
  title: string
  status: 'completed' | 'current' | 'pending'
}

interface ProgressJourneyProps {
  journey?: JourneyStep[]
}

const ProgressJourney = ({ journey = [] }: ProgressJourneyProps) => {
  // Fallback if no journey provided
  if (!journey || journey.length === 0) {
    return (
      <div className="py-2">
        <h4 className="text-lg font-bold text-gray-800 mb-6">Progres Journey Sertifikasi</h4>
        <div className="text-center py-8 text-gray-400 text-sm">
          Belum ada jadwal training aktif.
        </div>
      </div>
    )
  }

  // Calculate progress width
  // 0 completed -> 0%
  // 1 completed -> 33%
  // 2 completed -> 66%
  // 3 completed (last is current) -> 100%
  // 4 completed -> 100%
  const completedCount = journey.filter((s) => s.status === 'completed').length
  const currentStep = journey.find((s) => s.status === 'current')

  // If no step is current but all are completed (rare case with current logic), default to max
  // If step 4 is current, we want it to be fully filled?
  // Let's assume 3 segments for 4 steps.
  // Step 1 done -> 1/3 filled? No.
  // Step 1 (Start) --- Step 2 --- Step 3 --- Step 4 (End)
  // If Step 1 is Current -> 0% filled.
  // If Step 2 is Current -> 33% filled.
  // If Step 3 is Current -> 66% filled.
  // If Step 4 is Current -> 100% filled.

  let progressPercentage = 0
  if (completedCount > 0) {
    const totalSegments = journey.length - 1
    // logic: completedCount represents how many steps passed.
    // If Step 2 is current, Step 1 is completed. completedCount = 1.
    // 1 / 3 * 100 = 33.3%
    progressPercentage = (completedCount / totalSegments) * 100
  }

  // Cap at 100
  if (progressPercentage > 100) progressPercentage = 100

  return (
    <div className="py-2">
      <h4 className="text-lg font-bold text-gray-800 mb-6">Progres Journey Sertifikasi</h4>

      <div className="relative mt-8 mb-4">
        {/* Progress Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-100">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progressPercentage}%`, backgroundColor: 'var(--color-gold)' }}
          ></div>
        </div>

        {/* Steps */}
        <div className="flex justify-between relative">
          {journey.map((step) => (
            <div
              key={step.id}
              className="flex flex-col items-center z-10"
              style={{ width: '80px' }}
            >
              {/* Icon Circle */}
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 ${
                  step.status === 'completed'
                    ? ''
                    : step.status === 'current'
                      ? 'bg-white'
                      : 'bg-gray-50'
                }`}
                style={
                  step.status === 'completed'
                    ? { backgroundColor: 'var(--color-gold)' }
                    : step.status === 'current'
                      ? { borderWidth: '2px', borderColor: 'var(--color-gold)', backgroundColor: '#fff' }
                      : { borderWidth: '1px', borderColor: '#e5e7eb' }
                }
              >
                {step.status === 'completed' ? (
                  <Icon icon="solar:check-read-outline" className="text-white" height={24} />
                ) : step.status === 'current' ? (
                  <span className="text-sm font-bold text-[var(--color-gold)]">{step.id}</span>
                ) : (
                  <span className="text-sm font-bold text-gray-400">{step.id}</span>
                )}
              </div>

              {/* Label */}
              <p
                className={`text-[11px] md:text-xs text-center font-bold whitespace-nowrap ${
                  step.status === 'completed'
                    ? ''
                    : step.status === 'current'
                      ? 'text-[var(--color-gold)]'
                      : 'text-gray-500'
                }`}
                style={step.status === 'completed' ? { color: 'var(--color-gold)' } : {}}
              >
                {step.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ProgressJourney
