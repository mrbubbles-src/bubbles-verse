export default function PrivacyPolicyPage() {
  return (
    <section className="w-full  mx-auto py-16 px-6 space-y-8 break-words overflow-hidden">
      <article>
        <h1 className="text-3xl font-bold">Datenschutzerklärung</h1>

        <p>
          Die folgenden Hinweise geben einen einfachen Überblick darüber, was
          mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website
          besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie
          persönlich identifiziert werden können. Ausführliche Informationen zum
          Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten
          Datenschutzerklärung.
        </p>

        <h2 className="text-2xl font-semibold mt-8">
          1. Datenschutz auf einen Blick
        </h2>
        <h3 className="text-xl font-medium mt-6">Allgemeine Hinweise</h3>
        <p>
          Die Datenverarbeitung auf dieser Website erfolgt durch den
          Websitebetreiber.
        </p>
        <p>
          Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese
          mitteilen. Andere Daten werden automatisch beim Besuch der Website
          erfasst.
        </p>

        <h3 className="text-xl font-medium mt-6">
          Wofür nutzen wir Ihre Daten?
        </h3>
        <p>
          Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung
          der Website zu gewährleisten. Andere Daten können zur Analyse des
          Nutzerverhaltens verwendet werden.
        </p>

        <h3 className="text-xl font-medium mt-6">
          Welche Rechte haben Sie bezüglich Ihrer Daten?
        </h3>
        <p>
          Sie haben jederzeit das Recht auf Auskunft, Berichtigung oder Löschung
          Ihrer gespeicherten personenbezogenen Daten.
        </p>

        <h2 className="text-2xl font-semibold mt-8">2. Hosting</h2>
        <p>Diese Website wird extern bei folgendem Anbieter gehostet:</p>
        <p>
          Vercel Inc.
          <br />
          440 N Barranca Avenue #4133
          <br />
          Covina, CA 91723
          <br />
          United States
        </p>

        <h2 className="text-2xl font-semibold mt-8">
          3. Allgemeine Hinweise und Pflichtinformationen
        </h2>
        <p>
          Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten
          sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und
          entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser
          Datenschutzerklärung.
        </p>

        <h3 className="text-xl font-medium mt-6">Verantwortliche Stelle</h3>
        <p>
          Manuel Fahrenholz
          <br />
          Am Maarhof 28
          <br />
          51145 Köln
          <br />
          contact@mrbubbles-src.dev
        </p>

        <h3 className="text-xl font-medium mt-6">Speicherdauer</h3>
        <p>
          Ihre personenbezogenen Daten verbleiben bei uns, bis der Zweck für die
          Datenverarbeitung entfällt.
        </p>

        <h3 className="text-xl font-medium mt-6">Rechtsgrundlagen</h3>
        <p>
          Wir verarbeiten Ihre Daten auf Basis der DSGVO, insbesondere Art. 6
          Abs. 1 lit. a, b, c und f sowie Art. 9 und Art. 21 DSGVO.
        </p>

        <h3 className="text-xl font-medium mt-6">Ihre Rechte</h3>
        <ul className="list-disc list-inside">
          <li>Recht auf Auskunft, Berichtigung, Löschung und Einschränkung</li>
          <li>Recht auf Widerspruch gegen Verarbeitung</li>
          <li>Recht auf Datenübertragbarkeit</li>
          <li>Recht auf Beschwerde bei der Aufsichtsbehörde</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8">4. Datenerfassung</h2>
        <ul className="list-disc list-inside">
          <li>Cookies: lokal gesetzt, kein Drittanbieter-Zugriff</li>
          <li>
            Lokaler&nbsp;/&nbsp;Session&nbsp;Storage: Theme-Einstellung (Hell /
            Dunkel) sowie temporaere Cloudflare-Turnstile&nbsp;Tokens (werden
            nach dem Seitenwechsel automatisch gelöscht)
          </li>
          <li>Server-Logs: IP-Adresse, Browser, Referrer etc.</li>
          <li>Kontaktformular: Datenverarbeitung nur mit Einwilligung</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8">5. Plugins und Tools</h2>
        <ul className="list-disc list-inside">
          <li>Google Fonts (lokal eingebunden)</li>
          <li>
            Cloudflare Turnstile (Spam‑Schutz, Datenverarbeitung innerhalb der
            EU)
          </li>
          <p className="mt-2">
            Bei Verwendung des Kontaktformulars setzen wir{' '}
            <strong>Cloudflare&nbsp;Turnstile</strong>
            ein. Turnstile überprüft anhand von IP‑Adresse, Header‑Informationen
            und ggf.&nbsp;Maus‑bewegungen, ob die Eingabe von einem Menschen
            stammt. Die Daten werden an Cloudflare‑Server innerhalb der EU
            übertragen und dort maximal&nbsp;24&nbsp;Stunden gespeichert, um
            Missbrauch zu verhindern. Rechtsgrundlage ist
            Art.&nbsp;6&nbsp;Abs.&nbsp;1&nbsp;lit.&nbsp;f DSGVO (berechtigtes
            Interesse an der Sicherheit und Funktionsfähigkeit dieser Website).
            Weitere Informationen:{' '}
            <a
              href="https://developers.cloudflare.com/turnstile/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline">
              developers.cloudflare.com/turnstile
            </a>
            .
          </p>
          <li>Font Awesome (lokal eingebunden)</li>
        </ul>

        <p className="mt-8 text-sm">
          Diese Datenschutzerklärung wurde mit dem eRecht24 Generator erstellt.
          Für rechtliche Details siehe auch die PDF-Version oder kontaktieren
          Sie mich direkt.
        </p>
      </article>
      <div className="mt-16 text-center text-black">
        <a
          href="/datenschutzerklaerung_www_mrbubbles_src_dev_de.pdf"
          download
          className="block w-full text-center px-6 py-3 bg-primary font-semibold rounded hover:bg-primary/90 transition md:inline-block md:w-auto">
          Download der kompletten Datenschutzerklärung (PDF)
        </a>
      </div>
      <article>
        <h2 className="text-3xl font-bold mt-20" id="privacy-policy-en">
          Privacy Policy (English)
        </h2>

        <p>
          The following information provides a simple overview of what happens
          to your personal data when you visit this website. Personal data
          refers to all data that can personally identify you. Detailed
          information on data protection can be found in the privacy policy
          listed below.
        </p>

        <h2 className="text-2xl font-semibold mt-8">
          1. Data Protection at a Glance
        </h2>
        <h3 className="text-xl font-medium mt-6">General Information</h3>
        <p>
          Data processing on this website is carried out by the site operator.
          Some data is collected when you provide it. Other data is collected
          automatically when visiting the website.
        </p>

        <h3 className="text-xl font-medium mt-6">
          What do we use your data for?
        </h3>
        <p>
          Some of the data is collected to ensure error-free provision of the
          website. Other data may be used to analyze user behavior.
        </p>

        <h3 className="text-xl font-medium mt-6">
          What rights do you have regarding your data?
        </h3>
        <p>
          You have the right to receive information about your stored personal
          data, its origin, recipients, and the purpose of data collection at
          any time. You also have the right to request correction, blocking, or
          deletion of this data.
        </p>

        <h2 className="text-2xl font-semibold mt-8">2. Hosting</h2>
        <p>This website is hosted externally by the following provider:</p>
        <p>
          Vercel Inc.
          <br />
          440 N Barranca Avenue #4133
          <br />
          Covina, CA 91723
          <br />
          United States
        </p>

        <h2 className="text-2xl font-semibold mt-8">
          3. General Information and Mandatory Disclosures
        </h2>
        <p>
          The operators of this website take the protection of your personal
          data very seriously. We treat your personal data confidentially and in
          accordance with the statutory data protection regulations and this
          privacy policy.
        </p>

        <h3 className="text-xl font-medium mt-6">Responsible Entity</h3>
        <p>
          Manuel Fahrenholz
          <br />
          Am Maarhof 28
          <br />
          51145 Cologne
          <br />
          contact@mrbubbles-src.dev
        </p>

        <h3 className="text-xl font-medium mt-6">Storage Duration</h3>
        <p>
          Your personal data will remain with us until the purpose for data
          processing no longer applies.
        </p>

        <h3 className="text-xl font-medium mt-6">Legal Basis</h3>
        <p>
          We process your data based on the GDPR, specifically Art. 6 (1) lit.
          a, b, c, and f, as well as Art. 9 and Art. 21 GDPR.
        </p>

        <h3 className="text-xl font-medium mt-6">Your Rights</h3>
        <ul className="list-disc list-inside">
          <li>Right to access, rectify, delete, and restrict processing</li>
          <li>Right to object to processing</li>
          <li>Right to data portability</li>
          <li>Right to lodge a complaint with a supervisory authority</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8">4. Data Collection</h2>
        <ul className="list-disc list-inside">
          <li>Cookies: locally stored, no third‑party access</li>
          <li>
            Local&nbsp;/&nbsp;session storage: theme preference (light / dark)
            and temporary Cloudflare Turnstile tokens (automatically cleared
            after navigation)
          </li>
          <li>Server logs: IP address, browser type, referrer, etc.</li>
          <li>Contact form: data processing only with consent</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8">5. Plugins and Tools</h2>
        <ul className="list-disc list-inside">
          <li>Google Fonts (self-hosted)</li>
          <li>
            Cloudflare Turnstile (spam protection, processed within the EU)
          </li>
          <p className="mt-2">
            When the contact form is used we leverage{' '}
            <strong>Cloudflare&nbsp;Turnstile</strong>. Turnstile checks, based
            on IP address, request headers and optionally mouse movements,
            whether the input comes from a human. These data are sent to
            Cloudflare servers within the EU and stored for up
            to&nbsp;24&nbsp;hours to prevent abuse. Processing is based on
            Art.&nbsp;6&nbsp;(1)&nbsp;f GDPR (legitimate interest in the
            security and proper functioning of this website). More
            details:&nbsp;
            <a
              href="https://developers.cloudflare.com/turnstile/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline">
              developers.cloudflare.com/turnstile
            </a>
            .
          </p>
          <li>Font Awesome (self-hosted)</li>
        </ul>

        <p className="mt-8 text-sm">
          This privacy policy was created using the eRecht24 Generator (German
          original). For legal validity, please refer to the German version.
          Feel free to contact us for clarification.
        </p>
      </article>
      <div className="mt-16 text-center text-black">
        <a
          href="/datenschutzerklaerung_www_mrbubbles_src_dev_de.pdf"
          download
          className="block w-full text-center px-6 py-3 bg-primary font-semibold rounded hover:bg-primary/90 transition md:inline-block md:w-auto">
          Download full privacy policy (PDF)
        </a>
      </div>
    </section>
  );
}
