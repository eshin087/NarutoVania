import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
 title: 'Narutovania — Story Boss Rush',
 description: 'Relive Land of Waves and Rock Lee versus Gaara. Master taijutsu, parries, stamina and signature techniques in an animated Naruto boss rush.',
 icons: {icon:'/art-v2/portraits/naruto.png'},
};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body>{children}</body></html>;
}
