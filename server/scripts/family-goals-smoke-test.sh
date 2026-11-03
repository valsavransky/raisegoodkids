# Goal requests from a family device. Same local server as family-smoke-test.sh.
set -u
B=http://localhost:3999
j() { python3 -c "import sys,json; d=json.load(sys.stdin); print(eval(sys.argv[1]))" "$1"; }
R=$RANDOM
EMAIL="goals$R@test.dev"
PT=$(curl -s -X POST $B/auth/signup -H 'content-type: application/json' -d "{\"email\":\"$EMAIL\",\"password\":\"password123\"}" | j "d['token']")
curl -s -X PUT $B/data -H "authorization: Bearer $PT" -H 'content-type: application/json' -d '{"data":{"childProfiles":[{"id":"c1","name":"Rayna"}],"goals":[{"id":"gl1","childProfileId":"c1","name":"Art set"}],"expectedItems":[],"gigs":[]}}' >/dev/null
CODE=$(curl -s -X POST $B/family/codes -H "authorization: Bearer $PT" | j "d['code']")
DT=$(curl -s -X POST $B/family/pair -H 'content-type: application/json' -d "{\"code\":\"$CODE\"}" | j "d['token']")
sub() { curl -s -X POST $B/child/submissions -H "authorization: Bearer $DT" -H 'content-type: application/json' -d "${1//@R@/$R}"; }
code() { curl -s -o /dev/null -w "%{http_code}" -X POST $B/child/submissions -H "authorization: Bearer $DT" -H 'content-type: application/json' -d "${1//@R@/$R}"; }
echo -n "goal_add with a name: "; sub '{"id":"a1-@R@","childId":"c1","kind":"goal_add","itemId":"new1","day":"2026-11-02","payload":{"name":"  Skateboard  "}}' | j "(d['submission']['kind'], d['submission']['payload'])"
echo -n "goal_add without a name (400): "; code '{"id":"a2-@R@","childId":"c1","kind":"goal_add","itemId":"new2","day":"2026-11-02","payload":{}}'; echo
echo -n "goal_add for an unknown child (404): "; code '{"id":"a3-@R@","childId":"zzz","kind":"goal_add","itemId":"new3","day":"2026-11-02","payload":{"name":"X"}}'; echo
echo -n "goal_rename of an existing goal: "; sub '{"id":"r1-@R@","childId":"c1","kind":"goal_rename","itemId":"gl1","day":"2026-11-02","payload":{"name":"Art set and paints"}}' | j "(d['submission']['kind'], d['submission']['payload'])"
echo -n "goal_rename of a missing goal (404): "; code '{"id":"r2-@R@","childId":"c1","kind":"goal_rename","itemId":"nope","day":"2026-11-02","payload":{"name":"X"}}'; echo
echo -n "goal_switch to an existing goal: "; sub '{"id":"w1-@R@","childId":"c1","kind":"goal_switch","itemId":"gl1","day":"2026-11-02"}' | j "d['submission']['status']"
echo -n "parent sees all three waiting: "; curl -s $B/family/submissions -H "authorization: Bearer $PT" | j "sorted(s['kind'] for s in d['submissions'])"
echo -n "parent declines the rename with a note: "; curl -s -X POST $B/family/submissions/r1-$R/decide -H "authorization: Bearer $PT" -H 'content-type: application/json' -d '{"decision":"declined","note":"Keep it simple"}' | j "(d['submission']['status'], d['submission']['note'])"
echo -n "parent approves the new goal with a price: "; curl -s -X POST $B/family/submissions/a1-$R/decide -H "authorization: Bearer $PT" -H 'content-type: application/json' -d '{"decision":"approved","price":60}' | j "(d['submission']['status'], d['submission']['payload'])"
