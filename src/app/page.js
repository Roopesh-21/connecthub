import AuthNav from "./components/AuthNav";
const people = [
  {
    initials: "AK",
    name: "Alex Kim",
    role: "Full-stack Developer",
    location: "Singapore",
    color: "blue",
  },
  {
    initials: "SR",
    name: "Sarah",
    role: "Product Designer",
    location: "London, UK",
    color: "purple",
  },
  {
    initials: "RV",
    name: "Rahul Verma",
    role: "AI Enthusiast",
    location: "India",
    color: "green",
  },
];

export default function Home() {
  return (
    <main>
      <nav className="navbar">
        <a className="brand" href="#" aria-label="ConnectHub home">
          <span className="brand-icon">c</span>
          connect<span className="brand-light">hub</span>
        </a>

        <AuthNav />
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" />A WORLD WITHOUT BORDERS
          </div>

          <h1>
            Your next
            <br />
            connection
            <br />
            <span>changes everything.</span>
          </h1>

          <p className="hero-description">
            Your next collaborator. Your next big idea. Your next opportunity.
            Meet ambitious people around the world and discover what you can
            build together.
          </p>

          <div className="hero-actions" id="join">
            <a href="/discover" className="primary-button">
              Discover your network <span>↗</span>
            </a>
            <a href="#projects" className="secondary-button">
              Explore possibilities →
            </a>
          </div>

          <div className="hero-note">
            <div className="avatar-stack">
              <span>A</span>
              <span>R</span>
              <span>M</span>
            </div>
            <p>
              <strong>Different places. Shared ambition.</strong>
              <br />
              Find your people. Build your future.
            </p>
          </div>

          <div className="hero-stats">
            <div>
              <strong>01</strong>
              <span>DISCOVER PEOPLE</span>
            </div>
            <div>
              <strong>02</strong>
              <span>BUILD TOGETHER</span>
            </div>
            <div>
              <strong>03</strong>
              <span>GO FURTHER</span>
            </div>
          </div>
        </div>

        <div className="visual">
          <div className="visual-top">
            <span>CONNECTIVITY / WORLDWIDE</span>
            <span className="live-label">
              <span className="status-dot" />
              YOUR WORLD AWAITS
            </span>
          </div>

          <div className="network">
            <div className="network-coordinate coordinate-one">35° 41' N</div>
            <div className="network-coordinate coordinate-two">51° 30' W</div>
            <div className="network-coordinate coordinate-three">
              01 / GLOBAL NETWORK
            </div>

            <svg
              className="network-art"
              viewBox="0 0 500 430"
              role="img"
              aria-label="Illustration of people connected through a global network"
            >
              <defs>
                <radialGradient id="networkGlow">
                  <stop offset="0%" stopColor="#E56B4A" stopOpacity=".20" />
                  <stop offset="60%" stopColor="#E9A9B8" stopOpacity=".14" />
                  <stop offset="100%" stopColor="#E9A9B8" stopOpacity="0" />
                </radialGradient>

                <linearGradient id="networkLine" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8D536E" stopOpacity=".8" />
                  <stop offset="100%" stopColor="#E56B4A" stopOpacity=".3" />
                </linearGradient>

                <filter
                  id="nodeGlow"
                  x="-100%"
                  y="-100%"
                  width="300%"
                  height="300%"
                >
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle cx="250" cy="210" r="195" fill="url(#networkGlow)" />

              <g fill="none" stroke="#8D536E" strokeOpacity=".20">
                <circle cx="250" cy="210" r="165" strokeDasharray="2 9" />
                <circle cx="250" cy="210" r="125" />
                <circle cx="250" cy="210" r="82" strokeDasharray="3 7" />
                <path d="M35 210 H465 M250 20 V400" strokeDasharray="2 8" />
              </g>

              <g fill="none" stroke="url(#networkLine)" strokeWidth="1.3">
                <path d="M250 210 L95 95 L58 235 L160 333 L250 210" />
                <path d="M250 210 L383 92 L442 230 L337 344 L250 210" />
                <path d="M95 95 L383 92 L337 344 L160 333 L58 235 L442 230" />
                <path d="M95 95 L250 20 L383 92" />
                <path d="M160 333 L250 400 L337 344" />
                <path d="M58 235 L250 210 L442 230" />
                <path
                  d="M95 95 L337 344 M383 92 L160 333"
                  strokeOpacity=".35"
                />
              </g>

              <g fill="#E56B4A" filter="url(#nodeGlow)">
                <circle cx="250" cy="210" r="4" />
                <circle cx="95" cy="95" r="4" />
                <circle cx="58" cy="235" r="3" />
                <circle cx="160" cy="333" r="4" />
                <circle cx="383" cy="92" r="4" />
                <circle cx="442" cy="230" r="3" />
                <circle cx="337" cy="344" r="4" />
                <circle cx="250" cy="20" r="3" />
                <circle cx="250" cy="400" r="3" />
              </g>

              <circle
                cx="250"
                cy="210"
                r="59"
                fill="#E9A9B8"
                fillOpacity=".10"
                stroke="#E56B4A"
                strokeOpacity=".55"
                strokeDasharray="3 7"
              />
            </svg>

            {people.map((person) => (
              <div
                key={person.initials}
                className={`person-card person-${person.color}`}
              >
                <div className={`person-avatar avatar-${person.color}`}>
                  {person.initials}
                </div>
                <div className="person-info">
                  <strong>{person.name}</strong>
                  <small>
                    {person.role} · {person.location}
                  </small>
                </div>
                <span className="connection-dot" />
              </div>
            ))}

            <div className="center-node">
              <span>c</span>
              <small>CONNECTHUB</small>
            </div>
          </div>

          <div className="visual-bottom">
            <span>ONE PLANET. INFINITE POTENTIAL.</span>
            <span>NETWORK / 001</span>
          </div>
        </div>
      </section>

      <section className="discovery-section" id="projects">
        <div className="section-heading">
          <span className="section-kicker">LESS SCROLLING. MORE BUILDING.</span>
          <h2>
            The right people
            <br />
            change the <span>possibilities.</span>
          </h2>
          <p>
            Great things rarely happen alone. Start with a connection and see
            where it takes you.
          </p>
        </div>

        <div className="feature-grid" id="people">
          <article className="feature-card">
            <span className="feature-number">01 / PEOPLE</span>
            <span className="feature-icon">◎</span>
            <h3>Find your people.</h3>
            <p>
              Discover students and professionals who share your interests,
              skills, and ambitions.
            </p>
            <a href="#join">Explore the network ↗</a>
          </article>

          <article className="feature-card">
            <span className="feature-number">02 / PROJECTS</span>
            <span className="feature-icon">⌘</span>
            <h3>Make ideas real.</h3>
            <p>
              Find collaborators, exchange ideas, and turn side projects into
              something meaningful.
            </p>
            <a href="#join">Find collaborators ↗</a>
          </article>

          <article className="feature-card">
            <span className="feature-number">03 / OPPORTUNITY</span>
            <span className="feature-icon">↗</span>
            <h3>Think beyond borders.</h3>
            <p>
              Expand your world beyond your campus, city, and country. Your next
              opportunity could be anywhere.
            </p>
            <a href="#about">See what's possible ↗</a>
          </article>
        </div>
      </section>

      <footer id="about">
        <a className="brand" href="#" aria-label="ConnectHub home">
          <span className="brand-icon">c</span>
          connect<span className="brand-light">hub</span>
        </a>
        <p>Made for people going places.</p>
        <span>CONNECT BEYOND BORDERS © 2026</span>
      </footer>
    </main>
  );
}
