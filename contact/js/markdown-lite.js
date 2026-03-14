/**
 * markdown-lite.js - Minimal markdown parser for policies
 * ~3KB instead of marked's 40KB
 * Only handles: headers, bold, lists, tables, hr, code, blockquotes, links
 */

const markdownLite = {
  parse(md) {
    if (!md) return '';
    
    // Split into blocks
    let html = '';
    let lines = md.split('\n');
    let i = 0;
    
    while (i < lines.length) {
      let line = lines[i];
      
      // Horizontal rule
      if (/^(-{3,}|={3,}|\*{3,})$/.test(line.trim())) {
        html += '<hr>';
        i++;
        continue;
      }
      
      // Headers
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = this.inline(headerMatch[2]);
        html += `<h${level}>${text}</h${level}>`;
        i++;
        continue;
      }
      
      // Tables
      if (line.includes('|')) {
        const tableStart = i;
        const tableLines = [];
        while (i < lines.length && lines[i].includes('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        if (tableLines.length >= 2) {
          html += this.table(tableLines);
          continue;
        } else {
          i = tableStart + 1;
          line = tableLines[0];
        }
      }
      
      // Lists (ul/ol)
      if (/^[\s]*[-*+]\s/.test(line) || /^[\s]*\d+\.\s/.test(line)) {
        const listStart = i;
        const listItems = [];
        const isOrdered = /^\d+\./.test(line.trim());
        
        while (i < lines.length) {
          const curr = lines[i];
          const itemMatch = isOrdered ? 
            curr.match(/^[\s]*\d+\.\s+(.+)$/) : 
            curr.match(/^[\s]*[-*+]\s+(.+)$/);
          if (!itemMatch) break;
          listItems.push(this.inline(itemMatch[1]));
          i++;
        }
        
        const tag = isOrdered ? 'ol' : 'ul';
        html += `<${tag}>${listItems.map(item => `<li>${item}</li>`).join('')}</${tag}>`;
        continue;
      }
      
      // Blockquotes
      if (/^>\s/.test(line)) {
        const quoteLines = [];
        while (i < lines.length && /^>\s/.test(lines[i])) {
          quoteLines.push(lines[i].replace(/^>\s*/, ''));
          i++;
        }
        const quoteText = this.inline(quoteLines.join('\n'));
        html += `<blockquote>${quoteText}</blockquote>`;
        continue;
      }
      
      // Code blocks
      if (line.trim().startsWith('```')) {
        const codeLines = [];
        i++; // skip opening ```
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing ```
        const code = codeLines.join('\n').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += `<pre><code>${code}</code></pre>`;
        continue;
      }
      
      // Paragraphs
      if (line.trim()) {
        html += `<p>${this.inline(line)}</p>`;
      }
      i++;
    }
    
    return html;
  },
  
  inline(text) {
    if (!text) return '';
    
    // Code spans
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // Bold **text** or __text__
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Italic *text* or _text_
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    text = text.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    return text;
  },
  
  table(tableLines) {
    const rows = tableLines.map(line => 
      line.split('|').map(cell => cell.trim()).filter(c => c)
    );
    
    if (rows.length < 2) return '';
    
    let html = '<table><thead><tr>';
    rows[0].forEach(cell => {
      html += `<th>${this.inline(cell)}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    for (let i = 2; i < rows.length; i++) {
      html += '<tr>';
      rows[i].forEach(cell => {
        html += `<td>${this.inline(cell)}</td>`;
      });
      html += '</tr>';
    }
    
    html += '</tbody></table>';
    return html;
  }
};

// Export for use
if (typeof window !== 'undefined') {
  window.marked = { parse: (md) => markdownLite.parse(md) };
}
