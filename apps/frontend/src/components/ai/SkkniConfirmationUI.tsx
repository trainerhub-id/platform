/**
 * SKKNI Confirmation UI Component
 * Displays SKKNI unit selection details with confirm/cancel actions
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { SkkniConfirmationData } from 'src/types/apps/skkni';

interface SkkniConfirmationUIProps {
  data: SkkniConfirmationData;
  onConfirm?: (data: SkkniConfirmationData) => void;
  onCancel?: () => void;
  confirmed?: boolean;
  readonly?: boolean;
}

// Helper function moved outside component to prevent recreation on every render
const getStatusBadge = (availability: 'applied' | 'cancelled') => {
  if (availability === 'applied') {
    return <Badge variant="success">Berlaku</Badge>;
  }
  return <Badge variant="gray">Dicabut</Badge>;
};

export const SkkniConfirmationUI: React.FC<SkkniConfirmationUIProps> = ({
  data,
  onConfirm,
  onCancel,
  confirmed,
  readonly,
}) => {

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span role="img" aria-label="Document">📋</span>
          <span>Konfirmasi Pilihan Unit Kompetensi</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Document Section */}
        <div>
          <h4 className="font-semibold mb-2 text-sm text-bodytext">
            Dokumen SKKNI:
          </h4>
          <dl className="space-y-2">
            <div className="flex gap-2">
              <dt className="font-medium min-w-[80px]">Nomor:</dt>
              <dd>{data.documentNumber ?? 'N/A'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium min-w-[80px]">Judul:</dt>
              <dd>{data.documentTitle ?? 'N/A'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium min-w-[80px]">Sektor:</dt>
              <dd>{data.sector ?? 'N/A'}</dd>
            </div>
          </dl>
        </div>

        {/* Unit Section */}
        <div>
          <h4 className="font-semibold mb-2 text-sm text-bodytext">
            Unit Kompetensi:
          </h4>
          <dl className="space-y-2">
            <div className="flex gap-2">
              <dt className="font-medium min-w-[80px]">Kode:</dt>
              <dd className="font-mono text-sm">{data.unitCode ?? 'N/A'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium min-w-[80px]">Judul:</dt>
              <dd>{data.unitTitle ?? 'N/A'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium min-w-[80px]">Status:</dt>
              <dd>{getStatusBadge(data.unitAvailability)}</dd>
            </div>
          </dl>
        </div>
      </CardContent>

      {/* Actions (only if not readonly) */}
      {!readonly && (
        <CardFooter className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button onClick={() => onConfirm?.(data)}>
            Simpan
          </Button>
        </CardFooter>
      )}

      {/* Receipt state */}
      {readonly && confirmed && (
        <CardFooter>
          <div className="text-sm text-success flex items-center gap-2">
            <span role="img" aria-label="Confirmed">✓</span>
            <span>Pilihan dikonfirmasi</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default SkkniConfirmationUI;
