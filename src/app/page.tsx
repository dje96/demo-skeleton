import { siteConfig } from '@/lib/config';

/**
 * PLACEHOLDER home page. The Build phase replaces this with the demo's real
 * homepage. Its only purpose here is to give the tracking baseline a page to
 * fire a page_view on so you can verify the pipeline end-to-end after cloning.
 */
export default function Home() {
  return (
    <div className="mx-auto max-w-page px-6 py-section">
      <p className="text-small font-semibold uppercase tracking-wider text-primary">
        Snowplow demo skeleton
      </p>
      <h1 className="mt-3 font-heading text-h1 font-extrabold text-heading">
        {siteConfig.brand.name}
      </h1>
      <p className="mt-4 max-w-[42rem] text-body">
        This is the plumbing baseline: Snowplow tracker, consent, Signals, the
        presenter footer, and the Signals Inspector are all wired. Replace this
        page and fill <code className="font-mono text-primary">src/lib/config.ts</code>{' '}
        to build the demo.
      </p>

      <ul className="mt-8 space-y-2 text-small text-muted">
        <li>• Open the Signals panel (bottom-left) to watch live attributes.</li>
        <li>• Use the footer controls to reload with UTM, clear identity, manage consent.</li>
        <li>• Sign in (top-right) to see the anonymous→known identity stitch.</li>
        <li>• &ldquo;Watch Video&rdquo; exercises YouTube media tracking.</li>
      </ul>
    </div>
  );
}
