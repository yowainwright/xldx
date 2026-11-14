import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Spreadsheet } from "@/components/Spreadsheet";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-4 px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="sr-only">xldx spreadsheet</h1>
        <Spreadsheet />
      </main>

      <Footer />
    </div>
  );
}
