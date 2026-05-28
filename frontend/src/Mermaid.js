import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Dark theme ke liye configuration
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Urbanist, sans-serif',
});

const Mermaid = ({ chart }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && chart) {
      // Har baar naya content aane par re-render karo
      ref.current.removeAttribute('data-processed');
      mermaid.contentLoaded();
    }
  }, [chart]);

  return (
    <div className="mermaid bg-slate-800/50 p-4 rounded-xl border border-slate-700 my-4 flex justify-center overflow-x-auto" ref={ref}>
      {chart}
    </div>
  );
};

export default Mermaid;