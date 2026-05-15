import { mock } from 'bun:test';
import { JSDOM } from 'jsdom';
import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '@testing-library/react';

mock('@iconify/react', () => ({
  Icon: ({ icon, className }: { icon: string; className?: string }) => (
    <span data-icon={icon} className={className} />
  ),
}));

const dom = new JSDOM('<!doctype html><html><body></body></html>');
(globalThis as any).window = dom.window;
(globalThis as any).document = dom.window.document;
(globalThis as any).navigator = dom.window.navigator;
(globalThis as any).HTMLElement = dom.window.HTMLElement;
(globalThis as any).Node = dom.window.Node;
(globalThis as any).MutationObserver = dom.window.MutationObserver;

const overlayModule = await import('./MasterBatchGenerateOverlay');
const { MasterBatchGenerateOverlay } = overlayModule;

test('renders nothing when closed', () => {
  const { queryByText } = render(
    <MasterBatchGenerateOverlay isOpen={false} />,
  );

  assert.strictEqual(queryByText('AI sedang menyusun semua bukti master'), null);
});

test('renders animated master batch copy when open', () => {
  const { getByText, getByTestId } = render(
    <MasterBatchGenerateOverlay isOpen />,
  );

  assert.ok(getByText('AI sedang menyusun semua bukti master'));
  assert.ok(getByText('Mohon tunggu. Bukti 1 sampai Bukti 8 sedang diproses satu per satu.'));
  assert.ok(getByTestId('master-batch-overlay'));
});
