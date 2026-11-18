# Control map — GitHub Copilot in our organisation

Status: ✅ enforced · ⚠️ available but not set · ❓ unknown · 🔒 can't see (admin only)

| Layer | Control | Owner | Status |
|---|---|---|---|
| ① GitHub AI controls | Copilot features (chat, agents, cloud agent, code review) | | |
| ① GitHub AI controls | Model availability + "Default availability" for new models | | |
| ① GitHub AI controls | MCP servers in Copilot policy | | |
| ① GitHub AI controls | Content exclusion | | |
| ① GitHub AI controls | Audit log (agent actions) | | |
| ② Enterprise-managed settings | `permissions` / `sandbox` | | |
| ② Enterprise-managed settings | Default `model` / `fusionTier` | | |
| ② Enterprise-managed settings | MCP allow / deny lists | | |
| ③ VS Code device policies | ChatAgentMode · ChatToolsAutoApprove · ChatMCP | | |
| Repository | preToolUse guardrail hook (`.github/hooks/`) — Step 4 | me (this lab) | |
| Repository | Branch ruleset on `main` — Step 5 | me (this lab) | |
| Repository | CI check `Test` (`.github/workflows/ci.yml`) | | ✅ |