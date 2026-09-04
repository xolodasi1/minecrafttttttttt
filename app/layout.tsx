import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Minecraft World Manager & Unity C# Engine',
  description: 'Minecraft clone world selection and creation menu for PC with Flat and Default worlds, save file manager, 3D voxel preview, and Unity C# landscape generation scripts.',
  openGraph: {
    title: 'Minecraft World Manager & Unity C# Engine',
    description: 'Minecraft clone world selection and creation menu for PC with Flat and Default worlds, save file manager, 3D voxel preview, and Unity C# landscape generation scripts.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Minecraft World Manager & Unity C# Engine',
    description: 'Minecraft clone world selection and creation menu for PC with Flat and Default worlds, save file manager, 3D voxel preview, and Unity C# landscape generation scripts.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
