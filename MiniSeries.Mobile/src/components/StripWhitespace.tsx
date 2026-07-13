import React from 'react';

/** Filters JSX whitespace text nodes that trigger RN "Text strings must be rendered within <Text>" errors. */
export function StripWhitespace({ children }: { children: React.ReactNode }) {
  return (
    <>
      {React.Children.toArray(children).filter(child => {
        if (typeof child === 'string') {
          return child.trim() !== '';
        }
        return true;
      })}
    </>
  );
}

