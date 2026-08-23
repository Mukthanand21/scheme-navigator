import { CitizenForm } from "../components/CitizenForm";

export function ProfilePage() {
  return (
    <div className="page">
      <div className="container" style={{ maxWidth: "800px" }}>
        <div className="page-header" style={{ textAlign: "center" }}>
          <h1>Create Your Profile</h1>
          <p>Fill in your details to find government schemes you're eligible for.</p>
        </div>
        <CitizenForm />
      </div>
    </div>
  );
}
