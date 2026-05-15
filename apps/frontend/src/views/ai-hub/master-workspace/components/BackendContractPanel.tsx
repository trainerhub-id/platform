const endpoints = [
  'GET /api/ai-master/workspace/:documentId',
  'POST /api/ai-master/workspace/:documentId/messages',
  'PATCH /api/ai-master/workspace/:documentId/slots/:field',
  'POST /api/ai-master/workspace/:documentId/skkni/search',
  'POST /api/ai-master/workspace/:documentId/skkni/select',
  'POST /api/ai-master/workspace/:documentId/documents/generate-all',
];

export function BackendContractPanel() {
  return (
    <section className="rounded-[2rem] border border-slate-800 bg-slate-950 p-5 text-white shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">Integration seam</p>
      <h2 className="mt-1 text-xl font-bold">Backend Contract</h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">Backend baru cukup implement endpoint ini dengan response shape dari `contracts.ts`.</p>
      <div className="mt-4 space-y-2">
        {endpoints.map((endpoint) => (
          <code key={endpoint} className="block rounded-xl bg-white/10 px-3 py-2 text-xs text-amber-100">{endpoint}</code>
        ))}
      </div>
    </section>
  );
}
