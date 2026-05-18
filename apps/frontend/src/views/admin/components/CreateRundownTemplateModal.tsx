import { Icon } from '@iconify/react'
import { useState } from 'react'
import api from 'src/api/axios'
import { Button } from 'src/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { ButtonLoading } from 'src/components/ui/loading'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select'
import { Textarea } from 'src/components/ui/textarea'

interface RundownItem {
  clientId: string
  time: string
  title: string
  type: 'session' | 'break' | 'registration'
}

const createRundownItemId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `rundown-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const createRundownItem = (item: Omit<RundownItem, 'clientId'>): RundownItem => ({
  clientId: createRundownItemId(),
  ...item,
})

const toRundownPayload = ({ clientId: _clientId, ...item }: RundownItem) => item

interface CreateRundownTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export const CreateRundownTemplateModal = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateRundownTemplateModalProps) => {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<RundownItem[]>([
    createRundownItem({ time: '08:00', title: 'Registrasi', type: 'registration' }),
  ])

  const addItem = () => {
    setItems([...items, createRundownItem({ time: '09:00', title: '', type: 'session' })])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof RundownItem, value: string) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post('/admin/rundown-templates', {
        name,
        description,
        items: items.map(toRundownPayload),
      })
      onSuccess()
      onOpenChange(false)
      // Reset form
      setName('')
      setDescription('')
      setItems([createRundownItem({ time: '08:00', title: 'Registrasi', type: 'registration' })])
    } catch (error: any) {
      console.error('Error creating template:', error)
      alert(error.response?.data?.message || 'Failed to create template')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="solar:document-add-line-duotone" className="text-primary" height={24} />
            Create Rundown Template
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">
              Template Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard Training Day"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this template"
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Rundown Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Icon icon="solar:add-circle-line-duotone" className="mr-1" height={16} />
                Add Item
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {items.map((item, index) => (
                <div
                  key={item.clientId}
                  className="flex gap-2 items-start p-3 border border-ld rounded-md"
                >
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor={`time-${index}`} className="text-xs">
                        Time
                      </Label>
                      <Input
                        id={`time-${index}`}
                        type="time"
                        value={item.time}
                        onChange={(e) => updateItem(index, 'time', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`type-${index}`} className="text-xs">
                        Type
                      </Label>
                      <Select
                        value={item.type}
                        onValueChange={(val) => updateItem(index, 'type', val)}
                      >
                        <SelectTrigger id={`type-${index}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="registration">Registration</SelectItem>
                          <SelectItem value="session">Training Session</SelectItem>
                          <SelectItem value="break">Break</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1">
                      <Label htmlFor={`title-${index}`} className="text-xs">
                        Title
                      </Label>
                      <Input
                        id={`title-${index}`}
                        value={item.title}
                        onChange={(e) => updateItem(index, 'title', e.target.value)}
                        placeholder="e.g., Training - Sesi 1"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="mt-6 text-error hover:text-error"
                  >
                    <Icon icon="solar:trash-bin-trash-line-duotone" height={18} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <ButtonLoading />
                  Creating...
                </>
              ) : (
                <>
                  <Icon icon="solar:check-circle-bold" className="mr-2" height={18} />
                  Create Template
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
