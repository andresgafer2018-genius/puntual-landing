{
  "name": "puntual-outreach",
  "version": "1.0.0",
  "description": "Script de outreach automatico para Puntual",
  "main": "outreach.js",
  "scripts": {
    "buscar": "node outreach.js buscar",
    "enviar": "node outreach.js enviar",
    "estado": "node outreach.js estado"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "axios": "^1.7.0",
    "cheerio": "^1.0.0",
    "dotenv": "^16.4.0",
    "nodemailer": "^6.9.0"
  }
}
