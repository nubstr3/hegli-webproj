import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FLEX Privacy Policy | hegli.dev",
  description:
    "FLEX has no accounts, no ads, no analytics and no tracking. Your data stays on your device.",
};

const CONTACT_EMAIL = "henry@hegli.dev";

const h2 = "text-xl font-medium text-white";

export default function FlexPrivacyPage() {
  return (
    <main className="min-h-screen bg-[#111] text-neutral-200">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <Link
          href="/projects"
          className="text-sm text-neutral-400 transition-colors hover:text-white"
        >
          ← Projects
        </Link>

        <h1 className="mt-8 text-3xl font-semibold text-white">
          FLEX Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-neutral-400">
          Effective date: 20 October 2026
        </p>
        <p className="mt-1 text-sm text-neutral-400">Developer: hegli</p>
        <p className="mt-1 text-sm text-neutral-400">
          Contact:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-sky-400 hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </p>

        <div className="mt-10 space-y-8 leading-relaxed">
          <section>
            <h2 className={h2}>Summary</h2>
            <p className="mt-3">
              FLEX is a trip planning app. It has no accounts, no ads, no
              analytics and no tracking. Your trips, places, notes and spending
              are stored on your device only. I don&rsquo;t have access to
              them.
            </p>
          </section>

          <section>
            <h2 className={h2}>Information stored on your device</h2>
            <p className="mt-3">
              FLEX stores the following in a database on your device: your
              trips, days, places, notes, spending entries, settings, and any
              locations you choose to save. This data never leaves your device
              unless you export a backup yourself. If you delete the app, this
              data is deleted with it, unless you have kept a backup file.
            </p>
          </section>

          <section>
            <h2 className={h2}>Location</h2>
            <p className="mt-3">
              FLEX asks for your location only while you are using the app. It
              uses it to show places near you, to help you add a place quickly,
              and to save where you were when you mark a stop as done. Saved
              locations are stored on your device. You can turn off location
              access at any time in iOS Settings, and the rest of the app will
              keep working.
            </p>
          </section>

          <section>
            <h2 className={h2}>Third-party services</h2>
            <p className="mt-3">
              To provide some features, FLEX sends requests to these services:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong className="text-white">
                  OpenRouteService (HeiGIT):
                </strong>{" "}
                receives the coordinates of places to calculate walking times
                and routes. It uses the API key you enter in the app&rsquo;s
                Settings.
              </li>
              <li>
                <strong className="text-white">
                  Overpass API (OpenStreetMap):
                </strong>{" "}
                receives the area you are searching so it can return nearby
                places.
              </li>
            </ul>
            <p className="mt-3">
              These requests contain coordinates and the search area, and they
              are not linked to a name, email address or account, because FLEX
              has none. These services have their own privacy policies and may
              keep logs of requests under their own terms. I don&rsquo;t
              receive or store this data.
            </p>
          </section>

          <section>
            <h2 className={h2}>Backups and sharing</h2>
            <p className="mt-3">
              You can export your data as a backup file and share it using the
              iOS share sheet. What you do with that file is up to you. FLEX
              doesn&rsquo;t upload it anywhere.
            </p>
          </section>

          <section>
            <h2 className={h2}>What FLEX does not do</h2>
            <p className="mt-3">
              FLEX does not collect your name, email or contact details. It
              does not use analytics or crash-reporting tools. It does not show
              ads. It does not track you across other apps or websites. It does
              not sell or share your data.
            </p>
          </section>

          <section>
            <h2 className={h2}>Children</h2>
            <p className="mt-3">
              FLEX is not directed at children, and I do not knowingly collect
              information from anyone.
            </p>
          </section>

          <section>
            <h2 className={h2}>Changes</h2>
            <p className="mt-3">
              If this policy changes, I will update it on this page and change
              the effective date above.
            </p>
          </section>

          <section>
            <h2 className={h2}>Contact</h2>
            <p className="mt-3">
              Questions about this policy:{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-sky-400 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}