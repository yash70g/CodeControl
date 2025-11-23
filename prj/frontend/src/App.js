import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export default function CodeRunner() {
  const [code, setCode] = useState(`print("Hello")`);
  const [languageId, setLanguageId] = useState(54);
  const [testcases, setTestcases] = useState(["1 2", "3 4"]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/code/load`);
        if (res.data) {
          setCode(res.data.code || `print("Hello")`);
          setLanguageId(res.data.languageId || 54);
          setTestcases(res.data.testcases || ["1 2", "3 4"]);
        }
      } catch (err) {
        console.error("Failed to load from MongoDB:", err);
      } finally {
        setDbLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (dbLoading) return;

    const timer = setTimeout(async () => {
      try {
        setSaveStatus("Saving...");
        await axios.post(`${API_BASE_URL}/code/save`, {
          code,
          languageId,
          testcases,
        });
        setSaveStatus("Saved ✓");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch (err) {
        console.error("Failed to save to MongoDB:", err);
        setSaveStatus("Save failed ✗");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [code, languageId, testcases, dbLoading]);

  const runCode = async () => {
    setLoading(true);
    setResults([]);

    const outputs = [];
    for (let tc of testcases) {
      try {
        const res = await axios.post(
          "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
          {
            language_id: languageId,
            source_code: code,
            stdin: tc,
          },
          {
            headers: {
              "Content-Type": "application/json",
              "X-RapidAPI-Key": process.env.REACT_APP_RAPID,
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
          }
        );

        outputs.push({
          input: tc,
          output: res.data.stdout || res.data.stderr || "No output",
          status: res.data.status.description,
        });
      } catch (err) {
        outputs.push({
          input: tc,
          output: "Error running code",
          status: "Failed",
        });
      }
    }

    setResults(outputs);
    setLoading(false);
  };

  const addTestcase = () => setTestcases([...testcases, ""]);
  const updateTestcase = (i, v) => {
    const updated = [...testcases];
    updated[i] = v;
    setTestcases(updated);
  };
  const removeTestcase = (i) =>
    setTestcases(testcases.filter((_, idx) => idx !== i));

  const clearResults = () => setResults([]);

  if (dbLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh", background: "#0e141b" }}
      >
        <p className="text-success fs-4">Loading from database...</p>
      </div>
    );
  }
// console.log("API KEY:", process.env.REACT_APP_RAPID);

  return (
    <div style={{ minHeight: "100vh", background: "#0e141b", color: "#e6edf3" }}>
      <div className="container py-4">

        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="fw-bold" style={{ color: "#1ba94c" }}>
            Code Runner
          </h1>
          <div
            className={`fw-semibold ${
              saveStatus.includes("Saved")
                ? "text-success"
                : saveStatus.includes("failed")
                ? "text-danger"
                : "text-secondary"
            }`}
          >
            {saveStatus}
          </div>
        </div>

        <div className="row g-4">

          {/* Code + Language */}
          <div className="col-lg-8">
            {/* Language selector */}
            <div
              className="p-3 rounded mb-3"
              style={{
                background: "#1a1f24",
                border: "1px solid #252b31",
              }}
            >
              <label className="fw-semibold mb-2">Language</label>
              <select
                value={languageId}
                onChange={(e) => setLanguageId(parseInt(e.target.value))}
                className="form-select"
                style={{
                  background: "#0d1117",
                  borderColor: "#252b31",
                  color: "#e6edf3",
                }}
              >
                <option value={54}>C++</option>
                <option value={71}>Python 3</option>
                <option value={62}>Java</option>
                <option value={63}>JavaScript</option>
              </select>
            </div>

            {/* Code editor */}
            <div
              className="p-3 rounded"
              style={{
                background: "#1a1f24",
                border: "1px solid #252b31",
              }}
            >
              <label className="fw-semibold mb-2">Source Code</label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="form-control"
                rows={15}
                style={{
                  background: "#0d1117",
                  color: "#e6edf3",
                  borderColor: "#252b31",
                  fontFamily: "monospace",
                }}
              ></textarea>
            </div>
          </div>

          {/* Testcases */}
          <div className="col-lg-4">
            <div
              className="p-3 rounded"
              style={{
                background: "#1a1f24",
                border: "1px solid #252b31",
                maxHeight: "540px",
                overflowY: "auto",
              }}
            >
              <h5 className="fw-bold mb-3" style={{ color: "#1ba94c" }}>
                Test Cases
              </h5>

              {testcases.map((tc, idx) => (
                <div className="d-flex mb-2" key={idx}>
                  <input
                    value={tc}
                    onChange={(e) => updateTestcase(idx, e.target.value)}
                    className="form-control"
                    style={{
                      background: "#0d1117",
                      color: "#e6edf3",
                      borderColor: "#252b31",
                    }}
                  />
                  <button
                    onClick={() => removeTestcase(idx)}
                    className="btn btn-danger ms-2"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                onClick={addTestcase}
                className="btn w-100 mt-3"
                style={{
                  background: "#1a1f24",
                  borderColor: "#252b31",
                  color: "#e6edf3",
                }}
              >
                + Add Test Case
              </button>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="d-flex gap-3 mt-4">
          <button
            onClick={runCode}
            disabled={loading}
            className="btn px-4 py-2"
            style={{
              background: "#1ba94c",
              color: "black",
              fontWeight: "600",
            }}
          >
            {loading ? "Running..." : "▶ Run Code"}
          </button>

          <button
            onClick={clearResults}
            className="btn px-4 py-2"
            style={{
              background: "#1a1f24",
              border: "1px solid #252b31",
              color: "#e6edf3",
            }}
          >
            Clear Results
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-5">
            <h3 className="fw-bold mb-3" style={{ color: "#1ba94c" }}>
              Results
            </h3>

            {results.map((r, idx) => (
              <div
                key={idx}
                className="p-3 mb-3 rounded"
                style={{
                  background: "#1a1f24",
                  border: "1px solid #252b31",
                }}
              >
                <p className="mb-1">
                  <strong>Input:</strong>{" "}
                  <code
                    style={{
                      background: "#0d1117",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    {r.input}
                  </code>
                </p>

                <strong style={{ color: "#1ba94c" }}>Output:</strong>
                <pre
                  style={{
                    background: "#0d1117",
                    color: "#1ba94c",
                    padding: "12px",
                    borderRadius: "4px",
                    border: "1px solid #252b31",
                  }}
                >
                  {r.output}
                </pre>

                <p className="mt-2">
                  <strong
                    className={
                      r.status.includes("Accepted")
                        ? "text-success"
                        : "text-warning"
                    }
                  >
                    Status:
                  </strong>{" "}
                  {r.status}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
