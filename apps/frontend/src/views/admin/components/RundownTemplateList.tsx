import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import api from 'src/api/axios'
import { Button } from 'src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { Loading } from 'src/components/ui/loading'
import { CreateRundownTemplateModal } from './CreateRundownTemplateModal'
import { EditRundownTemplateModal } from './EditRundownTemplateModal'

interface RundownItem {
  time: string
  title: string
  type: 'session' | 'break' | 'registration'
}

interface RundownTemplate {
  id: number
  name: string
  description?: string
  items: RundownItem[]
  createdAt: string
  updatedAt: string
}

export const RundownTemplateList = () => {
  const [templates, setTemplates] = useState<RundownTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<RundownTemplate | null>(null)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await api.get('/admin/rundown-templates')
      setTemplates(response.data)
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await api.delete(`/admin/rundown-templates/${id}`)
      fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template')
    }
  }

  const handleEdit = (template: RundownTemplate) => {
    setSelectedTemplate(template)
    setEditModalOpen(true)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'session':
        return 'text-primary bg-lightprimary'
      case 'break':
        return 'text-info bg-lightinfo'
      case 'registration':
        return 'text-warning bg-lightwarning'
      default:
        return 'text-bodytext bg-lightgray'
    }
  }

  if (loading) {
    return <Loading fullPage text="Memuat templates..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-dark dark:text-white">Rundown Templates</h3>
          <p className="text-bodytext text-sm mt-1">Manage event rundown templates</p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Icon icon="solar:add-circle-bold" className="mr-2" height={18} />
          Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon
              icon="solar:document-text-line-duotone"
              className="mx-auto mb-4 text-bodytext"
              height={64}
            />
            <p className="text-bodytext">No templates found. Create your first rundown template.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.description && (
                      <p className="text-sm text-bodytext mt-1">{template.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                      <Icon icon="solar:pen-line-duotone" height={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="text-error hover:text-error"
                    >
                      <Icon icon="solar:trash-bin-trash-line-duotone" height={18} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-dark dark:text-white">
                    {template.items.length} items
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {template.items.slice(0, 5).map((item, idx) => (
                      <div key={`${item.time}-${item.type}`} className="flex items-center gap-2 text-sm">
                        <span className="text-bodytext font-mono">{item.time}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                        <span className="text-dark dark:text-white truncate">{item.title}</span>
                      </div>
                    ))}
                    {template.items.length > 5 && (
                      <p className="text-xs text-bodytext">
                        +{template.items.length - 5} more items
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateRundownTemplateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchTemplates}
      />

      {selectedTemplate && (
        <EditRundownTemplateModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          template={selectedTemplate}
          onSuccess={fetchTemplates}
        />
      )}
    </div>
  )
}
