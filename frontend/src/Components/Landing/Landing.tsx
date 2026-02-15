import "./Landing.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import mainLogo from "../Assets/connecther-logo.png";
import textLogo from "../Assets/text-logo.png";
import heroImage from "../Assets/doctor-consultation.png";
import womanYoga from "../Assets/woman-yoga.png";
import { FiVolume2 } from "react-icons/fi";
import { apiService } from "../../services/api.service";
import { isServerTtsNotConfigured, speakWithBrowserTts } from "../../utils/ttsFallback";

const languageOptions = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
  { code: "pt", label: "Portuguese" },
];

function Landing() {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [audioLanguage, setAudioLanguage] = useState<string>("en");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string>("");
  const location = useLocation();
  const navWrapRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!menuOpen) return;
      if (!navWrapRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const landingAudioText = useMemo(() => {
    return [
      "Welcome to ConnectHER.",
      "Main heading: Accessible Women's Healthcare, Anytime.",
      "Subheading: Understand your symptoms. Find the right care.",
      "Primary actions: Symptom Checker and Find a Provider.",
      "Important information section includes disclaimer, privacy, and inclusive care notice.",
      "Mission section: ConnectHer empowers women with accessible healthcare guidance, trusted resources, and faster paths to care.",
      "Navigation links include login, register, and your profile.",
    ].join(" ");
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      for (const objectUrl of audioCacheRef.current.values()) {
        URL.revokeObjectURL(objectUrl);
      }
      audioCacheRef.current.clear();
    };
  }, []);

  const handleListen = async () => {
    setAudioError("");
    setIsSpeaking(true);

    try {
      const cacheKey = `${audioLanguage}::${landingAudioText}`;
      let audioUrl = audioCacheRef.current.get(cacheKey);

      if (!audioUrl) {
        const blob = await apiService.synthesizeSpeech({
          text: landingAudioText,
          language: audioLanguage,
        });
        audioUrl = URL.createObjectURL(blob);
        audioCacheRef.current.set(cacheKey, audioUrl);
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        setIsSpeaking(false);
        setAudioError("Audio playback failed. Please try again.");
      };
      await audio.play();
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : "Audio unavailable right now.";

      if (isServerTtsNotConfigured(message)) {
        try {
          await speakWithBrowserTts(landingAudioText, audioLanguage);
          setAudioError("Using browser voice because server text-to-speech is not configured.");
          setIsSpeaking(false);
          return;
        } catch (fallbackError) {
          const fallbackMessage =
            fallbackError instanceof Error && fallbackError.message
              ? fallbackError.message
              : "Audio unavailable right now.";
          setAudioError(fallbackMessage);
          setIsSpeaking(false);
          return;
        }
      }

      setIsSpeaking(false);
      setAudioError(message);
    }
  };

  return (
    <div className="landing-root">
      <div className="parallax-bg" aria-hidden="true" />

      <header>
        <h1 className="logo">
          <img src={mainLogo} alt="" className="logo-img logo-main" />
          <img src={textLogo} alt="ConnectHER" className="logo-img logo-text" />
        </h1>
        <div className="container" ref={navWrapRef}>
          <div
            className="hamburger"
            role="button"
            tabIndex={0}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setMenuOpen((prev) => !prev);
              }
            }}
          >
            <span />
            <span />
            <span />
          </div>
          <nav className={menuOpen ? "nav open" : "nav"}>
            <ul className="nav-links">
              <li>
                <Link
                  to={isAuthenticated ? "/your-profile" : "/login"}
                  onClick={() => setMenuOpen(false)}
                >
                  {isAuthenticated ? "Logged In" : "Login"}
                </Link>
              </li>
              <li>
                <Link to="/register" onClick={() => setMenuOpen(false)}>
                  Register
                </Link>
              </li>
              <li>
                <Link
                  to="/your-profile"
                  onClick={() => setMenuOpen(false)}
                >
                  Your Profile
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <section id="hero">
        <div className="container">
          <div className="hero-layout">
            <div className="hero-content">
              <h2>Accessible Women's Healthcare, Anytime</h2>
              <h3>Understand your symptoms. Find the right care.</h3>
              <div className="hero-actions">
                <Link to="/symptom-checker" className="service-button">
                  Symptom Checker
                </Link>
                <Link to="/find-a-provider" className="service-button">
                  Find a Provider
                </Link>
              </div>
              <div className="hero-audio-controls">
                <label htmlFor="landing-audio-language" className="hero-audio-label">
                  Audio language
                </label>
                <select
                  id="landing-audio-language"
                  className="hero-audio-select"
                  value={audioLanguage}
                  onChange={(e) => setAudioLanguage(e.target.value)}
                >
                  {languageOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="hero-audio-button"
                  onClick={handleListen}
                  disabled={isSpeaking}
                  data-active={!isSpeaking}
                >
                  <FiVolume2 size={16} />
                  {isSpeaking ? "Playing..." : "Listen page"}
                </button>
              </div>
              {audioError && <p className="hero-audio-error">{audioError}</p>}
            </div>
            <div className="hero-visual">
              <img
                src={heroImage}
                alt="Doctor consultation illustration"
                className="hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="spacer" aria-hidden="true" />

      <div className="footer-container">
        <ul className="important-info">
          <li>
            <strong>Disclaimer:</strong> ConnectHER is an informational tool and
            not a substitute for professional medical advice. Always consult a
            healthcare provider for medical concerns.
          </li>
          <li>
            <strong>Privacy:</strong> We prioritize your privacy. Your data is
            securely stored and never shared without your consent.
          </li>
          <li>
            <strong>Inclusive:</strong> We are committed to providing accessible
            and inclusive healthcare information for all women.
          </li>
        </ul>
      </div>

      <section id="about" className="about-section">
        <div className="container about-shell">
          <article className="about-card">
            <div className="about-media" aria-hidden="true">
              <img src={womanYoga} alt="" className="about-media-image" />
            </div>
            <div className="about-content">
              <p className="about-eyebrow">Our Mission</p>
              <h3>
                ConnectHer empowers women with accessible healthcare guidance,
                trusted resources, and faster paths to care.
              </h3>
              <p className="about-body">
                We built this platform to reduce uncertainty, improve health
                literacy, and help every user move from symptoms to informed
                care decisions with confidence.
              </p>
            </div>
          </article>

          <article className="mission-data-card" aria-label="Maternity care access snapshot">
            <p className="mission-data-eyebrow">Care Access Snapshot</p>
            <h4 className="mission-data-title">
              Over 35% of U.S. counties have no access to maternity care.
            </h4>

            <div className="mission-data-visual" role="img" aria-label="35 percent no access, 65 percent with access">
              <div className="mission-data-donut-wrap">
                <svg viewBox="0 0 42 42" className="mission-data-donut" aria-hidden="true">
                  <circle className="mission-data-donut-base" cx="21" cy="21" r="15.9155" />
                  <circle
                    className="mission-data-donut-segment"
                    cx="21"
                    cy="21"
                    r="15.9155"
                    strokeDasharray="35 65"
                  />
                </svg>
                <div className="mission-data-donut-label">
                  <strong>35%</strong>
                  <span>No access</span>
                </div>
              </div>
              <div className="mission-data-compare">
                <p className="mission-data-compare-title">Rural vs Urban Access (ScienceDirect)</p>
                <div className="mission-data-bars" role="img" aria-label="Rural and urban maternity care access comparison">
                  <div className="mission-data-region">
                    <p className="mission-data-region-label">Rural counties</p>
                    <div className="mission-data-bar-row">
                      <span className="mission-data-bar-label">No access</span>
                      <div className="mission-data-bar-track">
                        <div className="mission-data-bar-fill mission-data-bar-fill-no-access" style={{ width: "55.8%" }} />
                      </div>
                      <span className="mission-data-bar-value">55.8%</span>
                    </div>
                    <div className="mission-data-bar-row">
                      <span className="mission-data-bar-label">Full access</span>
                      <div className="mission-data-bar-track">
                        <div className="mission-data-bar-fill mission-data-bar-fill-full-access" style={{ width: "37.9%" }} />
                      </div>
                      <span className="mission-data-bar-value">37.9%</span>
                    </div>
                  </div>

                  <div className="mission-data-region">
                    <p className="mission-data-region-label">Urban counties</p>
                    <div className="mission-data-bar-row">
                      <span className="mission-data-bar-label">No access</span>
                      <div className="mission-data-bar-track">
                        <div className="mission-data-bar-fill mission-data-bar-fill-no-access" style={{ width: "22.9%" }} />
                      </div>
                      <span className="mission-data-bar-value">22.9%</span>
                    </div>
                    <div className="mission-data-bar-row">
                      <span className="mission-data-bar-label">Full access</span>
                      <div className="mission-data-bar-track">
                        <div className="mission-data-bar-fill mission-data-bar-fill-full-access" style={{ width: "61.5%" }} />
                      </div>
                      <span className="mission-data-bar-value">61.5%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mission-data-legend">
                <span className="mission-data-key mission-data-key-no-access" />
                <span>No access</span>
                <span className="mission-data-key mission-data-key-access" />
                <span>Some access</span>
              </div>
            </div>

            <p className="mission-data-impact">
              This affects <strong>2.3 million</strong> reproductive-age women.
            </p>
            <p className="mission-data-source">(according to ScienceDirect)</p>
          </article>

          <article className="miscarriage-data-card" aria-label="U.S. miscarriage estimates by trimester">
            <p className="miscarriage-data-eyebrow">Miscarriage Estimates</p>
            <h4 className="miscarriage-data-title">Estimated annual U.S. miscarriages by trimester</h4>

            <div className="miscarriage-charts">
              <div className="miscarriage-chart">
                <p className="miscarriage-chart-title">1st + 2nd trimester (n = 1,034,000)</p>
                <svg viewBox="0 0 42 42" className="miscarriage-donut" aria-hidden="true">
                  <circle className="miscarriage-donut-base" cx="21" cy="21" r="15.9155" />
                  <circle
                    className="miscarriage-donut-segment miscarriage-donut-segment-first"
                    cx="21"
                    cy="21"
                    r="15.9155"
                    strokeDasharray="87 13"
                  />
                  <circle
                    className="miscarriage-donut-segment miscarriage-donut-segment-second"
                    cx="21"
                    cy="21"
                    r="15.9155"
                    strokeDasharray="13 87"
                    strokeDashoffset="-87"
                  />
                </svg>
                <p className="miscarriage-chart-note">1st trimester: 87.0% | 2nd trimester: 13.0%</p>
              </div>

              <div className="miscarriage-chart">
                <p className="miscarriage-chart-title">1st trimester only (n = 900,000)</p>
                <svg viewBox="0 0 42 42" className="miscarriage-donut" aria-hidden="true">
                  <circle className="miscarriage-donut-base" cx="21" cy="21" r="15.9155" />
                  <circle
                    className="miscarriage-donut-segment miscarriage-donut-segment-first"
                    cx="21"
                    cy="21"
                    r="15.9155"
                    strokeDasharray="87 13"
                  />
                </svg>
                <p className="miscarriage-chart-note">Share of annual 1st+2nd trimester miscarriages: 87.0%</p>
              </div>
            </div>

            <div className="miscarriage-legend">
              <span className="miscarriage-legend-key miscarriage-legend-key-first" />
              <span>1st trimester</span>
              <span className="miscarriage-legend-key miscarriage-legend-key-second" />
              <span>2nd trimester / remaining share</span>
            </div>

            <p className="miscarriage-source">
              Source: Nobles J, Hwang S, Bennett E, Jacques L. "Abortion Restrictions Threaten
              Miscarriage Management in The United States." PMCID: PMC11596537, PMID: 39226500
              (Health Aff).
            </p>
          </article>
        </div>
      </section>

      <section
        className="parallax-transition"
        aria-hidden="true"
      >
        <div className="transition-shape transition-shape-a" />
        <div className="transition-shape transition-shape-b" />
      </section>
    </div>
  );
}

export default Landing;
