#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Scan Vue components and extract documentation
function scanComponents() {
  const componentsDir = path.join(__dirname, '../src/components');
  const components = [];
  
  if (!fs.existsSync(componentsDir)) return components;
  
  const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.vue'));
  
  files.forEach(file => {
    const filePath = path.join(componentsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract component info
    const component = {
      name: file.replace('.vue', ''),
      file: `src/components/${file}`,
      props: extractProps(content),
      methods: extractMethods(content),
      purpose: extractPurpose(content)
    };
    
    components.push(component);
  });
  
  return components;
}

function extractProps(content) {
  const propsMatch = content.match(/defineProps\s*<([^>]+)>|defineProps\s*\(\s*{([^}]+)}/s);
  if (!propsMatch) return [];
  
  // Simple extraction - could be enhanced
  return ['Props detected - see component file for details'];
}

function extractMethods(content) {
  const methodMatches = content.match(/const\s+(\w+)\s*=\s*\(/g) || [];
  return methodMatches.map(m => m.match(/const\s+(\w+)/)[1]);
}

function extractPurpose(content) {
  // Look for comments at the top of the file
  const purposeMatch = content.match(/<!--\s*Purpose:\s*([^-]+)-->/);
  return purposeMatch ? purposeMatch[1].trim() : 'Component purpose not documented';
}

// Update COMPONENT_GUIDE.md
function updateComponentGuide() {
  const components = scanComponents();
  const timestamp = new Date().toISOString().split('T')[0];
  
  let content = `# Component Guide

*Auto-generated on ${timestamp}*

## Component Overview

`;

  components.forEach(comp => {
    content += `### ${comp.name}.vue
**Location**: \`${comp.file}\`

**Purpose**: ${comp.purpose}

**Key Methods**: ${comp.methods.join(', ') || 'None detected'}

`;
  });

  content += `
## Manual Documentation

For detailed component documentation including props, events, and usage examples, see the manually maintained sections in the original COMPONENT_GUIDE.md file.

---

*This section is auto-generated. Manual updates will be preserved above.*`;

  const docsPath = path.join(__dirname, '../docs/COMPONENT_GUIDE_AUTO.md');
  fs.writeFileSync(docsPath, content);
  console.log('Updated COMPONENT_GUIDE_AUTO.md');
}

// Scan backend documentation
function scanBackendDocs() {
  const backendDir = path.join(__dirname, '../backend');
  const docs = [];
  
  // Recursively find .md files in backend
  function findMdFiles(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        findMdFiles(fullPath);
      } else if (item.endsWith('.md')) {
        const relativePath = path.relative(path.join(__dirname, '..'), fullPath);
        docs.push({
          name: item,
          path: relativePath,
          lastModified: stat.mtime.toISOString().split('T')[0]
        });
      }
    });
  }
  
  findMdFiles(backendDir);
  return docs;
}

// Update backend documentation index
function updateBackendDocsIndex() {
  const backendDocs = scanBackendDocs();
  const timestamp = new Date().toISOString().split('T')[0];
  
  let content = `# Backend Documentation Index\n\n*Auto-generated on ${timestamp}*\n\n`;
  
  if (backendDocs.length > 0) {
    content += `## Available Documentation\n\n`;
    backendDocs.forEach(doc => {
      content += `- [${doc.name}](../${doc.path}) - Last modified: ${doc.lastModified}\n`;
    });
  } else {
    content += `No backend documentation found.\n`;
  }
  
  const indexPath = path.join(__dirname, '../docs/BACKEND_DOCS_INDEX.md');
  fs.writeFileSync(indexPath, content);
  console.log('Updated BACKEND_DOCS_INDEX.md');
}

// Update last modified timestamp in main docs
function updateTimestamps() {
  const docsDir = path.join(__dirname, '../docs');
  const files = ['ARCHITECTURE.md', 'COMPONENT_GUIDE.md', 'DEVELOPMENT_GUIDE.md'];
  
  files.forEach(file => {
    const filePath = path.join(docsDir, file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const timestamp = new Date().toISOString().split('T')[0];
      
      // Update timestamp at bottom of file
      content = content.replace(
        /\*Last Updated:.*\*/,
        `*Last Updated: ${timestamp}*`
      );
      
      fs.writeFileSync(filePath, content);
    }
  });
  
  console.log('Updated documentation timestamps');
}

// Main execution
try {
  updateComponentGuide();
  updateBackendDocsIndex();
  updateTimestamps();
  console.log('Documentation generation completed successfully');
} catch (error) {
  console.error('Error generating documentation:', error);
  process.exit(1);
}