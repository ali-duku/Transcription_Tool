import { AppIcon } from "../../../../shared/ui/AppIcon";
import type { WhatsNewRelease, WhatsNewTone } from "../../../../shared/constants/whatsNewReleases";
import "./WhatsNewModal.css";

interface WhatsNewModalProps {
  open: boolean;
  appVersion: string;
  releases: WhatsNewRelease[];
  onClose: () => void;
}

function toneClassName(tone: WhatsNewTone): string {
  if (tone === "success") return "whats-new-tone-success";
  if (tone === "danger") return "whats-new-tone-danger";
  if (tone === "warning") return "whats-new-tone-warning";
  return "whats-new-tone-info";
}

export function WhatsNewModal({ open, appVersion, releases, onClose }: WhatsNewModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="whats-new-modal" role="dialog" aria-modal="true" aria-labelledby="whats-new-title">
      <div className="whats-new-dialog">
        <div className="whats-new-header">
          <div className="whats-new-title-row">
            <h2 id="whats-new-title">What&apos;s New</h2>
            <span className="whats-new-version-pill">Version {appVersion}</span>
          </div>
          <button
            type="button"
            className="tab-button whats-new-close"
            onClick={onClose}
            aria-label="Close What's New"
          >
            <AppIcon name="close" />
          </button>
        </div>

        <div className="whats-new-content">
          {releases.map((release, index) => (
            <section key={release.version} className="whats-new-release">
              <div className="whats-new-release-row">
                <h3>Version {release.version}</h3>
                {index === 0 ? <span className="whats-new-current-badge">Current</span> : null}
              </div>
              {release.sections.map((section) => (
                <div key={`${release.version}-${section.key}`} className="whats-new-section">
                  <h4 className={toneClassName(section.tone)}>
                    <AppIcon name={section.icon} />
                    <span>{section.title}</span>
                  </h4>
                  <ul>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
