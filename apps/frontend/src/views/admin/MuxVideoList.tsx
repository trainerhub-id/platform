import { Icon } from '@iconify/react'
import { useEffect, useState } from 'react'
import api from 'src/api/axios'
import CardBox from 'src/components/shared/CardBox'
import LazyMuxPlayer from 'src/components/shared/LazyMuxPlayer'
import { Badge } from 'src/components/ui/badge'
import { Button } from 'src/components/ui/button'
import { Loading } from 'src/components/ui/loading'
import { useAuthAxios } from 'src/hooks/useAuthAxios'

interface MuxAsset {
  id: string
  status: string
  playbackId: string
  playbackPolicy: string
  duration: number
  aspectRatio: string
  createdAt: string
  maxStoredResolution: string
  maxStoredFrameRate: number
  playbackToken: string | null
}

const MuxVideoList = () => {
  useAuthAxios() // Setup auth interceptor for API calls

  const [assets, setAssets] = useState<MuxAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<MuxAsset | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const response = await api.get('/kelas/mux/list-all')
      setAssets(response.data)
    } catch (error) {
      console.error('Failed to fetch Mux assets:', error)
      alert('Gagal memuat daftar video Mux')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    alert(`${label} disalin ke clipboard!`)
  }

  if (loading) {
    return <Loading fullPage />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark">Mux Video Library</h2>
          <p className="text-sm text-bodytext">Daftar semua video yang tersimpan di Mux</p>
        </div>
        <Button onClick={fetchAssets} variant="outline">
          <Icon icon="solar:refresh-linear" className="mr-2" height={18} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CardBox className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Icon icon="solar:videocamera-bold" className="text-blue-600" height={24} />
            </div>
            <div>
              <p className="text-sm text-bodytext">Total Videos</p>
              <p className="text-2xl font-bold text-dark">{assets.length}</p>
            </div>
          </div>
        </CardBox>
        <CardBox className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Icon icon="solar:check-circle-bold" className="text-green-600" height={24} />
            </div>
            <div>
              <p className="text-sm text-bodytext">Ready</p>
              <p className="text-2xl font-bold text-dark">
                {assets.filter((a) => a.status === 'ready').length}
              </p>
            </div>
          </div>
        </CardBox>
        <CardBox className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Icon icon="solar:refresh-circle-bold" className="text-yellow-600" height={24} />
            </div>
            <div>
              <p className="text-sm text-bodytext">Processing</p>
              <p className="text-2xl font-bold text-dark">
                {assets.filter((a) => a.status === 'preparing').length}
              </p>
            </div>
          </div>
        </CardBox>
        <CardBox className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Icon icon="solar:lock-keyhole-bold" className="text-purple-600" height={24} />
            </div>
            <div>
              <p className="text-sm text-bodytext">Signed</p>
              <p className="text-2xl font-bold text-dark">
                {assets.filter((a) => a.playbackPolicy === 'signed').length}
              </p>
            </div>
          </div>
        </CardBox>
      </div>

      {/* Video List */}
      <CardBox>
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-dark">Daftar Video Mux</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="py-3 px-4 text-xs font-semibold text-bodytext uppercase tracking-wider">
                  Preview
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-bodytext uppercase tracking-wider">
                  Asset Info
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-bodytext uppercase tracking-wider">
                  Playback ID
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-bodytext uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-4 text-xs font-semibold text-bodytext uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assets.length > 0 ? (
                assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4">
                      {asset.playbackId ? (
                        <div className="w-32 h-18 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={`https://image.mux.com/${asset.playbackId}/thumbnail.jpg?time=0&width=200`}
                            alt="Thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-18 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Icon
                            icon="solar:videocamera-slash-linear"
                            className="text-gray-400"
                            height={24}
                          />
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <p className="text-xs font-mono text-gray-600">ID: {asset.id}</p>
                        <p className="text-xs text-bodytext">
                          Duration: {formatDuration(asset.duration)}
                        </p>
                        <p className="text-xs text-bodytext">
                          Resolution: {asset.maxStoredResolution}
                        </p>
                        <p className="text-xs text-bodytext">
                          Created: {formatDate(asset.createdAt)}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {asset.playbackId ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {asset.playbackId}
                            </code>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(asset.playbackId, 'Playback ID')}
                            >
                              <Icon icon="solar:copy-linear" height={14} />
                            </Button>
                          </div>
                          <Badge
                            className={`text-xs ${asset.playbackPolicy === 'signed' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                          >
                            {asset.playbackPolicy}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No playback ID</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        className={`
                                                ${asset.status === 'ready' ? 'bg-green-100 text-green-700' : ''}
                                                ${asset.status === 'preparing' ? 'bg-yellow-100 text-yellow-700' : ''}
                                                ${asset.status === 'errored' ? 'bg-red-100 text-red-700' : ''}
                                            `}
                      >
                        {asset.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {asset.playbackToken && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(asset.playbackToken!, 'Playback Token')}
                          >
                            <Icon icon="solar:copy-linear" className="mr-2" height={16} />
                            Copy Token
                          </Button>
                        )}
                        {asset.playbackId && asset.status === 'ready' && (
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-primary/90"
                            onClick={() => {
                              setSelectedAsset(asset)
                              setShowPlayer(true)
                            }}
                          >
                            <Icon icon="solar:play-circle-bold" className="mr-2" height={16} />
                            Play
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center opacity-40">
                      <Icon icon="solar:videocamera-slash-linear" height={64} />
                      <p className="mt-2 font-medium">Tidak ada video di Mux</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardBox>

      {/* Video Player Modal */}
      {showPlayer && selectedAsset && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-dark">Video Player</h3>
                <p className="text-xs text-bodytext font-mono">{selectedAsset.playbackId}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setShowPlayer(false)
                  setSelectedAsset(null)
                }}
              >
                <Icon icon="solar:close-circle-linear" height={24} />
              </Button>
            </div>
            <div className="aspect-video bg-black">
              {selectedAsset.playbackToken ? (
                <LazyMuxPlayer
                  playbackId={selectedAsset.playbackId}
                  tokens={{
                    playback: selectedAsset.playbackToken,
                  }}
                  streamType="on-demand"
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <Icon icon="solar:lock-keyhole-linear" height={48} className="mb-2" />
                    <p>No playback token available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MuxVideoList
