const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function migratePasswords() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'thezombie123',
    database: 'show_my_grades'
  });

  try {
    // Fetch all users
    const [users] = await connection.execute('SELECT id, email, password FROM users');

    for (const user of users) {
      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Update the user's password with the bcrypt hash
      await connection.execute(
        'UPDATE users SET password = ? WHERE id = ?', 
        [hashedPassword, user.id]
      );

      console.log(`Migrated password for ${user.email}`);
    }

    console.log('Password migration complete');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await connection.end();
  }
}

migratePasswords();