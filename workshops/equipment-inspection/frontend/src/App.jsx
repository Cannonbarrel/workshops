import { useState, useEffect, useCallback } from "react";

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const SEV_COLOR  = { LOW: "#22c55e", MEDIUM: "#f59e0b", HIGH: "#f97316", CRITICAL: "#ef4444" };
const SEV_BG     = { LOW: "#f0fdf4", MEDIUM: "#fffbeb", HIGH: "#fff7ed", CRITICAL: "#fef2f2" };
const STATUS_COLOR = { PENDING: "#64748b", REVIEWED: "#3b82f6", APPROVED: "#22c55e", FLAGGED: "#ef4444" };

const SAMPLE_EQUIPMENT = ["PUMP-001", "VALVE-042", "COMP-07", "SEP-003"];

// vite proxy rewrites /api → backend; if VITE_API_URL is set, use that host directly
const API = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}` : "";

export default function App() {
  const [equipmentId, setEquipmentId]         = useState("PUMP-001");
  const [photos, setPhotos]                   = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [selectedComp, setSelectedComp]       = useState(null);
  const [versions, setVersions]               = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [showUpload, setShowUpload]           = useState(false);

  // upload form
  const [uFile,     setUFile]     = useState(null);
  const [uComp,     setUComp]     = useState("");
  const [uTech,     setUTech]     = useState("TECH-001");
  const [uSev,      setUSev]      = useState("LOW");
  const [uNotes,    setUNotes]    = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  // ── data fetching ──────────────────────────────────────────────────────────

  const loadPhotos = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/equipment/${id}/photos`);
      const data = await res.json();
      setPhotos(Array.isArray(data) ? data : []);
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPhotos(equipmentId); }, [equipmentId, loadPhotos]);

  const loadVersions = async (equip, comp) => {
    setVersionsLoading(true);
    const slug = comp.toLowerCase().replace(/ /g, "-");
    try {
      const res  = await fetch(`${API}/api/equipment/${equip}/photos/${slug}`);
      const data = await res.json();
      setVersions(Array.isArray(data) ? data : []);
    } catch {
      setVersions([]);
    } finally {
      setVersionsLoading(false);
    }
  };

  const selectComponent = (comp) => {
    setSelectedComp(comp);
    loadVersions(equipmentId, comp);
  };

  // ── derived: latest photo per component ────────────────────────────────────

  const latestByComponent = () => {
    const seen = {};
    for (const p of photos) {
      if (!seen[p.component]) seen[p.component] = p;
    }
    return Object.values(seen);
  };

  // ── upload flow ────────────────────────────────────────────────────────────

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uFile || !uComp.trim()) return;

    setUploading(true);
    setUploadErr("");

    try {
      const ext = uFile.name.split(".").pop() || "jpg";

      // 1. Get presigned PUT URL from backend
      const urlRes = await fetch(`${API}/api/upload-url`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          equipment_id: equipmentId,
          component:    uComp,
          technician_id: uTech,
          file_ext:     ext,
        }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { upload_url, s3_key, captured_at } = await urlRes.json();

      // 2. PUT file directly to S3 (no backend involvement — presigned URL)
      const s3Res = await fetch(upload_url, { method: "PUT", body: uFile });
      if (!s3Res.ok) throw new Error("S3 upload failed — check bucket CORS config");

      // 3. Save metadata to DynamoDB via backend
      const metaRes = await fetch(`${API}/api/photos`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          equipment_id:  equipmentId,
          component:     uComp,
          s3_key,
          captured_at,
          technician_id: uTech,
          severity:      uSev,
          notes:         uNotes,
        }),
      });
      if (!metaRes.ok) throw new Error("Failed to save metadata");

      // reset and refresh
      setShowUpload(false);
      setUFile(null); setUComp(""); setUNotes(""); setUSev("LOW");
      loadPhotos(equipmentId);
      if (selectedComp === uComp) loadVersions(equipmentId, uComp);
    } catch (err) {
      setUploadErr(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-left">
          <span className="header-icon">🔧</span>
          <h1>Equipment Inspection</h1>
        </div>
        <div className="header-right">
          <div className="equipment-selector">
            <select
              value={SAMPLE_EQUIPMENT.includes(equipmentId) ? equipmentId : "__custom"}
              onChange={(e) => {
                if (e.target.value !== "__custom") setEquipmentId(e.target.value);
              }}
              className="select"
            >
              {SAMPLE_EQUIPMENT.map((id) => (
                <option key={id} value={id}>{id}</option>
              ))}
              {!SAMPLE_EQUIPMENT.includes(equipmentId) && (
                <option value="__custom">{equipmentId}</option>
              )}
            </select>
            <input
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value.toUpperCase())}
              placeholder="or type ID…"
              className="equipment-input"
            />
          </div>
          <button onClick={() => setShowUpload(true)} className="btn-primary">
            + New Inspection
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="main">

        {/* Components grid — latest photo per component */}
        <section className="section">
          <div className="section-header">
            <h2>
              Components
              <span className="equipment-badge">{equipmentId}</span>
            </h2>
            <span className="count-label">{latestByComponent().length} component{latestByComponent().length !== 1 ? "s" : ""}</span>
          </div>

          {loading && <p className="state-msg">Loading…</p>}

          {!loading && latestByComponent().length === 0 && (
            <div className="empty-state">
              <p>No inspection photos yet for <strong>{equipmentId}</strong>.</p>
              <button onClick={() => setShowUpload(true)} className="btn-primary" style={{ marginTop: 12 }}>
                Upload first photo
              </button>
            </div>
          )}

          <div className="grid">
            {latestByComponent().map((p) => (
              <div
                key={p.component}
                className={`card ${selectedComp === p.component ? "card-selected" : ""}`}
                onClick={() => selectComponent(p.component)}
              >
                <div className="card-img-wrap">
                  <img src={p.photo_url} alt={p.component} className="card-img" />
                  <span
                    className="sev-pill"
                    style={{ background: SEV_COLOR[p.severity] }}
                  >
                    {p.severity}
                  </span>
                </div>
                <div className="card-body">
                  <div className="card-title">{p.component}</div>
                  <div className="card-meta">
                    <span>{p.technician_id}</span>
                    <span>{new Date(p.captured_at).toLocaleDateString()}</span>
                  </div>
                  {p.notes && <p className="card-notes">{p.notes}</p>}
                  <div className="card-footer">
                    <span className="status-chip" style={{ color: STATUS_COLOR[p.status] || "#64748b" }}>
                      ● {p.status}
                    </span>
                    <span className="view-history">View history →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Version history panel */}
        {selectedComp && (
          <section className="section version-section">
            <div className="section-header">
              <h2>
                Version History
                <span className="equipment-badge">{selectedComp}</span>
              </h2>
              <button onClick={() => setSelectedComp(null)} className="btn-ghost">✕ Close</button>
            </div>

            {versionsLoading && <p className="state-msg">Loading versions…</p>}

            <div className="version-list">
              {versions.map((v) => (
                <div key={v.component_ts} className="version-row">
                  <a href={v.photo_url} target="_blank" rel="noreferrer" className="thumb-link">
                    <img src={v.photo_url} alt={`v${v.version_num}`} className="version-thumb" />
                    <span className="thumb-version">v{v.version_num}</span>
                  </a>
                  <div className="version-meta">
                    <div className="version-badges">
                      <span
                        className="sev-pill-sm"
                        style={{ background: SEV_COLOR[v.severity], color: "#fff" }}
                      >
                        {v.severity}
                      </span>
                      <span className="status-chip" style={{ color: STATUS_COLOR[v.status] || "#64748b" }}>
                        ● {v.status}
                      </span>
                    </div>
                    <p className="ver-date">{new Date(v.captured_at).toLocaleString()}</p>
                    <p className="ver-tech">Technician: <strong>{v.technician_id}</strong></p>
                    {v.notes && <p className="ver-notes">{v.notes}</p>}
                    <p className="ver-s3key">
                      <span className="s3-label">S3</span> {v.s3_key}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── Upload modal ── */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Inspection Photo</h3>
              <button onClick={() => setShowUpload(false)} className="btn-ghost">✕</button>
            </div>

            <p className="modal-sub">
              Equipment: <strong>{equipmentId}</strong>
            </p>

            <form onSubmit={handleUpload} className="form">
              <label className="field">
                <span>Component / Location</span>
                <input
                  value={uComp}
                  onChange={(e) => setUComp(e.target.value)}
                  placeholder="e.g. Inlet Valve, Pressure Gauge"
                  required
                />
              </label>

              <label className="field">
                <span>Technician ID</span>
                <input
                  value={uTech}
                  onChange={(e) => setUTech(e.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Severity</span>
                <select value={uSev} onChange={(e) => setUSev(e.target.value)}>
                  {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>

              <div
                className="sev-preview"
                style={{ background: SEV_BG[uSev], borderColor: SEV_COLOR[uSev] }}
              >
                <span style={{ color: SEV_COLOR[uSev], fontWeight: 600 }}>{uSev}</span>
                {uSev === "CRITICAL" && " — flag for immediate supervisor review"}
                {uSev === "HIGH"     && " — action required within 24 hours"}
                {uSev === "MEDIUM"   && " — schedule repair at next maintenance window"}
                {uSev === "LOW"      && " — monitor at next inspection"}
              </div>

              <label className="field">
                <span>Notes</span>
                <textarea
                  value={uNotes}
                  onChange={(e) => setUNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe what you observed…"
                />
              </label>

              <label className="field">
                <span>Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUFile(e.target.files[0])}
                  required
                />
              </label>

              {uploadErr && <p className="error-msg">{uploadErr}</p>}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowUpload(false)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={uploading} className="btn-primary">
                  {uploading ? "Uploading…" : "Upload Photo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
