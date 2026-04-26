import BrandMark from '@/components/BrandMark';

export default function DatabaseSetupScreen({ errorMessage }) {
  return (
    <main className="min-h-screen" style={{ background: '#FEFAF5', color: '#4A3B2C' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '56px 24px' }}>
        <div
          style={{
            background: 'white',
            border: '1px solid #E5D9D0',
            borderRadius: 24,
            padding: 28,
            boxShadow: '0 10px 35px rgba(62,44,31,0.08)'
          }}
        >
          <div style={{ marginBottom: 20 }}><BrandMark size="footer" /></div>
          <h1 style={{ fontSize: 32, marginBottom: 8 }}>Shopnow needs a MongoDB connection</h1>
          <p style={{ color: '#8B7A6B', marginBottom: 20 }}>
            The UI build is fine, but the app could not reach MongoDB Atlas from your machine.
          </p>

          <div style={{ background: '#F8F3EE', borderRadius: 16, padding: 16, marginBottom: 20 }}>
            <strong>Current error</strong>
            <pre style={{ whiteSpace: 'pre-wrap', marginTop: 10, fontSize: 13 }}>{errorMessage}</pre>
          </div>

          <ol style={{ paddingLeft: 20, lineHeight: 1.8 }}>
            <li>In MongoDB Atlas, add your current public IP in <strong>Network Access</strong>.</li>
            <li>Confirm the database user and password in <strong>Database Access</strong>.</li>
            <li>Keep <code>.env.local</code> pointed at the Atlas connection string.</li>
            <li>Restart the Next.js dev server after saving <code>.env.local</code>.</li>
          </ol>

          <div style={{ marginTop: 20, color: '#8B7A6B', fontSize: 14 }}>
            After Atlas access is fixed, reload the page and the seeded store will appear automatically.
          </div>
        </div>
      </div>
    </main>
  );
}
