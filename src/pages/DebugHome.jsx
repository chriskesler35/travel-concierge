import React from 'react';

export default function DebugHome() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Debug Home Page</h1>
      <p>If you can see this, React is working!</p>
      
      <h2>Quick Links:</h2>
      <ul>
        <li><a href="/auth">Go to Login Page</a></li>
        <li><a href="/database-test">Test Database Connection</a></li>
      </ul>
      
      <h2>Debug Info:</h2>
      <p>Current URL: {window.location.href}</p>
      <p>React Version: {React.version}</p>
      
      <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
        <p><strong>Check browser console (F12) for any errors!</strong></p>
      </div>
    </div>
  );
}