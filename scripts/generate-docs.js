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
  updateTimestamps();
  console.log('Documentation generation completed successfully');
} catch (error) {
  console.error('Error generating documentation:', error);
  process.exit(1);
}