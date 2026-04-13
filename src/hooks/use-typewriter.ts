import {useEffect, useState} from "react";

export function useTypewriter(text: string, speed = 10) {
  const [visibleText, setVisibleText] = useState(text.slice(0, 1));

  useEffect(() => {
    setVisibleText(text.slice(0, 1));

    if (text.length <= 1) {
      return;
    }

    let frame = 1;
    const timer = setInterval(() => {
      frame += 1;
      setVisibleText(text.slice(0, frame));
      if (frame >= text.length) {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [speed, text]);

  const isTyping = visibleText.length < text.length;

  return {
    visibleText,
    isTyping
  };
}
