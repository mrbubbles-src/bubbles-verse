export default function LegalPage() {
  return (
    <section className="flex flex-col w-full max-w-3xl mx-auto py-16 px-6 space-y-12 break-words overflow-hidden">
      <article>
        <h1 className="text-3xl font-bold mb-4">Impressum / Legal Notice</h1>

        <div className="space-t-6">
          <div>
            <h2 className="text-xl font-semibold">Angaben gemäß § 5 TMG</h2>
            <p>
              Manuel Fahrenholz
              <br />
              Am Maarhof 28
              <br />
              51145 Köln
              <br />
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Kontakt</h2>
            <p>
              Telefon: +49 (0) 1727284635
              <br />
              E-Mail: contact@mrbubbles-src.dev
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              Redaktionell verantwortlich
            </h2>
            <p>
              Manuel Fahrenholz
              <br />
              Am Maarhof 28
              <br />
              51145 Köln
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Quelle</h2>
            <p>
              <a
                className="underline"
                href="https://www.e-recht24.de/impressum-generator.html"
                target="_blank"
                rel="noopener noreferrer">
                https://www.e-recht24.de/impressum-generator.html
              </a>
            </p>
          </div>
        </div>
      </article>

      <div className="mt-16 text-center text-black">
        <a
          href="/impressum_www_mrbubbles_src_dev_de.pdf"
          download
          className="block w-full text-center px-6 py-3 bg-primary font-semibold rounded hover:bg-primary/90 transition md:inline-block md:w-auto">
          Download des kompletten Impressums (PDF)
        </a>
      </div>

      <article>
        <h1 className="text-3xl font-bold mb-4">Legal Notice (English)</h1>

        <div className="space-t-6">
          <div>
            <h2 className="text-xl font-semibold">
              Information according to Section 5 of the German Telemedia Act
              (TMG)
            </h2>
            <p>
              Manuel Fahrenholz
              <br />
              Am Maarhof 28
              <br />
              51145 Cologne, Germany
              <br />
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Contact</h2>
            <p>
              Phone: +49 (0) 1727284635
              <br />
              E-Mail: contact@mrbubbles-src.dev
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Editorially responsible</h2>
            <p>
              Manuel Fahrenholz
              <br />
              Am Maarhof 28
              <br />
              51145 Cologne, Germany
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold">Source</h2>
            <p>
              <a
                className="underline"
                href="https://www.e-recht24.de/impressum-generator.html"
                target="_blank"
                rel="noopener noreferrer">
                https://www.e-recht24.de/impressum-generator.html
              </a>
            </p>
          </div>
        </div>
      </article>

      <div className="mt-16 text-center text-black">
        <a
          href="/impressum_www_mrbubbles_src_dev_de.pdf"
          download
          className="block w-full text-center px-6 py-3 bg-primary font-semibold rounded hover:bg-primary/90 transition md:inline-block md:w-auto">
          Download full legal notice (PDF)
        </a>
      </div>
    </section>
  );
}
