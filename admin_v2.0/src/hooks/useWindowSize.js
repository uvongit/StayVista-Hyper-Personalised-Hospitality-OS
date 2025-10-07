import { useEffect, useState } from "react";

const getSize = () => {
  if (typeof window === "undefined") {
    return { width: undefined, height: undefined };
  }
  return { width: window.innerWidth, height: window.innerHeight };
};

const useWindowSize = () => {
  const [size, setSize] = useState(() => getSize());

  useEffect(() => {
    const handleResize = () => {
      setSize(getSize());
    };

    window.addEventListener("resize", handleResize, { passive: true });
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return size;
};

export default useWindowSize;
