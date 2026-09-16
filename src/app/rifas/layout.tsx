import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rifas Gratis de la Comunidad',
  description:
    'Crea tu rifa gratis, compártela por WhatsApp y gestiona las reservas al instante. Sin registro. Comunidad Tenute Chile.',
};

export default function RifasLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
