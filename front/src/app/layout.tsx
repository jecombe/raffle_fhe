import "../styles/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "./providers";
import { FhevmProvider } from "./Contexts/FhevmContext";
import TopMenu from "./components/TopMenu";

function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
      <Providers>
        <TopMenu/>
        <FhevmProvider>
          {children}
        </FhevmProvider>
        </Providers>
      </body>
    </html>
  );
}

export default RootLayout;
