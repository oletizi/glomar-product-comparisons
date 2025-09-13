# Product Marketing Analysis Generator

This project uses LLMs to generate comprehensive product marketing analysis documents that inform competitive product comparisons and web content creation.

## Project Goals

Generate structured marketing analysis documents for technology products using AI, focusing on three key areas:

1. **Product Value Proposition** - Core value statements, key benefits, market positioning, and competitive differentiation
2. **User Personas** - Detailed user profiles, pain points, behavioral patterns, and decision-making criteria  
3. **User Adoption Journeys** - End-to-end adoption paths, decision points, acceleration factors, and success patterns

These analysis documents serve as the foundation for creating compelling product comparison web content and marketing materials.

## Document Structure

The project organizes analysis documents by product in the following structure:

```
src/content/
├── analysis/
│   ├── [product-name]/
│   │   ├── [product-name]-value-proposition.md
│   │   ├── [product-name]-user-personas.md
│   │   └── [product-name]-user-journey.md
│   └── ...
├── comparisons/
    └── [product-a]-v-[product-b].md
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the TypeScript code:**
   ```bash
   npm run build
   ```

## Content Types

### Value Proposition Documents
- Core value proposition statements
- Key benefits and features
- Target market positioning
- Competitive differentiation
- Business impact metrics
- Technical foundation details

### User Personas Documents
- Primary user personas and characteristics
- Pain points and motivations
- Behavioral patterns and preferences
- Decision-making criteria
- Market segments and demographics
- Use case scenarios

### User Journey Documents
- Adoption timeline and stages
- Critical decision points
- Acceleration and friction factors
- Success patterns by user type
- Implementation approaches
- ROI and business case development

### Product Comparisons
- Side-by-side feature analysis
- Strengths and weaknesses assessment
- Use case recommendations
- Implementation considerations
- Pricing and value comparisons

## Markdown Format

All documents use standard markdown with frontmatter for metadata:

```yaml
---
title: Product Name Analysis
status: Draft
---
```

## Output Usage

The generated analysis documents are used to:

- Create product comparison web content
- Develop marketing messaging and positioning
- Inform sales enablement materials  
- Guide content marketing strategies
- Support competitive intelligence initiatives
- Generate buyer journey content

## File Structure

- `src/content/analysis/` - Product analysis documents organized by product
- `src/content/comparisons/` - Product-to-product comparison documents
- `src/sync-docs.ts` - Document synchronization utilities
- `src/markdown-to-docs.ts` - Markdown processing utilities