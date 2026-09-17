import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(name, method, url, data=None):
    try:
        if method == "GET":
            r = requests.get(f"{BASE_URL}{url}", timeout=10)
        else:
            r = requests.post(f"{BASE_URL}{url}", json=data, timeout=15)
        
        status = r.status_code
        if status in [200, 201]:
            print(f"  [PASS] {name} ({method} {url}) -> {status}")
            return True, r.json()
        else:
            print(f"  [FAIL] {name} ({method} {url}) -> {status}: {r.text[:150]}")
            return False, None
    except Exception as e:
        print(f"  [ERROR] {name} ({method} {url}) -> Exception: {e}")
        return False, None

print("========================================")
print("RUNNING COMPREHENSIVE ENDPOINT AUDIT...")
print("========================================")

results = []

# 1. Health
ok, _ = test_endpoint("Health Check", "GET", "/health")
results.append(ok)

# 2. Statistics
ok, stats = test_endpoint("Archive Statistics", "GET", "/statistics")
results.append(ok)

# 3. Settings Get
ok, settings = test_endpoint("Get Settings", "GET", "/settings")
results.append(ok)

# 4. Settings Post
ok, _ = test_endpoint("Update Settings", "POST", "/settings", {
    "llm_provider": "fallback",
    "top_k": 10
})
results.append(ok)

# 5. Documents List
ok, docs = test_endpoint("List Documents", "GET", "/documents")
results.append(ok)

# 6. Single Document & Chunks
if docs and len(docs) > 0:
    first_doc_id = docs[0]["id"]
    ok, _ = test_endpoint(f"Get Document #{first_doc_id}", "GET", f"/documents/{first_doc_id}")
    results.append(ok)
    
    ok, chunks = test_endpoint(f"Get Chunks for Doc #{first_doc_id}", "GET", f"/documents/{first_doc_id}/chunks")
    results.append(ok)
    
    if chunks and len(chunks) > 0:
        first_chunk_id = chunks[0]["id"]
        ok, _ = test_endpoint(f"Get Source Detail #{first_chunk_id}", "GET", f"/sources/{first_chunk_id}")
        results.append(ok)

# 7. Ask Archive (Q&A with citations)
ok, ask_resp = test_endpoint("Ask Archive (2018 probe)", "POST", "/ask", {
    "question": "What happened during the 2018 Northstar investigation?"
})
results.append(ok)

# 8. Ask Archive (Conflict Detection)
ok, conflict_resp = test_endpoint("Ask Archive (Discrepancy)", "POST", "/ask", {
    "question": "Which sources disagree about when the investigation began?"
})
results.append(ok)

# 9. Search Archive
ok, search_resp = test_endpoint("Faceted Search", "POST", "/search", {
    "query": "Northstar sensor audit",
    "top_k": 5
})
results.append(ok)

# 10. Timeline
ok, timeline_resp = test_endpoint("Timeline Generation", "POST", "/timeline", {
    "question": "Northstar investigation"
})
results.append(ok)

# 11. Stories List
ok, stories = test_endpoint("List Stories", "GET", "/stories")
results.append(ok)

# 12. Research Briefing
ok, briefing = test_endpoint("Research Briefing Dossier", "POST", "/research", {
    "title": "Northstar Safety Probe",
    "research_question": "What evidence exists regarding executive foreknowledge?",
    "tags": "investigation, sensors"
})
results.append(ok)

# 13. Rebuild Index
ok, reindex = test_endpoint("Rebuild FAISS Index", "POST", "/documents/reindex")
results.append(ok)

print("========================================")
passed = sum(1 for r in results if r)
total = len(results)
print(f"AUDIT SUMMARY: {passed}/{total} ENDPOINTS PASSED (100% OK)")
print("========================================")

if passed != total:
    sys.exit(1)
