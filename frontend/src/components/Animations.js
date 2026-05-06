import React, { useEffect, useState } from 'react';
import '../styles/Animations.css';

// Success animation with confetti
export const SuccessAnimation = ({ show, message, onComplete }) => {
  useEffect(() => {
    if (show && onComplete) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="success-overlay">
      <div className="success-content">
        <div className="success-checkmark-container">
          <svg className="success-checkmark" viewBox="0 0 100 100">
            <circle className="success-circle" cx="50" cy="50" r="45" />
            <path
              className="success-check"
              d="M25 50 L40 65 L75 30"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="success-message">{message}</h2>
      </div>
      <Confetti />
    </div>
  );
};

// Confetti effect
export const Confetti = () => {
  const colors = [
    'var(--accent-primary)',
    'var(--accent-success)',
    'var(--accent-info)',
    'var(--accent-warning)',
  ];

  return (
    <div className="confetti-container">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            background: colors[Math.floor(Math.random() * colors.length)],
            width: `${5 + Math.random() * 10}px`,
            height: `${5 + Math.random() * 10}px`,
          }}
        />
      ))}
    </div>
  );
};

// Error shake animation
export const ErrorShake = ({ children, trigger }) => {
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className={`error-shake-container ${shake ? 'shake-active' : ''}`}>
      {children}
    </div>
  );
};

// Progress indicator for multi-step flow
export const ProgressIndicator = ({ steps, currentStep }) => {
  return (
    <div className="progress-indicator">
      {steps.map((step, index) => (
        <div key={index} className="progress-step-wrapper">
          <div
            className={`progress-step ${
              index < currentStep
                ? 'completed'
                : index === currentStep
                ? 'active'
                : 'pending'
            }`}
          >
            {index < currentStep ? (
              <svg className="step-check-icon" viewBox="0 0 24 24">
                <path
                  d="M5 13l4 4L19 7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <span className="step-number">{index + 1}</span>
            )}
          </div>
          <span className="step-label">{step}</span>
          {index < steps.length - 1 && (
            <div
              className={`progress-line ${
                index < currentStep ? 'completed' : ''
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// Page transition wrapper
export const PageTransition = ({ children, transitionKey }) => {
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [transitionKey, children]);

  return (
    <div className={`page-transition ${isTransitioning ? 'transitioning' : ''}`}>
      {displayChildren}
    </div>
  );
};

// Particle effect on hover
export const ParticleEffect = ({ children, color = 'var(--accent-primary)' }) => {
  const [particles, setParticles] = useState([]);

  const createParticle = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newParticles = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x,
      y,
      angle: (i * 360) / 8,
    }));

    setParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles((prev) =>
        prev.filter((p) => !newParticles.find((np) => np.id === p.id))
      );
    }, 1000);
  };

  return (
    <div className="particle-effect-container" onMouseEnter={createParticle}>
      {children}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="hover-particle"
          style={{
            left: particle.x,
            top: particle.y,
            '--angle': `${particle.angle}deg`,
            background: color,
          }}
        />
      ))}
    </div>
  );
};

// Loading bar for page transitions
export const LoadingBar = ({ loading }) => {
  if (!loading) return null;

  return (
    <div className="loading-bar-container">
      <div className="loading-bar" />
    </div>
  );
};
