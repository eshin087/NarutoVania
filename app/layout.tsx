import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
 title: 'Naruto: Land of Waves — Story Boss Rush',
 description: 'Relive Team 7’s Land of Waves encounters. Master parries, stamina and signature techniques as Kakashi, Naruto, Sasuke and Sakura in a seven-phase story boss rush.',
 icons: {icon:'/art-v2/portraits/naruto.png'},
};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body>{children}</body></html>;
}
