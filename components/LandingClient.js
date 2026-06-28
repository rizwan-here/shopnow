'use client';
import { useSession, signIn, signOut } from 'next-auth/react';

/**
 * Tiny client island that handles auth buttons on the static homepage.
 * mode: 'nav' (default) | 'signup' | 'login'
 */
export default function LandingClient({ mode = 'nav' }) {
  const { data: session, status } = useSession();
  const loggedIn = status === 'authenticated';

  if (mode === 'signup') {
    return (
      <button
        className="soft-button button-with-icon"
        onClick={() => signIn('google', { callbackUrl: '/dashboard?intent=signup' })}
      >
        <span className="btn-icon">G</span>Sign up with Google
      </button>
    );
  }

  if (mode === 'login') {
    return (
      <button
        className="soft-button button-with-icon"
        onClick={() => signIn('google', { callbackUrl: '/dashboard?intent=login' })}
      >
        <span className="btn-icon">G</span>Log in with Google
      </button>
    );
  }

  // nav mode
  if (loggedIn) {
    return (
      <>
        <a className="soft-button-ghost button-with-icon" href="/dashboard">
          <span className="btn-icon">◌</span>Go to dashboard
        </a>
        <button
          type="button"
          className="soft-button-ghost button-with-icon"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <span className="btn-icon">⏻</span>Log out
        </button>
      </>
    );
  }

  return (
    <>
      <a className="soft-button-ghost" href="#login-options">Log in</a>
      <a className="soft-button" href="#signup-options">Sign up free</a>
    </>
  );
}
