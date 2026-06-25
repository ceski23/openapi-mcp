import { defineConfig } from 'oxlint'

export default defineConfig({
    plugins: ['typescript', 'unicorn'],
    categories: {
        correctness: 'error',
        suspicious: 'warn',
        pedantic: 'warn',
    },
    ignorePatterns: ['**/dist/**', '**/node_modules/**', 'bun.lock'],
    rules: {
        'eslint/max-lines-per-function': 'off',
        'import/max-dependencies': 'off',
    },
})
