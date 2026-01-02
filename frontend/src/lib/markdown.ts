import { marked, type Token } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js";

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

      const buttonHtml = `<button class="code-block-copy" onclick="copyCodeBlock(this)" aria-label="Copy code">
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
        <pre><code class="hljs language-${safeLanguage}">${highlighted}</code></pre>
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

export async function parseMarkdown(markdown: string): Promise<string> {
  const html = await marked.parse(markdown);
  
  const sanitized = DOMPurify.sanitize(html, {
    ADD_TAGS: ['div', 'span', 'button', 'svg', 'path', 'rect'],
    ADD_ATTR: ['class', 'data-language', 'onclick', 'aria-label', 'xmlns', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'width', 'height', 'rx', 'ry', 'd', 'style', 'href', 'target'],
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
