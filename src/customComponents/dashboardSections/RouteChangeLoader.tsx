import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const RouteChangeLoader = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 200); // adjust duration
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    loading ? (
      <div className="fixed top-0 left-0 w-full h-1 bg-blue-500 animate-pulse z-[100]" />
    ) : null
  );
};

export default RouteChangeLoader;
