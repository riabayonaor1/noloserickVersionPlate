import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Rick',
  description: 'Pagina web con contenido del universo de Rick',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* MathJax para ecuaciones matemáticas */}
        <script
          id="MathJax-script"
          async
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        ></script>
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        
        {/* Script para inicializar elementos de Plate que necesitan JavaScript */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('DOMContentLoaded', function() {
                // Inicializar MathJax para ecuaciones añadidas dinámicamente
                if (typeof MathJax !== 'undefined') {
                  MathJax.typeset();
                }
                
                // Inicializar otros elementos si es necesario
                // Ejemplo: habilitar toggles, tablas interactivas, etc.
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
