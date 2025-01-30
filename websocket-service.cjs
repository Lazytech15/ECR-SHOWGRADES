// websocket-service.cjs
const WebSocket = require('ws');
const mysql = require('mysql2');

class WebSocketService {
  constructor(server, dbConfig) {
    // Initialize WebSocket server
    this.wss = new WebSocket.Server({ server });
    
    // Create MySQL connection pool
    this.pool = mysql.createPool(dbConfig).promise();
    
    // Track connected clients
    this.clients = new Set();
    
    // Initialize WebSocket server
    this.initializeWebSocket();
    
    // Initialize database triggers
    this.initializeDatabaseTriggers();
  }

  // Initialize WebSocket connection handling
  initializeWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('Client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  // Broadcast message to all connected clients
  broadcast(message) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Initialize database triggers
  async initializeDatabaseTriggers() {
    try {
      // Create changes_log table
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS changes_log (
          id INT AUTO_INCREMENT PRIMARY KEY,
          table_name VARCHAR(255),
          operation VARCHAR(50),
          record_id VARCHAR(255),
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create triggers for students table
      await this.createTableTriggers('students', 'student_id');
      
      // Create triggers for grades table
      await this.createTableTriggers('grades', 'id');

      // Start monitoring changes
      this.startChangeMonitoring();
    } catch (error) {
      console.error('Error initializing triggers:', error);
    }
  }

  // Create triggers for a specific table
  async createTableTriggers(tableName, idColumn) {
    try {
      // Insert trigger
      await this.pool.query(`
        DROP TRIGGER IF EXISTS ${tableName}_after_insert
      `);
      await this.pool.query(`
        CREATE TRIGGER ${tableName}_after_insert
        AFTER INSERT ON ${tableName}
        FOR EACH ROW
        BEGIN
          INSERT INTO changes_log (table_name, operation, record_id)
          VALUES ('${tableName}', 'INSERT', NEW.${idColumn});
        END
      `);

      // Update trigger
      await this.pool.query(`
        DROP TRIGGER IF EXISTS ${tableName}_after_update
      `);
      await this.pool.query(`
        CREATE TRIGGER ${tableName}_after_update
        AFTER UPDATE ON ${tableName}
        FOR EACH ROW
        BEGIN
          INSERT INTO changes_log (table_name, operation, record_id)
          VALUES ('${tableName}', 'UPDATE', NEW.${idColumn});
        END
      `);

      // Delete trigger
      await this.pool.query(`
        DROP TRIGGER IF EXISTS ${tableName}_after_delete
      `);
      await this.pool.query(`
        CREATE TRIGGER ${tableName}_after_delete
        AFTER DELETE ON ${tableName}
        FOR EACH ROW
        BEGIN
          INSERT INTO changes_log (table_name, operation, record_id)
          VALUES ('${tableName}', 'DELETE', OLD.${idColumn});
        END
      `);

      console.log(`Successfully created triggers for ${tableName}`);
    } catch (error) {
      console.error(`Error creating triggers for ${tableName}:`, error);
      throw error;
    }
  }

  // Monitor database changes
  async startChangeMonitoring() {
    let lastCheckedId = 0;

    // Check for changes every second
    setInterval(async () => {
      try {
        const [changes] = await this.pool.query(
          'SELECT * FROM changes_log WHERE id > ? ORDER BY id ASC',
          [lastCheckedId]
        );

        if (changes.length > 0) {
          lastCheckedId = changes[changes.length - 1].id;

          // Group changes by table and operation
          const groupedChanges = this.groupChanges(changes);
          
          // Broadcast changes to all connected clients
          this.broadcast({
            type: 'database_update',
            changes: groupedChanges
          });
        }
      } catch (error) {
        console.error('Error monitoring changes:', error);
      }
    }, 1000);
  }

  // Group changes by table and operation
  groupChanges(changes) {
    return changes.reduce((acc, change) => {
      const key = `${change.table_name}_${change.operation.toLowerCase()}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(change.record_id);
      return acc;
    }, {});
  }
}

module.exports = WebSocketService;