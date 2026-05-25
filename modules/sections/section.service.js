const db = require("../../config/db");

const createSection = async (data) => {
  const result = await db.query(
    `
    INSERT INTO sections (class_id, name)
    VALUES ($1, $2)
    RETURNING *
    `,
    [data.class_id, data.name]
  );

  return result.rows[0];
};

const getSections = async () => {
  const result = await db.query(`
    SELECT *
    FROM sections
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `);

  return result.rows;
};

const updateSection = async (id, data) => {
  const result = await db.query(
    `
    UPDATE sections
    SET 
    class_id = $1,
    name = $2, 
    updated_at = NOW()
    WHERE id = $3 AND deleted_at IS NULL
    RETURNING *
    `,
    [data.class_id, data.name, id]
  );
    return result.rows[0];
};
const deleteSection = async (id) => {
  const result = await db.query(
    `
    UPDATE sections
    SET deleted_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return result.rows[0];
};

module.exports = {
  createSection,
  getSections,
  updateSection,
  deleteSection,
};