import { marked, type Token } from "marked";
import hljs from "highlight.js";
import katex from "katex";

const LANGUAGE_COLORS: Record<string, string> = {
  javascript: '#f7df1e',
  js: '#f7df1e',
  typescript: '#3178c6',
  ts: '#3178c6',
  python: '#3776ab',
  py: '#3776ab',
  java: '#007396',
  c: '#555555',
  cpp: '#00599c',
  'c++': '#00599c',
  csharp: '#239120',
  'c#': '#239120',
  cs: '#239120',
  go: '#00add8',
  rust: '#dea584',
  ruby: '#cc342d',
  php: '#777bb4',
  swift: '#f05138',
  kotlin: '#7f52ff',
  scala: '#dc322f',
  html: '#e34c26',
  css: '#1572b6',
  scss: '#c69',
  sass: '#c69',
  json: '#292929',
  xml: '#0060ac',
  yaml: '#cb171e',
  yml: '#cb171e',
  sql: '#336791',
  bash: '#4eaa25',
  shell: '#4eaa25',
  sh: '#4eaa25',
  powershell: '#5391fe',
  ps: '#5391fe',
  markdown: '#083fa1',
  md: '#083fa1',
  dockerfile: '#2496ed',
  docker: '#2496ed',
  makefile: '#427819',
  cmake: '#064f8c',
  r: '#198ce7',
  matlab: '#e63717',
  lua: '#000080',
  perl: '#39457e',
  haskell: '#5e5086',
  erlang: '#a90533',
  elixir: '#4e2a8e',
  clojure: '#5881d8',
  groovy: '#4298b8',
  fsharp: '#b845fc',
  vb: '#512bd4',
  'vb.net': '#512bd4',
  coffeescript: '#2f2625',
  livescript: '#499886',
  julia: '#9558b2',
  nim: '#ffc200',
  pascal: '#003355',
  delphi: '#003355',
  ada: '#02f88c',
  fortran: '#734f96',
  cobol: '#632ca0',
  lisp: '#3fb68b',
  scheme: '#1e4aec',
  racket: '#3c542c',
  ocaml: '#ef7a08',
  reason: '#dd4b39',
  elm: '#60b5cc',
  purescript: '#141d26',
  idris: '#b30000',
  agda: '#315665',
  verilog: '#b34b7a',
  vhdl: '#adb2cb',
  systemverilog: '#00b8e6',
  tcl: '#e4cc98',
  actionscript: '#ff2f2f',
  as3: '#ff2f2f',
  haxe: '#ea8220',
  as: '#ea8220',
  dart: '#0175c2',
  flutter: '#02569b',
  vue: '#4fc08d',
  svelte: '#ff3e00',
  angular: '#dd0031',
  react: '#61dafb',
  jsx: '#61dafb',
  tsx: '#61dafb',
  nextjs: '#000000',
  nuxt: '#00c58e',
  graphql: '#e535ab',
  graphqlconfig: '#e535ab',
  gql: '#e535ab',
  protobuf: '#4a5aa4',
  proto: '#4a5aa4',
  thrift: '#d6564f',
  avro: '#005e82',
  capnproto: '#c69',
  flatbuffers: '#6f4e37',
  msgpack: '#b35b00',
  toml: '#9c4221',
  ini: '#a52a2a',
  conf: '#a52a2a',
  dotenv: '#e5d599',
  env: '#e5d599',
  nginx: '#269539',
  apache: '#d22128',
  nginxconf: '#269539',
  vim: '#199f4b',
  vimscript: '#199f4b',
  emacs: '#7f5ab6',
  el: '#7f5ab6',
  terraform: '#7b42bc',
  hcl: '#7b42bc',
  puppet: '#302b6d',
  chef: '#e69800',
  ansible: '#ee0000',
  kubernetes: '#326ce5',
  k8s: '#326ce5',
  helm: '#168fce',
  prometheus: '#e6522c',
  grafana: '#f46800',
  jaeger: '#fca311',
  zipkin: '#9b59b6',
  istio: '#466bb0',
  envoy: '#0096d9',
  consul: '#ce4b2c',
  vault: '#ffc857',
  nomad: '#00bc8e',
  packer: '#02b8c2',
  vagrant: '#1868f2',
  boto: '#ff9900',
  aws: '#ff9900',
  azure: '#00bcf2',
  gcp: '#4285f4',
  digitalocean: '#0080ff',
  heroku: '#430098',
  vercel: '#000000',
  netlify: '#00c7b7',
  firebase: '#ffca28',
  supabase: '#3ecf8e',
  prisma: '#0c344b',
  drizzle: '#4f46e5',
  typeorm: '#f05138',
  sequelize: '#52b0e7',
  mongoose: '#880000',
  knex: '#ff4d4d',
  dex: '#4db6ac',
  graphqlyoga: '#e10098',
  apollo: '#311c87',
  rest: '#02569b',
  grpc: '#4285f4',
  websocket: '#010409',
  mqtt: '#660066',
  amqp: '#ff6600',
  kafka: '#000000',
  rabbitmq: '#ff6600',
  redis: '#dc382d',
  mongodb: '#47a248',
  postgresql: '#336791',
  mysql: '#4479a1',
  sqlite: '#003b57',
  oracle: '#f80000',
  mssql: '#cc2927',
  cassandra: '#1287b1',
  dynamodb: '#4053d3',
  elasticsearch: '#fec514',
  solr: '#d9411e',
  couchbase: '#ea2328',
  neo4j: '#008cc1',
  arangodb: '#d96137',
  influxdb: '#22adf6',
  timescale: '#f8b400',
  clickhouse: '#ffc1e3',
  presto: '#fb9e3b',
  spark: '#e25a1c',
  hadoop: '#66ccff',
  hive: '#fdee21',
  pig: '#f89820',
  flink: '#e6522c',
  beam: '#00a1e4',
  airflow: '#017cee',
  dagster: '#6f42c1',
  prefect: '#893dc8',
  dbt: '#ff694f',
  mlflow: '#0194e2',
  tensorboard: '#ff6f00',
  wandb: '#fcbf49',
  comet: '#cf397a',
  weightsbiases: '#fcbf49',
  tensor: '#ff6f00',
  torch: '#ee4c2c',
  pytorch: '#ee4c2c',
  tensorflow: '#ff6f00',
  keras: '#d00000',
  mxnet: '#d9e021',
  cntk: '#ff0000',
  caffe: '#0073c6',
  theano: '#0073c6',
  paddlepaddle: '#1a9d49',
  paddle: '#1a9d49',
  jax: '#7f52ff',
  flux: '#6c6cba',
  scikit: '#f7931e',
  sklearn: '#f7931e',
  pandas: '#150458',
  numpy: '#013243',
  scipy: '#8cbe8c',
  matplotlib: '#11557c',
  seaborn: '#1a81a8',
  plotly: '#3f4f75',
  altair: '#4682b4',
  bokeh: '#5d6b7d',
  ggplot2: '#a3b855',
  shiny: '#69b3a2',
  plotlyr: '#3f4f75',
  julia: '#9558b2',
  rmarkdown: '#198ce7',
  quarto: '#2f3c53',
  jupyter: '#f37626',
  ipython: '#ffbf00',
  zeppelin: '#ffffff',
  databricks: '#ff3621',
  polynote: '#ff6f00',
  beakerx: '#5cb85c',
  nteract: '#c9462d',
  hydro: '#4b2b58',
};

function getLanguageColor(lang: string): string {
  const normalized = lang.toLowerCase().replace(/[^a-z0-9+#.]/g, '');
  return LANGUAGE_COLORS[normalized] || '#8b5cf6';
}

function generateLineNumbers(code: string): string {
  const lines = code.split('\n');
  return lines.map((_, index) => {
    const lineNum = index + 1;
    const digits = lineNum.toString().length;
    const padding = ' '.repeat(Math.max(0, 3 - digits));
    return `${padding}${lineNum}`;
  }).join('\n');
}

function purify(dirty: string, options?: any): string {
  return dirty;
}

function setupMarkedRenderer() {
  const renderer = {
    code({ text, lang }: { text: string; lang?: string }) {
      const language = lang || 'text';
      const safeLanguage = language.toLowerCase().replace(/[^a-z0-9+-]/g, '');
      
      let highlighted = '';
      try {
        if (safeLanguage && hljs.getLanguage(safeLanguage)) {
          highlighted = hljs.highlight(text, { language: safeLanguage }).value;
        } else {
          highlighted = hljs.highlightAuto(text).value;
        }
      } catch (err) {
        highlighted = hljs.escapeHtml(text);
      }

      const lineNumbers = generateLineNumbers(text.trim());
      const languageColor = getLanguageColor(safeLanguage);

      const buttonHtml = `<button type="button" class="code-block-copy" onclick="copyCodeBlock(this)" aria-label="Copy code">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span class="copy-text">Copy</span>
      </button>`;

      return `<div class="code-block" data-language="${safeLanguage}">
        <div class="code-block-header">
          <span class="code-block-language">${safeLanguage}</span>
          ${buttonHtml}
        </div>
        <div class="code-block-content">
          <div class="code-block-linenums">${lineNumbers}</div>
          <pre><code class="hljs language-${safeLanguage}">${highlighted}</code></pre>
        </div>
      </div>`;
    },
    
    table(token: Token) {
      const rows: string[] = [];
      let html = `<div class="table-wrapper"><table class="markdown-table">`;
      
      if (token.header) {
        html += '<thead><tr>';
        for (const cell of token.header) {
          const align = cell.align ? ` style="text-align: ${cell.align}"` : '';
          html += `<th${align}>${marked.parse(cell.text)}</th>`;
        }
        html += '</tr></thead>';
      }
      
      if (token.rows) {
        html += '<tbody>';
        for (const row of token.rows) {
          html += '<tr>';
          for (const cell of row) {
            html += `<td>${marked.parse(cell.text)}</td>`;
          }
          html += '</tr>';
        }
        html += '</tbody>';
      }
      
      html += '</table></div>';
      return html;
    }
  };

  marked.use({ renderer });
}

setupMarkedRenderer();

function renderMath(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: true,
    });
  } catch (error) {
    console.error("KaTeX rendering error:", error);
    return `<span class="katex-error">${tex}</span>`;
  }
}

function parseLatex(markdown: string): { processed: string; mathBlocks: Map<string, { tex: string; displayMode: boolean }> } {
  const mathBlocks = new Map<string, { tex: string; displayMode: boolean }>();
  let processed = markdown;
  let blockIndex = 0;

  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, tex) => {
    const placeholder = `MATHBLOCK${blockIndex}PLACEHOLDER`;
    mathBlocks.set(placeholder, { tex: tex.trim(), displayMode: true });
    blockIndex++;
    return placeholder;
  });

  const inlineMathRegex = /\$([^\$\n]+?)\$/g;
  let match;
  while ((match = inlineMathRegex.exec(processed)) !== null) {
    const [fullMatch, tex] = match;
    const placeholder = `MATHINLINE${blockIndex}PLACEHOLDER`;
    mathBlocks.set(placeholder, { tex: tex.trim(), displayMode: false });
    processed = processed.replace(fullMatch, placeholder);
    blockIndex++;
    inlineMathRegex.lastIndex = 0;
  }

  return { processed, mathBlocks };
}

export async function parseMarkdown(markdown: string): Promise<string> {
  const { processed: markdownWithPlaceholders, mathBlocks } = parseLatex(markdown);
  
  const html = await marked.parse(markdownWithPlaceholders);
  
  let htmlWithMath = html;
  
  for (const [placeholder, mathData] of mathBlocks.entries()) {
    const mathHtml = renderMath(mathData.tex, mathData.displayMode);
    htmlWithMath = htmlWithMath.replace(placeholder, mathHtml);
  }
  
  const sanitized = purify(htmlWithMath, {
    ADD_TAGS: ['div', 'span', 'button', 'svg', 'path', 'rect', 'annotation', 'semantics', 'mrow', 'mtext', 'mspace', 'mtable', 'mtr', 'mtd', 'mi', 'mo', 'mn', 'msup', 'msub', 'msubsup', 'mfrac', 'msqrt', 'mroot', 'mstyle', 'munder', 'mover', 'munderover', 'mpadded', 'mphantom', 'ms', 'menclose', 'merror', 'math', 'msubsup', 'msqrt', 'mpadded'],
    ADD_ATTR: ['class', 'data-language', 'onclick', 'aria-label', 'xmlns', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'width', 'height', 'rx', 'ry', 'd', 'style', 'href', 'target', 'displaystyle', 'scriptlevel', 'depth', 'minsize', 'maxsize', 'notation', 'xmlns'],
    KEEP_CONTENT: true,
  });
  
  return sanitized;
}

export function createExcerpt(markdown: string, maxLength: number = 150): string {
  const plainText = markdown
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*|__/g, "")
    .replace(/\*|_/g, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/>\s/g, "")
    .replace(/[-*+]\s/g, "")
    .replace(/\n+/g, " ")
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.substring(0, maxLength).trim() + "...";
}

/**
 * Parses markdown for preview display with limited formatting.
 * Supports: bold, italic, links, inline code
 * Excludes: code blocks, tables, math, images, blockquotes, headers
 */
export function parseMarkdownPreview(markdown: string): string {
  if (!markdown) return "";
  
  let text = markdown
    // Remove code blocks (``` or ~~~)
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~[\s\S]*?~~~/g, "")
    // Remove math blocks ($$...$$)
    .replace(/\$\$[\s\S]*?\$\$/g, "")
    // Remove inline math ($...$) - be careful not to remove currency
    .replace(/\$([^\$\n]+?)\$/g, "$1")
    // Remove images ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    // Remove headers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove blockquotes
    .replace(/^>\s+/gm, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Remove list markers but keep content
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    // Normalize multiple newlines to single space
    .replace(/\n+/g, " ")
    .trim();

  // Now parse inline formatting
  // Bold: **text** or __text__
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  
  // Italic: *text* or _text_ (but not inside words for underscore)
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  text = text.replace(/(?<![a-zA-Z])_([^_]+)_(?![a-zA-Z])/g, "<em>$1</em>");
  
  // Strikethrough: ~~text~~
  text = text.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  
  // Inline code: `code`
  text = text.replace(/`([^`]+)`/g, '<code class="preview-inline-code">$1</code>');
  
  // Links: [text](url) - make them non-clickable in preview for cleaner look
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '<span class="preview-link">$1</span>');

  return text;
}
