
import { useState } from "react";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Membership from "./components/Membership";
import Amenities from "./components/Amenities";
import Benefits from "./components/Benefits";
import Gallery from "./components/Gallery";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

import BookingForm from "./components/BookingForm";
import TermsAndConditions from "./components/TermsAndConditions";
import MobileActionBar from "./components/MobileActionBar";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import BackToTop from "./components/BackToTop";

type Page = "home" | "booking" | "terms";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");

  return (
    <>
      {currentPage === "home" && (
        <>
          <Navbar
            onBookNow={() => setCurrentPage("booking")}
            isBookingPage={false}
          />

          <main>
            <Hero />
            <About />
            <Membership />
            <Amenities />
            <Benefits />
            <Gallery />
            <Contact />
          </main>

          <Footer />

          <MobileActionBar
            onBookNow={() => setCurrentPage("booking")}
          />
        </>
      )}

      {currentPage !== "home" && (
        <div className="relative min-h-screen overflow-hidden bg-[#061A17]">

          {/* RESORT BACKGROUND */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[url('/assets/herobanner.png')] bg-cover bg-center bg-no-repeat"
          />

          {/* DARK OVERLAY */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[#031512]/75"
          />

          {/* PAGE CONTENT */}
          <div className="relative z-10">

            <Navbar
              onBookNow={() => setCurrentPage("booking")}
              isBookingPage={true}
            />

            <div
              className={
                currentPage === "booking" ? "block" : "hidden"
              }
            >
              <BookingForm
                onBack={() => setCurrentPage("home")}
                onViewTerms={() => setCurrentPage("terms")}
              />
            </div>

            {currentPage === "terms" && (
              <TermsAndConditions
                onBack={() => setCurrentPage("booking")}
              />
            )}

          </div>
        </div>
      )}

      {/* WHATSAPP FLOATING BUTTON - AVAILABLE ON ALL PAGES */}
      <FloatingWhatsApp />
      <BackToTop />
    </>
  );
}
