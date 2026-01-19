'use client';

import React from 'react';

export default function TestPage() {
  console.log('[TEST] Test page rendering');
  return (
    <div style={{ padding: '50px', backgroundColor: 'red', color: 'white', fontSize: '30px' }}>
      TEST PAGE - If you see this, React is working!
    </div>
  );
}


