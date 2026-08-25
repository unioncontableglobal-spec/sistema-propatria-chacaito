import DirectorioTable from '@/components/socios/DirectorioTable';

export const dynamic = 'force-dynamic';

export default function DirectorioPage() {
  return (
    <div className="pb-8">
      <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Directorio de Asociados</h1>
        </div>
      </header>

      <main>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-primary uppercase">Directorio Institucional</h2>
          </div>
          
          <div className="p-6">
            <DirectorioTable />
          </div>
        </div>
      </main>
    </div>
  );
}
