"use client";

import { useEffect, useState } from "react";
import { useDemo } from "@/hooks/useDemo";
import "@/components/sites/vodacom-co-za-ca27d76c/shared/vodacom-home.css";

const ASSET = "/sites/vodacom-co-za-ca27d76c/shared/images";
const HERO = "/sites/vodacom-co-za/home/carousel";
const slides = [
  { bg: "cbu-homepage-16-10-2026-banner-1-bg.webp", fg: "cbu-homepage-16-10-2026-banner-1-fg.webp", badge: "Available now", title: "iPhone Duo", text: "Unlimited Minutes on RED Core, plus a free 1-year extended warranty.", price: "From R1999 PM x 36", cta: "Buy now", tone: "light" },
  { bg: "cbu-homepage-16-10-2026-banner-2-bg.webp", fg: "cbu-homepage-16-10-2026-banner-2-fg.webp", badge: "Mid-month sale", title: "Sale season starts now", text: "Save R3,600 on selected deals and get a free air fryer.", price: "", cta: "Shop now", tone: "dark" },
  { bg: "cbu-homepage-banner-1-06-10-2026-bg.webp", fg: "cbu-homepage-banner-1-06-10-2026-fg.webp", badge: "New iPhone 18 Pro", title: "iPhone 18 Pro", text: "Get Unlimited Minutes on RED Core plans, plus a free 1-year extended warranty.", price: "From R1299 PM x 36", cta: "Buy now", tone: "light" },
  { bg: "cbu-homepage-banner-4-13-10-2026-bg.webp", fg: "cbu-homepage-banner-4-13-10-2026-fg.webp", badge: "VodaPay App Only Deal", title: "Summer Deal", text: "7.5GB Anytime + 7.5GB Night Owl + 5GB YouTube + unlimited minutes.", price: "R129 · 30 days", cta: "Get the deal", tone: "dark" },
  { bg: "cbu-homepage-banner-3-06-10-2026-bg.webp", fg: "cbu-homepage-banner-3-06-10-2026-fg-1.webp", badge: "Online Exclusive", title: "Your +1 gets an iPhone too", text: "Double up with selected pre-owned iPhone deals.", price: "From R599 PM x 36", cta: "Buy now", tone: "dark" },
] as const;

const footerGroups = [
  ["Online shopping", "Check if I can upgrade", "Build my own contract", "Deliveries & returns", "Repairs & aftersales"],
  ["In-store", "Find a store", "Book an appointment", "In-store deals", "Vodacom World & Events"],
  ["Help & support", "Frequently asked questions", "Report scams & fraud", "Chat to us online", "Network maintenance"],
  ["Policies", "Vodacom Terms & Conditions", "Privacy & Access to Information"],
];

export function VodacomHomePage() {
  const { track, openChat } = useDemo();
  const [active, setActive] = useState(0);
  const slide = slides[active];

  useEffect(() => { void track("page_view", "/"); }, [track]);
  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % slides.length), 5500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="tk-home min-h-full">
      <header className="tk-home__header">
        <div className="tk-home__util">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="tk-home__logo" src="/brand/vodacom-logo.svg" alt="Vodacom" />
          <div className="tk-home__segments" role="tablist" aria-label="Segment">
            <button type="button" className="tk-home__seg is-active">Personal</button>
            <button type="button" className="tk-home__seg">Business</button>
          </div>
          <div className="tk-home__util-links">
            <a className="tk-home__util-link" href="#"><img src={`${ASSET}/menu/self.svg`} alt="" />My Vodacom</a>
            <button type="button" className="tk-home__util-link" onClick={openChat}><img src={`${ASSET}/menu/help.svg`} alt="" />Help</button>
            <a className="tk-home__util-link" href="#"><img src={`${ASSET}/menu/coverage.svg`} alt="" />Coverage</a>
            <a className="tk-home__util-link" href="#"><img src={`${ASSET}/menu/store.svg`} alt="" />Cart</a>
            <a className="tk-home__util-link" href="#"><img src={`${ASSET}/menu/self.svg`} alt="" />Login</a>
          </div>
        </div>
        <div className="tk-home__nav">
          <nav className="tk-home__nav-links" aria-label="Primary"><span>Mobile &amp; Internet</span><span>Financial Services</span><span>Lifestyle &amp; Rewards</span></nav>
          <form className="tk-home__search" onSubmit={(event) => event.preventDefault()} role="search">
            <input type="search" placeholder="Find products, services and more..." aria-label="Search" />
            <button type="submit" aria-label="Search">⌕</button>
          </form>
        </div>
      </header>

      <section className={`tk-home__hero is-${slide.tone}`} aria-roledescription="carousel" aria-label="Vodacom offers">
        <img key={slide.bg} className="tk-home__hero-bg" src={`${HERO}/${slide.bg}`} alt="" />
        <div key={slide.title} className="tk-home__hero-inner">
          <span className="tk-home__hero-badge">{slide.badge}</span><h1>{slide.title}</h1><p>{slide.text}</p>
          {slide.price && <strong className="tk-home__hero-price">{slide.price}</strong>}
          <a href="https://www.vodacom.co.za/shop/" className="tk-home__cta-lime">{slide.cta}</a>
        </div>
        <img key={slide.fg} className="tk-home__hero-product" src={`${HERO}/${slide.fg}`} alt="" />
        <div className="tk-home__carousel-ctrl">
          <button type="button" onClick={() => setActive((active + slides.length - 1) % slides.length)} aria-label="Previous offer">‹</button>
          <div className="tk-home__dots">{slides.map((item, index) => <button key={item.title} type="button" className={index === active ? "is-on" : ""} onClick={() => setActive(index)} aria-label={`Show offer ${index + 1}`} aria-current={index === active} />)}</div>
          <button type="button" onClick={() => setActive((active + 1) % slides.length)} aria-label="Next offer">›</button>
        </div>
      </section>

      <section className="tk-home__section" aria-label="More from Vodacom"><h2>More ways to connect</h2><p>Discover prepaid, fibre, devices and digital services — all in one place.</p></section>

      <footer className="tk-home__footer">
        <div className="tk-home__footer-inner">
          <div className="tk-home__footer-brand"><img src="/brand/vodacom-logo.svg" alt="Vodacom" /><strong>Further together</strong></div>
          <div className="tk-home__footer-links">{footerGroups.map(([heading, ...links]) => <div key={heading}><h3>{heading}</h3>{links.map((link) => <a key={link} href="https://www.vodacom.co.za/shop/">{link}</a>)}</div>)}</div>
          <p className="tk-home__copyright">© Vodacom SA SOC Limited. 2026 All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
