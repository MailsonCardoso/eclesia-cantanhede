import fs from 'fs';
import path from 'path';
import server from './.output/server/index.mjs';

const routes = [
  '/',
  '/agenda-eventos',
  '/agenda-pastoral',
  '/analise-financeira',
  '/congregacoes',
  '/contribuicoes',
  '/departamentos',
  '/financeiro',
  '/inventario',
  '/membros',
  '/relatorio-membros',
];

const fallbackScript = `
<script>
  // Fallback de seguranca para TanStack Start em hospedagem estatica
  (function() {
    window.$R = window.$R || {};
    window.$R["tsr"] = window.$R["tsr"] || [];
    if (!window.$_TSR) {
      window.$_TSR = {
        h: function() { this.hydrated = true; },
        e: function() { this.streamEnded = true; },
        c: function() {},
        p: function(fn) { this.initialized ? fn() : this.buffer.push(fn); },
        buffer: [],
        router: {
          manifest: { routes: {} },
          matches: []
        }
      };
    } else {
      // Garante que router e matches sempre existam caso o SSR nao popule
      window.$_TSR.router = window.$_TSR.router || { manifest: { routes: {} }, matches: [] };
      window.$_TSR.buffer = window.$_TSR.buffer || [];
    }
  })();
</script>
`;

async function buildStaticDist() {
  console.log('--- Iniciando geracao de dist/ estatico completo ---');
  
  // 1. Limpar e copiar assets estaticos de .output/public para dist/
  if (fs.existsSync('dist/assets')) {
    fs.rmSync('dist/assets', { recursive: true, force: true });
  }
  if (fs.existsSync('.output/public')) {
    fs.cpSync('.output/public', 'dist', { recursive: true });
    console.log('✓ Arquivos publicos copiados de .output/public para dist/');
  }

  const env = { ASSETS: { fetch: () => new Response('not found', { status: 404 }) } };
  const ctx = { waitUntil: () => {} };

  // 2. Pre-renderizar cada rota
  for (const route of routes) {
    try {
      const url = 'http://localhost:3000' + route;
      const res = await server.fetch(new Request(url), env, ctx);
      let html = await res.text();

      // Injeta o fallback seguro no <head>
      if (html.includes('</head>')) {
        html = html.replace('</head>', fallbackScript + '</head>');
      }

      if (route === '/') {
        fs.writeFileSync(path.join('dist', 'index.html'), html, 'utf8');
        console.log(`✓ Rota [${route}] salva em dist/index.html (${html.length} bytes)`);
      } else {
        const routeDir = path.join('dist', route.replace(/^\//, ''));
        fs.mkdirSync(routeDir, { recursive: true });
        fs.writeFileSync(path.join(routeDir, 'index.html'), html, 'utf8');
        console.log(`✓ Rota [${route}] salva em dist/${route.replace(/^\//, '')}/index.html (${html.length} bytes)`);
      }
    } catch (err) {
      console.error(`Erro ao gerar rota ${route}:`, err);
    }
  }

  // 3. Criar .htaccess completo para Apache / cPanel / LiteSpeed
  const htaccessContent = `# ====================================================================
# EcclesiaPro - Configuracao Apache / cPanel / LiteSpeed
# ====================================================================

# Desativa listagem de diretorios (evita 403 Forbidden em pastas)
Options -Indexes

# Define index.html como documento padrao
DirectoryIndex index.html

# Garante tipos MIME corretos para modulos JavaScript e CSS
<IfModule mod_mime.c>
  AddType application/javascript .js .mjs
  AddType text/css .css
  AddType image/svg+xml .svg
  AddType application/json .json
  AddType font/woff2 .woff2
</IfModule>

# Habilita compressao Gzip / Deflate
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json image/svg+xml
</IfModule>

# Roteamento SPA / HTML5 History API
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Permite carregar arquivos ou diretorios fisicos existentes
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Redireciona qualquer rota dinamica para index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Headers de CORS e seguranca
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
  Header set X-Content-Type-Options "nosniff"
</IfModule>
`;

  fs.writeFileSync(path.join('dist', '.htaccess'), htaccessContent, 'utf8');
  console.log('✓ Arquivo dist/.htaccess gerado com sucesso!');

  console.log('--- Build estatico de dist finalizado com sucesso! ---');
}

buildStaticDist().catch(console.error);
