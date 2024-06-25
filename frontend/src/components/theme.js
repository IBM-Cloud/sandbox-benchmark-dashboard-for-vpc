import {useState, useEffect} from "react";
const useThemeDetector = () => {
  const browserTheme = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : null;
  const getCurrentTheme = () => browserTheme !== null ? browserTheme : false;
  const [isDarkTheme, setIsDarkTheme] = useState(getCurrentTheme());
  const mqListener = (e => {
    setIsDarkTheme(e.matches);
  });
  useEffect(() => {
    const darkThemeMq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    darkThemeMq.addListener(mqListener);
    return () => darkThemeMq.removeListener(mqListener);
  }, []);
  return isDarkTheme;
}

export default useThemeDetector;
