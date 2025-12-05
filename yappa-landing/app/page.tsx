import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Benefits from '@/components/Benefits';
import Mission from '@/components/Mission';
import AboutUs from '@/components/AboutUs';
import Demo from '@/components/Demo';
import ForStores from '@/components/ForStores';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <Hero />
        <Benefits />
        <Mission />
        <AboutUs />
        <Demo />
        <ForStores />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
