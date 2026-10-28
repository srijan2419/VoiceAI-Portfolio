# VoiceAI — Real-Time AI Calling & Call-Operations Platform

**Live voice agents • Telephony integrations • Go backend • React dashboard**

VoiceAI is a phone-oriented AI application developed through SrijanAI Innovations. It combines a real-time conversational voice-agent session with telephony call-history retrieval and an administrative frontend.

> **Genuine implementation, deliberately sanitized.** This portfolio presents a selected LiveKit/OpenAI Realtime agent, Go/Twilio integration and call-operations UI. The original repository also contains a standalone LiveKit multi-agent *sample*; that sample is deliberately excluded because it is **not evidence of original product features**.

## 30-second overview

| | |
| --- | --- |
| **Problem** | Handle conversational phone interactions and give operators visibility into the resulting call activity. |
| **Approach** | A Python real-time voice session connected through LiveKit, with a Go service querying Twilio call records and a React call-history interface. |
| **Engineering areas** | Voice-agent lifecycle, async session handling, telephony API integration, call metadata retrieval, backend service separation and frontend operations. |
| **Stack** | **Python, LiveKit Agents, OpenAI Realtime API, aiosqlite, Go, PostgreSQL, Twilio API, React, TypeScript.** |
| **Portfolio scope** | Reviewed source excerpts and architecture notes; no client script, recorded calls, phone numbers, live credentials or production datasets. |

## Explore the actual source

| Area | Code | What to inspect |
| --- | --- | --- |
| Real-time voice runtime | [Voice agent](src/voice/agent.py) | LiveKit room connection, OpenAI Realtime session configuration, lifecycle callbacks and caller context |
| Telephony integration | [Call-history handler](src/backend/internal/handler/userhandler.go) | Twilio Calls API HTTP integration, request authentication to Twilio, record decoding and response shaping |
| Backend layers | [User service](src/backend/internal/service/userservice.go) · [Repository](src/backend/internal/repository/loginrepo.go) | Separating handler logic, database operations, hashed passwords and stored Twilio configuration |
| Service wiring | [Routes](src/backend/internal/routes/route.go) · [Go entrypoint](src/backend/cmd/main.go) | HTTP API setup and configuration from environment variables |
| Data contracts | [Request/response models](src/backend/internal/models/authmodel.go) · [Database adapter](src/backend/db/db.go) | Typed API boundary and PostgreSQL connection |
| Persistence | [Auth schema](src/backend/migrations/000001_auth_init.up.sql) · [Telephony config schema](src/backend/migrations/000002_twillio_cred.up.sql) | Basic application persistence |
| Call operations UI | [Call-history page](src/frontend/pages/CallHistory.tsx) · [Login](src/frontend/pages/login/Login.tsx) | Call lists, sorting, display formatting and administrative navigation |
| Frontend shell | [App routes](src/frontend/App.tsx) | Separating call-history and login screens |

[**Technical implementation and trade-offs →**](ENGINEERING_NOTES.md)

## Architecture at a glance

~~~mermaid
flowchart TD
    CALL["Caller / voice channel"] --> ROOM["LiveKit room + agent worker"]
    ROOM --> V["Python AgentSession + assistant lifecycle"]
    V <--> REALTIME["OpenAI Realtime model"]
    V -. "Local call-log helper available" .-> LOCAL[("SQLite helper")]
    OPS["Operator"] --> UI["React / TypeScript interface"]
    UI --> API["Go HTTP backend"]
    API --> DB[("PostgreSQL application data")]
    API --> TWILIO["Twilio Calls API"]
    TWILIO --> API
    API --> UI
~~~

The voice-session path and administrative call-history path are **separate integration paths in the code**. This diagram does not claim end-to-end automated synchronization between them.

## What I can walk through technically

1. **Voice session lifecycle:** Connecting to a LiveKit room, starting an OpenAI Realtime session, and handling entry/exit events and errors.
2. **Telephony operations:** Fetching call-history metadata through Twilio, handling HTTP errors, decoding results, and shaping API responses.
3. **Backend boundaries:** Go handler/service/repository separation and PostgreSQL-backed account/telephony metadata.
4. **Frontend operations:** Loading, sorting, displaying, and exporting call-history records in a React interface.
5. **Privacy and hardening:** Redacting caller data, separating secrets from code, and evaluating where a prototype needs stronger access controls before enterprise deployment.

## Scope, attribution and limitations

These are **source excerpts, not a runnable complete system**. The original agent's campaign-specific prompt and caller-number console output were redacted for the portfolio. The private instruction file, environment files, telephony credentials, recorded calls, production databases, local call history, and customer identity are excluded.

The original agent defines an asynchronous SQLite call-log helper; **this selected version does not demonstrate that it is invoked automatically at session end**. The Go login flow also uses a user identifier as a response token in the inspected code; it should **not** be advertised as a hardened JWT/session-security architecture. The portfolio is not a security audit or a claim of automated call-volume metrics.

**Voice technology attribution:** LiveKit and OpenAI provide the underlying real-time framework/model APIs. The original upstream LiveKit example is not presented as independently authored product work.

**Implementation:** Srijan Choudhary / SrijanAI Innovations.  
**Rights:** Application-specific source shared for technical portfolio review; no open-source license is granted for proprietary portions. Third-party libraries retain their own licenses.
