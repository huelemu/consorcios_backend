import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export function setupSwagger(app) {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Consorcios API',
        version: '1.0.0',
        description: 'API Backend para gestión de Consorcios y Unidades Funcionales'
      },
      servers: [
        { url: 'http://localhost:7000', description: 'Servidor local' }
      ]
    },
    apis: ['./src/routes/*.js']
  };

  const specs = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  console.log('📘 Swagger UI disponible en http://localhost:7000/api-docs');
}
