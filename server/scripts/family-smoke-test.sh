# Smoke test for the family-device and approval routes. Run a local server first:
#   DATABASE_URL=... JWT_SECRET=testsecret PORT=3999 npx tsx src/index.ts
#   then: bash scripts/family-smoke-test.sh
set -u
B=http://localhost:3999
j() { python3 -c "import sys,json; d=json.load(sys.stdin); print(eval(sys.argv[1]))" "$1"; }
ok() { echo "$1"; }
PW=$(curl -s -X POST $B/auth/signup -H 'content-type: application/json' -d '{"email":"parent1@test.dev","password":"password123"}')
PT=$(echo "$PW" | j "d['token']")
curl -s -X PUT $B/data -H "authorization: Bearer $PT" -H 'content-type: application/json' -d '{"data":{"parentName":"Mom","childProfile":{"id":"c1"},"childProfiles":[{"id":"c1","name":"Rayna"}],"expectedItems":[{"id":"e1","childProfileId":"c1","name":"Make bed"}],"gigs":[{"id":"g1","childProfileId":"c1","name":"Walk dog"}],"expectedCompletions":[],"gigCompletions":[],"futureFund":{"balance":12},"futureFunds":[{"balance":12}],"gigEffortValues":{"quick":2},"badges":[],"goals":[]}}' >/dev/null
echo "--- code"
CODE=$(curl -s -X POST $B/family/codes -H "authorization: Bearer $PT" | j "d['code']"); echo "code=$CODE (len ${#CODE})"
echo "--- bad code"; curl -s -X POST $B/family/pair -H 'content-type: application/json' -d '{"code":"ZZZZZZ"}'; echo
echo "--- pair"; DT=$(curl -s -X POST $B/family/pair -H 'content-type: application/json' -d "{\"code\":\"$CODE\",\"deviceName\":\"Kitchen tablet\"}" | j "d['token']"); echo "device token ok: ${DT:0:12}..."
echo "--- reuse code"; curl -s -X POST $B/family/pair -H 'content-type: application/json' -d "{\"code\":\"$CODE\"}"; echo
echo "--- device token on parent route (expect 403)"; curl -s -o /dev/null -w "%{http_code}\n" $B/data -H "authorization: Bearer $DT"
echo "--- parent token on child route (expect 401)"; curl -s -o /dev/null -w "%{http_code}\n" $B/child/data -H "authorization: Bearer $PT"
echo "--- child data (no money?)"; curl -s $B/child/data -H "authorization: Bearer $DT" | python3 -c "import sys,json; d=json.load(sys.stdin); print('keys:',sorted(d['data'].keys())); print('has futureFund:', 'futureFund' in d['data'], 'has parentName:', 'parentName' in d['data'])"
echo "--- submit expected"; curl -s -X POST $B/child/submissions -H "authorization: Bearer $DT" -H 'content-type: application/json' -d '{"id":"s1","childId":"c1","kind":"expected","itemId":"e1","day":"2026-11-02"}'; echo
echo "--- submit same again (idempotent)"; curl -s -X POST $B/child/submissions -H "authorization: Bearer $DT" -H 'content-type: application/json' -d '{"id":"s1b","childId":"c1","kind":"expected","itemId":"e1","day":"2026-11-02"}' | j "d['submission']['id']"
echo "--- submit unknown item (expect 404)"; curl -s -o /dev/null -w "%{http_code}\n" -X POST $B/child/submissions -H "authorization: Bearer $DT" -H 'content-type: application/json' -d '{"id":"x","childId":"c1","kind":"gig","itemId":"nope","day":"2026-11-02"}'
echo "--- submit gig"; curl -s -X POST $B/child/submissions -H "authorization: Bearer $DT" -H 'content-type: application/json' -d '{"id":"s2","childId":"c1","kind":"gig","itemId":"g1","day":"2026-11-02"}' | j "d['submission']['status']"
echo "--- parent sees pending"; curl -s $B/family/submissions -H "authorization: Bearer $PT" | j "[(s['id'],s['status']) for s in d['submissions']]"
echo "--- child takes back s2"; curl -s -X DELETE $B/child/submissions/s2 -H "authorization: Bearer $DT"; echo
echo "--- parent approves s1"; curl -s -X POST $B/family/submissions/s1/decide -H "authorization: Bearer $PT" -H 'content-type: application/json' -d '{"decision":"approved"}' | j "d['submission']['status']"
echo "--- decide again (expect 409)"; curl -s -o /dev/null -w "%{http_code}\n" -X POST $B/family/submissions/s1/decide -H "authorization: Bearer $PT" -H 'content-type: application/json' -d '{"decision":"declined"}'
echo "--- child re-submits after, then parent declines with note"; curl -s -X POST $B/child/submissions -H "authorization: Bearer $DT" -H 'content-type: application/json' -d '{"id":"s3","childId":"c1","kind":"gig","itemId":"g1","day":"2026-11-02"}' >/dev/null; curl -s -X POST $B/family/submissions/s3/decide -H "authorization: Bearer $PT" -H 'content-type: application/json' -d '{"decision":"declined","note":"Did the leash go back?"}' | j "(d['submission']['status'], d['submission']['note'])"
echo "--- child sees results"; curl -s $B/child/data -H "authorization: Bearer $DT" | j "[(s['id'],s['status'],s.get('note')) for s in d['submissions']]"
echo "--- devices"; DID=$(curl -s $B/family/devices -H "authorization: Bearer $PT" | j "d['devices'][0]['id']"); curl -s $B/family/devices -H "authorization: Bearer $PT" | j "[x['name'] for x in d['devices']]"
echo "--- remove device, then child call (expect 401 removed)"; curl -s -X DELETE $B/family/devices/$DID -H "authorization: Bearer $PT" >/dev/null; curl -s -w " %{http_code}\n" $B/child/data -H "authorization: Bearer $DT"
echo "--- other parent can't decide mine"; PT2=$(curl -s -X POST $B/auth/signup -H 'content-type: application/json' -d '{"email":"parent2@test.dev","password":"password123"}' | j "d['token']"); curl -s -o /dev/null -w "%{http_code}\n" -X POST $B/family/submissions/s1/decide -H "authorization: Bearer $PT2" -H 'content-type: application/json' -d '{"decision":"approved"}'
echo "--- rate limit"; for i in $(seq 1 12); do curl -s -o /dev/null -w "%{http_code} " -X POST $B/family/pair -H 'content-type: application/json' -d '{"code":"AAAAAA"}'; done; echo
