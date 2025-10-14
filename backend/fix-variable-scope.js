const fs = require('fs');

let content = fs.readFileSync('../scripts/live-graphql-test.js', 'utf8');

// Fix update mutations error logging
content = content.replace(
  /(\s+)console\.log\(`❌ \$\{mutationName\} - Failed: \$\{error\.message\}`\);\n(\s+)console\.log\(`   Query:`, mutationString\);\n(\s+)console\.log\(`   Variables:`, JSON\.stringify\(\{ input: inputData \}, null, 2\)\);\n(\s+)this\.results\.mutations\.failed\+\+;\n(\s+)this\.results\.mutations\.details\.push\(\{ name: mutationName, status: 'FAIL', error: error\.message \}\);\n(\s+)\} catch \(error\) \{\n(\s+)console\.log\(`❌ \$\{mutationName\} - Failed: \$\{error\.message\}`\);\n(\s+)console\.log\(`   Query:`, mutationString\);\n(\s+)console\.log\(`   Variables:`, JSON\.stringify\(\{ input: inputData \}, null, 2\)\);/g,
  '$1console.log(`❌ ${mutationName} - Failed: ${error.message}`);\n$2console.log(`   Query:`, mutationString);\n$3console.log(`   Variables:`, JSON.stringify({ input: updateData }, null, 2));\n$4this.results.mutations.failed++;\n$5this.results.mutations.details.push({ name: mutationName, status: \'FAIL\', error: error.message });\n$6} catch (error) {\n$7console.log(`❌ ${mutationName} - Failed: ${error.message}`);\n$8console.log(`   Query:`, mutationString);\n$9console.log(`   Variables:`, JSON.stringify({ input: { [record.idField]: record.id || 1 } }, null, 2));'
);

fs.writeFileSync('../scripts/live-graphql-test.js', content);
console.log('Fixed variable scope issues');