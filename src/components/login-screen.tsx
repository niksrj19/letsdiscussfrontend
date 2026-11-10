'use client';

import { Icon } from '@/components/icon';

export function LoginScreen({ error, isBusy }: { error: string; isBusy: boolean }) {
  return <main className="login-shell">
    <section className="login-card">
      <a className="brand login-brand" href="#">
        <span className="brand-mark"><Icon name="chart" size={20}/></span>
        <span>market<span className="brand-light">lens</span><small>RESEARCH WORKSPACE</small></span>
      </a>
      <div className="login-eyebrow"><span className="eyebrow-line"/> PRIVATE MARKET RESEARCH</div>
      <h1>Research with<br/><span>more clarity.</span></h1>
      <p className="login-copy">Sign in to bring your market sources together. Your research stays private to your account.</p>
      <div className="login-benefits">
        <Benefit number="01" title="Your own source library" detail="Index up to four URLs for your account."/>
        <Benefit number="02" title="Answers grounded in research" detail="Ask questions across your indexed sources."/>
        <Benefit number="03" title="Private by design" detail="Your sources and answers are yours."/>
      </div>
      <div className="google-login">
        <div id="google-sign-in-button"/>
        {isBusy && <span className="login-wait"><span className="mini-spinner"/> Signing you in…</span>}
      </div>
      {error && <div className="error-note login-error">{error}</div>}
      <div className="login-footnote"><span/> Secure sign-in powered by Google</div>
    </section>
    <LoginArtwork/>
  </main>;
}

function Benefit({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <div><span>{number}</span><p><b>{title}</b><small>{detail}</small></p></div>;
}

function LoginArtwork() {
  return <div className="login-decoration">
    <span className="decoration-line line-one"/><span className="decoration-line line-two"/>
    <span className="decoration-orb orb-one"/><span className="decoration-orb orb-two"/>
    <div className="market-preview">
      <div className="preview-label">MARKET PULSE <span>● LIVE RESEARCH</span></div>
      <div className="preview-title">Signal over noise.</div>
      <div className="preview-chart">
        {Array.from({ length: 20 }, (_, index) => <i key={index}/>)}
        <svg viewBox="0 0 420 110" preserveAspectRatio="none"><path d="M0 83 C28 74 35 89 58 65 S96 74 120 52 S158 72 182 42 S218 60 240 36 S276 55 299 25 S338 44 360 18 S393 31 420 5"/></svg>
      </div>
      <div className="preview-bottom"><span>RESEARCH SIGNAL</span><b>↑ 12.8%</b></div>
    </div>
  </div>;
}
