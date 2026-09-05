import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
 title: 'Naruto: Land of Waves — Narutovania',
 description: 'Step into the mist as Naruto. Master shadow clones, substitution and Rasengan, then face Zabuza and Haku in this 2D action chapter.',
 icons: {icon:'/art/naruto-sprites.png'},
};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body>{children}</body></html>;
}
