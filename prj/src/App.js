import React, { useState } from "react";
import axios from "axios";

export default function CodeRunner() {
  const [code, setCode] = useState(`print("Hello")`);
  const [languageId, setLanguageId] = useState(54); // 71 = Python3
  const [testcases, setTestcases] = useState(["1 2","3 4"]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

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
              "X-RapidAPI-Key": "4b89ee184emsh4afaa98e31975d9p1c7ec9jsn3f3fe260835a",  // replace
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
        outputs.push({ input: tc, output: "Error running code", status: "Failed" });
      }
    }

    setResults(outputs);
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-2">Judge0 Code Runner</h2>

      <textarea
        className="w-full p-2 border rounded"
        rows="8"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <button
        onClick={runCode}
        disabled={loading}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? "Running..." : "Run Code"}
      </button>

      <div className="mt-4">
        <h3 className="font-semibold">Results:</h3>
        {results.map((r, idx) => (
          <div key={idx} className="border p-2 mt-2 rounded">
            <p><strong>Input:</strong> {r.input}</p>
            <p><strong>Output:</strong> {r.output}</p>
            <p><strong>Status:</strong> {r.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
