import MobileShell from "../components/MobileShell";
import MobileContactForm from "../components/MobileContactForm";

export default function MobileContactPage() {
  return (
    <MobileShell>
      <div style={{ paddingTop: 24, paddingBottom: 24 }}>
        <MobileContactForm />
      </div>
    </MobileShell>
  );
}