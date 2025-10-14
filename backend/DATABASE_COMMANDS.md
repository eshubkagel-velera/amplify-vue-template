# Database Commands Reference

## Single Consolidated Command: `npm run db`

All database operations use one command with different parameters:

### Basic Usage
```bash
npm run db [environment] [-- flags]
```

### Examples

**Preview changes (dry-run):**
```bash
npm run db:dev -- --dry-run
npm run db:test -- --dry-run
npm run db:uat -- --dry-run
npm run db:live -- --dry-run
```

**Apply changes:**
```bash
npm run db:dev
npm run db:test
npm run db:uat
npm run db:live
```

**Apply changes and remove extra columns:**
```bash
npm run db:dev -- --remove-extra
npm run db:test -- --remove-extra
```

**Generic syntax (also supported):**
```bash
npm run db dev -- --dry-run
npm run db dev -- --remove-extra
```

### Flags

- `--dry-run`: Preview changes without applying them
- `--remove-extra`: Remove columns that exist in database but not in SQL schema files

### What the command does:

1. **Compares** current database schema with SQL files
2. **Generates** ALTER statements for differences
3. **Preserves** all existing data
4. **Adds** missing columns
5. **Modifies** column types when they differ
6. **Removes** extra columns (only with `--remove-extra` flag)

### Safety Features

- **Data preservation**: Never drops tables or loses data
- **Preview mode**: Always preview changes before applying
- **Smart comparison**: Handles case and whitespace differences
- **Error handling**: Continues on non-critical errors (like duplicate columns)

### Environment Configuration

Database connections are configured in `/config/database-config.yml` with stage-specific settings for cluster ARNs, secret ARNs, and database names.