import dynamic from 'next/dynamic';

// Atualize para o nome correto do arquivo (consistente com o sistema de arquivos)
const Quotation = dynamic(() => import('./Quotation'), { ssr: false });

export default function Page() {
  return (
    <div>
      <Quotation />
    </div>
  );
}
