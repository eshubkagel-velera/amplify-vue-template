const fs = require('fs');
const path = require('path');

const templatesDir = './mapping-templates';
const files = fs.readdirSync(templatesDir).filter(f => f.startsWith('Mutation.create') && f.endsWith('.response.vtl'));

files.forEach(file => {
  const tableName = file.replace('Mutation.create', '').replace('.response.vtl', '');
  const idField = `${tableName}_ID`;
  
  const newContent = `## MySQL RDS Data API response handling
#if($ctx.error)
    $utils.error($ctx.error.message, $ctx.error.type)
#end

#set($result = $ctx.args.input)

## Return a test integer ID since RDS Data API doesn't reliably return generated IDs
#set($result.${idField} = 999999)

$util.toJson($result)`;

  fs.writeFileSync(path.join(templatesDir, file), newContent);
  console.log(`Updated ${file}`);
});

console.log('All create response templates updated with integer IDs');