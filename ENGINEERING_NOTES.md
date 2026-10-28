# VoiceAI — Engineering Deep Dive

This technical walkthrough documents the **curated product implementation** rather than a copy of every original file. The Python agent, Go service and React UI are real selected modules. Source is partial, and customer-facing configuration and operational records are excluded.

## 1. Real-time voice session lifecycle

Start with [agent.py](src/voice/agent.py). The custom `Assistant` derives from LiveKit's `Agent`; it defines an entry lifecycle, gets room context, and initiates a greeting. The async entrypoint connects to a LiveKit room and starts an `AgentSession` configured with `openai.realtime.RealtimeModel`.

**Sanitization:** The original script contained a customer-specific sales introduction. That block is replaced with a generic greeting in this portfolio, and caller-number console output is redacted. The agent reads its prompt from a private `sys_inst.txt` file not included here.

The module also defines asynchronous SQLite functions to create a call-log table and insert records. Its `on_exit` method **only prints session data in the checked source**; it does not call `log_call`. It would be inaccurate to claim this proves completed-call persistence from a voice session.

## 2. Telephony metadata integration

The [Go call-history handler](src/backend/internal/handler/userhandler.go) gets stored Twilio account configuration through the [service](src/backend/internal/service/userservice.go) and [repository](src/backend/internal/repository/loginrepo.go), then makes an authenticated request to Twilio's Calls endpoint and deserializes returned metadata.

The system uses the Go HTTP standard library and PostgreSQL adapter; see [routes](src/backend/internal/routes/route.go) and [database](src/backend/db/db.go). All Twilio account secrets and client records are excluded.

The selected code handles the API integration path; it is not a claim of verified pagination, webhook signature checks, or comprehensive telephony error recovery.

## 3. Administrative UI

The [React call-history view](src/frontend/pages/CallHistory.tsx) loads rows from the Go API, transforms call metadata, supports display/sorting and a spreadsheet-export flow. [Login](src/frontend/pages/login/Login.tsx) and [routing](src/frontend/App.tsx) provide basic navigation.

No actual phone numbers, customer names or call records are distributed here. The source demonstrates **interface and integration implementation**, not proof of production consent compliance.

## 4. Authentication and privacy trade-offs

The Go [user service](src/backend/internal/service/userservice.go) uses bcrypt hashing and password comparison. However, the inspected [API handler](src/backend/internal/handler/userhandler.go) returns a **user ID in the token field**, not a verifiable JWT. The selected [routes](src/backend/internal/routes/route.go) also use permissive CORS and do not themselves show role-protected middleware for call-history access.

These are **important limitations**, not features to exaggerate. A production-hardening discussion should cover authenticated/authorized call-history requests, token issuance and validation, rate limiting, CORS restrictions, customer-specific data isolation, and telephony-data retention.

## 5. Upstream technology versus custom code

LiveKit and OpenAI provide the real-time voice infrastructure. The original repository includes a generic publishing-house/storyteller LiveKit multi-agent example (`main.py`) which was intentionally omitted; it should not be used to claim delivery of a specialized multi-agent phone product without product-specific evidence.

## 6. Portfolio boundaries

The original repository is **read-only and unchanged**. This public edition has fresh Git history, sanitized client prompts, no environment or telephony credentials, no local databases, no recorded calls, and no real contact lists.

This source subset cannot be run independently. No claims are made regarding number of production calls, latency benchmarks, fully operational voice-to-CRM automation, comprehensive security review, or independent accuracy testing.

Return to the [README.md](README.md) for the concise walkthrough.
