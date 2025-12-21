import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';
import { initDatabase } from './db/index.js';
import boardRoutes from './routes/board.js';
import columnsRoutes from './routes/columns.js';
import cardsRoutes from './routes/cards.js';
import membersRoutes from './routes/members.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/board', boardRoutes);
app.use('/api/columns', columnsRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/members', membersRoutes);

// Export endpoint
app.get('/api/export', (req, res) => {
    res.redirect('/api/board/export');
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Swagger UI - Load OpenAPI spec
try {
    // Try multiple possible paths (Docker and local development)
    const possiblePaths = [
        join(__dirname, '../../openapi.yaml'),  // Docker: /app/backend/src -> /app/openapi.yaml
        join(__dirname, '../../../openapi.yaml'), // Local: backend/src -> openapi.yaml
        join(process.cwd(), 'openapi.yaml'),    // Current working directory
        '/app/openapi.yaml'                      // Absolute Docker path
    ];
    
    let openApiFile = null;
    let openApiPath = null;
    
    for (const path of possiblePaths) {
        try {
            openApiFile = readFileSync(path, 'utf8');
            openApiPath = path;
            break;
        } catch (err) {
            // Try next path
            continue;
        }
    }
    
    if (!openApiFile) {
        throw new Error(`Could not find openapi.yaml in any of: ${possiblePaths.join(', ')}`);
    }
    
    const openApiSpec = yaml.load(openApiFile);
    
    // Serve Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Family Kanban Board API Documentation'
    }));
    
    console.log(`   API Docs: http://localhost:${PORT}/api-docs (loaded from ${openApiPath})`);
} catch (error) {
    console.warn('⚠️  Could not load OpenAPI spec for Swagger UI:', error.message);
}

// Serve static frontend files
app.use(express.static(join(__dirname, '../../frontend/dist')));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(join(__dirname, '../../frontend/dist/index.html'));
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// Initialize database and start server
try {
    initDatabase();
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🎯 Kanban server running on http://0.0.0.0:${PORT}`);
        console.log(`   Health check: http://localhost:${PORT}/health`);
    });
} catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
}

