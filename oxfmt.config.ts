import { defineConfig } from 'oxfmt'

export default defineConfig({
    singleQuote: true,
    semi: false,
    trailingComma: 'all',
    printWidth: 100,
    tabWidth: 4,
    useTabs: false,
    insertFinalNewline: true,
    ignorePatterns: ['**/node_modules/**', 'bun.lock'],
})
