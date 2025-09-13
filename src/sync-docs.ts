import { GoogleDocsClient, createGoogleDocsClient } from '@tetrateio/scully-clients';
import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';
import { createMarkdownConverter } from './markdown-to-docs.js';

interface Config {
  googleDrive: {
    folderId: string;
  };
  sync: {
    contentPath: string;
    extensions: string[];
    ignorePatterns: string[];
  };
}

interface MarkdownFile {
  path: string;
  content: string;
  frontmatter: {
    doc?: string;
    title?: string;
    [key: string]: any;
  };
}

interface SyncReport {
  timestamp: string;
  summary: {
    totalMarkdownFiles: number;
    successfulSyncs: number;
    failedSyncs: number;
    documentsNeedingCreation: number;
    documentsUpdated: number;
  };
  actions: SyncAction[];
  documentsToCreate: DocumentToCreate[];
  errors: SyncError[];
}

interface SyncAction {
  type: 'update' | 'skip' | 'init';
  file?: string;
  document?: string;
  status: 'success' | 'failed' | 'skipped';
  message: string;
  timestamp: string;
}

interface DocumentToCreate {
  markdownFile: string;
  suggestedTitle: string;
  suggestedFileName: string;
  content: string;
  instructions: string;
}

interface SyncError {
  file: string;
  error: string;
  timestamp: string;
}

class DocSynchronizer {
  private docsClient: GoogleDocsClient;
  private config: Config;
  private report: SyncReport;

  constructor(config: Config) {
    this.config = config;
    
    if (!process.env.SCULLY_CONFIG_PASSWORD) {
      throw new Error('SCULLY_CONFIG_PASSWORD environment variable is required but not set');
    }
    
    this.docsClient = createGoogleDocsClient();
    this.report = this.initializeReport();
  }

  private initializeReport(): SyncReport {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalMarkdownFiles: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        documentsNeedingCreation: 0,
        documentsUpdated: 0
      },
      actions: [],
      documentsToCreate: [],
      errors: []
    };
  }

  async syncMarkdownFiles(): Promise<void> {
    try {
      this.logAction('init', '', '', 'success', 'Successfully initialized Google Docs client');
      
      const markdownFiles = await this.findMarkdownFiles();
      this.report.summary.totalMarkdownFiles = markdownFiles.length;
      
      console.log(`Found ${markdownFiles.length} markdown files to sync`);
      
      for (const file of markdownFiles) {
        try {
          await this.syncFile(file);
        } catch (error) {
          console.error(`✗ Failed to sync ${file.path}:`, error);
          this.report.errors.push({
            file: file.path,
            error: String(error),
            timestamp: new Date().toISOString()
          });
          this.report.summary.failedSyncs++;
        }
      }

      await this.saveReport();
    } catch (error) {
      this.logAction('init', '', '', 'failed', `Failed to initialize: ${error}`);
      throw error;
    }
  }

  private async findMarkdownFiles(): Promise<MarkdownFile[]> {
    const patterns = this.config.sync.extensions.map(ext => 
      path.join(this.config.sync.contentPath, '**', `*${ext}`)
    );
    
    let allFiles: string[] = [];
    for (const pattern of patterns) {
      const files = await glob(pattern, {
        ignore: this.config.sync.ignorePatterns,
      });
      allFiles = [...allFiles, ...files];
    }
    
    
    const markdownFiles: MarkdownFile[] = [];
    
    for (const filePath of allFiles) {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = matter(content);
      
      markdownFiles.push({
        path: filePath,
        content: parsed.content,
        frontmatter: parsed.data,
      });
    }
    
    return markdownFiles;
  }

  private async syncFile(file: MarkdownFile): Promise<void> {
    if (file.frontmatter.doc) {
      const docId = this.extractDocId(file.frontmatter.doc);
      await this.updateExistingDoc(docId, file);
      console.log(`✓ Updated existing doc: ${file.path}`);
      this.report.summary.documentsUpdated++;
      this.report.summary.successfulSyncs++;
      this.logAction('update', file.path, docId, 'success', `Updated existing Google Doc ${docId}`);
    } else {
      await this.recordDocumentToCreate(file);
      console.log(`⚠ Document needs to be created for: ${file.path}`);
      this.report.summary.documentsNeedingCreation++;
      this.logAction('skip', file.path, '', 'skipped', 'No Google Doc linked - needs manual creation');
    }
  }

  private extractDocId(docUrl: string): string {
    const match = docUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error(`Invalid Google Doc URL: ${docUrl}`);
    }
    return match[1];
  }

  private async recordDocumentToCreate(file: MarkdownFile): Promise<void> {
    const title = file.frontmatter.title || path.basename(file.path, path.extname(file.path));
    const suggestedFileName = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const metadataTable = this.createMetadataTable(file);
    const fullContent = `${metadataTable}\n\n${file.content}`;
    
    this.report.documentsToCreate.push({
      markdownFile: file.path,
      suggestedTitle: title,
      suggestedFileName: suggestedFileName,
      content: fullContent,
      instructions: `
1. Create a new Google Doc in the folder with ID: ${this.config.googleDrive.folderId}
2. Title the document: "${title}"
3. Copy the content provided into the document
4. Get the document ID from the URL (it's the part after /d/ and before /edit)
5. Update the markdown file's frontmatter with: doc: "https://docs.google.com/document/d/[DOCUMENT_ID]/edit"
`
    });
  }

  private async updateExistingDoc(docId: string, file: MarkdownFile): Promise<void> {
    try {
      const doc = await this.docsClient.getDocument({ documentId: docId });
      
      const metadataTable = this.createMetadataTable(file);
      const fullMarkdown = `${metadataTable}\n\n${file.content}`;
      
      const currentContent = this.extractTextFromDoc(doc);
      
      // Clear existing content first
      if (currentContent.trim()) {
        await this.docsClient.replaceText(docId, currentContent.trim(), '');
      }
      
      // Convert markdown to Google Docs requests
      const converter = createMarkdownConverter();
      const requests = await converter.convertMarkdownToGoogleDocs(fullMarkdown);
      
      if (requests.length > 0) {
        // Use batchUpdate to apply all formatting requests
        await this.docsClient.batchUpdate(docId, requests);
      } else {
        // Fallback to plain text if conversion fails
        await this.docsClient.insertText(docId, fullMarkdown, 1);
      }
    } catch (error) {
      throw new Error(`Failed to update document ${docId}: ${error}`);
    }
  }

  private createMetadataTable(file: MarkdownFile): string {
    const now = new Date().toISOString();
    const relativePath = path.relative(process.cwd(), file.path);
    
    const table = `| Metadata | Value |
|----------|--------|
| Last Updated | ${now} |
| Source Path | ${relativePath} |
| Title | ${file.frontmatter.title || 'Untitled'} |
| Status | ${file.frontmatter.status || 'Draft'} |`;
    
    return table;
  }

  private extractTextFromDoc(doc: any): string {
    let text = '';
    
    if (doc.body?.content) {
      for (const element of doc.body.content) {
        if (element.paragraph?.elements) {
          for (const textRun of element.paragraph.elements) {
            if (textRun.textRun?.content) {
              text += textRun.textRun.content;
            }
          }
        }
      }
    }
    
    return text;
  }

  private logAction(type: 'update' | 'skip' | 'init', file: string, document: string, status: 'success' | 'failed' | 'skipped', message: string): void {
    this.report.actions.push({
      type,
      file,
      document,
      status,
      message,
      timestamp: new Date().toISOString()
    });
  }

  private async saveReport(): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'sync-reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    const reportPath = path.join(reportsDir, `sync-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    const readableReportPath = path.join(reportsDir, 'latest-sync-report.md');
    
    await fs.writeFile(reportPath, JSON.stringify(this.report, null, 2));
    
    const readableReport = this.generateReadableReport();
    await fs.writeFile(readableReportPath, readableReport);
    
    console.log(`\n📊 Sync report saved to:`);
    console.log(`   - JSON: ${reportPath}`);
    console.log(`   - Markdown: ${readableReportPath}`);
  }

  private generateReadableReport(): string {
    let report = `# Sync Report\n\n`;
    report += `**Generated:** ${this.report.timestamp}\n\n`;
    
    report += `## Summary\n\n`;
    report += `- **Total Markdown Files:** ${this.report.summary.totalMarkdownFiles}\n`;
    report += `- **Successful Syncs:** ${this.report.summary.successfulSyncs}\n`;
    report += `- **Failed Syncs:** ${this.report.summary.failedSyncs}\n`;
    report += `- **Documents Updated:** ${this.report.summary.documentsUpdated}\n`;
    report += `- **Documents Needing Creation:** ${this.report.summary.documentsNeedingCreation}\n\n`;
    
    if (this.report.documentsToCreate.length > 0) {
      report += `## ⚠️ Documents That Need Manual Creation\n\n`;
      report += `The following markdown files don't have associated Google Docs. Please create them manually:\n\n`;
      
      for (const doc of this.report.documentsToCreate) {
        report += `### ${doc.markdownFile}\n\n`;
        report += `**Suggested Title:** ${doc.suggestedTitle}\n\n`;
        report += `**Instructions:**\n${doc.instructions}\n\n`;
        report += `**Content to paste into the new document:**\n\n`;
        report += `\`\`\`\n${doc.content}\n\`\`\`\n\n`;
        report += `---\n\n`;
      }
    }
    
    if (this.report.actions.length > 0) {
      report += `## Actions Taken\n\n`;
      for (const action of this.report.actions) {
        const icon = action.status === 'success' ? '✅' : action.status === 'failed' ? '❌' : '⏭️';
        report += `- ${icon} **${action.timestamp}**: ${action.message}\n`;
        if (action.file) report += `  - File: ${action.file}\n`;
        if (action.document) report += `  - Document: ${action.document}\n`;
      }
      report += `\n`;
    }
    
    if (this.report.errors.length > 0) {
      report += `## ❌ Errors\n\n`;
      for (const error of this.report.errors) {
        report += `- **${error.timestamp}** - ${error.file}: ${error.error}\n`;
      }
      report += `\n`;
    }
    
    return report;
  }
}

async function main() {
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config: Config = JSON.parse(configContent);
    
    const synchronizer = new DocSynchronizer(config);
    
    console.log('Syncing markdown files to Google Drive...');
    await synchronizer.syncMarkdownFiles();
    
    console.log('\n✨ Sync completed! Check the report for details.');
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}