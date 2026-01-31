# HackathonOS

> **Turn hackathon deadlines into execution plans.**

HackathonOS is an intelligent system that discovers upcoming hackathons and automatically converts their timelines into structured, calendar-aware work schedules.

Instead of just tracking events, HackathonOS actively helps you **plan, execute, and submit**.

---

## Why HackathonOS?

Hackathons are high-leverage learning environments, but most participants fail to submit due to poor planning.

Common problems:

* Hackathons are fragmented across platforms
* Deadlines are easy to miss
* Calendars are passive and deadline-unaware
* Time planning is unrealistic

**HackathonOS treats time as a first-class resource.**

---

## Core Features

* **Hackathon Aggregation**
  Discover hackathons from multiple platforms in one place.

* **Intelligent Scheduling**
  Automatically converts hackathon deadlines into prep, build, and submission phases.

* **Calendar Integration**
  Syncs schedules directly to Google Calendar or exports ICS files.

* **Rule-Based Planning (MVP)**
  Availability-aware scheduling with realistic buffers.

* **User-Owned Calendar Data**
  HackathonOS never stores full calendar data — only references.

---

## System Overview

```
Hackathon Sources
(API / Scrapers)
        ↓
Hackathon Aggregator
        ↓
PostgreSQL (Source of Truth)
        ↓
User Selection
        ↓
Scheduling Engine
        ↓
Calendar Integration
(Google Calendar / ICS)
```

---

## Scheduling Logic (MVP)

1. Calculate total available hours until the hackathon deadline
2. Allocate time:

   * 30% → preparation & ideation
   * 60% → building & iteration
   * 10% → testing & submission buffer
3. Automatically block calendar slots
4. Add deadline reminders

---

## Data Architecture

### Primary Storage – PostgreSQL

Stores all persistent and authoritative data:

* Hackathon metadata
* User profiles and preferences
* Availability rules
* Generated schedules
* Calendar event references

### Cache Layer – Redis

Used for:

* Hackathon feed caching
* Rate-limiting and scraping protection
* Scheduler intermediate state

### Calendar Systems

* Google Calendar API (primary)
* `.ics` export (fallback)

Calendar data remains **fully owned by the user**.

---

## Tech Stack

### Backend

* FastAPI / Node.js
* PostgreSQL
* Redis
* Cron-based ingestion jobs

### Frontend

* React / Next.js
* Timeline-centric dashboard

### Integrations

* Google Calendar API
* ICS export

### Intelligence Layer (Planned)

* LLM-assisted scheduling
* Theme-based idea suggestions
* Automatic rescheduling

---

## Project Status

**MVP in development**

Current focus:

* Hackathon ingestion & normalization
* Rule-based scheduling engine
* Calendar sync

---

## Roadmap

* [ ] Hackathon aggregation (Devpost, MLH, Unstop, etc.)
* [ ] User availability & preferences
* [ ] Rule-based scheduling
* [ ] Google Calendar integration
* [ ] ICS export
* [ ] Conflict detection
* [ ] AI-assisted planning

---

## Philosophy

> Deadlines don’t fail people.
> **Planning does.**

HackathonOS exists to close the gap between intention and execution.

---

## Contributing

Contributions are welcome.

If you’re interested in:

* scheduling algorithms
* scraping systems
* calendar APIs
* intelligent agents

open an issue or submit a PR.

---

## License

MIT License

---

## Author

Built by developers who want to **finish what they start**.

---
