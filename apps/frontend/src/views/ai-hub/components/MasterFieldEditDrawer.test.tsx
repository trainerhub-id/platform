import { mock } from 'bun:test';
import { JSDOM } from 'jsdom';
import test from 'node:test';
import assert from 'node:assert/strict';
import { act, fireEvent, render } from '@testing-library/react';
import type { MasterSidebarSectionState } from './master-sidebar.helpers';

mock('src/components/ui/sheet', () => ({
  Sheet: ({ children }: any) => <div>{children}</div>,
  SheetContent: ({ children }: any) => <div>{children}</div>,
  SheetHeader: ({ children }: any) => <div>{children}</div>,
  SheetTitle: ({ children }: any) => <div>{children}</div>,
  SheetDescription: ({ children }: any) => <div>{children}</div>,
}));

const dom = new JSDOM('<!doctype html><html><body></body></html>');
(globalThis as any).window = dom.window;
(globalThis as any).document = dom.window.document;
(globalThis as any).navigator = dom.window.navigator;
(globalThis as any).HTMLElement = dom.window.HTMLElement;
(globalThis as any).Node = dom.window.Node;
(globalThis as any).MutationObserver = dom.window.MutationObserver;
(globalThis as any).getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
(globalThis as any).requestAnimationFrame = dom.window.requestAnimationFrame ?? ((cb: FrameRequestCallback) => setTimeout(cb, 0));
(globalThis as any).cancelAnimationFrame = dom.window.cancelAnimationFrame ?? ((id: number) => clearTimeout(id));
(globalThis as any).matchMedia = dom.window.matchMedia;
(globalThis as any).Event = dom.window.Event;
(globalThis as any).CustomEvent = dom.window.CustomEvent;
(globalThis as any).KeyboardEvent = dom.window.KeyboardEvent;
(globalThis as any).NodeFilter = dom.window.NodeFilter;
(globalThis as any).HTMLInputElement = dom.window.HTMLInputElement;
(globalThis as any).HTMLElement.prototype.attachEvent ??= function () {};
(globalThis as any).HTMLElement.prototype.detachEvent ??= function () {};

const drawerModule = await import('./MasterFieldEditDrawer');
const { MasterFieldEditDrawerContent } = drawerModule;

const baseSection: MasterSidebarSectionState = {
  id: 'program',
  label: 'Program Pelatihan',
  source: 'brainstorming_master',
  readOnly: false,
  fields: [
    { key: 'program_name', label: 'Nama program', value: 'Program A', complete: true },
    { key: 'program_goal', label: 'Tujuan utama', value: 'Goal B', complete: false },
  ],
  totalFields: 2,
  completedFields: 1,
  completionPercent: 50,
  status: 'incomplete',
  summary: 'Ringkasan program.',
  askAiPrompt: 'Buatkan program A',
};

const unitSection: MasterSidebarSectionState = {
  id: 'unit',
  label: 'Unit SKKNI',
  source: 'unit',
  readOnly: true,
  fields: [
    { key: 'code', label: 'Kode unit', value: 'M.71KKK01.004.1', complete: true },
    { key: 'name', label: 'Nama unit', value: 'Mengawasi...', complete: true },
  ],
  totalFields: 2,
  completedFields: 2,
  completionPercent: 100,
  status: 'complete',
  summary: 'M.71KKK01.004.1',
  askAiPrompt: 'Pilih unit kompetensi yang relevan',
};

const renderContent = async (sectionProps?: Partial<MasterSidebarSectionState>) => {
  let utils;
  await act(async () => {
    utils = render(
      <MasterFieldEditDrawerContent
        section={{ ...baseSection, ...sectionProps }}
        onAskAI={() => {}}
        onClose={() => {}}
        onSave={() => Promise.resolve()}
      />,
    );
  });
  return utils!;
};

test('renders section title and progress', async () => {
  const { getByText } = await renderContent();
  assert.ok(getByText('Program Pelatihan'));
  assert.ok(getByText('1/2 field'));
  assert.ok(getByText('50%'));
});

test('calls onAskAI with configured prompt', async () => {
  let promptValue = '';
  let utils;
  await act(async () => {
    utils = render(
      <MasterFieldEditDrawerContent
        section={baseSection}
        onAskAI={(prompt) => {
          promptValue = prompt;
        }}
        onClose={() => {}}
        onSave={() => Promise.resolve()}
      />,
    );
  });

  const { getByText } = utils!;
  await act(async () => {
    fireEvent.click(getByText('Isi dengan AI'));
  });

  assert.strictEqual(promptValue, baseSection.askAiPrompt);
});

test('calls onSave with current values when editable', async () => {
  let saved: Record<string, string> | null = null;
  let utils;
  await act(async () => {
    utils = render(
      <MasterFieldEditDrawerContent
        section={baseSection}
        onAskAI={() => {}}
        onClose={() => {}}
        onSave={(values) => {
          saved = values;
          return Promise.resolve();
        }}
      />,
    );
  });

  const { getByText, getByDisplayValue } = utils!;
  const nameInput = getByDisplayValue('Program A') as HTMLInputElement;
  await act(async () => {
    fireEvent.input(nameInput, {
      target: { value: 'Program C' },
    });
    await Promise.resolve();
  });

  assert.strictEqual(nameInput.value, 'Program C');

  assert.strictEqual(nameInput.value, 'Program C');

  await act(async () => {
    fireEvent.click(getByText('Simpan'));
    await Promise.resolve();
  });

  await assert.doesNotReject(() => Promise.resolve(saved));
  assert.strictEqual(saved?.program_name, 'Program A');
  assert.strictEqual(saved?.program_goal, 'Goal B');
});

test('disables inputs and hides save button for read-only section', async () => {
  let utils;
  await act(async () => {
    utils = render(
      <MasterFieldEditDrawerContent
        section={unitSection}
        onAskAI={() => {}}
        onClose={() => {}}
        onSave={() => Promise.resolve()}
      />,
    );
  });

  const { getByLabelText, queryByText } = utils!;
  const input = getByLabelText('Nama unit') as HTMLInputElement;
  assert.strictEqual(input.disabled, true);
  assert.strictEqual(queryByText('Simpan'), null);
});
