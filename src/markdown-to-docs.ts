import { marked } from 'marked';
import { docs_v1 } from 'googleapis';

export class MarkdownToDocsConverter {
  private requests: Record<string, unknown>[] = [];
  private currentIndex = 1; // Start at index 1 (after document start)

  async convertMarkdownToGoogleDocs(markdown: string): Promise<Record<string, unknown>[]> {
    this.requests = [];
    this.currentIndex = 1;

    // Parse markdown into tokens
    const tokens = marked.lexer(markdown);
    
    // Process each token
    for (const token of tokens) {
      await this.processToken(token);
    }

    return this.requests;
  }

  private async processToken(token: any): Promise<void> {
    switch (token.type) {
      case 'heading':
        await this.addHeading(token.text, token.depth);
        break;
      case 'paragraph':
        await this.addParagraph(token.text);
        break;
      case 'list':
        await this.addList(token);
        break;
      case 'table':
        await this.addTable(token);
        break;
      case 'blockquote':
        await this.addBlockquote(token.text);
        break;
      case 'code':
        await this.addCodeBlock(token.text);
        break;
      case 'hr':
        await this.addHorizontalRule();
        break;
      default:
        // Handle other token types or skip
        break;
    }
  }

  private async addHeading(text: string, level: number): Promise<void> {
    // Insert the heading text
    const cleanText = this.stripMarkdown(text);
    this.requests.push({
      insertText: {
        location: { index: this.currentIndex },
        text: cleanText + '\n'
      }
    });

    // Style as heading
    const namedStyle = this.getHeadingStyle(level);
    this.requests.push({
      updateParagraphStyle: {
        range: {
          startIndex: this.currentIndex,
          endIndex: this.currentIndex + cleanText.length
        },
        paragraphStyle: {
          namedStyleType: namedStyle
        },
        fields: 'namedStyleType'
      }
    });

    this.currentIndex += cleanText.length + 1; // +1 for newline
  }

  private async addParagraph(text: string): Promise<void> {
    const processedText = await this.processInlineFormatting(text);
    this.requests.push({
      insertText: {
        location: { index: this.currentIndex },
        text: processedText + '\n\n'
      }
    });

    this.currentIndex += processedText.length + 2; // +2 for double newline
  }

  private async addList(listToken: any): Promise<void> {
    for (const item of listToken.items) {
      const bullet = listToken.ordered ? `${listToken.start || 1}. ` : '• ';
      const text = this.stripMarkdown(item.text);
      
      this.requests.push({
        insertText: {
          location: { index: this.currentIndex },
          text: bullet + text + '\n'
        }
      });

      this.currentIndex += bullet.length + text.length + 1;
    }
    
    // Add extra line after list
    this.requests.push({
      insertText: {
        location: { index: this.currentIndex },
        text: '\n'
      }
    });
    this.currentIndex += 1;
  }

  private async addTable(tableToken: any): Promise<void> {
    // Simple table representation - Google Docs API table creation is complex
    // For now, we'll render as formatted text
    const header = tableToken.header.map((cell: any) => this.stripMarkdown(cell.text)).join(' | ');
    const separator = '─'.repeat(header.length);
    
    this.requests.push({
      insertText: {
        location: { index: this.currentIndex },
        text: header + '\n' + separator + '\n'
      }
    });
    this.currentIndex += header.length + separator.length + 2;

    for (const row of tableToken.rows) {
      const rowText = row.map((cell: any) => this.stripMarkdown(cell.text)).join(' | ');
      this.requests.push({
        insertText: {
          location: { index: this.currentIndex },
          text: rowText + '\n'
        }
      });
      this.currentIndex += rowText.length + 1;
    }

    // Add extra line after table
    this.requests.push({
      insertText: {
        location: { index: this.currentIndex },
        text: '\n'
      }
    });
    this.currentIndex += 1;
  }

  private async addBlockquote(text: string): Promise<void> {
    const cleanText = this.stripMarkdown(text);
    const quotedText = '> ' + cleanText.replace(/\n/g, '\n> ');
    
    this.requests.push({
      insertText: {
        location: { index: this.currentIndex },
        text: quotedText + '\n\n'
      }
    });

    // Style as italic for blockquotes
    this.requests.push({
      updateTextStyle: {
        range: {
          startIndex: this.currentIndex,
          endIndex: this.currentIndex + quotedText.length
        },
        textStyle: { italic: true },
        fields: 'italic'
      }
    });

    this.currentIndex += quotedText.length + 2;
  }

  private async addCodeBlock(code: string): Promise<void> {
    this.requests.push({
      insertText: {
        location: { index: this.currentIndex },
        text: code + '\n\n'
      }
    });

    // Style as monospace
    this.requests.push({
      updateTextStyle: {
        range: {
          startIndex: this.currentIndex,
          endIndex: this.currentIndex + code.length
        },
        textStyle: {
          weightedFontFamily: { fontFamily: 'Courier New' }
        },
        fields: 'weightedFontFamily'
      }
    });

    this.currentIndex += code.length + 2;
  }

  private async addHorizontalRule(): Promise<void> {
    const rule = '─'.repeat(50);
    this.requests.push({
      insertText: {
        location: { index: this.currentIndex },
        text: rule + '\n\n'
      }
    });
    this.currentIndex += rule.length + 2;
  }

  private async processInlineFormatting(text: string): Promise<string> {
    // For now, just strip markdown - inline formatting would require 
    // more complex parsing and multiple requests
    return this.stripMarkdown(text);
  }

  private stripMarkdown(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // bold
      .replace(/\*(.*?)\*/g, '$1') // italic
      .replace(/`(.*?)`/g, '$1') // code
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
      .replace(/!\[(.*?)\]\(.*?\)/g, '$1') // images
      .replace(/#{1,6}\s*/g, '') // headings
      .replace(/>/g, '') // blockquotes
      .trim();
  }

  private getHeadingStyle(level: number): string {
    switch (level) {
      case 1: return 'HEADING_1';
      case 2: return 'HEADING_2';
      case 3: return 'HEADING_3';
      case 4: return 'HEADING_4';
      case 5: return 'HEADING_5';
      case 6: return 'HEADING_6';
      default: return 'HEADING_1';
    }
  }
}

export function createMarkdownConverter(): MarkdownToDocsConverter {
  return new MarkdownToDocsConverter();
}