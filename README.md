# User Activity Logging Dashboard

A comprehensive, full-stack monitoring and analytics platform engineered to track, store, and visualize real-time user telemetry and system events. Designed for performance and scalability, featuring automated data retention and advanced aggregation analytics.

---

## Key Features

* **Real-Time Event Tracking:** Capture and stream user actions, navigation milestones, and system events seamlessly.
* **Automated Data Lifecycle Management:** Utilizes MongoDB TTL (Time-To-Live) indexing to automatically purge logs older than 30 days, keeping database storage optimized.
* **Advanced Aggregation Analytics:** Leverages MongoDB Aggregation Pipelines to compute high-performance usage statistics, active session metrics, and trend lines directly at the database level.
* **Interactive Visualizations:** Dynamic charts built with Chart.js displaying usage distributions, category breakdowns, and activity volume over time.
* **Flexible Filtering & Search:** Filter activity logs instantly by date range, user ID, category, or specific action types.
* **Export & Reporting:** Export filtered activity data into CSV formats for offline auditing and compliance reviews.

---

## Tech Stack

* **Frontend:** React.js, Chart.js, Tailwind CSS, Axios
* **Backend:** Node.js, Express.js
* **Database:** MongoDB, Mongoose (with Aggregation Pipelines & TTL Indexing)

---

## Architecture & Core Implementation Details

### 1. Log Storage & TTL Indexing
To prevent unchecked database bloat, the MongoDB schema applies a TTL index on the `createdAt` timestamp field. Documents older than 30 days are automatically removed by MongoDB's background index thread without requiring manual cron jobs.

### 2. Aggregation Pipelines
Instead of fetching raw logs into application memory for calculation, heavy computations—such as daily active counts, action frequencies, and category distributions—are processed directly inside MongoDB using optimized aggregation stages (`$match`, `$group`, `$sort`).

---

## Getting Started

### Prerequisites
* Node.js (v18+ recommended)
* MongoDB Atlas cluster or local MongoDB instance

### Installation & Local Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/latifahTech/user-activity-logging.git](https://github.com/latifahTech/user-activity-logging.git)
   cd user-activity-dashboard