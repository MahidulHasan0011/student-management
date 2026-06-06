students.routes.js   → URL define করে
        ↓
students.controller.js → request handle করে
        ↓
students.service.js → business logic
        ↓
students.repository.js → DB query


👉 Service কখনো DB query লিখবে না
👉 Service শুধু Repository call করবে

Controller → Service → Repository → DB
Service → transaction control (BEGIN/COMMIT/ROLLBACK)