# Portfolio edition: client-specific greeting and caller-number logging redacted.
import os
from dotenv import load_dotenv
import asyncio
from datetime import datetime
import aiosqlite
from pathlib import Path

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions
from livekit.plugins import openai

# Load .env
load_dotenv()


# ====== DATABASE FUNCTIONS ======

DB_PATH = "calls.db"

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS call_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                caller_number TEXT,
                direction TEXT,
                call_time TEXT
            );
        """)
        await db.commit()

async def log_call(caller_number, direction, call_time):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO call_logs (caller_number, direction, call_time)
            VALUES (?, ?, ?);
        """, (caller_number, direction, call_time))
        await db.commit()


# ====== VOICE AGENT CLASS ======

class Assistant(Agent):
    def __init__(self) -> None:
        instructions_path = Path(__file__).with_name("sys_inst.txt")
        system_instructions = instructions_path.read_text(encoding="utf-8")
        super().__init__(instructions=system_instructions)
        self.room_name = None
        self.call_log = None



    async def on_enter(self):
        print("🎭 Agent entered session - generating greeting...")

        caller_number = self.room_name.split('_')[1] if '_' in self.room_name else "unknown"
        call_start_time = datetime.utcnow()

        self.call_log = {
            "caller_number": caller_number,
            "direction": "incoming",
            "call_time": call_start_time.isoformat()
        }

        print("Incoming call received")
        print(f"🕒 Time: {call_start_time.isoformat()}")

        try:
            self.session.generate_reply(
                instructions="""Greet the caller warmly and offer general assistance. Client-specific sales instructions are omitted from this portfolio edition."""
            )
            print("✅ Greeting initiated successfully!")
        except Exception as e:
            print(f"⚠️ Greeting error: {e}")
            
    async def on_exit(self):
        print("🔚 Agent exiting session - logging call...")
        if self.call_log:
            print("Call session ended; sensitive caller details are not printed in this portfolio edition")
        else:
            print("⚠️ No call log found.")

# ====== ENTRYPOINT ======

async def entrypoint(ctx: agents.JobContext):
    try:
        print("📞 Agent triggered")
        print(f"ctx.room = {ctx.room}")

        try:    
            print("🔄 Connecting to room...")
            await ctx.connect()
            print("🔗 Connected to room")
        except Exception as e:
            print("❌ Error in connect():", e)
            return

        session = AgentSession(
            llm=openai.realtime.RealtimeModel(
                voice="coral",
                temperature=0.7,
                model="gpt-4o-realtime-preview",
                api_key=os.getenv("OPENAI_API_KEY"),
            )
        )

        # Create assistant instance and pass room name for caller parsing
        assistant = Assistant()
        assistant.room_name = ctx.room.name

        try:
            print("🔄 Starting session...")
            await session.start(
                room=ctx.room,
                agent=assistant,
                room_input_options=RoomInputOptions(),
            )

            print("✅ Session started successfully!")
        except Exception as e:
            print("❌ Error in start():", e)

    except Exception as e:
        print("❌ Error in entrypoint():", e)
        import traceback
        traceback.print_exc()


# ====== RUN APP ======

if __name__ == "__main__":
    # Initialize the database first
    asyncio.run(init_db())
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint, agent_name="my-voice-agent"))
