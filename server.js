const express = require("express");
const pg = require("pg");

const { Client } = pg;
const client = new Client({
  user: "postgres",
  password: "ol121632",
  host: "localhost",
  port: 5432,
  database: "example",
});
const server = express();
const PORT = 3000;

server.use(express.json());

server.get("/", (req, res) => {
  res.send("Hello World!");
});

server.get("/api/employees", async (req, res) => {
  try {
    const result = await client.query(`
      SELECT employee.*, department.name AS department_name
      FROM employee
      JOIN department ON employee.department_id = department.id
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
server.get("/api/department", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM department");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

client
  .connect()
  .then(() => {
    console.log("Connected to the database");
    server.listen(PORT, () => {
      console.log(`Server is listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });

server.post("/api/employees", async (req, res) => {
  const { name, department_id } = req.body;

  try {
    const result = await client.query(
      `INSERT INTO employee (name, created_at, updated_at, department_id)
         VALUES ($1, NOW(), NOW(), $2)
         RETURNING *`,
      [name, department_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

server.put("/api/employees/:id", async (req, res) => {
  const { name, department_id } = req.body;
  const { id } = req.params;

  try {
    const result = await client.query(
      `UPDATE employee SET name = $1, department_id = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [name, department_id, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

server.delete("/api/employees/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await client.query("DELETE FROM employee WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
