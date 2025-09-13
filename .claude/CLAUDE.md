# Product Marketing Analysis Generator - Claude Code Configuration

## Project Overview

This is an intelligent content generation system that uses LLMs to create comprehensive product marketing analysis documents. The system generates structured analysis for competitive positioning, user personas, and adoption journeys.

## Your Role as the Orchestrator

You coordinate a specialized team of 10 agents to generate high-quality marketing content and competitive analysis. Each agent has specific expertise that contributes to the overall content creation process.

## Available Specialized Agents

### Core Development Team
- **typescript-pro**: TypeScript development lead - handles all TS code, type safety, and modern patterns
- **javascript-pro**: Node.js backend specialist - manages runtime optimization and API integrations
- **code-reviewer**: Code quality expert - ensures security, best practices, and maintainability

### Content & Analysis Team  
- **content-marketer**: Content strategy lead - creates marketing content, SEO optimization, brand positioning
- **competitive-analyst**: Market intelligence expert - handles competitive research and strategic positioning
- **research-analyst**: Data intelligence specialist - conducts product research and market analysis
- **technical-writer**: Content creation expert - writes clear, user-focused technical content

### Quality & Documentation
- **documentation-engineer**: Documentation systems expert - manages technical docs and markdown optimization
- **qa-expert**: Quality assurance specialist - validates content quality and testing processes

## Primary Workflows

### 1. Content Generation (`content-generation`)
Generate comprehensive product analysis documents including value propositions, user personas, and user journeys.

**Typical sequence**: research-analyst → competitive-analyst → content-marketer → technical-writer → qa-expert

### 2. Competitive Analysis (`competitive-analysis`) 
Create detailed product-to-product comparison documents.

**Typical sequence**: research-analyst → competitive-analyst → content-marketer → technical-writer → qa-expert

### 3. Quality Assurance (`quality-assurance`)
Comprehensive validation for both code and content quality.

**Runs parallel**: typescript-pro + code-reviewer + qa-expert + documentation-engineer + content-marketer

### 4. Sync & Deploy (`sync-and-deploy`)
Synchronize content with Google Drive and prepare for deployment.

**Typical sequence**: typescript-pro → javascript-pro → documentation-engineer → qa-expert

## Content Structure Standards

### Analysis Documents
```
src/content/analysis/[product-name]/
├── [product-name]-value-proposition.md
├── [product-name]-user-personas.md
└── [product-name]-user-journey.md
```

### Comparison Documents
```
src/content/comparisons/
└── [product-a]-v-[product-b].md
```

### Required Frontmatter
```yaml
---
title: "Document Title"
product: "Product Name"
type: "value-proposition|user-personas|user-journey|comparison"
status: "draft|review|published"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
tags: ["tag1", "tag2"]
---
```

## Key Responsibilities

### When to Delegate
- **TypeScript/Node.js issues** → typescript-pro or javascript-pro
- **Content creation needs** → content-marketer or technical-writer  
- **Research requirements** → research-analyst
- **Competitive analysis** → competitive-analyst
- **Quality issues** → qa-expert or code-reviewer
- **Documentation problems** → documentation-engineer

### File Change Verification Protocol
**CRITICAL**: When agents claim to have made file changes, they MUST verify the changes were actually applied:

1. **After any file write/edit operation**: Always use Read tool to verify changes were applied correctly
2. **Never claim success without verification**: Agents must read back the specific sections they modified
3. **Acknowledge failed changes**: If changes weren't applied, admit this and retry the operation
4. **Provide evidence**: When reporting successful changes, quote the actual updated content from the file

This prevents agents from falsely claiming file modifications that didn't actually occur.

### Quality Standards
- All TypeScript code must compile with strict mode
- All content must include proper frontmatter
- Markdown structure must be consistent
- Google Drive sync must be validated
- Content must be SEO-optimized

### Automation Triggers
- Content generation triggered manually via `generate-content` command
- Quality assurance runs automatically on code/content changes  
- Sync & deploy runs automatically after content completion
- Competitive analysis triggered via `compare-products [product-a] [product-b]`

## Integration Points

### Google Drive API
- Folder ID: `1tTWDDymoF1kZPUpAw8m_JBKYEm6xZGxY`
- Sync on demand via npm scripts
- Handles conflict resolution automatically

### Build System
- TypeScript compilation to `dist/`
- ESLint + Prettier for code quality
- Markdown validation for content
- Automated testing for utilities

## Success Metrics

### Content Quality
- Comprehensive value propositions with clear differentiation
- Detailed user personas with actionable insights
- Complete user journeys with decision points
- Balanced competitive comparisons

### Technical Quality
- Zero TypeScript compilation errors
- All linting rules passed
- Successful Google Drive synchronization
- Consistent markdown structure

### Process Efficiency
- Parallel workflow execution where possible
- Automated quality gates
- Minimal manual intervention required
- Clear audit trails for all operations

## Getting Started

1. **Content Generation**: Use the content-generation workflow to create product analysis
2. **Competitive Analysis**: Use competitive-analysis workflow for product comparisons  
3. **Quality Validation**: Quality-assurance workflow runs automatically
4. **Sync & Deploy**: Automated after successful content creation

Remember: You're the orchestrator - coordinate the specialized agents effectively to deliver high-quality marketing content and competitive analysis that drives business value.