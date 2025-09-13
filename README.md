# Product Comparisons - Google Drive Sync

This project synchronizes markdown files with Google Drive documents using the Tetrateio Scully client.

## Setup

1. **Configure Google Drive folder:**
   - Edit `config.json` and add your Google Drive folder ID
   - Set up Google API credentials using scully-config (see Authentication section)

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the TypeScript code:**
   ```bash
   npm run build
   ```

## Authentication

This tool uses the `@tetrateio/scully-clients` package which handles Google OAuth2 authentication through encrypted configuration storage. To set up authentication:

```bash
# Set up Google OAuth2 credentials interactively
npx scully-clients google-auth setup
```

Follow the prompts to configure your Google API credentials. Credentials are securely stored in `~/.config/scully/`.

## Usage

### Sync Markdown to Google Drive
Updates existing Google Docs with markdown content and generates a report for documents that need to be created:
```bash
npm run sync
```

## How It Works

### For Existing Documents
- If a markdown file has a `doc` field in its frontmatter, the program updates the corresponding Google Doc
- Each document gets a metadata table at the top with sync information
- The document content is replaced with the latest markdown content

### For New Documents
- If a markdown file doesn't have a `doc` field, it's added to the "needs creation" report
- The program generates detailed instructions for manually creating the Google Doc
- Provides the exact content to paste into the new document
- Instructions include how to link the document back to the markdown file

## File Structure

- `src/content/` - Markdown files to sync
- `config.json` - Configuration for Google Drive folder and sync settings
- `src/sync-docs.ts` - Main synchronization program
- `latest-sync-report.md` - Human-readable sync report
- `sync-report-[timestamp].json` - Detailed JSON sync report

## Markdown Frontmatter

Markdown files should include a `doc` field in the frontmatter with the Google Drive document URL:

```yaml
---
title: My Document
doc: https://docs.google.com/document/d/DOCUMENT_ID/edit
status: Draft
---
```

## Google Drive Document Format

Documents in Google Drive will have a metadata table at the top containing:
- Last Updated timestamp
- Source Path to the markdown file
- Title
- Status

## Configuration

Edit `config.json` to customize:

```json
{
  "googleDrive": {
    "folderId": "YOUR_GOOGLE_DRIVE_FOLDER_ID"
  },
  "sync": {
    "contentPath": "./src/content",
    "extensions": [".md"],
    "ignorePatterns": ["**/node_modules/**", "**/.git/**"]
  }
}
```

## Reports

After each sync, the tool generates two reports:

1. **`latest-sync-report.md`** - Human-readable report with:
   - Summary statistics
   - List of documents that need manual creation with step-by-step instructions
   - Actions taken during sync
   - Any errors encountered

2. **`sync-report-[timestamp].json`** - Detailed JSON report for programmatic analysis