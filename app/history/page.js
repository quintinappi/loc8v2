import dynamic from 'next/dynamic';

const HistoryPageContent = dynamic(() => import('../../components/HistoryPageContent'), {
  ssr: false,
});

export default function HistoryPage() {
  return <HistoryPageContent />;
}