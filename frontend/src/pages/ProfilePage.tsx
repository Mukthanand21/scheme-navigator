import { CitizenForm } from "../components/CitizenForm";
import { useLanguage } from "../i18n/LanguageContext";

export function ProfilePage() {
  const { t } = useLanguage();

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "800px" }}>
        <div className="page-header" style={{ textAlign: "center" }}>
          <h1>{t("profileTitle")}</h1>
          <p>{t("profileSubtitle")}</p>
        </div>
        <CitizenForm />
      </div>
    </div>
  );
}
