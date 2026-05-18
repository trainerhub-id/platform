// Type definitions for Trainer Dashboard components

export interface TrainingInfo {
  id: string
  title: string
  startDate: string
  endDate: string
  location: string
  venue: string
  paymentStatus: 'lunas' | 'pending' | 'partial'
}

export interface ProgressStep {
  id: number
  title: string
  status: 'completed' | 'current' | 'pending'
  icon: string
  color: string
}

export interface QuickAccessItem {
  id: number
  title: string
  description: string
  icon: string
  bgColor: string
  buttonText: string
  buttonVariant: 'outline' | 'default'
  href?: string
}

export interface Task {
  id: number
  title: string
  description: string
  completed: boolean
  buttonText: string
  priority?: 'normal' | 'high'
}

export interface Alert {
  id: number
  type: 'warning' | 'info' | 'success' | 'error'
  message: string
  dismissible?: boolean
}

// Example data structure for API integration
export interface TrainerDashboardData {
  user: {
    name: string
    email: string
    role: string
  }
  training: TrainingInfo
  progress: {
    currentStep: number
    steps: ProgressStep[]
  }
  tasks: Task[]
  alerts: Alert[]
}
