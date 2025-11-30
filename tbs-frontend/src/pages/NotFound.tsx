import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-slate-100">{t('notfound.title')}</h1>
        <p className="mb-4 text-xl text-slate-400">{t('notfound.message')}</p>
        <a href="/" className="text-amber-500 underline hover:text-amber-400">
          {t('notfound.returnHome')}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
