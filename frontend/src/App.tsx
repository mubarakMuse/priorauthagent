import { useState } from "react";
import type { PipelineResponse } from "./types";
import "./App.css";
const API_BASE = import.meta.env.VITE_API_BASE ?? ""
const API_URL = `${API_BASE}/api/process`
const PDF_API_URL = `${API_BASE}/api/process-pdf`


const parseErrorDetail = async (response: Response, fallback: string): Promise<string> => {
  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    const err = await response.json()
    return err.detail || fallback
  }

  const text = await response.text()
  if (text.includes("504 Gateway Time-out")) {
    return "The API timed out — the server may still be starting. Try again in a minute."
  }

  return text.slice(0, 200) || `${fallback} (HTTP ${response.status})`
}

const SAMPLE_NOTE = `Patient: 58yo male
Chief complaint: Progressive knee pain, 6 months

Assessment:
- Primary osteoarthritis of right knee (M17.11)
- Failed conservative management (NSAIDs, PT x 8 weeks)

Plan:
- Refer for total knee arthroplasty, right knee (CPT 27447)
- Continue meloxicam 15mg daily until surgery`;

function App() {

// inside App():
const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [note, setNote] = useState(SAMPLE_NOTE);
  const [result, setResult] = useState<PipelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handlePdfSubmit() {
    if (!selectedFile) return;
  
    setLoading(true);
    setError(null);
    setResult(null);
  
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
  
      const response = await fetch(PDF_API_URL, {
        method: "POST",
        body: formData,  // no Content-Type header — browser sets multipart boundary
      });
  
      if (!response.ok) {
        throw new Error(await parseErrorDetail(response, "PDF upload failed"))
      }
  
      const data: PipelineResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }
  
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setError(null);
  }
  async function handleSubmit() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinical_note: note }),
      });

      if (!response.ok) {
        throw new Error(await parseErrorDetail(response, "Request failed"))
      }

      const data: PipelineResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <header>
        <h1>Prior Auth Agent</h1>
        <p>Paste a clinical note → extract → match rules → generate request</p>
      </header>
      <div className="upload-section">
  <label htmlFor="pdf">Or upload a PDF</label>
  <input
    id="pdf"
    type="file"
    accept=".pdf,application/pdf"
    onChange={handleFileChange}
  />
  {selectedFile && <p className="file-name">Selected: {selectedFile.name}</p>}
  <button
    onClick={handlePdfSubmit}
    disabled={loading || !selectedFile}
    className="secondary-btn"
  >
    {loading ? "Processing..." : "Run Pipeline from PDF"}
  </button>
</div>

<hr className="divider" />

<label htmlFor="note">Or paste clinical note</label>
{/* existing textarea + Run Pipeline button */}
      <section className="input-section">
        <label htmlFor="note">Clinical Note</label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={12}
          placeholder="Paste clinical note here..."
        />
        <button onClick={handleSubmit} disabled={loading || !note.trim()}>
          {loading ? "Processing..." : "Run Pipeline"}
        </button>
      </section>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="results">
          <section className="card">
            <h2>Extraction</h2>
            <p className="summary">{result.extraction.patient_summary}</p>

            <h3>Diagnoses</h3>
            <ul>
              {result.extraction.diagnoses.map((d, i) => (
                <li key={i}>
                  {d.description} {d.icd10_code && `(${d.icd10_code})`}
                </li>
              ))}
            </ul>

            <h3>Procedures</h3>
            <ul>
              {result.extraction.procedures.map((p, i) => (
                <li key={i}>
                  {p.description} {p.cpt_code && `(CPT ${p.cpt_code})`}
                </li>
              ))}
            </ul>

            <h3>Medications</h3>
            <ul>
              {result.extraction.medications.map((m, i) => (
                <li key={i}>
                  {m.name} {m.dosage && `— ${m.dosage}`}
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2>Matched Rules ({result.matched_rules.length})</h2>
            {result.matched_rules.length === 0 ? (
              <p>No payer rules matched.</p>
            ) : (
              <ul>
                {result.matched_rules.map((rule) => (
                  <li key={rule.id}>
                    <strong>[{rule.id}]</strong> {rule.description}
                    <span className="badge">
                      {rule.requires_prior_auth ? "Prior auth required" : "No prior auth"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2>Prior Auth Request</h2>
            {result.prior_auth_request ? (
              <>
                <p><strong>Payer:</strong> {result.prior_auth_request.payer}</p>
                <p>
                  <strong>Procedure:</strong>{" "}
                  {result.prior_auth_request.procedure_description} (CPT{" "}
                  {result.prior_auth_request.cpt_code})
                </p>
                <p>
                  <strong>Diagnosis:</strong>{" "}
                  {result.prior_auth_request.diagnosis_description} (ICD-10{" "}
                  {result.prior_auth_request.icd10_code})
                </p>
                <h3>Clinical Justification</h3>
                <p>{result.prior_auth_request.clinical_justification}</p>
                <h3>Supporting Facts</h3>
                <ul>
                  {result.prior_auth_request.supporting_facts.map((fact, i) => (
                    <li key={i}>{fact}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p>No prior auth request generated — no rules matched.</p>
            )}
          </section>
          {result.evaluation && (
            <section className="card">
              <h2>
                Evaluation —{" "}
                <span className={result.evaluation.confidence_score >= 0.8 ? "score-good" : "score-warn"}>
                  {(result.evaluation.confidence_score * 100).toFixed(0)}% confidence
                </span>
              </h2>
              <p>{result.evaluation.summary}</p>

              <p>
                <strong>Extraction grounded:</strong>{" "}
                {result.evaluation.extraction_grounded ? "Yes" : "No"}
              </p>
              <p>
                <strong>Prior auth consistent:</strong>{" "}
                {result.evaluation.prior_auth_consistent ? "Yes" : "No"}
              </p>

              {result.evaluation.fact_evals.length > 0 && (
                <>
                  <h3>Supporting Facts Check</h3>
                  <ul>
                    {result.evaluation.fact_evals.map((f, i) => (
                      <li key={i} className={f.grounded ? "grounded" : "ungrounded"}>
                        {f.grounded ? "✓" : "✗"} {f.fact}
                        <span className="reason"> — {f.reason}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <p><strong>Generation attempts:</strong> {result.generation_attempts}</p>
              <p><strong>Code confidence:</strong> {(result.evaluation.code_confidence_score * 100).toFixed(0)}%</p>

              {result.evaluation.llm_eval && (
                <>
                  <p>
                    <strong>LLM groundedness:</strong>{" "}
                    {(result.evaluation.llm_eval.groundedness_score * 100).toFixed(0)}%
                  </p>
                  <p><em>{result.evaluation.llm_eval.reasoning}</em></p>
                  {result.evaluation.llm_eval.ungrounded_claims.length > 0 && (
                    <>
                      <h3>LLM Flagged Claims</h3>
                      <ul>
                        {result.evaluation.llm_eval.ungrounded_claims.map((claim, i) => (
                          <li key={i} className="ungrounded">{claim}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default App;