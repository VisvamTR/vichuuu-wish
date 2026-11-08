import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Copy, Flame, Heart, Music2, Send, Sparkles, Volume2, VolumeX, X } from 'lucide-react'

const sparkleSeeds = Array.from({ length: 34 }, (_, i) => ({
  id: i,
  x: (i * 37 + 11) % 100,
  y: (i * 53 + 7) % 94,
  delay: (i % 8) * 0.43,
  size: 2 + (i % 3) * 1.5,
}))

const petalSeeds = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: (i * 41 + 7) % 100,
  delay: (i % 7) * 1.4,
  duration: 8 + (i % 5) * 1.3,
  drift: -28 + (i % 6) * 12,
}))

function safeParam(value, fallback = '') {
  return value?.trim().slice(0, 40) || fallback
}

function playChime() {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return
  const ctx = new AudioContext()
  const now = ctx.currentTime
  ;[523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = index % 2 ? 'sine' : 'triangle'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0, now + index * 0.1)
    gain.gain.linearRampToValueAtTime(0.055, now + index * 0.1 + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 1.15)
    oscillator.connect(gain).connect(ctx.destination)
    oscillator.start(now + index * 0.1)
    oscillator.stop(now + index * 0.1 + 1.2)
  })
  setTimeout(() => ctx.close(), 1800)
}

function Fireworks({ active }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!active || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      return
    }
    let frame
    let stopped = false
    let particles = []
    const colors = ['#ffd36a', '#ff8b4b', '#ffcfed', '#fdf1ba']

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio
      canvas.height = window.innerHeight * window.devicePixelRatio
      context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0)
    }

    const burst = (x, y) => {
      particles.push(...Array.from({ length: 34 }, (_, i) => ({
        x,
        y,
        vx: Math.cos((Math.PI * 2 * i) / 34) * (1.2 + Math.random() * 3),
        vy: Math.sin((Math.PI * 2 * i) / 34) * (1.2 + Math.random() * 3),
        life: 1,
        color: colors[i % colors.length],
      })))
    }

    const draw = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
      context.globalCompositeOperation = 'lighter'
      particles.forEach((particle) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += 0.025
        particle.vx *= 0.992
        particle.life -= 0.014
        context.beginPath()
        context.arc(particle.x, particle.y, 1.2, 0, Math.PI * 2)
        context.fillStyle = particle.color
        context.globalAlpha = Math.max(particle.life, 0)
        context.fill()
      })
      context.globalAlpha = 1
      particles = particles.filter((particle) => particle.life > 0)
      if (!stopped) frame = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    burst(window.innerWidth * 0.18, window.innerHeight * 0.28)
    setTimeout(() => burst(window.innerWidth * 0.82, window.innerHeight * 0.22), 350)
    setTimeout(() => burst(window.innerWidth * 0.69, window.innerHeight * 0.42), 760)
    draw()
    const stopTimer = setTimeout(() => { stopped = true }, 3300)

    return () => {
      stopped = true
      clearTimeout(stopTimer)
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [active])

  return <canvas className="fireworks" ref={canvasRef} aria-hidden="true" />
}

function HangingLantern({ side, delay }) {
  return (
    <div className={`lantern lantern--${side}`} style={{ '--delay': `${delay}s` }} aria-hidden="true">
      <span className="lantern__string" />
      <span className="lantern__cap" />
      <span className="lantern__body"><i /></span>
      <span className="lantern__tail" />
    </div>
  )
}

function MiniDiya({ delay = 0 }) {
  return (
    <div className="mini-diya" style={{ '--delay': `${delay}s` }} aria-hidden="true">
      <span className="mini-diya__flame" />
      <span className="mini-diya__bowl" />
    </div>
  )
}

function PersonalizeModal({ open, onClose, recipient, sender, onSave }) {
  const [to, setTo] = useState(recipient)
  const [from, setFrom] = useState(sender)

  useEffect(() => {
    if (open) {
      setTo(recipient)
      setFrom(sender)
    }
  }, [open, recipient, sender])

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="personalize-title">
        <button className="icon-button modal__close" onClick={onClose} aria-label="Close personalization dialog"><X size={19} /></button>
        <span className="eyebrow"><Sparkles size={13} /> Make it yours</span>
        <h2 id="personalize-title">Personalise your wish</h2>
        <p>Add names, then share the special link with someone you love.</p>
        <form onSubmit={(event) => { event.preventDefault(); onSave(to, from) }}>
          <label htmlFor="recipient">For</label>
          <input id="recipient" value={to} onChange={(e) => setTo(e.target.value)} placeholder="e.g. Vichuuu & family" autoFocus maxLength={40} />
          <label htmlFor="sender">From</label>
          <input id="sender" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Your name" maxLength={40} />
          <button className="button button--primary button--wide" type="submit"><Flame size={17} /> Create my wish</button>
        </form>
      </section>
    </div>
  )
}

function App() {
  const initial = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return { recipient: safeParam(params.get('to')), sender: safeParam(params.get('from')) }
  }, [])
  const [recipient, setRecipient] = useState(initial.recipient)
  const [sender, setSender] = useState(initial.sender)
  const [lit, setLit] = useState(false)
  const [sound, setSound] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [fireworkKey, setFireworkKey] = useState(0)

  const createShareUrl = useCallback((to = recipient, from = sender) => {
    const url = new URL(window.location.href)
    url.search = ''
    if (to) url.searchParams.set('to', to)
    if (from) url.searchParams.set('from', from)
    return url.toString()
  }, [recipient, sender])

  const toggleDiya = () => {
    const nextLit = !lit
    setLit(nextLit)
    if (nextLit) {
      setFireworkKey((value) => value + 1)
      if (sound) playChime()
    }
  }

  const saveNames = (to, from) => {
    const nextTo = safeParam(to)
    const nextFrom = safeParam(from)
    setRecipient(nextTo)
    setSender(nextFrom)
    window.history.replaceState({}, '', createShareUrl(nextTo, nextFrom))
    setModalOpen(false)
  }

  const shareWish = async () => {
    const shareData = {
      title: 'A Diwali wish for you ✨',
      text: recipient ? `A little Diwali light for ${recipient}` : 'A little Diwali light, joy and love for you',
      url: createShareUrl(),
    }
    if (navigator.share) {
      try { await navigator.share(shareData); return } catch (error) { if (error.name === 'AbortError') return }
    }
    await navigator.clipboard.writeText(shareData.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2400)
  }

  const copyWish = async () => {
    await navigator.clipboard.writeText(createShareUrl())
    setCopied(true)
    setTimeout(() => setCopied(false), 2400)
  }

  return (
    <main className={lit ? 'site is-lit' : 'site'}>
      <div className="noise" aria-hidden="true" />
      <div className="page-frame" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="ambient ambient--one" aria-hidden="true" />
      <div className="ambient ambient--two" aria-hidden="true" />
      <div className="mandala mandala--left" aria-hidden="true"><span /><span /><span /></div>
      <div className="mandala mandala--right" aria-hidden="true"><span /><span /><span /></div>
      {sparkleSeeds.map((sparkle) => <i key={sparkle.id} className="sparkle" style={{ left: `${sparkle.x}%`, top: `${sparkle.y}%`, animationDelay: `${sparkle.delay}s`, width: sparkle.size, height: sparkle.size }} aria-hidden="true" />)}
      <div className="petal-field" aria-hidden="true">
        {petalSeeds.map((petal) => <i key={petal.id} style={{ '--x': `${petal.x}vw`, '--delay': `${petal.delay}s`, '--duration': `${petal.duration}s`, '--drift': `${petal.drift}px` }} />)}
      </div>
      <HangingLantern side="left" delay={0} />
      <HangingLantern side="right" delay={0.8} />
      <Fireworks key={fireworkKey} active={lit} />

      <nav className="nav" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Diwali wish home">
          <span className="brand__mark"><Sparkles size={16} /></span>
          <span className="brand__words"><small>A little</small>Festival of Lights</span>
        </a>
        <div className="nav__actions">
          <button className="icon-button" onClick={() => setSound(!sound)} aria-label={sound ? 'Turn sound off' : 'Turn sound on'}>{sound ? <Volume2 size={18} /> : <VolumeX size={18} />}</button>
          <button className="button button--ghost" onClick={() => setModalOpen(true)}><Sparkles size={15} /> Personalise</button>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero__content">
          <div className="eyebrow hero__eyebrow"><span /> A celebration of light <span /></div>
          {recipient && <p className="recipient">Dear {recipient},</p>}
          <h1>
            <span className="hero__small">May your world glow with</span>
            <span className="hero__script">light, love</span>
            <span className="hero__and">&</span>
            <span className="hero__script hero__script--joy">endless joy.</span>
          </h1>
          <p className="hero__copy">May every diya you light bring a glow of happiness, prosperity, and beautiful new beginnings.</p>
        </div>

        <div className="diya-stage">
          <div className="diya-orbit" aria-hidden="true"><i /><i /><i /><i /></div>
          <button className="diya-button" onClick={toggleDiya} aria-pressed={lit} aria-label={lit ? 'Turn off the diya' : 'Light the diya to reveal your wish'}>
            <span className="diya-button__halo" />
            <span className="diya-button__flame"><i /></span>
            <span className="diya-button__spark diya-button__spark--one" />
            <span className="diya-button__spark diya-button__spark--two" />
            <span className="diya-button__spark diya-button__spark--three" />
            <span className="diya-button__wick" />
            <span className="diya-button__oil" />
            <span className="diya-button__bowl"><i /></span>
          </button>
          <button className="light-prompt" onClick={toggleDiya} aria-pressed={lit}>
            {lit ? <><Flame size={15} /> Tap to dim the diya</> : <><Flame size={15} /> Tap to light the diya</>}
          </button>
        </div>
        <div className="scroll-cue"><span>Unwrap your wish</span><i /></div>
      </section>

      <section className="wish-section" aria-label="Your Diwali wish">
        <div className="marigold-line" aria-hidden="true">{Array.from({ length: 15 }, (_, i) => <i key={i} />)}</div>
        <div className="wish-card">
          <span className="wish-card__corner wish-card__corner--tl" aria-hidden="true" />
          <span className="wish-card__corner wish-card__corner--br" aria-hidden="true" />
          <div className="wish-card__icon"><Music2 size={19} /></div>
          <p className="wish-card__kicker">A little wish, from the heart</p>
          <h2>May this Diwali write a<br /><em>golden chapter</em> in your story.</h2>
          <p className="wish-card__message">May your home be filled with laughter, your heart with peace, and your days with the kind of magic that stays long after the last firework fades.</p>
          <div className="wish-ribbon"><span>Shine bright</span><i /><span>Love deeply</span><i /><span>Begin beautifully</span></div>
          <div className="blessings" aria-label="Diwali blessings">
            <span><i>01</i> Light in every corner</span>
            <span><i>02</i> Love in every moment</span>
            <span><i>03</i> Joy in every beginning</span>
          </div>
          {sender && <p className="signature">With love,<strong>{sender}</strong></p>}
          <div className="diya-row"><MiniDiya delay={0} /><MiniDiya delay={0.5} /><MiniDiya delay={1} /><MiniDiya delay={1.5} /><MiniDiya delay={2} /></div>
        </div>
      </section>

      <section className="share-section">
        <p className="eyebrow"><Heart size={13} /> Pass the light on</p>
        <h2>Someone you love<br />deserves this little glow.</h2>
        <p>Personalise this wish, then send a pocketful of light to their screen.</p>
        <div className="share-actions">
          <button className="button button--primary" onClick={shareWish}><Send size={17} /> Share this wish</button>
          <button className="button button--secondary" onClick={copyWish}>{copied ? <Check size={17} /> : <Copy size={17} />}{copied ? 'Link copied!' : 'Copy link'}</button>
        </div>
      </section>

      <footer>
        <p>Made with <Heart size={13} fill="currentColor" /> and a little festive magic.</p>
        <span>Light • Love • Happy Diwali</span>
      </footer>
      <PersonalizeModal open={modalOpen} onClose={() => setModalOpen(false)} recipient={recipient} sender={sender} onSave={saveNames} />
      <div className={`toast ${copied ? 'toast--show' : ''}`} role="status"><Check size={15} /> The wish link is ready to share</div>
    </main>
  )
}

export default App
