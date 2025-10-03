#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if documentation is up to date
function checkDocumentationFreshness() {
  const docsDir = path.join(__dirname, '../docs');
  const srcDir = path.join(__dirname, '../src');
  
  try {
    // Get last modification time of source files
    const srcFiles = execSync('find src -name "*.vue" -o -name "*.ts" -o -name "*.js"', { cwd: path.join(__dirname, '..') })
      .toString()
      .split('\n')
      .filter(f => f.trim());
    
    let latestSrcTime = 0;
    srcFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        latestSrcTime = Math.max(latestSrcTime, stat.mtime.getTime());
      }
    });
    
    // Get last modification time of docs
    const docFiles = ['ARCHITECTURE.md', 'COMPONENT_GUIDE.md', 'DEVELOPMENT_GUIDE.md'];
    let latestDocTime = 0;
    
    docFiles.forEach(file => {
      const filePath = path.join(docsDir, file);
      if (fs.existsSync(filePath)) {
        const stat = fs.statSync(filePath);
        latestDocTime = Math.max(latestDocTime, stat.mtime.getTime());
      }
    });
    
    // Check if docs are older than source
    if (latestSrcTime > latestDocTime) {
      console.log('⚠️  Documentation may be outdated');
      console.log('Consider running: npm run docs:generate');
      return false;
    }
    
    console.log('✅ Documentation appears up to date');
    return true;
    
  } catch (error) {
    console.log('ℹ️  Could not check documentation freshness:', error.message);
    return true; // Don't fail the build
  }
}

// Main execution
if (require.main === module) {
  const isUpToDate = checkDocumentationFreshness();
  process.exit(isUpToDate ? 0 : 1);
}

module.exports = { checkDocumentationFreshness };